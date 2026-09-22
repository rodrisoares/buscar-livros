import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchBooks } from '@/services/googleBooksApi';
import { isQuotaError } from '@/lib/apiErrors';
import { SUGGESTION_THEMES, deriveThemes, getThemeOfTheDay } from '@/lib/suggestionThemes';
import { useFavorites } from './useFavorites';

/**
 * A consulta já trazia 12 e a vitrine mostrava 4 — oito livros baixados e
 * jogados fora. Três fileiras de quatro cabem na mesma requisição; buscar temas
 * diferentes por fileira custaria uma consulta a mais cada, na cota anônima que
 * o app inteiro evita gastar.
 */
const SUGGESTION_COUNT = 12;

/**
 * Vitrine da tela inicial. É conteúdo opcional: não insiste em caso de erro
 * (`retry: false`) para não gastar a cota da API, e fica em cache por meia hora.
 *
 * Os temas saem da estante de quem está olhando; os fixos entram só enquanto
 * não há estante que sirva de pista.
 */
export const useSuggestedBooks = () => {
	const { favorites, isLoading: isLoadingShelf } = useFavorites();

	const themes = useMemo(() => {
		const derived = deriveThemes(favorites);
		return derived.length > 0 ? derived : SUGGESTION_THEMES;
	}, [favorites]);

	// Derivado da data, não sorteado: a vitrine não muda a cada volta para a Home.
	const theme = useMemo(() => getThemeOfTheDay(new Date(), themes), [themes]);

	const { data, isLoading, error } = useQuery({
		queryKey: ['books', 'suggestions', theme.query, theme.lang ?? ''] as const,
		queryFn: ({ signal }) =>
			searchBooks(theme.query, { maxResults: 12, lang: theme.lang, signal }),
		// Esperar a estante evita a consulta dupla: sair com o tema fixo e
		// refazer tudo assim que os favoritos chegam custaria duas requisições
		// por visita, e a segunda descartaria a primeira.
		enabled: !isLoadingShelf,
		staleTime: 30 * 60 * 1000,
		gcTime: 60 * 60 * 1000,
		retry: false,
	});

	return {
		theme,
		// Só entram na vitrine os livros que têm capa.
		books: (data?.books ?? []).filter((book) => book.thumbnail).slice(0, SUGGESTION_COUNT),
		isLoading: isLoading || isLoadingShelf,
		hasError: Boolean(error),
		isQuotaError: isQuotaError(error),
	};
};
