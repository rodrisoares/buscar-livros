import type { ShelfStatus } from './Shelf';

/**
 * Uma marcação de progresso: em que página a leitura estava e quando.
 *
 * `currentPage` sozinho é um retrato — ele era sobrescrito a cada anotação e o
 * caminho até ali se perdia. Com o registro, dá para ver o ritmo e estimar
 * quando o livro acaba.
 */
export interface ProgressEntry {
	page: number;
	at: number;
}

export interface Book {
	id: string;
	title: string;
	author: string;
	publishedDate: string;
	publisher: string;
	pageCount: number;
	categories: string[];
	description: string;
	thumbnail: string;
	previewLink: string;
	infoLink: string;
	/** ISBN-13 quando a editora informa; senão string vazia. */
	isbn13: string;
	isbn10: string;
	/** Código ISO do idioma (pt, en, es...). */
	language: string;
	/** 0 quando o volume não tem avaliações. */
	averageRating: number;
	ratingsCount: number;
	/** NOT_MATURE | MATURE | '' */
	maturityRating: string;
	/** ALL_PAGES | PARTIAL | NO_PAGES | UNKNOWN | '' */
	viewability: string;
	epubAvailable: boolean;
	pdfAvailable: boolean;
	/** FOR_SALE | FREE | NOT_FOR_SALE | FOR_SALE_AND_RENTAL | '' */
	saleability: string;
	/** Preço já formatado na moeda devolvida pela API; '' quando não está à venda. */
	price: string;
	buyLink: string;
	webReaderLink: string;
}

/**
 * Livro guardado na estante do usuário.
 *
 * `id` continua sendo o id do Google Books (é o que a interface usa nos links e
 * na verificação de "já está na estante"). `recordId` é a chave do registro na
 * API, que o json-server gera por conta própria — ele ignora o id enviado no
 * POST, então os dois não podem ser tratados como a mesma coisa.
 */
export interface FavoriteBook extends Book {
	recordId: string;
	addedAt: number;
	status: ShelfStatus;
	/** Página em que a leitura está; 0 quando ainda não começou. */
	currentPage: number;
	/** Caminho até `currentPage`, em ordem cronológica. */
	progressLog: ProgressEntry[];
	/** Nota pessoal de 1 a 5; 0 significa "sem nota". */
	rating: number;
	notes: string;
	tags: string[];
	/** Chaves das estantes personalizadas a que o livro pertence. */
	shelves: string[];
	/** Timestamps de início e conclusão da leitura; 0 quando não se aplica. */
	startedAt: number;
	finishedAt: number;
}

/** Campos da estante que o usuário edita (o resto vem do Google Books). */
export type ShelfPatch = Partial<
	Pick<
		FavoriteBook,
		| 'status'
		| 'currentPage'
		| 'progressLog'
		| 'rating'
		| 'notes'
		| 'tags'
		| 'shelves'
		| 'startedAt'
		| 'finishedAt'
	>
>;
