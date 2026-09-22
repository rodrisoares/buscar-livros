import type { IconName } from '@/components/Icon';

/**
 * Uma estante criada pelo usuário.
 *
 * Convive com os três status (Quero ler / Lendo / Lido) em vez de competir com
 * eles: um livro está em exatamente um status e em quantas estantes
 * personalizadas quiser. É o que permite "emprestado para a Ana" sem apagar
 * "Lendo", e é o que mantém intactas as regras que dependem do status — datas
 * de leitura, contagem da meta e progresso.
 */
export interface CustomShelf {
	/** Chave do registro na API. */
	recordId: string;
	name: string;
	icon: IconName;
	color: ShelfColor;
	/** Ordem de exibição entre as abas. */
	position: number;
}

export interface RawCustomShelf {
	id?: string | number;
	name?: string;
	icon?: string;
	color?: string;
	position?: number;
}

export type ShelfColor = 'sky' | 'amber' | 'emerald' | 'rose' | 'violet' | 'slate';

export const SHELF_COLORS: ShelfColor[] = ['sky', 'amber', 'emerald', 'rose', 'violet', 'slate'];

/** Mesmo formato dos selos das estantes fixas, para as duas se lerem igual. */
export const SHELF_COLOR_CLASSES: Record<ShelfColor, string> = {
	sky: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
	amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
	emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
	rose: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
	violet: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
	slate: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
};

/** Amostra da cor no seletor, sem depender do texto. */
export const SHELF_COLOR_SWATCHES: Record<ShelfColor, string> = {
	sky: 'bg-sky-500',
	amber: 'bg-amber-500',
	emerald: 'bg-emerald-500',
	rose: 'bg-rose-500',
	violet: 'bg-violet-500',
	slate: 'bg-slate-500',
};

/** Ícones oferecidos na criação — um recorte do conjunto do projeto. */
export const SHELF_ICON_OPTIONS: IconName[] = [
	'bookmark',
	'library',
	'book-open',
	'book-closed',
	'star',
	'heart',
	'tag',
	'clock',
	'bolt',
	'check-circle',
];

export const DEFAULT_SHELF_ICON: IconName = 'bookmark';
export const DEFAULT_SHELF_COLOR: ShelfColor = 'sky';

/** Nome de estante; o limite existe para a aba não virar um parágrafo. */
export const MAX_SHELF_NAME = 28;

export const isShelfColor = (value: unknown): value is ShelfColor =>
	typeof value === 'string' && (SHELF_COLORS as string[]).includes(value);

export const isShelfIcon = (value: unknown): value is IconName =>
	typeof value === 'string' && (SHELF_ICON_OPTIONS as string[]).includes(value);
