import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFavorites } from '@/services/favoritesApi';
import { queryKeys } from '@/lib/queryKeys';
import type { FavoriteBook } from '@/types/Book';

/**
 * Uma instância só para o caso vazio.
 *
 * Criar `[]` a cada render trocaria a identidade da lista e refaria os
 * `useCallback` abaixo sem que nada tivesse mudado.
 */
const EMPTY: FavoriteBook[] = [];

/**
 * A leitura da estante.
 *
 * Todo componente que chama isto compartilha o mesmo cache do React Query — a
 * consulta acontece uma vez, e card, ficha e painel nunca divergem sobre o que
 * está guardado. Chamá-lo em dois lugares da mesma árvore não dobra requisição
 * nenhuma; é o que permite `useShelfMutations` usá-lo por dentro sem custo.
 */
export const useShelfQuery = () => {
	const {
		data,
		isLoading,
		error,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: queryKeys.favorites,
		queryFn: ({ signal }) => getFavorites(signal),
	});

	const favorites = data ?? EMPTY;

	/**
	 * Falhar ao atualizar não é o mesmo que falhar ao carregar.
	 *
	 * Com o cache no armazenamento local, a estante já está na tela quando a
	 * rede cai — e trocar trinta livros por um aviso de erro entregaria menos do
	 * que o app tem em mãos. Só é erro de carregamento quando não há nada para
	 * mostrar; havendo, a lista fica e o aviso vem ao lado.
	 */
	const hasData = data !== undefined;

	const findFavorite = useCallback(
		(bookId: string) => favorites.find((favorite) => favorite.id === bookId),
		[favorites]
	);

	const isFavorite = useCallback(
		(bookId: string) => Boolean(findFavorite(bookId)),
		[findFavorite]
	);

	/** Os livros de uma seleção que de fato existem, na ordem em que estão na estante. */
	const selectFavorites = useCallback(
		(bookIds: string[]) => {
			const wanted = new Set(bookIds);
			return favorites.filter((favorite) => wanted.has(favorite.id));
		},
		[favorites]
	);

	return {
		favorites,
		favoritesCount: favorites.length,
		isLoading,
		loadError: error && !hasData ? 'Não foi possível carregar sua estante.' : null,
		refreshError:
			error && hasData ? 'Não foi possível atualizar a estante. Mostrando a última versão guardada.' : null,
		isRefreshing: isFetching,
		findFavorite,
		isFavorite,
		selectFavorites,
		refetch,
	};
};
