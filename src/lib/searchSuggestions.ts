import type { Book } from '@/types/Book';
import { normalizeForSearch } from '@/utils/normalize';

/**
 * Uma página de resultados tem 20 livros, quase sempre com mais de um autor
 * cada, e a estante entra por cima. Com um teto baixo o corte é alfabético, e
 * quem procura por "Tolkien" nunca veria a sugestão — o datalist do navegador
 * já filtra conforme se digita, então o limite existe só para não crescer sem fim.
 */
const MAX_SUGGESTIONS = 50;

/** Marcador que o adaptador usa quando a Google Books não informa a autoria. */
const UNKNOWN_AUTHOR = 'Unknown';

/** Ordena e corta, sem repetir por diferença de caixa ou acento. */
const dedupe = (values: string[], limit: number): string[] => {
	const seen = new Set<string>();
	const unique: string[] = [];

	for (const raw of values) {
		const value = raw.trim();
		if (!value) continue;

		const key = normalizeForSearch(value);
		if (!key || seen.has(key)) continue;

		seen.add(key);
		unique.push(value);
	}

	return unique.sort((a, b) => a.localeCompare(b, 'pt-BR')).slice(0, limit);
};

/**
 * Autorias vistas até aqui. `book.author` guarda os nomes já unidos por vírgula
 * (`joinArrayToString`), então cada um volta a ser uma sugestão separada.
 */
export const collectAuthorSuggestions = (books: Book[], limit = MAX_SUGGESTIONS): string[] =>
	dedupe(
		books.flatMap((book) =>
			book.author === UNKNOWN_AUTHOR ? [] : book.author.split(',').map((name) => name.trim())
		),
		limit
	);

export const collectSubjectSuggestions = (books: Book[], limit = MAX_SUGGESTIONS): string[] =>
	dedupe(
		books.flatMap((book) => book.categories),
		limit
	);
