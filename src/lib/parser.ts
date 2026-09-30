import { isUnit, UNITS } from './is';
import { TokenKind, type Token } from './tokenizer';

export interface ProgramNode extends NodeBase {
	type: 'Program';
	body: StatementNode[];
}

export type StatementNode = EntryStatementNode;

export interface EntryStatementNode extends NodeBase {
	type: 'EntryStatement';
	tag: string | null;
	quantity: QuantityNode;
	food: FoodNode;
	modifiers: ModifierNode[];
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
	name: string;
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

	private isEOF(): boolean {
		return this.currentIndex >= this.tokens.length || this.current().kind === TokenKind.EOF;
	}

	private parseStatements(): StatementNode[] {
		const statements: StatementNode[] = [];

		while (!this.isEOF()) statements.push(this.parseEntryStatement());

		return statements;
	}

	private parseEntryStatement(): EntryStatementNode {
		const startToken = this.tokens[this.currentIndex]!;

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

		const tag = this.tokens[this.currentIndex++];

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

		if (token.kind !== TokenKind.NUMBER) {
			throw new ParseError(`Expected number, got "${token.value}"`, token.line, token.col);
		}

		const value = parseFloat(token.value);
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
			const units = Array.from(UNITS).join(', ');
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

			words.push(token.value.toLowerCase().trim());
		}

		if (!words.length) {
			throw new ParseError(
				`Expected food, got "${words.join(' ')}"`,
				startToken.line,
				startToken.col
			);
		}

		return {
			type: 'Food',
			name: words.join(' '),
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

		while (!this.isEOF()) {
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
				raw: value,
				line: token.line,
				col: token.col
			});
		}

		const lastToken = this.tokens[this.currentIndex - 1];
		if (lastToken.kind !== TokenKind.RPAREN) {
			throw new ParseError(`Expected ), got "${lastToken.value}"`, lastToken.line, lastToken.col);
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
}
