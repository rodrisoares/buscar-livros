import { formatDate, fromDateInputValue, toDateInputValue } from './dates';

describe('toDateInputValue', () => {
	it('converte um timestamp para AAAA-MM-DD no fuso local', () => {
		expect(toDateInputValue(new Date(2026, 8, 2, 14, 30).getTime())).toBe('2026-09-02');
	});

	it('preenche mês e dia com zero à esquerda', () => {
		expect(toDateInputValue(new Date(2026, 0, 5).getTime())).toBe('2026-01-05');
	});

	it('devolve vazio quando não há data', () => {
		expect(toDateInputValue(0)).toBe('');
		expect(toDateInputValue(Number.NaN)).toBe('');
	});

	it('não escorrega de dia no fim da noite', () => {
		// Com toISOString(), 23h no Brasil viraria o dia seguinte em UTC.
		expect(toDateInputValue(new Date(2026, 8, 2, 23, 59).getTime())).toBe('2026-09-02');
	});
});

describe('fromDateInputValue', () => {
	it('lê AAAA-MM-DD como meia-noite local', () => {
		const timestamp = fromDateInputValue('2026-09-02');
		const date = new Date(timestamp);

		expect(date.getFullYear()).toBe(2026);
		expect(date.getMonth()).toBe(8);
		expect(date.getDate()).toBe(2);
		expect(date.getHours()).toBe(0);
	});

	it('devolve 0 para campo vazio ou formato inesperado', () => {
		expect(fromDateInputValue('')).toBe(0);
		expect(fromDateInputValue('   ')).toBe(0);
		expect(fromDateInputValue('02/09/2026')).toBe(0);
	});

	it('faz a ida e volta sem perder o dia', () => {
		const original = new Date(2026, 8, 2, 18, 45).getTime();
		expect(toDateInputValue(fromDateInputValue(toDateInputValue(original)))).toBe('2026-09-02');
	});
});

describe('formatDate', () => {
	it('formata no padrão brasileiro', () => {
		expect(formatDate(new Date(2026, 8, 2).getTime())).toBe('02/09/2026');
	});

	it('devolve vazio quando não há data', () => {
		expect(formatDate(0)).toBe('');
	});
});
