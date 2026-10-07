import type { EntryStatementNode, ResolvedLine } from '../types';

const DEBOUNCE_MS = 500;

// TODO(fcasibu): LRU
const cache = new Map<string, ResolvedLine>();

export function resolve(
	onResolved: (lines: ResolvedLine[]) => void
): (entries: EntryStatementNode[]) => void {
	let timeout: ReturnType<typeof setTimeout> | undefined;
	let controller: AbortController | undefined;

	return (entries) => {
		clearTimeout(timeout);
		controller?.abort();

		timeout = setTimeout(async () => {
			const current = new AbortController();
			controller = current;

			const missing = entries.filter((entry) => !cache.has(getEntryKey(entry)));

			if (missing.length) {
				const resolved = await query(missing, current.signal);
				if (current.signal.aborted || !resolved.length) return;

				for (const line of resolved) cache.set(getEntryKey(line.node), line);
			}

			onResolved(entries.flatMap((entry) => cache.get(getEntryKey(entry)) ?? []));
		}, DEBOUNCE_MS);
	};
}

async function query(entries: EntryStatementNode[], signal: AbortSignal): Promise<ResolvedLine[]> {
	try {
		const response = await fetch('/resolve', {
			method: 'POST',
			body: JSON.stringify({ entries }),
			signal
		});

		if (!response.ok) throw new Error(response.statusText);

		return await response.json();
	} catch (err) {
		if (!signal.aborted) console.error(err);
		return [];
	}
}

function getEntryKey({ quantity, food, modifiers, tag }: EntryStatementNode): string {
	return [
		quantity.value,
		quantity.unit?.raw,
		food.raw,
		modifiers.map((mod) => mod.raw).join(' '),
		tag
	].join('|');
}
