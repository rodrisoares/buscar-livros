import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SortOption } from '@/types/GoogleBooks';
import { searchBooks } from '@/services/googleBooksApi';
import { queryKeys } from '@/lib/queryKeys';
import { PAGE_SIZE, clampPage, getTotalPages, parsePageSize } from '@/lib/pagination';
import { describeBooksError, isQuotaError } from '@/lib/apiErrors';
import { listViewToParam, parseListView, type ListView } from '@/lib/listView';
import {
	parseShelfPresence,
	shelfPresenceToParam,
	type ShelfPresence,
} from '@/lib/shelfPresence';
import {
	EMPTY_FILTERS,
	buildQueryString,
	clearFilter,
	countActiveFilters,
	describeFilters,
	type Availability,
	type PrintType,
	type RemovableFilterKey,
	type SearchFilters,
} from '@/lib/searchQuery';

export const SEARCH_PARAM = 'q';
export const PAGE_PARAM = 'page';
export const SORT_PARAM = 'sort';
export const VIEW_PARAM = 'visao';
export const PER_PAGE_PARAM = 'por';
export const PRESENCE_PARAM = 'estante';

/** Um parâmetro de URL por filtro, para o link continuar compartilhável. */
const FILTER_PARAMS = {
	title: 'titulo',
	author: 'autor',
	subject: 'assunto',
	isbn: 'isbn',
	lang: 'idioma',
	availability: 'disp',
	printType: 'tipo',
} as const;

const parsePage = (value: string | null): number => {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 1 ? Math.trunc(parsed) : 1;
};

const parseSort = (value: string | null): SortOption => (value === 'newest' ? 'newest' : 'relevance');

const parseAvailability = (value: string | null): Availability =>
	value === 'ebooks' || value === 'free-ebooks' || value === 'paid-ebooks' ? value : '';

const parsePrintType = (value: string | null): PrintType =>
	value === 'magazines' || value === 'all' ? value : 'books';

/**
 * A busca inteira vive na URL (`/?q=...&autor=tolkien&idioma=pt&page=2`):
 * recarregar, voltar no histórico ou compartilhar o link continuam funcionando.
 */
