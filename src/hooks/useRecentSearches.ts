import { useCallback, useSyncExternalStore } from 'react';
import {
	addRecentSearch,
	getRecentSearches,
	subscribeRecentSearches,
	writeRecentSearches,
} from '@/lib/recentSearches';

/**
 * Lê a store compartilhada de `lib/recentSearches`, e não um estado próprio:
 * assim as duas barras de busca que podem estar montadas ao mesmo tempo (a do
 * cabeçalho e a do drawer) mostram sempre a mesma lista.
 */
export const useRecentSearches = () => {
	const recentSearches = useSyncExternalStore(
		subscribeRecentSearches,
		getRecentSearches,
		getRecentSearches
	);

	const remember = useCallback(
		(term: string) => writeRecentSearches(addRecentSearch(getRecentSearches(), term)),
		[]
	);

	const forget = useCallback(
		(term: string) => writeRecentSearches(getRecentSearches().filter((item) => item !== term)),
		[]
	);

	const clearRecentSearches = useCallback(() => writeRecentSearches([]), []);

	return { recentSearches, remember, forget, clearRecentSearches };
};
