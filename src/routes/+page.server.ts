import type { PageServerLoad } from './$types';
import { Parser } from '#lib/dsl/parser.js';
import { Tokenizer } from '#lib/dsl/tokenizer.js';
import { resolveProgram } from '#lib/server/resolver.js';

export const load: PageServerLoad = async () => {
	const source = `
50g quaker instant oats @breakfast
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
