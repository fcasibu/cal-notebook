import { DEMO_API_KEY } from '$app/env/private';
import { USDALimitExceededError } from '../errors';
import { rankFoods } from '../fdc/rank-foods';
import {
	NutrientNumbers,
	type DataType,
	type FdcFood,
	type FdcSearchResult,
	type SortBy
} from '../types';

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

type USDAResponse<T, E> =
	| {
			ok: true;
			data: T;
	  }
	| {
			ok: false;
			errors: E[];
	  };

interface USDARequestBody {
	query: string;
	dataType?: DataType[];
	pageSize?: number;
	pageNumber?: number;
	sortBy?: SortBy;
	sortOrder?: 'asc' | 'desc';
}

async function usdaFetch<T>(
	endpoint: string,
	init: Omit<RequestInit, 'body'> & { body?: USDARequestBody | BodyInit | null },
	searchParams?: URLSearchParams
): Promise<USDAResponse<T, USDALimitExceededError | Error>> {
	const errors: Error[] = [];
	const maxRetries = 3;
	const baseDelay = 1000;
	const maxDelay = 10000;

	const requestBody = typeof init.body === 'string' ? init.body : JSON.stringify(init.body);
	const params = searchParams ?? new URLSearchParams();
	params?.append('api_key', DEMO_API_KEY);

	for (let retries = maxRetries; retries > 0; retries--) {
		try {
			const response = await fetch(`${BASE_URL}/${endpoint}?${params.toString()}`, {
				...init,
				headers: {
					'Content-Type': 'application/json',
					...init.headers
				},
				body: requestBody
			});
			const remaining = response.headers.get('X-RateLimit-Remaining');

			if (remaining && Number(remaining) <= 0)
				return {
					ok: false,
					errors: [
						...errors,
						new USDALimitExceededError(`Rate limit exceeded. Remaining: ${remaining}`)
					]
				};

			if (!response.ok) throw new Error(response.statusText);

			const data = (await response.json()) as T;
			return { data, ok: true };
		} catch (error) {
			errors.push(error as Error);

			const delay = Math.min(baseDelay * Math.pow(2, retries), maxDelay);
			await new Promise((resolve) => setTimeout(resolve, Math.random() * delay));
		}
	}

	return { ok: false, errors };
}

export async function queryFood(
	query: string
): Promise<USDAResponse<FdcFood, USDALimitExceededError | Error>> {
	const response = await usdaFetch<FdcSearchResult>('foods/search', {
		method: 'POST',
		body: {
			query,
			dataType: ['SR Legacy', 'Foundation', 'Survey (FNDDS)'],
			pageSize: 25
		}
	});

	if (!response.ok) return { ok: false, errors: response.errors };

	const ranked = rankFoods(query, response.data.foods);
	if (!ranked.length) return { ok: false, errors: [] };

	return getFdcFood(ranked[0].fdcId);
}

async function getFdcFood(
	fdcId: number
): Promise<USDAResponse<FdcFood, USDALimitExceededError | Error>> {
	const params = new URLSearchParams();
	params.append('nutrients', NutrientNumbers.PROTEIN);
	params.append('nutrients', NutrientNumbers.FAT);
	params.append('nutrients', NutrientNumbers.CARBOHYDRATES);
	params.append('nutrients', NutrientNumbers.ENERGY);

	return await usdaFetch<FdcFood>(
		`food/${fdcId}`,
		{
			method: 'GET'
		},
		params
	);
}
