import { TokenKind, type Token } from './tokenizer';

interface ProgramNode extends NodeBase {
	type: 'Program';
	body: StatementNode[];
}

type StatementNode = EntryStatementNode;

interface EntryStatementNode extends NodeBase {
	type: 'EntryStatement';
	tag: string | null;
	quantity: QuantityNode;
	food: FoodNode;
	modifiers: ModifierNode[];
}

interface QuantityNode extends NodeBase {
	type: 'Quantity';
	value: number;
	unit: UnitNode | null;
}

interface UnitNode extends NodeBase {
	type: 'Unit';
	raw: string;
}

interface FoodNode extends NodeBase {
	type: 'Food';
	name: string;
}

interface ModifierNode extends NodeBase {
	type: 'Modifier';
	raw: string;
}

export interface NodeBase {
	line: number;
	col: number;
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

		while (this.currentIndex < this.tokens.length) statements.push(this.parseEntryStatement());

		return statements;
	}

	private parseEntryStatement(): EntryStatementNode {
		const startToken = this.tokens[0]!;

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
		const token = this.tokens[this.currentIndex++];
		if (!token) {
			this.currentIndex--;
			return null;
		}

		if (token.kind !== TokenKind.AT) {
			if (this.tokens[this.currentIndex].kind === TokenKind.IDENTIFIER) {
				throw new Error('Expected @');
			}

			this.currentIndex--;
			return null;
		}

		const tag = this.tokens[this.currentIndex++];

		if (tag.kind !== TokenKind.IDENTIFIER) {
			throw new Error('Expected tag');
		}

		return tag.value;
	}

	private parseQuantity(): QuantityNode {
		const token = this.tokens[this.currentIndex++];

		if (token.kind !== TokenKind.NUMBER) {
			throw new Error('Expected number');
		}

		const value = parseInt(token.value);
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
		const token = this.tokens[this.currentIndex++];

		if (token.kind !== TokenKind.IDENTIFIER) {
			this.currentIndex--;
			return null;
		}

		return {
			type: 'Unit',
			raw: token.value,
			line: token.line,
			col: token.col
		};
	}

	private parseFood(): FoodNode {
		const token = this.tokens[this.currentIndex++];

		if (token.value !== 'of') {
			this.currentIndex--;
		}

		const words: string[] = [];

		while (this.currentIndex < this.tokens.length) {
			const token = this.tokens[this.currentIndex++];

			if (token.kind !== TokenKind.IDENTIFIER) {
				this.currentIndex--;
				break;
			}

			words.push(token.value);
		}

		if (!words.length) {
			throw new Error('Expected food');
		}

		return {
			type: 'Food',
			name: words.join(' '),
			line: token.line,
			col: token.col
		};
	}

	private parseModifiers(): ModifierNode[] {
		const token = this.tokens[this.currentIndex++];
		if (!token) return [];

		if (token.kind !== TokenKind.LPAREN) {
			this.currentIndex--;
			return [];
		}

		const modifiers: ModifierNode[] = [];

		while (this.currentIndex < this.tokens.length) {
			const modifier = this.tokens[this.currentIndex++];

			if (modifier.kind === TokenKind.RPAREN) {
				break;
			}

			if (modifier.kind === TokenKind.COMMA) {
				continue;
			}

			if (modifier.kind !== TokenKind.IDENTIFIER) {
				throw new Error('Expected modifier');
			}

			modifiers.push({
				type: 'Modifier',
				raw: modifier.value,
				line: modifier.line,
				col: modifier.col
			});
		}

		if (this.tokens[this.currentIndex - 1].kind !== TokenKind.RPAREN) {
			throw new Error('Expected )');
		}

		return modifiers;
	}
}
