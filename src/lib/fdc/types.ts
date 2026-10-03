export type DataType = 'Foundation' | 'SR Legacy' | 'Survey (FNDDS)' | 'Branded';
export type SortBy =
	'fdcId' | 'dataType.keyword' | 'lowercaseDescription.keyword' | 'publishedDate';

export const NutrientNumbers = {
	PROTEIN: '203',
	FAT: '204',
	CARBOHYDRATES: '205',
	ENERGY: '208'
} as const;

export interface FoodNutrient {
	amount: number;
	nutrient: {
		number: string;
	};
}

export interface FoodPortion {
	gramWeight: number;
	measureUnit: {
		name: string;
		abbreviation?: string;
	};
	sequenceNumber?: number;
	portionDescription?: string;
	modifier?: string;
	amount?: number;
}

export interface NutrientConversionFactor {
	type: string;
	proteinValue: number;
	carbohydrateValue: number;
	fatValue: number;
}

export interface SearchNutrient {
	name: string;
	value: number;
	unitName: string;
	nutrientNumber: string;
}

export interface FdcFood {
	fdcId: number;
	description: string;
	dataType?: DataType;
	foodNutrients: FoodNutrient[];
	foodPortions?: FoodPortion[];
	score: number;
	nutrientConversionFactors: NutrientConversionFactor[];
}

export interface FdcSearchFood {
	fdcId: number;
	description: string;
	dataType?: DataType;
	score?: number;
	foodNutrients: SearchNutrient[];
}

export interface FdcSearchResult {
	foods: FdcSearchFood[];
	totalHits: number;
}
