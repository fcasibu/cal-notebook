<script lang="ts">
	import { aggregate } from '#lib/analysis/aggregate.js';
	import { Parser } from '#lib/dsl/parser.js';
	import { Tokenizer } from '#lib/dsl/tokenizer.js';
	import { resolve } from '#lib/editor/resolve-lines.js';
	import type { ResolvedLine, Totals } from '#lib/types.js';

	let resolvedLines: ResolvedLine[] = $state([]);
	let aggregated: Totals | null = $derived.by(() => aggregate(resolvedLines));
	let source = $state('');

	const resolveFn = resolve((lines) => {
		resolvedLines = lines;
	});

	function handleKeyup() {
		const tokenizer = new Tokenizer(source);
		const tokens = tokenizer.tokenize();
		const parser = new Parser(tokens);
		const { program } = parser.parse();
		const entries = program.body.filter((stmt) => stmt.type === 'EntryStatement');

		resolveFn(entries);
	}

	$inspect(resolvedLines, aggregated);
</script>

<textarea bind:value={source} onkeyup={handleKeyup}></textarea>
