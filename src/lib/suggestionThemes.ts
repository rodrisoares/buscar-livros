import type { FavoriteBook } from '@/types/Book';
import { shortenCategory } from '@/utils/bookLabels';
import { countBy } from './shelfStats';

export interface SuggestionTheme {
	title: string;
	/** Consulta pronta para a Google Books, com os operadores de assunto. */
	query: string;
	lang?: string;
}

/**
 * Usados enquanto a estante não diz nada sobre o gosto de quem chegou — e é o
 * caso de toda primeira visita.
 */
export const SUGGESTION_THEMES: SuggestionTheme[] = [
	{ title: 'Clássicos da literatura brasileira', query: 'subject:"Brazilian literature"', lang: 'pt' },
	{ title: 'Ficção científica para começar', query: 'subject:"Science fiction"', lang: 'pt' },
	{ title: 'Para quem programa', query: 'subject:"Computers"', lang: 'pt' },
	{ title: 'Mistério e investigação', query: 'subject:"Detective and mystery stories"', lang: 'pt' },
];

/** Termos fixos dos atalhos da tela inicial, pelo mesmo motivo. */
export const FALLBACK_SHORTCUTS = [
	'Machado de Assis',
	'Ficção científica',
	'Clarice Lispector',
	'Programação',
];

/**
 * Abaixo disso a estante ainda não tem opinião: dois livros salvos por acaso
 * virariam "mais de Fulano" como se fosse o autor favorito da pessoa.
 */
const MIN_BOOKS_FOR_TASTE = 3;

/** Marcador que o adaptador usa quando a Google Books não informa a autoria. */
const UNKNOWN_AUTHOR = 'Unknown';

/** A API junta vários autores numa string só; para uma consulta, o primeiro basta. */
const primaryAuthor = (book: FavoriteBook): string =>
	book.author && book.author !== UNKNOWN_AUTHOR ? book.author.split(',')[0].trim() : '';

/** O idioma que mais aparece na estante, para não sugerir em língua que a pessoa não lê. */
const dominantLanguage = (books: FavoriteBook[]): string | undefined =>
	countBy(books.map((book) => book.language))[0]?.label;

/**
 * Intercala duas listas, começando pela primeira. Sem isso a rotação diária
 * passaria dias seguidos só em categorias antes de chegar aos autores.
 */
const interleave = <T>(a: T[], b: T[]): T[] => {
	const out: T[] = [];
	for (let i = 0; i < Math.max(a.length, b.length); i++) {
		if (a[i] !== undefined) out.push(a[i]);
		if (b[i] !== undefined) out.push(b[i]);
	}
	return out;
};

/**
 * Temas tirados da própria estante.
 *
 * A vitrine da tela inicial mostrava quatro temas fixos no código, iguais para
 * quem só lê policial e para quem só lê técnico. Aqui ela passa a partir do que
 * a pessoa já guardou — categorias e autorias mais presentes — e só cai nos
 * temas fixos quando não há estante suficiente para ter opinião.
 */
export const deriveThemes = (books: FavoriteBook[]): SuggestionTheme[] => {
	if (books.length < MIN_BOOKS_FOR_TASTE) return [];

	const lang = dominantLanguage(books);

	// O caminho inteiro em `subject:` quase não devolve nada; o segmento
	// específico é o que a Google de fato indexa.
	const categories = countBy(
		books.flatMap((book) => [...new Set(book.categories.map(shortenCategory))])
	)
		.slice(0, 3)
		.map((item) => ({
			title: `Mais em ${item.label}`,
			query: `subject:"${item.label}"`,
			lang,
		}));

	const authors = countBy(books.map(primaryAuthor))
		.slice(0, 2)
		.map((item) => ({
			title: `Mais de ${item.label}`,
			query: `inauthor:"${item.label}"`,
			lang,
		}));

	return interleave(categories, authors);
};

/**
 * Atalhos de busca da tela inicial, tirados da estante. Texto puro, sem
 * operadores: eles vão para o campo de busca como se tivessem sido digitados.
 */
export const deriveShortcuts = (books: FavoriteBook[], limit = 4): string[] => {
	if (books.length < MIN_BOOKS_FOR_TASTE) return [];

	const authors = countBy(books.map(primaryAuthor))
		.slice(0, limit)
		.map((item) => item.label);
	const categories = countBy(
		books.flatMap((book) => [...new Set(book.categories.map(shortenCategory))])
	)
		.slice(0, limit)
		.map((item) => item.label);

	return interleave(authors, categories).slice(0, limit);
};

const MS_PER_DAY = 86_400_000;

/** Número do dia no calendário local, para servir de índice estável. */
const dayNumber = (date: Date): number =>
	Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY);

/**
 * Tema do dia.
 *
 * Antes o tema era sorteado a cada montagem do hook, e como a Home desmonta ao
 * navegar, a vitrine mudava toda vez que o usuário voltava ao início. Derivar
 * da data mantém a tela estável durante a visita e troca a sugestão no dia
 * seguinte.
 */
export const getThemeOfTheDay = (
	date: Date = new Date(),
	themes: SuggestionTheme[] = SUGGESTION_THEMES
): SuggestionTheme => {
	const pool = themes.length > 0 ? themes : SUGGESTION_THEMES;
	return pool[dayNumber(date) % pool.length];
};
