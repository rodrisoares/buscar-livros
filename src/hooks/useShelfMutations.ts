import { useCallback, useMemo } from 'react';
import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query';
import type { Book, FavoriteBook, ShelfPatch } from '@/types/Book';
import type { ShelfStatus } from '@/types/Shelf';
import { SHELF_LABELS } from '@/types/Shelf';
import { addToFavorites, removeFromFavorites, updateFavorite } from '@/services/favoritesApi';
import { queryKeys } from '@/lib/queryKeys';
import {
	buildProgressPatch,
	buildShelfEntries,
	buildStatusEntries,
	buildStatusPatch,
	buildTagEntries,
	runInBatches,
	shelfSnapshot,
	type ShelfEntry,
} from '@/lib/shelfPatches';
import { logger } from '@/utils/logger';
import { useShelfQuery } from './useShelfQuery';
import { useToast } from './useToast';

interface AddVariables {
	book: Book;
	/** Preservados no "Desfazer", para o livro voltar exatamente como estava. */
	addedAt?: number;
	shelf?: ShelfPatch;
}

interface RemoveVariables {
	/** Chave do registro na API — não é o id do volume no Google Books. */
	recordId: string;
	bookId: string;
}

interface UpdateVariables {
	bookId: string;
	recordId: string;
	patch: ShelfPatch;
}

/**
 * Uma única mutação cobre as três ações em lote. Separá-las em três daria três
 * atualizações otimistas, três rollbacks e três invalidações para descrever a
 * mesma coisa: "mexi em N livros de uma vez".
 */
type BulkVariables =
	| { kind: 'update'; entries: ShelfEntry[]; message: string }
	| { kind: 'remove'; books: FavoriteBook[] }
	| { kind: 'restore'; books: FavoriteBook[] };

interface MutationContext {
	previous: FavoriteBook[];
	removed?: FavoriteBook;
}

const FAVORITE_MUTATION_KEY = ['favorites', 'mutation'] as const;

/** Quantas escritas seguem juntas; acima disso o json-server começa a recusar. */
const BULK_CONCURRENCY = 5;

/**
 * As mutações carregam o id do volume em lugares diferentes (`book.id` na
 * inclusão, `bookId` na remoção e na atualização, uma lista inteira no lote).
 * Normalizar aqui é o que permite saber quais livros estão sendo salvos — e não
 * apenas que algo está.
 */
const mutatedBookIds = (variables: unknown): string[] => {
	if (!variables || typeof variables !== 'object') return [];

	const bulk = variables as Partial<BulkVariables>;
	if (bulk.kind === 'update') return (bulk.entries ?? []).map((entry) => entry.bookId);
	if (bulk.kind === 'remove' || bulk.kind === 'restore') {
		return (bulk.books ?? []).map((book) => book.id);
	}

	const { bookId, book } = variables as Partial<AddVariables & RemoveVariables>;
	const single = bookId ?? book?.id ?? '';
	return single ? [single] : [];
};

const ACTION_ERROR_MESSAGE = 'Não foi possível salvar a alteração. Tente novamente.';

const plural = (count: number, singular: string, many: string): string =>
	`${count} ${count === 1 ? singular : many}`;

/**
 * Tudo que escreve na estante: as quatro mutações, o rastro do que está em voo
 * e as ações que as telas chamam.
 *
 * A leitura vem de `useShelfQuery`, chamado aqui dentro — as ações precisam
 * saber o que já existe (a chave do registro, o estado atual do livro) antes de
 * montar a escrita. Como é a mesma chave de consulta, não custa requisição
 * nenhuma a mais.
 */
