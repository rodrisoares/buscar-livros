/**
 * Grade de capas para descobrir, lista para percorrer muitos títulos.
 *
 * Vive fora de `shelfFilters` porque a busca passou a oferecer a mesma escolha:
 * eram duas telas listando livros com formatos diferentes, e só uma deixava
 * trocar.
 */
export type ListView = 'grid' | 'list';

export const DEFAULT_LIST_VIEW: ListView = 'grid';

/** Slug legível na URL: `?visao=lista`. */
export const LIST_VIEW_SLUGS: Record<ListView, string> = { grid: 'grade', list: 'lista' };

export const parseListView = (value: string | null): ListView =>
	value === LIST_VIEW_SLUGS.list ? 'list' : DEFAULT_LIST_VIEW;

/** Valor que vai para a URL; `undefined` no padrão, para não sujar o endereço. */
export const listViewToParam = (view: ListView): string | undefined =>
	view === DEFAULT_LIST_VIEW ? undefined : LIST_VIEW_SLUGS[view];
