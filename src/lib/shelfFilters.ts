import type { FavoriteBook } from '@/types/Book';
import type { CustomShelf } from '@/types/CustomShelf';
import { SHELF_STATUSES, isShelfStatus, type ShelfStatus } from '@/types/Shelf';
import { normalizeForSearch, toSlug } from '@/utils/normalize';
import { getPublicationYear } from '@/utils/bookLabels';
import {
	DEFAULT_LIST_VIEW,
	LIST_VIEW_SLUGS,
	parseListView,
	type ListView,
} from './listView';

/**
 * Aba selecionada. As personalizadas entram como `shelf:<recordId>` — um
 * prefixo, e não um tipo novo, para tudo que já lida com abas (URL, teclado,
 * contadores) continuar tratando isso como uma string.
 */
export type ShelfTab = ShelfStatus | 'all' | `shelf:${string}`;

export const CUSTOM_TAB_PREFIX = 'shelf:';

export const isCustomTab = (tab: ShelfTab): tab is `shelf:${string}` =>
	tab.startsWith(CUSTOM_TAB_PREFIX);

export const customTabId = (tab: `shelf:${string}`): string =>
	tab.slice(CUSTOM_TAB_PREFIX.length);

export const toCustomTab = (recordId: string): ShelfTab => `${CUSTOM_TAB_PREFIX}${recordId}`;

export type ShelfSort =
	| 'recent'
	| 'title'
	| 'author'
	| 'publisher'
	| 'rating'
	| 'progress'
	| 'finished'
	| 'published';

/** A visão é a mesma da busca; o alias antigo continua valendo para não quebrar imports. */
export type ShelfView = ListView;

/**
 * Nota mínima exigida pelo filtro. `'none'` é o caminho oposto: só o que ainda
 * não foi avaliado — é assim que se encontra o que falta pontuar.
 */
export type RatingFilter = '' | '5' | '4' | '3' | 'none';

export const RATING_FILTERS: RatingFilter[] = ['', '5', '4', '3', 'none'];

export const RATING_FILTER_LABELS: Record<RatingFilter, string> = {
	'': 'Qualquer nota',
	'5': 'Só 5 estrelas',
	'4': '4 estrelas ou mais',
	'3': '3 estrelas ou mais',
	none: 'Ainda sem nota',
};

export interface ShelfFilters {
	tab: ShelfTab;
	sort: ShelfSort;
	view: ShelfView;
	/** Texto livre casado contra título, autoria, editora, categorias e tags. */
	term: string;
	/** Várias tags ao mesmo tempo, combinadas com E: "fantasia" *e* "relidos". */
	tags: string[];
	rating: RatingFilter;
	/** Só livros com anotação escrita. */
	hasNotes: boolean;
	page: number;
}

export const EMPTY_SHELF_FILTERS: ShelfFilters = {
	tab: 'all',
	sort: 'recent',
	view: DEFAULT_LIST_VIEW,
	term: '',
	tags: [],
	rating: '',
	hasNotes: false,
	page: 1,
};

export const SHELF_SORT_LABELS: Record<ShelfSort, string> = {
	recent: 'Recém adicionados',
	title: 'Título A-Z',
	author: 'Autor A-Z',
	publisher: 'Editora A-Z',
	rating: 'Minha nota',
	progress: 'Progresso',
	finished: 'Conclusão mais recente',
	published: 'Publicação mais recente',
};

export const SHELF_SORTS = Object.keys(SHELF_SORT_LABELS) as ShelfSort[];

/**
 * Como cada estante aparece na URL. Os valores internos (`want_to_read`) ficam
 * no código; o link que o usuário copia fica legível: `/favorites?estante=lendo`.
 */
export const SHELF_SLUGS: Record<ShelfStatus, string> = {
	want_to_read: 'quero-ler',
	reading: 'lendo',
	read: 'lido',
};

const SLUG_TO_STATUS = new Map<string, ShelfStatus>(
	SHELF_STATUSES.map((status) => [SHELF_SLUGS[status], status])
);

export const shelfTabToSlug = (tab: ShelfTab, shelves: CustomShelf[] = []): string => {
	if (tab === 'all') return '';

	if (isCustomTab(tab)) {
		const id = customTabId(tab);
		const shelf = shelves.find((item) => item.recordId === id);
		return shelf ? toSlug(shelf.name) : '';
	}

	return SHELF_SLUGS[tab];
};

/**
 * Aceita o slug (`lendo`), o valor interno (para links antigos não quebrarem) e
 * o nome de uma estante personalizada em forma de slug (`emprestado-p-ana`).
 *
 * O nome vai à URL, e não a chave do registro, porque é o endereço que a pessoa
 * lê e compartilha. O preço é que renomear a estante invalida links antigos —
 * que então caem em "Todos" em vez de numa tela quebrada.
 */
export const parseShelfTab = (value: string | null, shelves: CustomShelf[] = []): ShelfTab => {
	if (!value) return 'all';

	const bySlug = SLUG_TO_STATUS.get(value);
	if (bySlug) return bySlug;

	if (isShelfStatus(value)) return value;

	const custom = shelves.find((shelf) => toSlug(shelf.name) === value);
	return custom ? toCustomTab(custom.recordId) : 'all';
};

export const parseShelfSort = (value: string | null): ShelfSort =>
	SHELF_SORTS.includes(value as ShelfSort) ? (value as ShelfSort) : EMPTY_SHELF_FILTERS.sort;

