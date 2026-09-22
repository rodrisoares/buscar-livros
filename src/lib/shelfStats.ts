import type { FavoriteBook } from '@/types/Book';
import type { ShelfStatus } from '@/types/Shelf';
import { shortenCategory } from '@/utils/bookLabels';

export interface CountedItem {
	label: string;
	count: number;
}

export interface ShelfStats {
	total: number;
	byStatus: Record<ShelfStatus, number>;
	/** Páginas efetivamente lidas: livro concluído conta inteiro; em leitura, a página atual. */
	pagesRead: number;
	/** Soma das páginas de tudo que está na estante. */
	pagesTotal: number;
	topAuthors: CountedItem[];
	topCategories: CountedItem[];
	topTags: CountedItem[];
	ratedCount: number;
	averageRating: number;
	finishedThisYear: number;
}

/** Conta ocorrências e ordena da mais frequente para a menos. */
export const countBy = (values: string[]): CountedItem[] => {
	const counts = new Map<string, number>();

	for (const value of values) {
		const label = value.trim();
		if (!label) continue;
		counts.set(label, (counts.get(label) ?? 0) + 1);
	}

	return [...counts.entries()]
		.map(([label, count]) => ({ label, count }))
		// Empate resolvido em ordem alfabética, para a lista não dançar a cada render.
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'));
};

export const getShelfStats = (books: FavoriteBook[], year = new Date().getFullYear()): ShelfStats => {
	const byStatus: Record<ShelfStatus, number> = { want_to_read: 0, reading: 0, read: 0 };

	let pagesRead = 0;
	let pagesTotal = 0;
	let ratingSum = 0;
	let ratedCount = 0;
	let finishedThisYear = 0;

	for (const book of books) {
		byStatus[book.status] += 1;
		pagesTotal += book.pageCount;

		if (book.status === 'read') {
			pagesRead += book.pageCount || book.currentPage;
		} else if (book.status === 'reading') {
			pagesRead += Math.min(book.currentPage, book.pageCount || book.currentPage);
		}

		if (book.rating > 0) {
			ratingSum += book.rating;
			ratedCount += 1;
		}

		if (book.finishedAt > 0 && new Date(book.finishedAt).getFullYear() === year) {
			finishedThisYear += 1;
		}
	}

	return {
		total: books.length,
		byStatus,
		pagesRead,
		pagesTotal,
		topAuthors: countBy(books.map((book) => book.author)).slice(0, 5),
		// Encurtadas e sem repetir dentro do mesmo livro: dois caminhos que
		// terminam em "Science Fiction" são uma categoria só, e um livro que
		// carrega os dois conta uma vez, não duas.
		topCategories: countBy(
			books.flatMap((book) => [...new Set(book.categories.map(shortenCategory))])
		).slice(0, 6),
		topTags: countBy(books.flatMap((book) => book.tags)).slice(0, 10),
		ratedCount,
		averageRating: ratedCount > 0 ? ratingSum / ratedCount : 0,
		finishedThisYear,
	};
};

/** Percentual lido de um livro, de 0 a 100. */
export const getReadingProgress = (book: FavoriteBook): number => {
	if (book.status === 'read') return 100;
	if (!book.pageCount || book.currentPage <= 0) return 0;

	return Math.min(100, Math.round((book.currentPage / book.pageCount) * 100));
};
