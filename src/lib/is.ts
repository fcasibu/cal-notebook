export function isWhitespace(char: string) {
	return char === ' ' || char === '\t' || char === '\r';
}

export function isDigit(char: string) {
	return (char >= '0' && char <= '9') || char === '.';
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
