export function isWhitespace(char: string): boolean {
	return char === ' ' || char === '\t' || char === '\r';
}

export function isDigit(char: string): boolean {
	return char >= '0' && char <= '9';
}

export function isLetter(char: string): boolean {
	return (
		(char >= 'a' && char <= 'z') ||
		(char >= 'A' && char <= 'Z') ||
		char === '_' ||
		char === '-' ||
		char === "'"
	);
}

export function isNameChar(char: string): boolean {
	return isLetter(char) || isDigit(char) || char === '-' || char === "'";
}
