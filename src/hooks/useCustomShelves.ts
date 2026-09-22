import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CustomShelf } from '@/types/CustomShelf';
import {
	createShelf,
	deleteShelf,
	getShelves,
	updateShelfRecord,
	type ShelfInput,
} from '@/services/shelvesApi';
import { queryKeys } from '@/lib/queryKeys';
import { logger } from '@/utils/logger';
import { useToast } from './useToast';
import { useFavorites } from './useFavorites';

/**
 * As estantes que o usuário criou.
 *
 * Apagar uma estante precisa limpar a referência nos livros que estavam nela —
 * senão o registro guarda uma chave que não aponta mais para nada, e o livro
 * carrega para sempre um selo invisível.
 */
export const useCustomShelves = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { favorites, updateShelf } = useFavorites();

	const { data: shelves = [], isLoading } = useQuery({
		queryKey: queryKeys.shelves,
		queryFn: ({ signal }) => getShelves(signal),
	});

	const settle = useCallback(
		() => queryClient.invalidateQueries({ queryKey: queryKeys.shelves }),
		[queryClient]
	);

	const reportFailure = useCallback(
		(what: string) => (error: Error) => {
			logger.error(`[useCustomShelves] Falha ao ${what}:`, error);
			showToast({ message: `Não foi possível ${what}. Tente novamente.`, variant: 'error' });
		},
		[showToast]
	);

	const createMutation = useMutation<CustomShelf, Error, Omit<ShelfInput, 'position'>>({
		mutationFn: (input) =>
			// A nova entra no fim da fila de abas.
			createShelf({ ...input, position: shelves.length }),
		onSuccess: (shelf) => {
			showToast({ message: `Estante "${shelf.name}" criada.`, variant: 'success' });
			settle();
		},
		onError: reportFailure('criar a estante'),
	});

	const updateMutation = useMutation<
		CustomShelf,
		Error,
		{ recordId: string; patch: Partial<ShelfInput> }
	>({
		mutationFn: ({ recordId, patch }) => updateShelfRecord(recordId, patch),
		onSuccess: settle,
		onError: reportFailure('renomear a estante'),
	});

	const deleteMutation = useMutation<void, Error, CustomShelf>({
		mutationFn: async (shelf) => {
			await deleteShelf(shelf.recordId);
		},
		onSuccess: (_data, shelf) => {
			// Tira a estante dos livros que estavam nela, um a um pelo caminho
			// normal da estante — assim a atualização otimista e o rollback já
			// valem sem regra nova.
			for (const book of favorites) {
				if (!book.shelves.includes(shelf.recordId)) continue;
				updateShelf(book.id, {
					shelves: book.shelves.filter((id) => id !== shelf.recordId),
				});
			}

			showToast({ message: `Estante "${shelf.name}" apagada.`, variant: 'success' });
			settle();
		},
		onError: reportFailure('apagar a estante'),
	});

	const findShelf = useCallback(
		(recordId: string) => shelves.find((shelf) => shelf.recordId === recordId),
		[shelves]
	);

	/** Liga/desliga um livro numa estante, sem tocar nas outras nem no status. */
	const toggleBookShelf = useCallback(
		(bookId: string, shelfId: string) => {
			const book = favorites.find((item) => item.id === bookId);
			if (!book) return;

			updateShelf(bookId, {
				shelves: book.shelves.includes(shelfId)
					? book.shelves.filter((id) => id !== shelfId)
					: [...book.shelves, shelfId],
			});
		},
		[favorites, updateShelf]
	);

	return {
		shelves,
		isLoading,
		isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
		findShelf,
		toggleBookShelf,
		createShelf: createMutation.mutate,
		renameShelf: (recordId: string, patch: Partial<ShelfInput>) =>
			updateMutation.mutate({ recordId, patch }),
		removeShelf: deleteMutation.mutate,
	};
};
