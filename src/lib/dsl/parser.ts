import { ParseError, ParseNumberError, type ProgramError } from '../errors';
import { TokenKind, type Token } from '../types';
import { isUnit } from './units';
import { parseRawNumber } from './value';
import type {
	EntryStatementNode,
	FoodNode,
	ModifierNode,
	ProgramNode,
	QuantityNode,
	StatementNode,
	UnitNode
} from '../types';

export class Parser {
	private currentIndex: number = 0;

	constructor(private readonly tokens: Token[]) {}

	public parse(): { program: ProgramNode; errors: ProgramError[] } {
		const { statements, errors } = this.parseStatements();

		return {
			program: {
				type: 'Program',
				body: statements,
				line: 1,
				col: 1
			},
			errors
		};
	}

	private parseStatements(): { statements: StatementNode[]; errors: ProgramError[] } {
		const statements: StatementNode[] = [];
		const errors: ProgramError[] = [];

		while (!this.isEOF()) {
			if (this.isNewline()) {
				this.advance();
				continue;
			}

			if (this.current()!.kind === TokenKind.COMMENT) {
				const commentToken = this.advance();

				statements.push({
					type: 'Comment',
					text: commentToken.value,
					line: commentToken.line,
					col: commentToken.col
				});
				continue;
			}

			try {
				statements.push(this.parseEntryStatement());
			} catch (error) {
				this.synchronize();
				errors.push(error as ProgramError);
			}
		}

		return { statements, errors };
	}

	private parseEntryStatement(): EntryStatementNode {
		const startToken = this.current()!;

		const quantity = this.parseQuantity();
		const food = this.parseFood();
		const modifiers = this.parseModifiers();
		const tag = this.parseTag();

		return {
			type: 'EntryStatement',
			tag,
			quantity,
			food,
			modifiers,
			line: startToken.line,
			col: startToken.col
		};
	}

	private parseTag(): string | null {
		const token = this.advance();
		if (!token) {
			this.currentIndex--;
			return null;
		}

		if (token.kind !== TokenKind.AT) {
			if (token.kind === TokenKind.IDENTIFIER) {
				throw new ParseError(`Expected @, got "${token.value}"`, token.line, token.col);
			}

			this.currentIndex--;
			return null;
		}

		const tag = this.advance();

		if (tag.kind !== TokenKind.IDENTIFIER) {
			throw new ParseError(`Expected tag, got "${tag.value}"`, tag.line, tag.col);
		}

		let value = tag.value;
		while (this.current().kind === TokenKind.IDENTIFIER) {
			const token = this.advance();
			value += ` ${token.value}`;
		}

		return value;
	}

	private parseQuantity(): QuantityNode {
		const token = this.advance();

		if (token.kind !== TokenKind.NUMBER)
			throw new ParseError(`Expected quantity, got "${token.value}"`, token.line, token.col);

		let value: number;
		try {
			value = parseRawNumber(token.value);
		} catch (error) {
			if (error instanceof ParseNumberError) {
				error.line = token.line;
				error.col = token.col;
				throw error;
			} else {
				throw error;
			}
		}
		const unit = this.parseUnit();

		return {
			type: 'Quantity',
			value,
			unit,
			line: token.line,
			col: token.col
		};
	}

	private parseUnit(): UnitNode | null {
		const token = this.advance();

		if (token.kind !== TokenKind.IDENTIFIER) {
			this.currentIndex--;
			return null;
		}

		if (token.value === 'of') return null;

		let value = token.value;
		while (this.current().kind === TokenKind.IDENTIFIER) {
			const token = this.advance();

			const prevValue = value;
			value += ` ${token.value}`;

			if (!isUnit(value)) {
				this.currentIndex--;
				value = prevValue;
				break;
			}
		}

		if (!isUnit(value)) {
			this.currentIndex--;
			return null;
		}

		return {
			type: 'Unit',
			raw: value,
			line: token.line,
			col: token.col
		};
	}

	private parseFood(): FoodNode {
		const startToken = this.current();
		const words: string[] = [];

		while (!this.isEOF()) {
			const token = this.advance();
			if (token.value === 'of') continue;

			if (token.kind !== TokenKind.IDENTIFIER) {
				this.currentIndex--;
				break;
			}

			words.push(token.value);
		}

		if (!words.length)
			throw new ParseError(
				`Expected food, got "${words.join(' ')}"`,
				startToken.line,
				startToken.col
			);

		const normalized = words.join(' ').toLowerCase().trim();

		if (normalized.length < 2)
			throw new ParseError(`Expected food, got "${normalized}"`, startToken.line, startToken.col);

		return {
			type: 'Food',
			raw: words.join(' '),
			normalized,
			line: startToken.line,
			col: startToken.col
		};
	}

	private parseModifiers(): ModifierNode[] {
		const token = this.advance();
		if (!token) return [];

		if (token.kind !== TokenKind.LPAREN) {
			this.currentIndex--;
			return [];
		}

		const modifiers: ModifierNode[] = [];

		while (!this.isEOF() && !this.isNewline()) {
			const modifier = this.advance();

			if (modifier.kind === TokenKind.RPAREN) break;

			if (modifier.kind === TokenKind.COMMA) continue;

			if (modifier.kind !== TokenKind.IDENTIFIER)
				throw new ParseError(
					`Expected modifier, got "${modifier.value}"`,
					modifier.line,
					modifier.col
				);

			let value = modifier.value;
			while (this.current().kind === TokenKind.IDENTIFIER) {
				const token = this.advance();
				value += ` ${token.value}`;
			}

			modifiers.push({
				type: 'Modifier',
				raw: value.toLowerCase().trim(),
				line: modifier.line,
				col: modifier.col
			});
		}

		const lastToken = this.tokens[this.currentIndex - 1];
		if (lastToken.kind !== TokenKind.RPAREN && this.isNewline())
			throw new ParseError('Expected ")"', lastToken.line, lastToken.col);

		if (!modifiers.length)
			throw new ParseError('Expected modifier got "()"', token.line, token.col);

		return modifiers;
	}

	private current(): Token {
		const token = this.tokens[this.currentIndex];
		return token;
	}

	private advance(): Token {
		const token = this.tokens[this.currentIndex++];
		return token;
	}

	private isEOF(): boolean {
		return this.currentIndex >= this.tokens.length || this.current().kind === TokenKind.EOF;
	}

	private isNewline(): boolean {
		return this.current().kind === TokenKind.NEWLINE;
	}

	private synchronize(): void {
		while (!this.isEOF()) {
			if (this.current().kind == TokenKind.NEWLINE) return;

			this.advance();
		}
	}
}
