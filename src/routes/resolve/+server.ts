import { resolveEntries } from '#lib/server/resolver.js';
import type { EntryStatementNode } from '#lib/types.js';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent): Promise<Response> {
	const { entries } = (await request.json()) as { entries: EntryStatementNode[] };

	return Response.json(await resolveEntries(entries));
}
