import { LexError } from './error';
import { isDigit, isLetter, isNameChar, isWhitespace } from './is';

export enum TokenKind {
	LPAREN,
	RPAREN,
	COMMA,
	IDENTIFIER,
	NUMBER,
	COMMENT,
	AT,
	NEWLINE,
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

		this.tokens.push(this.makeToken(TokenKind.EOF, ''));

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
			case ',':
				this.tokens.push(this.makeToken(TokenKind.COMMA, ','));
				break;
			case '@':
				this.tokens.push(this.makeToken(TokenKind.AT, '@'));
				break;
			case '#':
				this.tokens.push(this.parseComment());
				break;
			case '\n':
				this.tokens.push(this.makeToken(TokenKind.NEWLINE, '\n'));
				break;
			case undefined:
				break;

			default: {
				if (isDigit(ch) || ch === '.') {
					if (isLetter(this.peek())) {
						this.tokens.push(this.parseIdent());
					} else {
						this.tokens.push(this.parseNumber());
					}
				} else if (isLetter(ch)) {
					this.tokens.push(this.parseIdent());
				} else {
					throw new LexError(`Unexpected character '${ch}'`, this.line, this.col);
				}

				return;
			}
		}

		this.consume();
	}

	private parseIdent(): Token {
		const start = this.cursor;
		const startLine = this.line;
		const startCol = this.col;

		while (isNameChar(this.currentChar)) this.consume();

		return this.makeToken(
			TokenKind.IDENTIFIER,
			this.source.slice(start, this.cursor),
			startLine,
			startCol
		);
	}

	private parseComment(): Token {
		const start = this.cursor;
		const startLine = this.line;
		const startCol = this.col;

		while (this.currentChar !== '\n' && this.currentChar !== '\r' && this.currentChar !== undefined)
			this.consume();

		return this.makeToken(
			TokenKind.COMMENT,
			this.source.slice(start, this.cursor),
			startLine,
			startCol
		);
	}

	private parseNumber(): Token {
		const start = this.cursor;
		const startLine = this.line;
		const startCol = this.col;

		let hasDot = false;
		let hasSlash = false;

		while (isDigit(this.currentChar) || this.currentChar === '.') {
			this.consume();

			if (hasDot && this.currentChar === '.')
				throw new LexError(`Unexpected character '${this.currentChar}'`, this.line, this.col);

			if (hasSlash && this.currentChar === '/')
				throw new LexError(`Unexpected character '${this.currentChar}'`, this.line, this.col);

			if (isWhitespace(this.currentChar)) {
				this.skipWhitespace();
				continue;
			}

			if (this.currentChar === '.') {
				hasDot = true;
				this.consume();
				continue;
			}

			if (this.currentChar === '/') {
				hasSlash = true;
				this.consume();
				continue;
			}
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

	private peek() {
		return this.source[this.cursor + 1];
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
