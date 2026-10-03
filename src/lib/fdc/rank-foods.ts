import type { DataType, FdcFood, FdcSearchFood } from './types';

type Rankable = Pick<FdcFood | FdcSearchFood, 'description'> & {
	dataType?: DataType;
	score?: number;
};

const TYPE_BONUS: Record<DataType, number> = {
	Foundation: 30,
	'SR Legacy': 20,
	'Survey (FNDDS)': 10,
	Branded: 0
};

const PLAIN_TOKENS = ['raw', 'fresh', 'whole'];
const PROCESSED_TOKENS = [
	'candied',
	'dried',
	'baked',
	'sweetened',
	'flavored',
	'flavoured',
	'fried',
	'smoked',
	'pickled',
	'salted',
	'canned'
];

export function norm(s: string): string {
	return s
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function tokens(s: string): string[] {
	const n = norm(s);
	return n ? n.split(' ') : [];
}

function head(s: string): string {
	return norm(s.split(',')[0]);
}

export function scoreFood(query: string, food: Rankable): number {
	const nq = norm(query);
	const nd = norm(food.description);
	const hd = head(food.description);

	const qTok = new Set(tokens(query));
	const dTok = new Set(tokens(food.description));

	let intersect = 0;
	for (const t of qTok) if (dTok.has(t)) intersect++;
	const coverage = qTok.size === 0 ? 0 : intersect / qTok.size;
	const extra = dTok.size - intersect;

	let score = 0;
	if (nd === nq) score += 1000;
	if (hd === nq) score += 500;
	if (nq && nd.startsWith(nq)) score += 20;
	score += 200 * coverage;
	score -= 10 * extra;

	if (food.dataType && food.dataType in TYPE_BONUS) score += TYPE_BONUS[food.dataType];

	for (const t of PLAIN_TOKENS) {
		if (!qTok.has(t) && dTok.has(t)) score += 20;
	}
	for (const t of PROCESSED_TOKENS) {
		if (!qTok.has(t) && dTok.has(t)) score -= 20;
	}

	return score;
}

export function rankFoods<T extends Rankable>(query: string, foods: T[]): T[] {
	return [...foods].sort((a, b) => {
		const diff = scoreFood(query, b) - scoreFood(query, a);
		if (diff !== 0) return diff;
		return (b.score ?? 0) - (a.score ?? 0);
	});
}
