import type { Book } from '@/types/Book';
import type {
	GoogleBooksVolume,
	RawGoogleBooksResponse,
	SearchResult,
	SortOption,
} from '@/types/GoogleBooks';
import type { Availability, PrintType } from '@/lib/searchQuery';
import { env } from '@/config/env';
import { request } from '@/lib/http';
import { PAGE_SIZE, getStartIndex } from '@/lib/pagination';
import { googleBooksAdapter } from '@/utils/GoogleBooksAdapter';

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

/**
 * Sem chave, as requisições caem na cota compartilhada e anônima do Google, que
 * é pequena e some rápido (erro 429 "Queries per day"). Com uma chave própria,
 * o consumo passa a contar no seu projeto do Google Cloud.
 */
const API_KEY = env.googleBooksApiKey;

const withApiKey = (url: URL): URL => {
	if (API_KEY) url.searchParams.set('key', API_KEY);
	return url;
};

export interface SearchOptions {
	page?: number;
	sort?: SortOption;
	/** Código ISO passado em `langRestrict`. */
	lang?: string;
	availability?: Availability;
	printType?: PrintType;
	maxResults?: number;
	signal?: AbortSignal;
}

export const buildSearchUrl = (query: string, options: SearchOptions = {}): string => {
	const {
		page = 1,
		sort = 'relevance',
		lang = '',
		availability = '',
		printType = 'books',
		maxResults = PAGE_SIZE,
	} = options;

	const url = new URL(GOOGLE_BOOKS_API_URL);
	url.searchParams.set('q', query);
	url.searchParams.set('maxResults', String(maxResults));
	// O salto entre páginas é do tamanho da página: com 40 por vez, a página 2
	// começa no índice 40 — senão o seletor de itens por página repetiria livros.
	url.searchParams.set('startIndex', String(getStartIndex(page, maxResults)));
	url.searchParams.set('printType', printType);
	url.searchParams.set('orderBy', sort);

	if (lang) url.searchParams.set('langRestrict', lang);
	if (availability) url.searchParams.set('filter', availability);

	return withApiKey(url).toString();
};

export const searchBooks = async (
	query: string,
	options: SearchOptions = {}
): Promise<SearchResult> => {
	if (!query.trim()) {
		return { books: [], totalItems: 0 };
	}

	const raw = await request<RawGoogleBooksResponse>(buildSearchUrl(query, options), {
		signal: options.signal,
	});

	return {
		// A API omite `items` quando a busca não retorna nada.
		books: googleBooksAdapter.transformArray(raw.items ?? []),
		totalItems: raw.totalItems ?? 0,
	};
};

export const getBookById = async (id: string, signal?: AbortSignal): Promise<Book> => {
	const url = withApiKey(new URL(`${GOOGLE_BOOKS_API_URL}/${id}`));
	const volume = await request<GoogleBooksVolume>(url.toString(), { signal });
	return googleBooksAdapter.transform(volume);
};
