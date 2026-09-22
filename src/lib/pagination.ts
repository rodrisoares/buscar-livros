export const PAGE_SIZE = 20;

/**
 * Tamanhos oferecidos no seletor dos resultados de busca. O teto é da própria
 * Google Books: `maxResults` acima de 40 é recusado pela API.
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 40] as const;

/** Quantos livros a estante mostra por página (lista local, sem limite de API). */
export const SHELF_PAGE_SIZE = 24;

/**
 * A Google Books anuncia dezenas de milhares de resultados, mas começa a devolver
 * respostas vazias/instáveis para índices altos. Limitamos a janela navegável
 * para não oferecer páginas que não carregam.
 */
export const MAX_PAGINATED_RESULTS = 400;

export const parsePageSize = (value: string | null): number => {
	const parsed = Number(value);
	return (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed) ? parsed : PAGE_SIZE;
};

/**
 * Total de páginas de uma lista qualquer — sem o teto da Google Books, porque a
 * estante é local e não tem índice máximo.
 */
export const countPages = (totalItems: number, pageSize: number): number =>
	Math.max(1, Math.ceil(Math.max(totalItems, 0) / Math.max(1, pageSize)));

export const getTotalPages = (totalItems: number, pageSize: number = PAGE_SIZE): number =>
	countPages(Math.min(Math.max(totalItems, 0), MAX_PAGINATED_RESULTS), pageSize);

export const clampPage = (
	page: number,
	totalItems: number,
	pageSize: number = PAGE_SIZE
): number => {
	if (!Number.isFinite(page) || page < 1) return 1;
	return Math.min(Math.trunc(page), getTotalPages(totalItems, pageSize));
};

/** Mesma correção da `clampPage`, para listas locais (estante) sem teto de API. */
export const clampLocalPage = (page: number, totalItems: number, pageSize: number): number => {
	if (!Number.isFinite(page) || page < 1) return 1;
	return Math.min(Math.trunc(page), countPages(totalItems, pageSize));
};

export const getStartIndex = (page: number, pageSize: number = PAGE_SIZE): number =>
	Math.max(0, (page - 1) * pageSize);

/** Índice do primeiro e do último item da página, em base 1, para o texto "X–Y de N". */
export const getPageRange = (
	page: number,
	itemsOnPage: number,
	pageSize: number = PAGE_SIZE
): { from: number; to: number } => {
	const from = getStartIndex(page, pageSize) + 1;
	return { from, to: from + Math.max(0, itemsOnPage) - 1 };
};

/** A fatia de uma lista local que cabe na página pedida. */
export const sliceForPage = <T>(items: T[], page: number, pageSize: number): T[] => {
	const start = getStartIndex(clampLocalPage(page, items.length, pageSize), pageSize);
	return items.slice(start, start + pageSize);
};

/**
 * Janela deslizante de páginas para os botões numerados: mantém o total de botões
 * estável e a página atual o mais centrada possível.
 */
export const getPageWindow = (current: number, total: number, size = 5): number[] => {
	if (total <= size) return Array.from({ length: total }, (_, i) => i + 1);

	const half = Math.floor(size / 2);
	const start = Math.min(Math.max(current - half, 1), total - size + 1);

	return Array.from({ length: size }, (_, i) => start + i);
};
