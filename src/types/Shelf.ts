import type { IconName } from '@/components/Icon';

export type ShelfStatus = 'want_to_read' | 'reading' | 'read';

export const SHELF_STATUSES: ShelfStatus[] = ['want_to_read', 'reading', 'read'];

export const SHELF_LABELS: Record<ShelfStatus, string> = {
	want_to_read: 'Quero ler',
	reading: 'Lendo',
	read: 'Lido',
};

/** Ícone de cada estante. Importa só o tipo, então nada de componente vem junto. */
export const SHELF_ICONS: Record<ShelfStatus, IconName> = {
	want_to_read: 'bookmark',
	reading: 'book-open',
	read: 'check-circle',
};

/** Classes de cor por estante, usadas em selos e abas. */
export const SHELF_BADGE_CLASSES: Record<ShelfStatus, string> = {
	want_to_read: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
	reading: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
	read: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
};

export const isShelfStatus = (value: unknown): value is ShelfStatus =>
	typeof value === 'string' && (SHELF_STATUSES as string[]).includes(value);
