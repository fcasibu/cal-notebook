import type { PageServerLoad } from './$types';
import { Parser } from '#lib/dsl/parser.js';
import { Tokenizer } from '#lib/dsl/tokenizer.js';
import { resolveProgram } from '#lib/server/resolver.js';

export const load: PageServerLoad = async () => {
	const source = `
50g oats (raw)
1 banana
170g greek yogurt
150g salmon (grilled)
1 cup white rice (cooked, long-grain)
100g avocado
30g peanuts
`;
	const tokenizer = new Tokenizer(source);
	const tokens = tokenizer.tokenize();
	const parser = new Parser(tokens);
	const { program, errors } = parser.parse();
	console.log(errors);

	const resolvedLines = await resolveProgram(program);
	return {
		resolvedLines
	};
};
