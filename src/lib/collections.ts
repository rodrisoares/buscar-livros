import type { FavoriteBook } from '@/types/Book';
import type { Collection } from '@/types/Collection';

/**
 * Um lugar na ordem da coleção.
 *
 * `book` vem indefinido quando o volume saiu da estante depois de ter entrado
 * na coleção. A entrada permanece de propósito: apagá-la em silêncio mudaria a
 * numeração da saga sem a pessoa pedir, e "falta o volume 2" é justamente o que
 * ela precisa ver.
 */
export interface CollectionEntry {
	bookId: string;
	/** Posição em base 1, como se lê numa saga. */
	position: number;
	book: FavoriteBook | undefined;
}

export const listCollectionEntries = (
	collection: Collection,
	favorites: FavoriteBook[]
): CollectionEntry[] =>
	collection.bookIds.map((bookId, index) => ({
		bookId,
		position: index + 1,
		book: favorites.find((favorite) => favorite.id === bookId),
	}));

export interface CollectionProgress {
	/** Volumes na coleção, inclusive os que saíram da estante. */
	total: number;
	read: number;
	reading: number;
	/** Volumes cujo livro não está mais na estante. */
	missing: number;
	percent: number;
}

export const getCollectionProgress = (
	collection: Collection,
	favorites: FavoriteBook[]
): CollectionProgress => {
	const entries = listCollectionEntries(collection, favorites);

	let read = 0;
	let reading = 0;
	let missing = 0;

	for (const entry of entries) {
		if (!entry.book) {
			missing += 1;
			continue;
		}
		if (entry.book.status === 'read') read += 1;
		else if (entry.book.status === 'reading') reading += 1;
	}

	return {
		total: entries.length,
		read,
		reading,
		missing,
		percent: entries.length > 0 ? Math.round((read / entries.length) * 100) : 0,
	};
};

/** Acrescenta ao fim, sem repetir — a posição nova é a última da saga. */
export const addToCollection = (bookIds: string[], bookId: string): string[] =>
	!bookId || bookIds.includes(bookId) ? bookIds : [...bookIds, bookId];

export const removeFromCollection = (bookIds: string[], bookId: string): string[] =>
	bookIds.filter((id) => id !== bookId);

/**
 * Troca um volume de lugar com o vizinho.
 *
 * Move de um em um, em vez de arrastar: é o que funciona com teclado e leitor
 * de tela sem inventar um modo de arrastar acessível — e reordenar uma saga é
 * quase sempre ajustar um volume fora do lugar, não reembaralhar tudo.
 */
export const moveInCollection = (
	bookIds: string[],
	index: number,
	direction: 'up' | 'down'
): string[] => {
	const target = direction === 'up' ? index - 1 : index + 1;
	if (index < 0 || index >= bookIds.length || target < 0 || target >= bookIds.length) {
		return bookIds;
	}

	const next = [...bookIds];
	[next[index], next[target]] = [next[target], next[index]];
	return next;
};

/** As coleções a que um livro pertence — usado na ficha dele. */
export const collectionsOf = (collections: Collection[], bookId: string): Collection[] =>
	collections.filter((collection) => collection.bookIds.includes(bookId));

/** Capas para o cartão da coleção, na ordem da saga e só as que existem. */
export const collectionCovers = (
	collection: Collection,
	favorites: FavoriteBook[],
	limit = 5
): FavoriteBook[] =>
	listCollectionEntries(collection, favorites)
		.map((entry) => entry.book)
		.filter((book): book is FavoriteBook => Boolean(book))
		.slice(0, limit);
