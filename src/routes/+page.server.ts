import type { PageServerLoad } from './$types';
import { Parser } from '#lib/dsl/parser.js';
import { Tokenizer } from '#lib/dsl/tokenizer.js';
import { resolveProgram } from '#lib/server/resolver.js';
import { aggregate } from '#lib/analysis/aggregate.js';

export const load: PageServerLoad = async () => {
	const source = `
50g quaker instant oats @breakfast
200g of chicken breast (raw, boneless, skinless) @dinner
2 eggs (whole, large, boiled) @dinner
`;
	const tokenizer = new Tokenizer(source);
	const tokens = tokenizer.tokenize();
	const parser = new Parser(tokens);
	const { program, errors } = parser.parse();
	console.log(errors);

	const resolvedLines = await resolveProgram(program);
	console.log(JSON.stringify(aggregate(resolvedLines), null, 2));
	return {
		resolvedLines
	};
};
