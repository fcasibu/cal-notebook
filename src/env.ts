import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DEMO_API_KEY: {},
	REDIS_URL: {}
});
