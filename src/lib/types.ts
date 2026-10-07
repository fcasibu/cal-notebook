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

export interface ProgramNode extends NodeBase {
	type: 'Program';
	body: StatementNode[];
}

export type StatementNode = EntryStatementNode | CommentNode;

export interface EntryStatementNode extends NodeBase {
	type: 'EntryStatement';
	tag: string | null;
	quantity: QuantityNode;
	food: FoodNode;
	modifiers: ModifierNode[];
}

export interface CommentNode extends NodeBase {
	type: 'Comment';
	text: string;
}

export interface QuantityNode extends NodeBase {
	type: 'Quantity';
	value: number;
	unit: UnitNode | null;
}

export interface UnitNode extends NodeBase {
	type: 'Unit';
	raw: string;
}

export interface FoodNode extends NodeBase {
	type: 'Food';
	raw: string;
	normalized: string;
}

export interface ModifierNode extends NodeBase {
	type: 'Modifier';
	raw: string;
}

export interface NodeBase {
	line: number;
	col: number;
}

export enum TokenKind {
	LPAREN,
	RPAREN,
	COMMA,
	IDENTIFIER,
	NUMBER,
	COMMENT,
	AT,
	NEWLINE,
	EOF
}

export interface Token {
	line: number;
	col: number;
	value: string;
	kind: TokenKind;
}

export interface Total {
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
}

export interface Totals {
	tags: { name: string; total: Total }[];
	daily: Total;
}
