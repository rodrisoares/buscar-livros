import type { FavoriteBook, ProgressEntry } from '@/types/Book';
import { migrateFavorite } from '@/lib/migrations';
import { BaseAdapter } from './DataAdapter';
import { normalizeArray, normalizeNumber, normalizeString, normalizeUrl } from './normalize';

/** Formato cru do registro na API de favoritos. */
export interface RawFavorite extends Partial<Omit<FavoriteBook, 'id' | 'recordId' | 'status'>> {
	/** Chave do registro, gerada pelo json-server. */
	id?: string | number;
	/** Id do volume no Google Books. Ausente nos registros anteriores a este campo. */
	bookId?: string;
	status?: string;
}

/**
 * O registro pode vir de uma versão anterior do app (sem log), editado à mão no
 * `server.json`, ou com entradas quebradas. Aqui ele vira sempre uma lista de
 * marcações válidas e em ordem cronológica — o resto do código conta com isso.
 */
const normalizeProgressLog = (raw: unknown, pageCount: number): ProgressEntry[] => {
	if (!Array.isArray(raw)) return [];

	return raw
		.filter((entry): entry is ProgressEntry => {
			if (!entry || typeof entry !== 'object') return false;

			const { page, at } = entry as Partial<ProgressEntry>;
			return (
				typeof page === 'number' &&
				Number.isFinite(page) &&
				page >= 0 &&
				typeof at === 'number' &&
				Number.isFinite(at) &&
				at > 0
			);
		})
		// Mesmo teto da página atual: um log com páginas além do fim do livro
		// distorceria o ritmo e a estimativa de conclusão.
		.map((entry) => ({
			page: pageCount > 0 ? Math.min(entry.page, pageCount) : entry.page,
			at: entry.at,
		}))
		.sort((a, b) => a.at - b.at);
};

export class FavoritesAdapter extends BaseAdapter<RawFavorite, FavoriteBook> {
	transform(original: RawFavorite): FavoriteBook {
		// As formas antigas do registro são resolvidas antes do mapeamento, em
		// `lib/migrations` — aqui em baixo fica só a conversão de tipos.
		const raw = migrateFavorite(original);

		const recordId = normalizeString(raw.id === undefined ? '' : String(raw.id));
		const pageCount = normalizeNumber(raw.pageCount);
		const currentPage = normalizeNumber(raw.currentPage);

		return {
			id: normalizeString(raw.bookId) || recordId,
			recordId,
			title: normalizeString(raw.title),
			author: normalizeString(raw.author),
			publishedDate: normalizeString(raw.publishedDate),
			publisher: normalizeString(raw.publisher),
			pageCount,
			categories: normalizeArray(raw.categories),
			description: normalizeString(raw.description),
			thumbnail: normalizeUrl(raw.thumbnail),
			previewLink: normalizeUrl(raw.previewLink),
			infoLink: normalizeUrl(raw.infoLink),
			isbn13: normalizeString(raw.isbn13),
			isbn10: normalizeString(raw.isbn10),
			language: normalizeString(raw.language),
			averageRating: normalizeNumber(raw.averageRating),
			ratingsCount: normalizeNumber(raw.ratingsCount),
			maturityRating: normalizeString(raw.maturityRating),
			viewability: normalizeString(raw.viewability),
			epubAvailable: raw.epubAvailable === true,
			pdfAvailable: raw.pdfAvailable === true,
			saleability: normalizeString(raw.saleability),
			price: normalizeString(raw.price),
			buyLink: normalizeUrl(raw.buyLink),
			webReaderLink: normalizeUrl(raw.webReaderLink),
			// Registros salvos antes deste campo existir caem para 0 e vão para o fim da lista.
			addedAt: normalizeNumber(raw.addedAt),
			status: raw.status as FavoriteBook['status'],
			// A página atual nunca pode passar do total de páginas do livro.
			currentPage: pageCount > 0 ? Math.min(currentPage, pageCount) : currentPage,
			progressLog: normalizeProgressLog(raw.progressLog, pageCount),
			rating: Math.min(Math.max(normalizeNumber(raw.rating), 0), 5),
			notes: normalizeString(raw.notes),
			tags: normalizeArray(raw.tags).filter((tag): tag is string => typeof tag === 'string'),
			shelves: normalizeArray(raw.shelves).filter(
				(shelf): shelf is string => typeof shelf === 'string' && shelf.length > 0
			),
			startedAt: normalizeNumber(raw.startedAt),
			finishedAt: normalizeNumber(raw.finishedAt),
		};
	}
}

export const favoritesAdapter = new FavoritesAdapter();
