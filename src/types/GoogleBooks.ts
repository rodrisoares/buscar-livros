import type { Book } from './Book';

export interface GoogleBooksIndustryIdentifier {
	type: string;
	identifier: string;
}

export interface GoogleBooksVolumeInfo {
	title: string;
	authors?: string[];
	publisher?: string;
	publishedDate?: string;
	description?: string;
	pageCount?: number;
	categories?: string[];
	imageLinks?: {
		thumbnail?: string;
		smallThumbnail?: string;
	};
	previewLink?: string;
	infoLink?: string;
	industryIdentifiers?: GoogleBooksIndustryIdentifier[];
	language?: string;
	averageRating?: number;
	ratingsCount?: number;
	maturityRating?: string;
}

export interface GoogleBooksPrice {
	amount?: number;
	currencyCode?: string;
}

export interface GoogleBooksSaleInfo {
	saleability?: string;
	listPrice?: GoogleBooksPrice;
	retailPrice?: GoogleBooksPrice;
	buyLink?: string;
}

export interface GoogleBooksAccessInfo {
	viewability?: string;
	webReaderLink?: string;
	epub?: { isAvailable?: boolean };
	pdf?: { isAvailable?: boolean };
}

export interface GoogleBooksVolume {
	id: string;
	volumeInfo: GoogleBooksVolumeInfo;
	saleInfo?: GoogleBooksSaleInfo;
	accessInfo?: GoogleBooksAccessInfo;
}

/** Resposta crua da API, antes do adapter. `items` some quando não há resultado. */
export interface RawGoogleBooksResponse {
	kind: string;
	totalItems?: number;
	items?: GoogleBooksVolume[];
}

/** Resultado já normalizado para o app. */
export interface SearchResult {
	books: Book[];
	totalItems: number;
}

export type SortOption = 'relevance' | 'newest';
