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
		if (!this.source) return [];

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
			case '\0':
				this.tokens.push(this.makeToken(TokenKind.EOF, ''));
				break;

			default: {
				if (isDigit(ch)) {
					this.tokens.push(this.parseNumber());
				} else if (isLetter(ch)) {
					this.tokens.push(this.parseLetter());
				}

				return;
			}
		}

		this.consume();
	}

	private parseLetter(): Token {
		const start = this.cursor;
		while (isLetter(this.currentChar)) this.consume();

		return this.makeToken(TokenKind.IDENTIFIER, this.source.slice(start, this.cursor));
	}

	private parseNumber(): Token {
		const start = this.cursor;
		while (isDigit(this.currentChar)) this.consume();

		return this.makeToken(TokenKind.NUMBER, this.source.slice(start, this.cursor));
	}

	private consume() {
		this.col = this.currentChar === '\n' ? 1 : this.col + 1;
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

	private makeToken(kind: TokenKind, value: string): Token {
		return {
			line: this.line,
			col: this.col,
			kind,
			value
		};
	}
}
