export function isWhitespace(char: string) {
	return char === ' ' || char === '\n' || char === '\t';
}

export function isDigit(char: string) {
	return char >= '0' && char <= '9';
}

export function isLetter(char: string) {
	return (
		(char >= 'a' && char <= 'z') ||
		(char >= 'A' && char <= 'Z') ||
		char === '_' ||
		char === '-' ||
		char === "'"
	);
}

export const UNITS = new Set(['g', 'kg', 'ml', 'l', 'oz', 'lb', 'tsp', 'tbsp', 'cup', 'scoop']);

export function isUnit(content: string) {
	return UNITS.has(content);
}
