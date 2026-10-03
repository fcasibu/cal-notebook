// See https://svelte.dev/docs/kit/types#app.d.ts

import type { ResolvedLine } from '#lib/server/resolver.ts';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			resolvedLines: ResolvedLine[];
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
