<script lang="ts">
	import { Parser } from '$lib/parser';
	import { Tokenizer } from '$lib/tokenizer';

	const source = `
##### Hello this is a comment
    200g of tuna () @lunch one _test-
`;
	const tokenizer = new Tokenizer(source);
	const parser = new Parser(tokenizer.tokenize());
	console.log(parser.parse());
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
