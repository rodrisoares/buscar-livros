import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CustomShelf } from '@/types/CustomShelf';
import { listViewToParam } from '@/lib/listView';
import {
	EMPTY_SHELF_FILTERS,
	parseRatingFilter,
	parseShelfSort,
	parseShelfTab,
	parseShelfView,
	shelfTabToSlug,
	type RatingFilter,
	type ShelfFilters,
	type ShelfSort,
	type ShelfTab,
	type ShelfView,
} from '@/lib/shelfFilters';

export const TAB_PARAM = 'estante';
export const SORT_PARAM = 'ordem';
export const TERM_PARAM = 'busca';
export const TAG_PARAM = 'tag';
export const VIEW_PARAM = 'visao';
export const RATING_PARAM = 'nota';
export const NOTES_PARAM = 'anotacoes';
export const PAGE_PARAM = 'pagina';

/** Valor de um parâmetro: string única, lista (repetido na URL) ou remoção. */
type ParamChange = string | string[] | undefined;

const parsePage = (value: string | null): number => {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 1 ? Math.trunc(parsed) : 1;
};

/**
 * A seleção da estante vive na URL, como já acontecia com a busca: o link
 * `/favorites?estante=lendo&tag=fantasia&tag=relidos` é compartilhável,
 * sobrevive ao recarregamento e o botão voltar desfaz a última escolha.
 */
export const useShelfFilters = (customShelves: CustomShelf[] = []) => {
	const [searchParams, setSearchParams] = useSearchParams();

	const filters: ShelfFilters = useMemo(
		() => ({
			// As estantes criadas pelo usuário só podem ser reconhecidas na URL
			// depois que a lista delas chega — até lá, o parâmetro cai em "Todos".
			tab: parseShelfTab(searchParams.get(TAB_PARAM), customShelves),
			sort: parseShelfSort(searchParams.get(SORT_PARAM)),
			term: (searchParams.get(TERM_PARAM) ?? '').trim(),
			// Repetido na URL (?tag=a&tag=b) em vez de separado por vírgula: tag com
			// vírgula no nome deixaria de funcionar, e o usuário pode criar qualquer uma.
			tags: searchParams
				.getAll(TAG_PARAM)
				.map((tag) => tag.trim())
				.filter(Boolean),
			rating: parseRatingFilter(searchParams.get(RATING_PARAM)),
			hasNotes: searchParams.get(NOTES_PARAM) === '1',
			view: parseShelfView(searchParams.get(VIEW_PARAM)),
			page: parsePage(searchParams.get(PAGE_PARAM)),
		}),
		[searchParams, customShelves]
	);

	const updateParams = useCallback(
		(changes: Record<string, ParamChange>, options?: { replace?: boolean }) => {
			setSearchParams((current) => {
				const params = new URLSearchParams(current);

				for (const [key, value] of Object.entries(changes)) {
					params.delete(key);

					if (Array.isArray(value)) {
						for (const item of value) if (item) params.append(key, item);
					} else if (value !== undefined && value !== '') {
						params.set(key, value);
					}
				}

				return params;
			}, options);
		},
		[setSearchParams]
	);

	/**
	 * Estreitar a lista sempre devolve à primeira página: filtrar estando na
	 * página 7 mostraria um vazio que parece "nenhum resultado".
	 */
	const updateFilter = useCallback(
		(changes: Record<string, ParamChange>, options?: { replace?: boolean }) =>
			updateParams({ ...changes, [PAGE_PARAM]: undefined }, options),
		[updateParams]
	);

	const setTab = useCallback(
		(tab: ShelfTab) => updateFilter({ [TAB_PARAM]: shelfTabToSlug(tab, customShelves) }),
		[updateFilter, customShelves]
	);

	const setSort = useCallback(
		(sort: ShelfSort) =>
			updateFilter({ [SORT_PARAM]: sort === EMPTY_SHELF_FILTERS.sort ? undefined : sort }),
		[updateFilter]
	);

	const setTags = useCallback(
		(tags: string[]) => updateFilter({ [TAG_PARAM]: tags }),
		[updateFilter]
	);

	/**
	 * Liga/desliga uma tag sem mexer nas outras — é o que torna o filtro cumulativo.
	 *
	 * Parte de `filters.tags`, a lista deste render. Dois toggles disparados no
	 * mesmo tick partiriam ambos do mesmo estado e o segundo apagaria o primeiro,
	 * mas cada clique navega e re-renderiza antes de o próximo chegar — e a forma
	 * funcional do `setSearchParams` não ajudaria: o react-router a alimenta com
	 * os `searchParams` do render, não com os da URL naquele instante.
	 */
	const toggleTag = useCallback(
		(tag: string) =>
			setTags(
				filters.tags.includes(tag)
					? filters.tags.filter((item) => item !== tag)
					: [...filters.tags, tag]
			),
		[filters.tags, setTags]
	);

	const setRating = useCallback(
		(rating: RatingFilter) => updateFilter({ [RATING_PARAM]: rating || undefined }),
		[updateFilter]
	);

	const setHasNotes = useCallback(
		(hasNotes: boolean) => updateFilter({ [NOTES_PARAM]: hasNotes ? '1' : undefined }),
		[updateFilter]
	);

	/** Trocar grade/lista não muda quais livros aparecem, então a página se mantém. */
	const setView = useCallback(
		(view: ShelfView) => updateParams({ [VIEW_PARAM]: listViewToParam(view) }),
		[updateParams]
	);

	const setPage = useCallback(
		(page: number) => updateParams({ [PAGE_PARAM]: page <= 1 ? undefined : String(page) }),
		[updateParams]
	);

	/**
	 * Digitar não é navegar: cada tecla substitui a entrada atual do histórico em
	 * vez de empilhar uma nova, senão o botão voltar percorreria letra por letra.
	 */
	const setTerm = useCallback(
		(term: string) => updateFilter({ [TERM_PARAM]: term.trim() }, { replace: true }),
		[updateFilter]
	);

	const clearFilters = useCallback(
		() =>
			updateParams({
				[TAB_PARAM]: undefined,
				[TERM_PARAM]: undefined,
				[TAG_PARAM]: undefined,
				[RATING_PARAM]: undefined,
				[NOTES_PARAM]: undefined,
				[PAGE_PARAM]: undefined,
			}),
		[updateParams]
	);

	return {
		filters,
		setTab,
		setSort,
		setTerm,
		setTags,
		toggleTag,
		setRating,
		setHasNotes,
		setView,
		setPage,
		clearFilters,
	};
};
