import type { EntryStatementNode } from '../types';

export function statementToQuery(stmt: EntryStatementNode): string {
	const name = stmt.food.normalized;
	const modifiers = stmt.modifiers.map((mod) => mod.raw).join(' ');

	return `${name} ${modifiers}`.trim();
}
