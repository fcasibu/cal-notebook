<script lang="ts">
	import { Parser } from '$lib/parser';
	import { Tokenizer } from '$lib/tokenizer';

	const source = `
##### Hello this is a comment
    200KG of tuna () @lunch one _test-
    1       1/2 cup of cheese @dinner
    1/2 cup of cheese
    50.5 cup of Cheese VITAMIN D3 gummies
`;
	const tokenizer = new Tokenizer(source);
	const parser = new Parser(tokenizer.tokenize());
	console.log(parser.parse());
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
