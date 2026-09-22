import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Book } from '@/types/Book';
import type { SearchResult } from '@/types/GoogleBooks';
import { getBookById } from '@/services/googleBooksApi';
import { queryKeys } from '@/lib/queryKeys';
import { describeBooksError, isQuotaError } from '@/lib/apiErrors';
import { useFavorites } from './useFavorites';

export const useBookData = (bookId: string | undefined) => {
	const { isFavorite, toggleFavorite, isUpdatingBook, findFavorite } = useFavorites();
	const queryClient = useQueryClient();

	/**
	 * Antes de ir à rede, olhamos o que já temos: o livro pode estar na estante
	 * (com todos os campos salvos) ou em alguma busca já carregada. Isso evita
	 * uma requisição e mantém a página funcionando mesmo quando a API recusa.
	 */
	const conhecido = useMemo((): Book | undefined => {
		if (!bookId) return undefined;

		const naEstante = findFavorite(bookId);
		if (naEstante) return naEstante;

		const buscasEmCache = queryClient.getQueriesData<SearchResult>({
			queryKey: ['books', 'search'],
		});

		for (const [, resultado] of buscasEmCache) {
			const achado = resultado?.books.find((livro) => livro.id === bookId);
			if (achado) return achado;
		}

		return undefined;
	}, [bookId, findFavorite, queryClient]);

	const {
		data,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: queryKeys.bookDetail(bookId ?? ''),
		queryFn: ({ signal }) => getBookById(bookId as string, signal),
		enabled: Boolean(bookId),
		// Enquanto a resposta não chega (ou se ela falhar), mostramos o que já sabemos.
		placeholderData: conhecido,
	});

	const book = data ?? conhecido ?? null;

	const handleToggleFavorite = useCallback(() => {
		if (book) toggleFavorite(book);
	}, [book, toggleFavorite]);

	return {
		book,
		// O status vem do mesmo cache usado pelos cards: uma fonte de verdade só.
		isFavorite: book ? isFavorite(book.id) : false,
		isLoading: isLoading && !book,
		// Só vira erro de tela cheia quando não há nada para mostrar.
		error: error && !book ? describeBooksError(error, 'Não foi possível carregar os detalhes do livro.') : null,
		/** Falhou o refresh, mas há dados guardados: avisa sem bloquear a página. */
		staleNotice:
			error && book
				? isQuotaError(error)
					? 'Mostrando os dados já salvos: a cota diária da Google Books API foi atingida.'
					: 'Mostrando os dados já salvos: não foi possível atualizar as informações agora.'
				: null,
		isUpdatingFavorite: isUpdatingBook(bookId ?? ''),
		toggleFavorite: handleToggleFavorite,
		refreshBook: refetch,
	};
};
