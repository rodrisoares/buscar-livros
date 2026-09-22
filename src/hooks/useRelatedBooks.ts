import { useQueries } from '@tanstack/react-query';
import type { Book } from '@/types/Book';
import { searchBooks } from '@/services/googleBooksApi';
import { queryKeys } from '@/lib/queryKeys';

const MAX_RELATED = 6;
const UNKNOWN_AUTHOR = 'Unknown';

/**
 * Sugestões na página de detalhes: outros livros da mesma autoria e da mesma
 * categoria. Reaproveita a busca com os operadores `inauthor:` e `subject:`.
 *
 * `enabled` é o que segura as duas consultas até o bloco chegar perto da tela:
 * elas custam cota da Google Books e ficam no rodapé da ficha, onde boa parte
 * das visitas nunca chega.
 */
export const useRelatedBooks = (book: Book | null, enabled = true) => {
	// A API devolve vários autores separados por vírgula; o primeiro basta.
	const author = book && book.author !== UNKNOWN_AUTHOR ? book.author.split(',')[0].trim() : '';
	const category = book?.categories[0] ?? '';

	const [byAuthor, byCategory] = useQueries({
		queries: [
			{
				queryKey: queryKeys.relatedBooks('author', author),
				queryFn: ({ signal }: { signal: AbortSignal }) =>
					searchBooks(`inauthor:"${author}"`, { maxResults: 12, signal }),
				enabled: enabled && author.length > 0,
			},
			{
				queryKey: queryKeys.relatedBooks('category', category),
				queryFn: ({ signal }: { signal: AbortSignal }) =>
					searchBooks(`subject:"${category}"`, { maxResults: 12, signal }),
				enabled: enabled && category.length > 0,
			},
		],
	});

	const dedupe = (books: Book[]): Book[] => {
		const seen = new Set<string>();

		return books.filter((item) => {
			// Fora o próprio livro e as reedições repetidas do mesmo volume.
			if (!item.id || item.id === book?.id || seen.has(item.id)) return false;
			seen.add(item.id);
			return true;
		});
	};

	return {
		author,
		category,
		sameAuthor: dedupe(byAuthor.data?.books ?? []).slice(0, MAX_RELATED),
		sameCategory: dedupe(byCategory.data?.books ?? []).slice(0, MAX_RELATED),
		// Uma consulta desabilitada fica em `pending` para sempre; sem o `enabled`
		// aqui, o esqueleto ficaria girando antes mesmo de a busca começar.
		isLoading: enabled && (byAuthor.isLoading || byCategory.isLoading),
	};
};
