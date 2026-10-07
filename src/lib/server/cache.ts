import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import { REDIS_URL } from '$app/env/private';
import { createHash } from 'crypto';

export type CacheKey = `fdc:v1:${string}`;
const DEFAULT_TTL = 60 * 60 * 24 * 30; // 30 days

export const cache = {
	getJson: async <T>(key: CacheKey): Promise<T | null> => {
		try {
			const raw = await (await getRedisClient()).get(key);
			if (!raw) return null;
			return JSON.parse(raw) as T;
		} catch (err) {
			console.error(`Cache read failed for ${key}: ${err}`);
			return null;
		}
	},
	setJson: async <T>(key: CacheKey, value: T, ttlInSeconds = DEFAULT_TTL): Promise<void> => {
		try {
			await (
				await getRedisClient()
			).set(key, JSON.stringify(value), {
				expiration: {
					type: 'EX',
					value: ttlInSeconds
				}
			});
		} catch (err) {
			console.error(`Cache write failed for ${key}: ${err}`);
		}
	}
} as const;

const MAX_KEY_PART = 100;

export function getCacheKey(input: string): CacheKey {
	const normalized = input.normalize('NFKC').toLowerCase().trim().replace(/\s+/g, ' ');

	const part =
		normalized.length <= MAX_KEY_PART
			? normalized
			: createHash('sha256').update(normalized).digest('hex');

	return `fdc:v1:${part}`;
}

let client: RedisClientType | null;

async function getRedisClient(): Promise<RedisClientType> {
	if (!client) {
		client = await createClient({
			url: REDIS_URL,
			socket: {
				connectTimeout: 5000
			}
		})
			.on('error', (err) => console.error('Redis error', err))
			.connect()
			.catch((err) => {
				console.error('Redis connection error', err);
				client = null;
				throw err;
			});
	}

	return client;
}

process.on('sveltekit:shutdown', async () => {
	const client = await getRedisClient();
	if (!client) return;

	console.log('Shutting down Redis client');
	try {
		await client.quit();
		console.log('Redis client disconnected');
	} catch (err) {
		console.error(`Error while shutting down: ${err}`);
		client.destroy();
		process.exit(1);
	}
});