export const useShelfMutations = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { findFavorite, selectFavorites } = useShelfQuery();

	const snapshot = useCallback(
		() => queryClient.getQueryData<FavoriteBook[]>(queryKeys.favorites) ?? [],
		[queryClient]
	);

	const cancelInFlight = useCallback(
		async () => queryClient.cancelQueries({ queryKey: queryKeys.favorites }),
		[queryClient]
	);

	const rollback = useCallback(
		(context: MutationContext | undefined) => {
			if (context) queryClient.setQueryData(queryKeys.favorites, context.previous);
		},
		[queryClient]
	);

	const settle = useCallback(
		() => queryClient.invalidateQueries({ queryKey: queryKeys.favorites }),
		[queryClient]
	);

	const addMutation = useMutation<FavoriteBook, Error, AddVariables, MutationContext>({
		mutationKey: FAVORITE_MUTATION_KEY,
		mutationFn: ({ book, addedAt, shelf }) => addToFavorites(book, addedAt, shelf),
		onMutate: async ({ book, addedAt, shelf }) => {
			await cancelInFlight();
			const previous = snapshot();
			queryClient.setQueryData<FavoriteBook[]>(queryKeys.favorites, [
				...previous.filter((favorite) => favorite.id !== book.id),
				{
					...book,
					// recordId só existe depois da resposta do servidor; o refetch preenche.
					recordId: '',
					addedAt: addedAt ?? Date.now(),
					status: 'want_to_read',
					currentPage: 0,
					progressLog: [],
					rating: 0,
					notes: '',
					tags: [],
					shelves: [],
					startedAt: 0,
					finishedAt: 0,
					...shelf,
				},
			]);
			return { previous };
		},
		onError: (error, _variables, context) => {
			// Sem rollback a interface mostraria um livro que o servidor recusou.
			rollback(context);
			logger.error('[useShelfMutations] Falha ao adicionar à estante:', error);
			showToast({ message: ACTION_ERROR_MESSAGE, variant: 'error' });
		},
		onSettled: settle,
	});

	const removeMutation = useMutation<void, Error, RemoveVariables, MutationContext>({
		mutationKey: FAVORITE_MUTATION_KEY,
		mutationFn: ({ recordId }) => removeFromFavorites(recordId),
		onMutate: async ({ bookId }) => {
			await cancelInFlight();
			const previous = snapshot();
			queryClient.setQueryData<FavoriteBook[]>(
				queryKeys.favorites,
				previous.filter((favorite) => favorite.id !== bookId)
			);
			return { previous, removed: previous.find((favorite) => favorite.id === bookId) };
		},
		onSuccess: (_data, _variables, context) => {
			const removed = context?.removed;
			if (!removed) return;

			showToast({
				message: `"${removed.title}" removido da estante.`,
				variant: 'success',
				action: {
					label: 'Desfazer',
					// Devolve o livro com progresso, nota, notas e tags intactos.
					onClick: () =>
						addMutation.mutate({
							book: removed,
							addedAt: removed.addedAt,
							shelf: shelfSnapshot(removed),
						}),
				},
			});
		},
		onError: (error, _variables, context) => {
			rollback(context);
			logger.error('[useShelfMutations] Falha ao remover da estante:', error);
			showToast({ message: ACTION_ERROR_MESSAGE, variant: 'error' });
		},
		onSettled: settle,
	});

	const updateMutation = useMutation<FavoriteBook, Error, UpdateVariables, MutationContext>({
		mutationKey: FAVORITE_MUTATION_KEY,
		mutationFn: ({ recordId, patch }) => updateFavorite(recordId, patch),
		onMutate: async ({ bookId, patch }) => {
			await cancelInFlight();
			const previous = snapshot();
			queryClient.setQueryData<FavoriteBook[]>(
				queryKeys.favorites,
				previous.map((favorite) =>
					favorite.id === bookId ? { ...favorite, ...patch } : favorite
				)
			);
			return { previous };
		},
		onError: (error, _variables, context) => {
			rollback(context);
			logger.error('[useShelfMutations] Falha ao atualizar a estante:', error);
			showToast({ message: ACTION_ERROR_MESSAGE, variant: 'error' });
		},
		onSettled: settle,
	});

	const bulkMutation = useMutation<void, Error, BulkVariables, MutationContext>({
		mutationKey: FAVORITE_MUTATION_KEY,
		mutationFn: async (variables) => {
			if (variables.kind === 'update') {
				await runInBatches(variables.entries, BULK_CONCURRENCY, (entry) =>
					updateFavorite(entry.recordId, entry.patch)
				);
				return;
			}

			if (variables.kind === 'remove') {
				await runInBatches(variables.books, BULK_CONCURRENCY, (book) =>
					removeFromFavorites(book.recordId)
				);
				return;
			}

			await runInBatches(variables.books, BULK_CONCURRENCY, (book) =>
				addToFavorites(book, book.addedAt, shelfSnapshot(book))
			);
		},
		onMutate: async (variables) => {
			await cancelInFlight();
			const previous = snapshot();

			if (variables.kind === 'update') {
				const patches = new Map(variables.entries.map((entry) => [entry.bookId, entry.patch]));
				queryClient.setQueryData<FavoriteBook[]>(
					queryKeys.favorites,
					previous.map((favorite) => {
						const patch = patches.get(favorite.id);
						return patch ? { ...favorite, ...patch } : favorite;
					})
				);
			} else if (variables.kind === 'remove') {
				const removing = new Set(variables.books.map((book) => book.id));
				queryClient.setQueryData<FavoriteBook[]>(
					queryKeys.favorites,
					previous.filter((favorite) => !removing.has(favorite.id))
				);
			} else {
				const returning = new Set(variables.books.map((book) => book.id));
				queryClient.setQueryData<FavoriteBook[]>(queryKeys.favorites, [
					...previous.filter((favorite) => !returning.has(favorite.id)),
					// O recordId antigo morreu com o DELETE; o refetch traz o novo.
					...variables.books.map((book) => ({ ...book, recordId: '' })),
				]);
			}

			return { previous };
		},
		onSuccess: (_data, variables) => {
			if (variables.kind === 'update') {
				showToast({ message: variables.message, variant: 'success' });
				return;
			}

			if (variables.kind === 'restore') {
				showToast({
					message: `${plural(variables.books.length, 'livro devolvido', 'livros devolvidos')} à estante.`,
					variant: 'success',
				});
				return;
			}

			const removed = variables.books;
			showToast({
				message: `${plural(removed.length, 'livro removido', 'livros removidos')} da estante.`,
				variant: 'success',
				action: {
					label: 'Desfazer',
					onClick: () => bulkMutation.mutate({ kind: 'restore', books: removed }),
				},
			});
		},
		onError: (error, _variables, context) => {
			rollback(context);
			logger.error('[useShelfMutations] Falha na ação em lote:', error);
			showToast({
				message: 'Não foi possível concluir a ação em todos os livros. Confira a estante.',
				variant: 'error',
			});
		},
		onSettled: settle,
	});

	/**
	 * O erro de mutação é estado local de cada `useMutation`, e quem dispara a ação
	 * costuma ser outro componente (o card). Lendo do MutationCache, qualquer tela
	 * consegue reagir à falha da última ação — e ela some sozinha no próximo sucesso.
	 * O mesmo cache diz quais livros têm uma escrita em andamento, para o spinner
	 * ficar só nos cards mexidos em vez de em todos eles.
	 */
	const mutationEntries = useMutationState({
		filters: { mutationKey: FAVORITE_MUTATION_KEY },
		select: (mutation) => ({
			status: mutation.state.status,
			bookIds: mutatedBookIds(mutation.state.variables),
		}),
	});

	const lastMutationStatus = mutationEntries.at(-1)?.status;

	/**
	 * Chave textual dos livros em voo: é o que mantém o Set estável entre
	 * renders, já que o `select` acima devolve objetos novos toda vez.
	 */
	const pendingKey = mutationEntries
		.filter((entry) => entry.status === 'pending')
		.flatMap((entry) => entry.bookIds)
		.filter(Boolean)
		.sort()
		.join('|');

	const pendingBookIds = useMemo(
		() => new Set(pendingKey ? pendingKey.split('|') : []),
		[pendingKey]
	);

	const isUpdatingBook = useCallback(
		(bookId: string) => pendingBookIds.has(bookId),
		[pendingBookIds]
	);

	const addFavorite = useCallback(
		(book: Book, shelf?: ShelfPatch) => addMutation.mutate({ book, shelf }),
		[addMutation]
	);

	const removeFavorite = useCallback(
		(bookId: string) => {
			const favorite = findFavorite(bookId);
			if (!favorite?.recordId) return;
			removeMutation.mutate({ recordId: favorite.recordId, bookId });
		},
		[findFavorite, removeMutation]
	);

	const toggleFavorite = useCallback(
		(book: Book) => {
			const favorite = findFavorite(book.id);

			if (favorite) {
				// Sem recordId (inclusão ainda em voo) não há o que remover no servidor.
				if (favorite.recordId) {
					removeMutation.mutate({ recordId: favorite.recordId, bookId: book.id });
				}
				return;
			}

			addMutation.mutate({ book });
		},
		[addMutation, findFavorite, removeMutation]
	);

	const updateShelf = useCallback(
		(bookId: string, patch: ShelfPatch) => {
			const favorite = findFavorite(bookId);
			if (!favorite?.recordId) return;
			updateMutation.mutate({ bookId, recordId: favorite.recordId, patch });
		},
		[findFavorite, updateMutation]
	);

	/**
	 * Anota em que página a leitura está, guardando a marcação no histórico.
	 *
	 * Existe separado de `updateShelf` porque a página não é um campo como os
	 * outros: sobrescrevê-la apagava o caminho percorrido, e é desse caminho que
	 * saem o ritmo e a previsão de conclusão.
	 */
	const recordProgress = useCallback(
		(bookId: string, page: number) => {
			const favorite = findFavorite(bookId);
			if (!favorite?.recordId) return;

			updateShelf(bookId, buildProgressPatch(favorite, page));
		},
		[findFavorite, updateShelf]
	);

	/** Move o livro de estante; se ele ainda não está salvo, entra já na estante escolhida. */
	const setStatus = useCallback(
		(book: Book, status: ShelfStatus) => {
			const favorite = findFavorite(book.id);

			if (!favorite) {
				addMutation.mutate({
					book,
					shelf:
						status === 'want_to_read'
							? { status }
							: buildStatusPatch({ ...book, startedAt: 0, finishedAt: 0 } as FavoriteBook, status),
				});
				return;
			}

			updateShelf(book.id, buildStatusPatch(favorite, status));
		},
		[addMutation, findFavorite, updateShelf]
	);

	const setStatusMany = useCallback(
		(bookIds: string[], status: ShelfStatus) => {
			const entries = buildStatusEntries(selectFavorites(bookIds), status);
			if (entries.length === 0) {
				showToast({
					message: `Nada a fazer: tudo já estava em "${SHELF_LABELS[status]}".`,
					variant: 'info',
				});
				return;
			}

			bulkMutation.mutate({
				kind: 'update',
				entries,
				message: `${plural(entries.length, 'livro movido', 'livros movidos')} para "${SHELF_LABELS[status]}".`,
			});
		},
		[bulkMutation, selectFavorites, showToast]
	);

	const tagMany = useCallback(
		(bookIds: string[], tag: string, mode: 'add' | 'remove') => {
			const entries = buildTagEntries(selectFavorites(bookIds), tag, mode);
			if (entries.length === 0) {
				showToast({
					message:
						mode === 'add'
							? `Todos os livros selecionados já tinham a tag "${tag}".`
							: `Nenhum dos livros selecionados tinha a tag "${tag}".`,
					variant: 'info',
				});
				return;
			}

			bulkMutation.mutate({
				kind: 'update',
				entries,
				message:
					mode === 'add'
						? `Tag "${tag}" aplicada a ${plural(entries.length, 'livro', 'livros')}.`
						: `Tag "${tag}" retirada de ${plural(entries.length, 'livro', 'livros')}.`,
			});
		},
		[bulkMutation, selectFavorites, showToast]
	);

	const shelfMany = useCallback(
		(bookIds: string[], shelfId: string, shelfName: string, mode: 'add' | 'remove') => {
			const entries = buildShelfEntries(selectFavorites(bookIds), shelfId, mode);
			if (entries.length === 0) {
				showToast({
					message:
						mode === 'add'
							? `Todos os selecionados já estavam em "${shelfName}".`
							: `Nenhum dos selecionados estava em "${shelfName}".`,
					variant: 'info',
				});
				return;
			}

			bulkMutation.mutate({
				kind: 'update',
				entries,
				message:
					mode === 'add'
						? `${plural(entries.length, 'livro', 'livros')} em "${shelfName}".`
						: `${plural(entries.length, 'livro', 'livros')} fora de "${shelfName}".`,
			});
		},
		[bulkMutation, selectFavorites, showToast]
	);

	const removeMany = useCallback(
		(bookIds: string[]) => {
			const books = selectFavorites(bookIds).filter((book) => book.recordId);
			if (books.length === 0) return;

			bulkMutation.mutate({ kind: 'remove', books });
		},
		[bulkMutation, selectFavorites]
	);

	return {
		actionError: lastMutationStatus === 'error' ? ACTION_ERROR_MESSAGE : null,
		/** Há uma escrita em voo para este livro — e só para ele. */
		isUpdatingBook,
		/** Uma ação em lote está sendo gravada; a barra de seleção se tranca. */
		isBulkPending: bulkMutation.isPending,
		addFavorite,
		removeFavorite,
		toggleFavorite,
		updateShelf,
		recordProgress,
		setStatus,
		setStatusMany,
		tagMany,
		shelfMany,
		removeMany,
	};
};
