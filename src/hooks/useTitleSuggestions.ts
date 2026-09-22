import { useQuery } from '@tanstack/react-query';
import { searchBooks } from '@/services/googleBooksApi';
import { queryKeys } from '@/lib/queryKeys';
import { useDebouncedValue } from './useDebouncedValue';

/**
 * Menos de três letras não descrevem livro nenhum: a consulta voltaria com o
 * acervo inteiro em ordem arbitrária e teria gastado cota para isso.
 */
const MIN_LENGTH = 3;
const MAX_SUGGESTIONS = 5;

/**
 * Mais longo que o de digitação comum (200ms) porque cada disparo aqui é uma
 * requisição à Google Books, não um filtro local.
 */
const DEBOUNCE_MS = 350;

/**
 * Livros reais sugeridos enquanto se digita.
 *
 * O campo só sabia repetir o que já tinha sido buscado antes; quem procurava um
 * título pela primeira vez digitava às cegas e só descobria se tinha acertado
 * depois de carregar a página de resultados.
 *
 * `retry: false` e o cache longo seguem a mesma regra da vitrine: sugestão é
 * conteúdo acessório e não vale insistir com a cota da API.
 */
export const useTitleSuggestions = (term: string, enabled = true) => {
	const debounced = useDebouncedValue(term.trim(), DEBOUNCE_MS);
	const shouldSearch = enabled && debounced.length >= MIN_LENGTH;

	const { data, isFetching } = useQuery({
		queryKey: queryKeys.booksSuggest(debounced),
		queryFn: ({ signal }) => searchBooks(debounced, { maxResults: MAX_SUGGESTIONS, signal }),
		enabled: shouldSearch,
		staleTime: 10 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
		retry: false,
	});

	return {
		books: (data?.books ?? []).slice(0, MAX_SUGGESTIONS),
		/** Consultando agora, sem nada ainda para mostrar. */
		isLoading: shouldSearch && isFetching && !data,
		/** Já dá para consultar — o campo tem texto suficiente. */
		isActive: shouldSearch,
	};
};
