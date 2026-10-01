const PATTERN = /^\s*([+-])?\s*(?:(\d+)\s+(\d+)\/(\d+)|(\d+)\/(\d+)|(\d+(?:\.\d+)?|\.\d+))\s*$/;

export function parseRawNumber(raw: string): number {
	const match = PATTERN.exec(raw);
	if (!match) throw new Error(`Invalid number: ${raw}`);

	const [, sign, whole, n1, d1, n2, d2, dec] = match;
	let value: number;

	if (whole) {
		if (Number(d1) === 0) throw new Error(`Zero division: ${raw}`);
		value = Number(whole) + Number(n1) / Number(d1);
	} else if (n2) {
		if (Number(d2) === 0) throw new Error(`Zero division: ${raw}`);
		value = Number(n2) / Number(d2);
	} else {
		value = parseFloat(dec);
	}

	return sign === '-' ? -value : value;
}
