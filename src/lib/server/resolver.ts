import { queryFood } from './fdc-client';
import { resolveUnit, UNIT_DEFS } from '../dsl/units';
import { cache, getCacheKey } from './cache';
import { statementToQuery } from '../dsl/query';
import {
	NutrientNumbers,
	type EntryStatementNode,
	type FdcFood,
	type FoodPortion,
	type NutrientConversionFactor,
	type QuantityNode,
	type ResolvedLine
} from '../types';

export async function resolveEntries(entries: EntryStatementNode[]): Promise<ResolvedLine[]> {
	return await Promise.all(
		entries.map(async (entry) => {
			const miss = { node: entry, nutrients: null };
			try {
				const query = statementToQuery(entry);
				const cacheKey = getCacheKey(query);
				let food = await cache.getJson<FdcFood>(cacheKey);
				if (!food) {
					const response = await queryFood(query);
					if (!response.ok) return miss;
					food = response.data;
					await cache.setJson(cacheKey, food);
				}

				return resolveLine(entry, food);
			} catch (err) {
				console.error(`Error resolving line ${entry.line}`, err);
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
