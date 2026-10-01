<script lang="ts">
	import { Parser } from '$lib/parser';
	import { Tokenizer } from '$lib/tokenizer';

	const source = `
150 g chicken
200g rice (lo, oil-free)
`;
	const tokenizer = new Tokenizer(source);
	const parser = new Parser(tokenizer.tokenize());
	console.log(parser.parse());
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
