import { queryFood } from './fdc-client';
import type { EntryStatementNode, ProgramNode, QuantityNode } from '../dsl/parser';
import { resolveUnit, UNIT_DEFS } from '../dsl/units';
import {
	type FdcFood,
	NutrientNumbers,
	type FoodPortion,
	type NutrientConversionFactor
} from '../fdc/types';
import { cache, getCacheKey } from './cache';

// TODO(fcasibu): status to show errors or warnings in the UI
export interface ResolvedLine {
	node: EntryStatementNode;
	nutrients: {
		calories: number | null;
		protein: number | null;
		carbs: number | null;
		fat: number | null;
	} | null;
}

export async function resolveProgram(p: ProgramNode): Promise<ResolvedLine[]> {
	return await Promise.all(
		p.body
			.filter((stmt) => stmt.type === 'EntryStatement')
			.map(async (stmt) => {
				const miss = { node: stmt, nutrients: null };
				try {
					const query = statementToQuery(stmt);
					const cacheKey = getCacheKey(query);
					let food = await cache.getJson<FdcFood>(cacheKey);
					console.log(!!food, cacheKey, 'cached!');
					if (!food) {
						const response = await queryFood(query);
						if (!response.ok) return miss;
						food = response.data;
						await cache.setJson(cacheKey, JSON.stringify(food));
					}

					return resolveLine(stmt, food);
				} catch {
					console.error('Error resolving line', stmt);
					return miss;
				}
			})
	);
}

function resolveLine(stmt: EntryStatementNode, food: FdcFood): ResolvedLine {
	const protein = food.foodNutrients.find(
		({ nutrient }) => nutrient.number === NutrientNumbers.PROTEIN
	);
	const carbs = food.foodNutrients.find(
		({ nutrient }) => nutrient.number === NutrientNumbers.CARBOHYDRATES
	);
	const fat = food.foodNutrients.find(({ nutrient }) => nutrient.number === NutrientNumbers.FAT);
	const calories = food.foodNutrients.find(
		({ nutrient }) => nutrient.number === NutrientNumbers.ENERGY
	);

	const calorieFactor = food.nutrientConversionFactors?.find(
		({ type }) => type === '.CalorieConversionFactor'
	);
	const gram = resolveGrams(stmt.quantity, food.foodPortions ?? []);

	const pValue = protein ? calculateNutrient(gram, protein.amount) : null;
	const cValue = carbs ? calculateNutrient(gram, carbs.amount) : null;
	const fValue = fat ? calculateNutrient(gram, fat.amount) : null;
	const kcalValue = calories
		? calculateNutrient(gram, calories.amount)
		: calculateFallbackCalories(pValue, cValue, fValue, calorieFactor);

	return {
		node: stmt,
		nutrients: {
			protein: pValue,
			carbs: cValue,
			fat: fValue,
			calories: kcalValue
		}
	};
}

function statementToQuery(stmt: EntryStatementNode): string {
	const name = stmt.food.normalized;
	const modifiers = stmt.modifiers.map((mod) => mod.raw).join(' ');

	return `${name} ${modifiers}`.trim();
}

function resolveGrams(q: QuantityNode, portions: FoodPortion[]): number {
	const def = q.unit ? resolveUnit(q.unit.raw) : null;
	if (q.unit && !def) throw new Error(`Unknown unit ${q.unit.raw}`);
	if (def?.type === 'weight') return q.value * def.toGram!;

	const sorted = [...portions].sort((a, b) => (a.sequenceNumber ?? 99) - (b.sequenceNumber ?? 99));

	if (!def || def.type === 'count') {
		const p =
			sorted.find((p) => portionMl(p) == null) ??
			sorted.find((p) => /large|medium|small|whole|piece/i.test(p.modifier ?? '')) ??
			sorted[0];
		if (!p?.gramWeight) throw new Error('Unknown weight');
		return (q.value * p.gramWeight) / (p.amount ?? 1);
	}

	const c = def.canonical;
	const pool = sorted.filter((p) => portionMl(p) != null);
	const exact = pool.find(
		(p) =>
			p.portionDescription?.toLowerCase().trim() === `1 ${c}` ||
			p.modifier?.toLowerCase().trim() === c
	);
	const p = exact ?? pool[0];
	if (!p) throw new Error(`Unknown weight: no ${c} portion`);

	return ((q.value * def.toMl!) / portionMl(p)!) * p.gramWeight;
}

function portionMl(p: FoodPortion): number | null {
	for (const text of [p.modifier, p.portionDescription]) {
		if (!text) continue;
		const s = text.toLowerCase();
		for (const def of UNIT_DEFS) {
			if (def.type !== 'volume' || def.toMl == null) continue;

			for (const name of [def.canonical, ...def.aliases])
				if (new RegExp(`\\b${name.replace('.', '\\.')}\\b`, 'i').test(s)) return def.toMl;
		}
	}

	const unitName = p.measureUnit?.abbreviation ?? p.measureUnit?.name;
	if (unitName && !/undetermined/i.test(unitName)) {
		const d = resolveUnit(unitName);
		if (d?.toMl) return d.toMl;
	}

	return null;
}

function calculateNutrient(grams: number, per100g: number): number {
	return (grams / 100) * per100g;
}

function calculateFallbackCalories(
	protein: number | null,
	carbs: number | null,
	fat: number | null,
	calorieFactor: NutrientConversionFactor | undefined
) {
	if (protein == null || carbs == null || fat == null) return null;

	const factors = {
		protein: calorieFactor?.proteinValue ?? 4,
		carbs: calorieFactor?.carbohydrateValue ?? 4,
		fat: calorieFactor?.fatValue ?? 9
	};

	return protein * factors.protein + carbs * factors.carbs + fat * factors.fat;
}
