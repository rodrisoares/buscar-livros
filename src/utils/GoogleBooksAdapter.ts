import type { Book } from '@/types/Book';
import type { GoogleBooksIndustryIdentifier, GoogleBooksVolume } from '@/types/GoogleBooks';
import { BaseAdapter } from './DataAdapter';
import { formatPrice } from './cover';
import {
	joinArrayToString,
	normalizeArray,
	normalizeNumber,
	normalizeString,
	normalizeUrl,
} from './normalize';

const findIdentifier = (
	identifiers: GoogleBooksIndustryIdentifier[] | undefined,
	type: string
): string => normalizeString(identifiers?.find((item) => item.type === type)?.identifier);

export class GoogleBooksAdapter extends BaseAdapter<GoogleBooksVolume, Book> {
	transform(googleBook: GoogleBooksVolume): Book {
		const { id, volumeInfo, saleInfo, accessInfo } = googleBook;
		const price = saleInfo?.retailPrice ?? saleInfo?.listPrice;

		return {
			id: normalizeString(id),
			title: normalizeString(volumeInfo.title),
			author: joinArrayToString(volumeInfo.authors),
			publishedDate: normalizeString(volumeInfo.publishedDate),
			publisher: normalizeString(volumeInfo.publisher),
			pageCount: normalizeNumber(volumeInfo.pageCount),
			categories: normalizeArray(volumeInfo.categories),
			description: normalizeString(volumeInfo.description),
			thumbnail: normalizeUrl(volumeInfo.imageLinks?.thumbnail),
			previewLink: normalizeUrl(volumeInfo.previewLink),
			infoLink: normalizeUrl(volumeInfo.infoLink),
			isbn13: findIdentifier(volumeInfo.industryIdentifiers, 'ISBN_13'),
			isbn10: findIdentifier(volumeInfo.industryIdentifiers, 'ISBN_10'),
			language: normalizeString(volumeInfo.language),
			averageRating: normalizeNumber(volumeInfo.averageRating),
			ratingsCount: normalizeNumber(volumeInfo.ratingsCount),
			maturityRating: normalizeString(volumeInfo.maturityRating),
			viewability: normalizeString(accessInfo?.viewability),
			epubAvailable: accessInfo?.epub?.isAvailable === true,
			pdfAvailable: accessInfo?.pdf?.isAvailable === true,
			saleability: normalizeString(saleInfo?.saleability),
			price: formatPrice(price?.amount, price?.currencyCode),
			buyLink: normalizeUrl(saleInfo?.buyLink),
			webReaderLink: normalizeUrl(accessInfo?.webReaderLink),
		};
	}
}

export const googleBooksAdapter = new GoogleBooksAdapter();
