export type Availability = '' | 'ebooks' | 'free-ebooks' | 'paid-ebooks';
export type PrintType = 'books' | 'magazines' | 'all';

export interface SearchFilters {
	/** Texto livre digitado na barra de busca. */
	term: string;
	title: string;
	author: string;
	subject: string;
	isbn: string;
	/** Código ISO de idioma para `langRestrict` (pt, en, es...). '' = qualquer. */
	lang: string;
	availability: Availability;
	printType: PrintType;
}

export const EMPTY_FILTERS: SearchFilters = {
	term: '',
	title: '',
	author: '',
	subject: '',
	isbn: '',
	lang: '',
	availability: '',
	printType: 'books',
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
	'': 'Qualquer',
	ebooks: 'Somente e-books',
	'free-ebooks': 'E-books gratuitos',
	'paid-ebooks': 'E-books pagos',
};

export const PRINT_TYPE_LABELS: Record<PrintType, string> = {
	books: 'Livros',
	magazines: 'Revistas',
	all: 'Tudo',
};

export const LANGUAGE_OPTIONS = [
	{ value: '', label: 'Qualquer idioma' },
	{ value: 'pt', label: 'Português' },
	{ value: 'en', label: 'Inglês' },
	{ value: 'es', label: 'Espanhol' },
	{ value: 'fr', label: 'Francês' },
	{ value: 'de', label: 'Alemão' },
	{ value: 'it', label: 'Italiano' },
];

/** Termos com espaço precisam de aspas para o operador valer na frase inteira. */
const quote = (value: string): string => {
	const trimmed = value.trim();
	return /\s/.test(trimmed) ? `"${trimmed}"` : trimmed;
};

/** ISBN só é aceito pela API sem hífen ou espaço. */
export const cleanIsbn = (value: string): string => value.replace(/[^0-9Xx]/g, '').toUpperCase();

/**
 * Monta o parâmetro `q` da Google Books combinando o texto livre com os
 * operadores de campo (`intitle:`, `inauthor:`, `subject:`, `isbn:`).
 */
export const buildQueryString = (filters: SearchFilters): string => {
	const parts: string[] = [];

	if (filters.term.trim()) parts.push(filters.term.trim());
	if (filters.title.trim()) parts.push(`intitle:${quote(filters.title)}`);
	if (filters.author.trim()) parts.push(`inauthor:${quote(filters.author)}`);
	if (filters.subject.trim()) parts.push(`subject:${quote(filters.subject)}`);

	const isbn = cleanIsbn(filters.isbn);
	if (isbn) parts.push(`isbn:${isbn}`);

	return parts.join(' ');
};

/** Quantos filtros avançados estão ativos (o texto livre não conta). */
export const countActiveFilters = (filters: SearchFilters): number => {
	let count = 0;

	if (filters.title.trim()) count++;
	if (filters.author.trim()) count++;
	if (filters.subject.trim()) count++;
	if (cleanIsbn(filters.isbn)) count++;
	if (filters.lang) count++;
	if (filters.availability) count++;
	if (filters.printType !== EMPTY_FILTERS.printType) count++;

	return count;
};

export const hasSearch = (filters: SearchFilters): boolean => buildQueryString(filters).length > 0;

/** Todo filtro avançado pode ser desfeito sozinho; o texto livre não é um chip. */
export type RemovableFilterKey = Exclude<keyof SearchFilters, 'term'>;

export interface FilterChip {
	/** Qual filtro este chip representa — é o que o ✕ precisa saber para removê-lo. */
	key: RemovableFilterKey;
	label: string;
}

/**
 * Descrição curta dos filtros ativos, para o cabeçalho dos resultados.
 *
 * Devolve a chave junto com o rótulo: os chips eram `<span>` mortos, e quem
 * queria tirar um filtro tinha que reabrir o painel e limpar o campo na mão.
 */
export const describeFilters = (filters: SearchFilters): FilterChip[] => {
	const chips: FilterChip[] = [];

	if (filters.title.trim()) chips.push({ key: 'title', label: `Título: ${filters.title.trim()}` });
	if (filters.author.trim())
		chips.push({ key: 'author', label: `Autoria: ${filters.author.trim()}` });
	if (filters.subject.trim())
		chips.push({ key: 'subject', label: `Assunto: ${filters.subject.trim()}` });
	if (cleanIsbn(filters.isbn)) chips.push({ key: 'isbn', label: `ISBN: ${cleanIsbn(filters.isbn)}` });
	if (filters.lang) {
		const option = LANGUAGE_OPTIONS.find((item) => item.value === filters.lang);
		chips.push({ key: 'lang', label: `Idioma: ${option?.label ?? filters.lang}` });
	}
	if (filters.availability) {
		chips.push({ key: 'availability', label: AVAILABILITY_LABELS[filters.availability] });
	}
	if (filters.printType !== EMPTY_FILTERS.printType) {
		chips.push({ key: 'printType', label: PRINT_TYPE_LABELS[filters.printType] });
	}

	return chips;
};

/** Devolve os filtros com um deles de volta ao padrão, preservando o resto. */
export const clearFilter = (filters: SearchFilters, key: RemovableFilterKey): SearchFilters => ({
	...filters,
	[key]: EMPTY_FILTERS[key],
});
