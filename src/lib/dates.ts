const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
});

/**
 * Timestamp para o valor de um `<input type="date">` (`AAAA-MM-DD`).
 *
 * A conversão é feita campo a campo, no fuso local: `toISOString()` converteria
 * para UTC e um livro terminado às 21h no Brasil apareceria com a data do dia
 * seguinte.
 */
export const toDateInputValue = (timestamp: number): string => {
	if (!timestamp) return '';

	const date = new Date(timestamp);
	if (Number.isNaN(date.getTime())) return '';

	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return `${date.getFullYear()}-${month}-${day}`;
};

/**
 * Caminho de volta: `AAAA-MM-DD` vira meia-noite local, e não meia-noite UTC
 * como faria `new Date('2026-09-02')`. Devolve 0 quando o campo está vazio.
 */
export const fromDateInputValue = (value: string): number => {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
	if (!match) return 0;

	const [, year, month, day] = match;
	const date = new Date(Number(year), Number(month) - 1, Number(day));

	return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

/** Data legível para exibição; string vazia quando não há data registrada. */
export const formatDate = (timestamp: number): string => {
	if (!timestamp) return '';

	const date = new Date(timestamp);
	return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
};

/** Hoje no formato do `<input type="date">`, para usar como `max`. */
export const todayAsInputValue = (): string => toDateInputValue(Date.now());
