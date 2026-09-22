import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Collection } from '@/types/Collection';
import {
	createCollection,
	deleteCollection,
	getCollections,
	updateCollection,
	type CollectionInput,
} from '@/services/collectionsApi';
import { queryKeys } from '@/lib/queryKeys';
import { addToCollection, moveInCollection, removeFromCollection } from '@/lib/collections';
import { logger } from '@/utils/logger';
import { useToast } from './useToast';

interface UpdateVariables {
	recordId: string;
	patch: Partial<CollectionInput>;
	/** Mensagem do toast; sem ela a alteração é silenciosa (reordenar, por exemplo). */
	message?: string;
}

/**
 * As coleções do usuário.
 *
 * Reordenar e incluir/excluir volumes são atualizações otimistas: arrastar um
 * volume para cima e esperar a resposta do servidor para ver o efeito tornaria
 * o ajuste de uma saga inteira insuportável.
 */
export const useCollections = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	const { data: collections = [], isLoading } = useQuery({
		queryKey: queryKeys.collections,
		queryFn: ({ signal }) => getCollections(signal),
	});

	const snapshot = useCallback(
		() => queryClient.getQueryData<Collection[]>(queryKeys.collections) ?? [],
		[queryClient]
	);

	const settle = useCallback(
		() => queryClient.invalidateQueries({ queryKey: queryKeys.collections }),
		[queryClient]
	);

	const reportFailure = useCallback(
		(what: string) => (error: Error) => {
			logger.error(`[useCollections] Falha ao ${what}:`, error);
			showToast({ message: `Não foi possível ${what}. Tente novamente.`, variant: 'error' });
		},
		[showToast]
	);

	const createMutation = useMutation<Collection, Error, CollectionInput>({
		mutationFn: createCollection,
		onSuccess: (collection) => {
			showToast({ message: `Coleção "${collection.name}" criada.`, variant: 'success' });
			settle();
		},
		onError: reportFailure('criar a coleção'),
	});

	const updateMutation = useMutation<Collection, Error, UpdateVariables, Collection[]>({
		mutationFn: ({ recordId, patch }) => updateCollection(recordId, patch),
		onMutate: async ({ recordId, patch }) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.collections });
			const previous = snapshot();

			queryClient.setQueryData<Collection[]>(
				queryKeys.collections,
				previous.map((item) => (item.recordId === recordId ? { ...item, ...patch } : item))
			);

			return previous;
		},
		onError: (error, _variables, previous) => {
			if (previous) queryClient.setQueryData(queryKeys.collections, previous);
			reportFailure('salvar a coleção')(error);
		},
		onSuccess: (_data, { message }) => {
			if (message) showToast({ message, variant: 'success' });
		},
		onSettled: settle,
	});

	const deleteMutation = useMutation<void, Error, Collection>({
		mutationFn: (collection) => deleteCollection(collection.recordId),
		onSuccess: (_data, collection) => {
			showToast({ message: `Coleção "${collection.name}" apagada.`, variant: 'success' });
			settle();
		},
		onError: reportFailure('apagar a coleção'),
	});

	const findCollection = useCallback(
		(recordId: string) => collections.find((item) => item.recordId === recordId),
		[collections]
	);

	/** Aplica uma transformação na ordem da coleção e grava o resultado. */
	const applyOrder = useCallback(
		(collection: Collection, bookIds: string[], message?: string) => {
			if (bookIds === collection.bookIds) return;
			updateMutation.mutate({ recordId: collection.recordId, patch: { bookIds }, message });
		},
		[updateMutation]
	);

	const addBook = useCallback(
		(collection: Collection, bookId: string) =>
			applyOrder(collection, addToCollection(collection.bookIds, bookId)),
		[applyOrder]
	);

	const removeBook = useCallback(
		(collection: Collection, bookId: string) =>
			applyOrder(collection, removeFromCollection(collection.bookIds, bookId)),
		[applyOrder]
	);

	const moveBook = useCallback(
		(collection: Collection, index: number, direction: 'up' | 'down') =>
			applyOrder(collection, moveInCollection(collection.bookIds, index, direction)),
		[applyOrder]
	);

	/** Liga/desliga um livro numa coleção — usado na ficha do livro. */
	const toggleBook = useCallback(
		(collection: Collection, bookId: string) =>
			collection.bookIds.includes(bookId)
				? removeBook(collection, bookId)
				: addBook(collection, bookId),
		[addBook, removeBook]
	);

	return {
		collections,
		isLoading,
		isSaving:
			createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
		findCollection,
		createCollection: createMutation.mutate,
		renameCollection: (recordId: string, patch: Partial<CollectionInput>) =>
			updateMutation.mutate({ recordId, patch, message: 'Coleção atualizada.' }),
		removeCollection: deleteMutation.mutate,
		addBook,
		removeBook,
		moveBook,
		toggleBook,
	};
};
