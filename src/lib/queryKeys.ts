import type { SortOption } from '@/types/GoogleBooks';
import type { SearchOptions } from '@/services/googleBooksApi';
import { PAGE_SIZE } from './pagination';

/** Chaves centralizadas: é o que garante a deduplicação correta por parâmetro. */
export const queryKeys = {
	booksSearch: (query: string, options: SearchOptions & { sort?: SortOption }) =>
		[
			'books',
			'search',
			{
				query,
				page: options.page ?? 1,
				sort: options.sort ?? 'relevance',
				lang: options.lang ?? '',
				availability: options.availability ?? '',
				printType: options.printType ?? 'books',
				// Sem isto, trocar "20 por página" para 40 reaproveitaria o cache de 20.
				maxResults: options.maxResults ?? PAGE_SIZE,
			},
		] as const,
	/**
	 * Sugestões do campo de busca. Ficam sob `['books','search']` de propósito:
	 * é o prefixo que `useBookData` varre à procura de um livro já carregado,
	 * então abrir a ficha por uma sugestão não custa requisição nenhuma.
	 */
	booksSuggest: (term: string) => ['books', 'search', 'suggest', term] as const,
	bookDetail: (id: string) => ['books', 'detail', id] as const,
	relatedBooks: (kind: 'author' | 'category', value: string) =>
		['books', 'related', kind, value] as const,
	favorites: ['favorites'] as const,
	shelves: ['shelves'] as const,
	collections: ['collections'] as const,
	goals: ['goals'] as const,
};
