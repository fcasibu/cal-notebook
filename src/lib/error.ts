export class LexError extends Error {
	constructor(
		public readonly msg: string,
		public readonly line: number,
		public readonly col: number
	) {
		super(msg);
		this.name = 'LexError';

		if (Error.captureStackTrace) Error.captureStackTrace(this, LexError);
	}
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

export class ParseNumberError extends Error {
	constructor(
		public readonly msg: string,
		public line: number = 0,
		public col: number = 0
	) {
		super(msg);
		this.name = 'ParseNumberError';

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ParseNumberError);
		}
	}
}

export type ProgramError = LexError | ParseError | ParseNumberError | Error;
