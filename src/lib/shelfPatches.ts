import type { FavoriteBook, ProgressEntry, ShelfPatch } from '@/types/Book';
import type { ShelfStatus } from '@/types/Shelf';
import { normalizeForSearch } from '@/utils/normalize';
import { appendProgress } from './progressLog';

/**
 * O log de um livro que ainda não está na estante.
 *
 * `setStatus` monta um `FavoriteBook` provisório a partir de um `Book` para
 * calcular as datas, e esse objeto não tem log nenhum. Sem isto, concluir um
 * livro direto da busca quebraria ao tentar acrescentar a marcação.
 */
const logOf = (book: FavoriteBook): ProgressEntry[] => book.progressLog ?? [];

/**
 * Regras de negócio das estantes: mudar de estante mexe nas datas de leitura.
 *
 * Mora aqui, e não no hook, porque as ações em lote precisam da mesma regra —
 * mover 20 livros para "Lido" tem que datar cada um como mover um só.
 */
export const buildStatusPatch = (book: FavoriteBook, status: ShelfStatus): ShelfPatch => {
	const now = Date.now();

	if (status === 'reading') {
		return { status, startedAt: book.startedAt || now, finishedAt: 0 };
	}

	if (status === 'read') {
		// Concluir o livro leva o progresso ao fim — e isso é um avanço de
		// leitura como qualquer outro, então entra no log.
		const finalPage = book.pageCount || book.currentPage;

		return {
			status,
			startedAt: book.startedAt || now,
			finishedAt: book.finishedAt || now,
			currentPage: finalPage,
			progressLog: appendProgress(logOf(book), finalPage, now),
		};
	}

	return { status, finishedAt: 0 };
};

/**
 * Uma escrita já resolvida: qual registro tocar e o que gravar nele.
 *
 * As entradas são calculadas **antes** de disparar a mutação, a partir do
 * estado original. Se fossem calculadas dentro da mutação, a atualização
 * otimista já teria mexido no cache e o `book.startedAt || now` leria a data
 * que acabamos de escrever em vez da que existia.
 */
export interface ShelfEntry {
	bookId: string;
	recordId: string;
	patch: ShelfPatch;
}

/** Livros que já existem no servidor — sem `recordId` não há o que atualizar. */
const persisted = (books: FavoriteBook[]): FavoriteBook[] =>
	books.filter((book) => Boolean(book.recordId));

export const buildStatusEntries = (
	books: FavoriteBook[],
	status: ShelfStatus
): ShelfEntry[] =>
	persisted(books)
		// Quem já está na estante de destino não precisa de escrita nenhuma.
		.filter((book) => book.status !== status)
		.map((book) => ({
			bookId: book.id,
			recordId: book.recordId,
			patch: buildStatusPatch(book, status),
		}));

const hasTag = (book: FavoriteBook, tag: string): boolean =>
	book.tags.some((item) => normalizeForSearch(item) === normalizeForSearch(tag));

/**
 * Adiciona ou remove uma tag em vários livros, pulando quem já está como se
 * quer. A comparação ignora acento e caixa, como no `TagInput`, para não criar
 * "Fantasia" ao lado de "fantasia".
 */
export const buildTagEntries = (
	books: FavoriteBook[],
	tag: string,
	mode: 'add' | 'remove'
): ShelfEntry[] => {
	const wanted = tag.trim();
	if (!wanted) return [];

	return persisted(books)
		.filter((book) => (mode === 'add' ? !hasTag(book, wanted) : hasTag(book, wanted)))
		.map((book) => ({
			bookId: book.id,
			recordId: book.recordId,
			patch: {
				tags:
					mode === 'add'
						? [...book.tags, wanted]
						: book.tags.filter(
								(item) => normalizeForSearch(item) !== normalizeForSearch(wanted)
							),
			},
		}));
};

/**
 * Põe ou tira vários livros de uma estante personalizada, pulando quem já está
 * como se quer. A comparação é por chave de registro, não por nome — renomear a
 * estante não pode desfazer o pertencimento.
 */
export const buildShelfEntries = (
	books: FavoriteBook[],
	shelfId: string,
	mode: 'add' | 'remove'
): ShelfEntry[] => {
	if (!shelfId) return [];

	return persisted(books)
		.filter((book) =>
			mode === 'add' ? !book.shelves.includes(shelfId) : book.shelves.includes(shelfId)
		)
		.map((book) => ({
			bookId: book.id,
			recordId: book.recordId,
			patch: {
				shelves:
					mode === 'add'
						? [...book.shelves, shelfId]
						: book.shelves.filter((id) => id !== shelfId),
			},
		}));
};

/** Anota uma página nova, guardando por onde a leitura passou. */
export const buildProgressPatch = (
	book: FavoriteBook,
	page: number,
	at: number = Date.now()
): ShelfPatch => ({
	currentPage: page,
	progressLog: appendProgress(logOf(book), page, at),
});

/** Os campos da estante que o "Desfazer" precisa devolver intactos. */
export const shelfSnapshot = (book: FavoriteBook): ShelfPatch => ({
	status: book.status,
	currentPage: book.currentPage,
	progressLog: logOf(book),
	rating: book.rating,
	notes: book.notes,
	tags: book.tags,
	shelves: book.shelves,
	startedAt: book.startedAt,
	finishedAt: book.finishedAt,
});

/**
 * Executa as escritas em grupos, em vez de uma de cada vez ou todas de uma vez.
 * Cinquenta PATCHes simultâneos derrubam o json-server; uma a uma, mover uma
 * estante grande levaria dezenas de segundos.
 */
export const runInBatches = async <T>(
	items: T[],
	size: number,
	run: (item: T) => Promise<unknown>
): Promise<void> => {
	for (let index = 0; index < items.length; index += size) {
		await Promise.all(items.slice(index, index + size).map(run));
	}
};
