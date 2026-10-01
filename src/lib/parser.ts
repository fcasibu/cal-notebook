import { TokenKind, type Token } from './tokenizer';
import { isUnit, UNITS } from './unit';
import { parseRawNumber } from './value';

export interface ProgramNode extends NodeBase {
	type: 'Program';
	body: StatementNode[];
}

export type StatementNode = EntryStatementNode | CommentNode;

export interface EntryStatementNode extends NodeBase {
	type: 'EntryStatement';
	tag: string | null;
	quantity: QuantityNode;
	food: FoodNode;
	modifiers: ModifierNode[];
}

export interface CommentNode extends NodeBase {
	type: 'Comment';
	text: string;
}

export interface QuantityNode extends NodeBase {
	type: 'Quantity';
	value: number;
	unit: UnitNode | null;
}

export interface UnitNode extends NodeBase {
	type: 'Unit';
	raw: string;
}

export interface FoodNode extends NodeBase {
	type: 'Food';
	raw: string;
	normalized: string;
}

export interface ModifierNode extends NodeBase {
	type: 'Modifier';
	raw: string;
}

export interface NodeBase {
	line: number;
	col: number;
}

export class ParseError extends Error {
	constructor(
		public readonly msg: string,
		public readonly line: number,
		public readonly col: number
	) {
		super(msg);
		this.name = 'ParseError';

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ParseError);
		}
	}
}

export class Parser {
	private currentIndex: number = 0;

	constructor(private readonly tokens: Token[]) {}

	public parse(): ProgramNode {
		const statements = this.parseStatements();

		return {
			type: 'Program',
			body: statements,
			line: 1,
			col: 1
		};
	}

	private parseStatements(): StatementNode[] {
		const statements: StatementNode[] = [];

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

			statements.push(this.parseEntryStatement());
		}

		return statements;
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

		const value = parseRawNumber(token.value);
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

		if (!isUnit(token.value)) {
			const units = Array.from(UNITS.values()).join(', ');
			throw new ParseError(
				`Expected unit, got "${token.value}". Expected one of [${units}]`,
				token.line,
				token.col
			);
		}

		return {
			type: 'Unit',
			raw: token.value,
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

			if (modifier.kind === TokenKind.RPAREN) {
				break;
			}

			if (modifier.kind === TokenKind.COMMA) {
				continue;
			}

			if (modifier.kind !== TokenKind.IDENTIFIER) {
				throw new ParseError(
					`Expected modifier, got "${modifier.value}"`,
					modifier.line,
					modifier.col
				);
			}

			let value = modifier.value;
			while (this.current().kind === TokenKind.IDENTIFIER) {
				const token = this.advance();
				value += ` ${token.value}`;
			}

			modifiers.push({
				type: 'Modifier',
				raw: value.toLowerCase().trim(),
				line: token.line,
				col: token.col
			});
		}

		const lastToken = this.tokens[this.currentIndex - 1];
		if (lastToken.kind !== TokenKind.RPAREN && this.isNewline()) {
			throw new ParseError('Expected ")"', lastToken.line, lastToken.col);
		}

		return modifiers;
	}

	private current(): Token {
		return this.tokens[this.currentIndex];
	}

	private advance(): Token {
		const token = this.tokens[this.currentIndex++];
		if (!token) {
			throw new Error('Unexpected undefined token');
		}
		return token;
	}

	private isEOF(): boolean {
		return this.currentIndex >= this.tokens.length || this.current().kind === TokenKind.EOF;
	}

	private isNewline(): boolean {
		return this.current().kind === TokenKind.NEWLINE;
	}
}
