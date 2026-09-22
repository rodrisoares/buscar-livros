import { normalizeForSearch } from '@/utils/normalize';

export const RECENT_SEARCHES_KEY = 'recentSearches';
export const MAX_RECENT_SEARCHES = 8;

/**
 * Insere no topo, sem repetir (comparação sem caixa/acento) e com tamanho máximo.
 * Função pura para poder ser testada sem localStorage.
 */
export const addRecentSearch = (list: string[], term: string): string[] => {
	const trimmed = term.trim();
	if (!trimmed) return list;

	const withoutDuplicate = list.filter(
		(item) => normalizeForSearch(item) !== normalizeForSearch(trimmed)
	);

	return [trimmed, ...withoutDuplicate].slice(0, MAX_RECENT_SEARCHES);
};

/** Filtra as buscas recentes pelo texto digitado, escondendo o termo exato já digitado. */
export const filterRecentSearches = (list: string[], term: string): string[] => {
	const normalizedTerm = normalizeForSearch(term);
	if (!normalizedTerm) return list;

	return list.filter((item) => {
		const normalizedItem = normalizeForSearch(item);
		return normalizedItem.includes(normalizedTerm) && normalizedItem !== normalizedTerm;
	});
};

export const readRecentSearches = (): string[] => {
	try {
		const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
		if (!stored) return [];

		const parsed: unknown = JSON.parse(stored);
		return Array.isArray(parsed)
			? parsed.filter((item): item is string => typeof item === 'string')
			: [];
	} catch {
		// Storage indisponível ou conteúdo corrompido: seguimos sem histórico.
		return [];
	}
};

/**
 * Store compartilhada.
 *
 * Cada `SearchBar` tinha o seu próprio `useState`, então o campo do cabeçalho e
 * o do drawer discordavam sobre o histórico até o reload. Uma única fonte, lida
 * por `useSyncExternalStore`, mantém todas as instâncias — e todas as abas — em
 * sincronia.
 */
let cache: string[] | null = null;
const listeners = new Set<() => void>();
let listeningToStorage = false;

const emit = () => {
	for (const listener of listeners) listener();
};

/** Outra aba mexeu no histórico: descarta o cache e avisa quem está na tela. */
const bindStorageEvent = () => {
	if (listeningToStorage || typeof window === 'undefined') return;
	listeningToStorage = true;

	window.addEventListener('storage', (event) => {
		// `key` nulo significa storage inteiro limpo.
		if (event.key !== null && event.key !== RECENT_SEARCHES_KEY) return;
		cache = null;
		emit();
	});
};

export const subscribeRecentSearches = (listener: () => void): (() => void) => {
	bindStorageEvent();
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

/**
 * O snapshot precisa manter a mesma referência enquanto nada muda: sem o cache,
 * cada render receberia um array novo e o React entraria em laço.
 */
export const getRecentSearches = (): string[] => {
	if (cache === null) cache = readRecentSearches();
	return cache;
};

export const writeRecentSearches = (list: string[]): void => {
	cache = list;

	try {
		localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
	} catch {
		// Modo privado / cota cheia: o histórico é opcional, então ignoramos.
	}

	emit();
};
