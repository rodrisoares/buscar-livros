/**
 * Filtro "já está na minha estante" aplicado aos resultados da busca.
 *
 * Vive separado de `SearchFilters` de propósito: os outros filtros viram
 * operadores no `q` da Google Books, este não vai à API nenhuma. Ele peneira o
 * que voltou, cruzando com a estante que já está em memória — por isso vale
 * **sobre a página atual**, e não sobre os milhares de resultados anunciados.
 */
export type ShelfPresence = '' | 'mine' | 'others';

export const SHELF_PRESENCES: ShelfPresence[] = ['', 'mine', 'others'];

export const SHELF_PRESENCE_LABELS: Record<ShelfPresence, string> = {
	'': 'Todos',
	mine: 'Na minha estante',
	others: 'Fora da estante',
};

/** Slug legível na URL: `?estante=minha`. */
export const SHELF_PRESENCE_SLUGS: Record<ShelfPresence, string> = {
	'': '',
	mine: 'minha',
	others: 'fora',
};

const SLUG_TO_PRESENCE = new Map<string, ShelfPresence>(
	SHELF_PRESENCES.filter(Boolean).map((presence) => [SHELF_PRESENCE_SLUGS[presence], presence])
);

export const parseShelfPresence = (value: string | null): ShelfPresence =>
	(value && SLUG_TO_PRESENCE.get(value)) || '';

export const shelfPresenceToParam = (presence: ShelfPresence): string | undefined =>
	presence ? SHELF_PRESENCE_SLUGS[presence] : undefined;

export const filterByShelfPresence = <T extends { id: string }>(
	books: T[],
	isInShelf: (bookId: string) => boolean,
	presence: ShelfPresence
): T[] => {
	if (!presence) return books;
	return books.filter((book) => (presence === 'mine' ? isInShelf(book.id) : !isInShelf(book.id)));
};