export const useBookSearch = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const { pathname } = useLocation();

	const filters: SearchFilters = useMemo(
		() => ({
			term: (searchParams.get(SEARCH_PARAM) ?? '').trim(),
			title: (searchParams.get(FILTER_PARAMS.title) ?? '').trim(),
			author: (searchParams.get(FILTER_PARAMS.author) ?? '').trim(),
			subject: (searchParams.get(FILTER_PARAMS.subject) ?? '').trim(),
			isbn: (searchParams.get(FILTER_PARAMS.isbn) ?? '').trim(),
			lang: (searchParams.get(FILTER_PARAMS.lang) ?? '').trim(),
			availability: parseAvailability(searchParams.get(FILTER_PARAMS.availability)),
			printType: parsePrintType(searchParams.get(FILTER_PARAMS.printType)),
		}),
		[searchParams]
	);

	const page = parsePage(searchParams.get(PAGE_PARAM));
	const sort = parseSort(searchParams.get(SORT_PARAM));
	const view = parseListView(searchParams.get(VIEW_PARAM));
	const perPage = parsePageSize(searchParams.get(PER_PAGE_PARAM));
	const presence = parseShelfPresence(searchParams.get(PRESENCE_PARAM));
	const queryString = buildQueryString(filters);

	const searchOptions = {
		page,
		sort,
		lang: filters.lang,
		availability: filters.availability,
		printType: filters.printType,
		maxResults: perPage,
	};

	const { data, isLoading, isFetching, error, refetch } = useQuery({
		queryKey: queryKeys.booksSearch(queryString, searchOptions),
		queryFn: ({ signal }) => searchBooks(queryString, { ...searchOptions, signal }),
		enabled: queryString.length > 0,
		// Mantém a página anterior visível enquanto a próxima carrega, sem piscar a tela.
		placeholderData: keepPreviousData,
	});

	const updateParams = useCallback(
		(changes: Record<string, string | undefined>, options?: { replace?: boolean }) => {
			setSearchParams((current) => {
				const params = new URLSearchParams(current);
				for (const [key, value] of Object.entries(changes)) {
					if (value === undefined || value === '') params.delete(key);
					else params.set(key, value);
				}
				return params;
			}, options);
		},
		[setSearchParams]
	);

	const search = useCallback(
		(value: string) => {
			const trimmed = value.trim();
			if (!trimmed) return;

			// A busca do cabeçalho pode ser disparada de qualquer tela: os
			// resultados vivem na Home, então vamos para lá levando o termo.
			if (pathname !== '/') {
				navigate(`/?${SEARCH_PARAM}=${encodeURIComponent(trimmed)}`);
				return;
			}

			// Toda nova busca volta para a página 1.
			updateParams({ [SEARCH_PARAM]: trimmed, [PAGE_PARAM]: undefined });
		},
		[navigate, pathname, updateParams]
	);

	const applyFilters = useCallback(
		(next: SearchFilters) => {
			updateParams({
				[SEARCH_PARAM]: next.term.trim(),
				[FILTER_PARAMS.title]: next.title.trim(),
				[FILTER_PARAMS.author]: next.author.trim(),
				[FILTER_PARAMS.subject]: next.subject.trim(),
				[FILTER_PARAMS.isbn]: next.isbn.trim(),
				[FILTER_PARAMS.lang]: next.lang,
				[FILTER_PARAMS.availability]: next.availability,
				[FILTER_PARAMS.printType]:
					next.printType === EMPTY_FILTERS.printType ? undefined : next.printType,
				[PAGE_PARAM]: undefined,
			});
		},
		[updateParams]
	);

	/** Tira um filtro sozinho, sem reabrir o painel — é o ✕ de cada chip. */
	const removeFilter = useCallback(
		(key: RemovableFilterKey) => applyFilters(clearFilter(filters, key)),
		[applyFilters, filters]
	);

	const goToPage = useCallback(
		(nextPage: number) => {
			updateParams({ [PAGE_PARAM]: nextPage <= 1 ? undefined : String(nextPage) });
			window.scrollTo({ top: 0, behavior: 'smooth' });
		},
		[updateParams]
	);

	const changeSort = useCallback(
		(nextSort: SortOption) => {
			updateParams({
				[SORT_PARAM]: nextSort === 'relevance' ? undefined : nextSort,
				[PAGE_PARAM]: undefined,
			});
		},
		[updateParams]
	);

	/** Trocar grade/lista não muda a busca: a página se mantém. */
	const changeView = useCallback(
		(nextView: ListView) => updateParams({ [VIEW_PARAM]: listViewToParam(nextView) }),
		[updateParams]
	);

	/**
	 * Mudar o tamanho da página remonta a numeração inteira — a "página 3" de 20
	 * em 20 não é a mesma de 40 em 40 —, então a contagem recomeça.
	 */
	const changePerPage = useCallback(
		(size: number) => {
			updateParams({
				[PER_PAGE_PARAM]: size === PAGE_SIZE ? undefined : String(size),
				[PAGE_PARAM]: undefined,
			});
		},
		[updateParams]
	);

	const changePresence = useCallback(
		(next: ShelfPresence) => updateParams({ [PRESENCE_PARAM]: shelfPresenceToParam(next) }),
		[updateParams]
	);

	const clearSearch = useCallback(() => setSearchParams({}), [setSearchParams]);

	const totalItems = data?.totalItems ?? 0;

	/**
	 * Página fora da faixa navegável (link antigo, URL editada na mão, busca que
	 * encolheu): em vez do beco sem saída "a página 999 não tem resultados",
	 * cai na última página que existe de fato. O `replace` evita que o botão
	 * voltar traga o usuário de volta ao endereço inválido.
	 */
	useEffect(() => {
		if (isLoading || totalItems === 0) return;

		const valid = clampPage(page, totalItems, perPage);
		if (valid === page) return;

		updateParams({ [PAGE_PARAM]: valid <= 1 ? undefined : String(valid) }, { replace: true });
	}, [isLoading, page, perPage, totalItems, updateParams]);

	return {
		filters,
		query: filters.term,
		queryString,
		activeFilterCount: countActiveFilters(filters),
		filterChips: describeFilters(filters),
		hasSearch: queryString.length > 0,
		page,
		sort,
		view,
		perPage,
		presence,
		books: data?.books ?? [],
		totalItems,
		totalPages: getTotalPages(totalItems, perPage),
		isLoading,
		/** Buscando uma nova página com a anterior ainda na tela. */
		isRefreshing: isFetching && !isLoading,
		error: error
			? describeBooksError(error, 'Não foi possível buscar os livros. Verifique sua conexão.')
			: null,
		isQuotaError: isQuotaError(error),
		retry: refetch,
		search,
		applyFilters,
		removeFilter,
		goToPage,
		changeSort,
		changeView,
		changePerPage,
		changePresence,
		clearSearch,
	};
};
