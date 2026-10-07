import type { ResolvedLine, Total, Totals } from '../types';

export function aggregate(resolvedLines: ResolvedLine[]): Totals {
	const daily = emptyTotal();
	const byTag = new Map<string, Total>();

	for (const { node, nutrients } of resolvedLines) {
		add(daily, nutrients);

		const tag = node.tag ?? 'None';
		let total = byTag.get(tag);
		if (!total) {
			total = emptyTotal();
			byTag.set(tag, total);
		}
		add(total, nutrients);
	}

	return {
		daily,
		tags: Array.from(byTag, ([name, total]) => ({ name, total }))
	};
}

function emptyTotal(): Total {
	return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

function add(target: Total, nutrients?: ResolvedLine['nutrients']): void {
	target.calories += nutrients?.calories ?? 0;
	target.protein += nutrients?.protein ?? 0;
	target.carbs += nutrients?.carbs ?? 0;
	target.fat += nutrients?.fat ?? 0;
}
