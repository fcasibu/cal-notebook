export type CanonicalUnit =
	| 'g'
	| 'kg'
	| 'mg'
	| 'ml'
	| 'l'
	| 'tsp'
	| 'tbsp'
	| 'fl-oz'
	| 'cup'
	| 'pt'
	| 'qt'
	| 'gal'
	| 'oz'
	| 'lb'
	| 'piece'
	| 'slice'
	| 'serving'
	| 'can'
	| 'package';

export type UnitType = 'weight' | 'volume' | 'count';

export interface UnitDef {
	type: UnitType;
	canonical: CanonicalUnit;
	toGram: number | null;
	toMl: number | null;
	aliases: string[];
}

export function WEIGHT(unit: CanonicalUnit, toGram: number, aliases: string[]): UnitDef {
	return {
		type: 'weight',
		canonical: unit,
		toGram,
		toMl: null,
		aliases
	};
}

export function VOLUME(unit: CanonicalUnit, toMl: number, aliases: string[]): UnitDef {
	return {
		type: 'volume',
		canonical: unit,
		toGram: null,
		toMl,
		aliases
	};
}

export function COUNT(unit: CanonicalUnit, aliases: string[]): UnitDef {
	return {
		type: 'count',
		canonical: unit,
		toGram: null,
		toMl: null,
		aliases
	};
}

export const UNIT_DEFS: readonly UnitDef[] = [
	WEIGHT('g', 1, ['gram', 'grams', 'gr', 'gms']),
	WEIGHT('kg', 1000, ['kilogram', 'kilograms', 'kilo', 'kilos']),
	WEIGHT('mg', 0.001, ['milligram', 'milligrams']),
	VOLUME('ml', 1, ['milliliter', 'milliliters', 'millilitre', 'millilitres', 'cc', 'mls']),
	VOLUME('l', 1000, ['liter', 'liters', 'litre', 'litres']),
	VOLUME('tsp', 4.92892159375, ['teaspoon', 'teaspoons']),
	VOLUME('tbsp', 14.78676478125, ['tablespoon', 'tablespoons']),
	VOLUME('fl-oz', 29.5735295625, ['fluid ounce', 'fluid ounces', 'fl oz', 'fl. oz.', 'floz']),
	VOLUME('cup', 236.5882365, ['cups', 'c']),
	VOLUME('pt', 473.176473, ['pint', 'pints']),
	VOLUME('qt', 946.352946, ['quart', 'quarts']),
	VOLUME('gal', 3785.411784, ['gallon', 'gallons']),
	WEIGHT('oz', 28.349523125, ['ounce', 'ounces']),
	WEIGHT('lb', 453.59237, ['pound', 'pounds', 'lbs']),
	COUNT('piece', ['pieces', 'pc', 'pcs']),
	COUNT('slice', ['slices']),
	COUNT('serving', ['servings']),
	COUNT('can', ['cans']),
	COUNT('package', ['packages', 'pack', 'packs', 'pkg'])
];

export const UNITS: ReadonlyMap<CanonicalUnit, UnitDef> = new Map(
	UNIT_DEFS.map((def) => [def.canonical, def] as const)
);

export const UNIT_LOOKUP: ReadonlyMap<string, CanonicalUnit> = new Map(
	UNIT_DEFS.flatMap((def) =>
		[def.canonical, ...def.aliases].map((key) => [normalizeUnitKey(key), def.canonical] as const)
	)
);

export function normalizeUnitKey(raw: string): string {
	return raw.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

export function resolveUnit(raw: string): UnitDef | null {
	const canonical = UNIT_LOOKUP.get(normalizeUnitKey(raw));
	if (!canonical) return null;
	return UNITS.get(canonical) ?? null;
}

export function isUnit(raw: string): boolean {
	return resolveUnit(raw) !== null;
}

export function unitToGram(canonical: CanonicalUnit, value: number): number | null {
	const def = UNITS.get(canonical);
	if (!def?.toGram) return null;
	return value * def.toGram;
}

export function unitToMl(canonical: CanonicalUnit, value: number): number | null {
	const def = UNITS.get(canonical);
	if (!def?.toMl) return null;
	return value * def.toMl;
}
