import { QueryClient } from '@tanstack/react-query';
import { shouldRetry } from './http';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000,
			gcTime: 10 * 60 * 1000,
			retry: shouldRetry,
			retryDelay: (attempt) => Math.min(300 * 2 ** attempt, 3000),
			refetchOnWindowFocus: false,
		},
		mutations: {
			// Mutações não são repetidas: um POST repetido cria favorito duplicado.
			retry: false,
		},
	},
});
