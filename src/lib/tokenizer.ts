import { isDigit, isLetter, isWhitespace } from './is';

export enum TokenKind {
	LPAREN,
	RPAREN,
	LBRACKET,
	RBRACKET,
	COMMA,
	IDENTIFIER,
	NUMBER,
	AT,
	EOF
}

export interface Token {
	line: number;
	col: number;
	value: string;
	kind: TokenKind;
}

export class Tokenizer {
	private currentChar: string;
	private cursor: number = 0;
	private line: number = 1;
	private col: number = 1;
	private tokens: Token[] = [];

	constructor(private readonly source: string) {
		this.currentChar = source[0] ?? '';
	}

	public tokenize(): Token[] {
		while (!this.eof()) {
			this.skipWhitespace();
			this.scan();
		}

		return this.tokens;
	}

	private scan() {
		const ch = this.currentChar;

		switch (ch) {
			case '(':
				this.tokens.push(this.makeToken(TokenKind.LPAREN, '('));
				break;
			case ')':
				this.tokens.push(this.makeToken(TokenKind.RPAREN, ')'));
				break;
			case '[':
				this.tokens.push(this.makeToken(TokenKind.LBRACKET, '['));
				break;
			case ']':
				this.tokens.push(this.makeToken(TokenKind.RBRACKET, ']'));
				break;
			case ',':
				this.tokens.push(this.makeToken(TokenKind.COMMA, ','));
				break;
			case '@':
				this.tokens.push(this.makeToken(TokenKind.AT, '@'));
				break;
			case undefined:
				this.tokens.push(this.makeToken(TokenKind.EOF, ''));
				break;

			default: {
				if (isDigit(ch)) {
					this.tokens.push(this.parseNumber());
				} else if (isLetter(ch)) {
					this.tokens.push(this.parseLetter());
				} else {
					throw new Error(`Unexpected character '${ch}'`);
				}

				return;
			}
		}

		this.consume();
	}

	private parseLetter(): Token {
		const start = this.cursor;
		const startLine = this.line;
		const startCol = this.col;

		while (isLetter(this.currentChar)) this.consume();

		return this.makeToken(
			TokenKind.IDENTIFIER,
			this.source.slice(start, this.cursor),
			startLine,
			startCol
		);
	}

	private parseNumber(): Token {
		const start = this.cursor;
		const startLine = this.line;
		const startCol = this.col;

		while (isDigit(this.currentChar)) {
			this.consume();

			if (this.currentChar === '.') this.consume();
		}

		return this.makeToken(
			TokenKind.NUMBER,
			this.source.slice(start, this.cursor),
			startLine,
			startCol
		);
	}

	private consume() {
		this.col = this.currentChar === '\n' ? 1 : this.col + 1;
		this.line = this.currentChar === '\n' ? this.line + 1 : this.line;
		this.cursor += 1;

		const char = this.source[this.cursor];
		this.currentChar = char;
	}

	private skipWhitespace() {
		while (isWhitespace(this.currentChar)) this.consume();
	}

	private eof() {
		return this.cursor >= this.source.length;
	}

	private makeToken(
		kind: TokenKind,
		value: string,
		line: number = this.line,
		col: number = this.col
	): Token {
		return {
			line,
			col,
			kind,
			value
		};
	}
}