export const parseRatingFilter = (value: string | null): RatingFilter =>
	RATING_FILTERS.includes(value as RatingFilter) ? (value as RatingFilter) : '';

/** Slug legível também aqui: `?visao=lista`. */
export const SHELF_VIEW_SLUGS = LIST_VIEW_SLUGS;

export const parseShelfView = parseListView;

/**
 * Se alguma seleção está estreitando a lista — o que decide o texto do contador.
 * Ordenação, visão e página ficam de fora: nenhuma delas esconde livro nenhum.
 */
export const hasActiveShelfFilters = (filters: ShelfFilters): boolean =>
	filters.tab !== 'all' ||
	filters.term.trim().length > 0 ||
	filters.tags.length > 0 ||
	filters.rating !== '' ||
	filters.hasNotes;

const progressOf = (book: FavoriteBook): number =>
	book.pageCount > 0 ? book.currentPage / book.pageCount : 0;

const byText = (book: FavoriteBook, term: string): boolean =>
	[book.title, book.author, book.publisher, ...book.categories, ...book.tags].some(
		(field) => normalizeForSearch(field ?? '').includes(term)
	);

/** Todas as tags pedidas precisam estar no livro — filtrar é estreitar, não alargar. */
const byTags = (book: FavoriteBook, tags: string[]): boolean =>
	tags.every((wanted) =>
		book.tags.some((tag) => normalizeForSearch(tag) === normalizeForSearch(wanted))
	);

const byRating = (book: FavoriteBook, rating: RatingFilter): boolean => {
	if (!rating) return true;
	if (rating === 'none') return book.rating === 0;
	return book.rating >= Number(rating);
};

/** Ano de publicação como número; 0 quando a API não informou nada utilizável. */
const publicationYearOf = (book: FavoriteBook): number =>
	Number(getPublicationYear(book.publishedDate)) || 0;

/**
 * Aplica aba, tags, nota, anotações, texto e ordenação. Ficou fora do componente
 * para poder ser testado sem montar a página — é aqui que mora a regra da estante.
 */
export const filterAndSortShelf = (
	books: FavoriteBook[],
	filters: ShelfFilters
): FavoriteBook[] => {
	const term = normalizeForSearch(filters.term);

	const filtered = books.filter((book) => {
		if (filters.tab !== 'all') {
			// Estante personalizada é pertencimento (o livro está nela ou não);
			// as três fixas são o status, que é exclusivo.
			if (isCustomTab(filters.tab)) {
				if (!book.shelves.includes(customTabId(filters.tab))) return false;
			} else if (book.status !== filters.tab) {
				return false;
			}
		}
		if (filters.tags.length > 0 && !byTags(book, filters.tags)) return false;
		if (!byRating(book, filters.rating)) return false;
		if (filters.hasNotes && !book.notes.trim()) return false;
		return term ? byText(book, term) : true;
	});

	switch (filters.sort) {
		case 'title':
			return filtered.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
		case 'author':
			return filtered.sort((a, b) => (a.author || '').localeCompare(b.author || '', 'pt-BR'));
		case 'publisher':
			return filtered.sort((a, b) =>
				(a.publisher || '').localeCompare(b.publisher || '', 'pt-BR')
			);
		case 'rating':
			return filtered.sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title, 'pt-BR'));
		case 'progress':
			return filtered.sort((a, b) => progressOf(b) - progressOf(a));
		case 'finished':
			// Quem ainda não terminou não tem data e vai para o fim, não para o topo.
			return filtered.sort(
				(a, b) => b.finishedAt - a.finishedAt || a.title.localeCompare(b.title, 'pt-BR')
			);
		case 'published':
			return filtered.sort(
				(a, b) =>
					publicationYearOf(b) - publicationYearOf(a) || a.title.localeCompare(b.title, 'pt-BR')
			);
		case 'recent':
		default:
			// Ordena pela data real de inclusão; registros antigos (sem addedAt) vão para o fim.
			return filtered.sort((a, b) => b.addedAt - a.addedAt);
	}
};

/** Quantos livros há em cada aba fixa, para os contadores ao lado dos rótulos. */
export const countByShelfTab = (books: FavoriteBook[]): Record<ShelfStatus | 'all', number> => {
	const counts: Record<ShelfStatus | 'all', number> = {
		all: books.length,
		want_to_read: 0,
		reading: 0,
		read: 0,
	};

	for (const book of books) counts[book.status] += 1;
	return counts;
};

/** Todas as tags usadas na estante, sem repetir, em ordem alfabética. */
export const collectShelfTags = (books: FavoriteBook[]): string[] =>
	[...new Set(books.flatMap((book) => book.tags))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

/**
 * Quantos livros sobrariam se esta tag entrasse no filtro atual. É o que permite
 * mostrar o número ao lado de cada tag e apagar as combinações que dão zero, em
 * vez de deixar o usuário descobrir clicando.
 */
export const countShelfTagMatches = (
	books: FavoriteBook[],
	filters: ShelfFilters,
	tag: string
): number => {
	const tags = filters.tags.includes(tag) ? filters.tags : [...filters.tags, tag];
	return filterAndSortShelf(books, { ...filters, tags }).length;
};

/** O mesmo contador, para as estantes criadas pelo usuário. */
export const countByCustomShelf = (books: FavoriteBook[]): Record<string, number> => {
	const counts: Record<string, number> = {};

	for (const book of books) {
		for (const shelfId of book.shelves) {
			counts[shelfId] = (counts[shelfId] ?? 0) + 1;
		}
	}

	return counts;
};
