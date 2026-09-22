import {
	joinArrayToString,
	normalizeArray,
	normalizeForSearch,
	normalizeNumber,
	normalizeString,
	normalizeUrl,
} from './normalize';

describe('normalizeString', () => {
	it('remove espaços das pontas', () => {
		expect(normalizeString('  texto  ')).toBe('texto');
	});

	it('cai no valor padrão para vazio, null e undefined', () => {
		expect(normalizeString(undefined)).toBe('');
		expect(normalizeString(null)).toBe('');
		expect(normalizeString('   ', 'padrão')).toBe('padrão');
	});
});

describe('normalizeNumber', () => {
	it('mantém números válidos', () => {
		expect(normalizeNumber(42)).toBe(42);
		expect(normalizeNumber(0)).toBe(0);
	});

	it('descarta NaN, null e undefined', () => {
		expect(normalizeNumber(Number.NaN)).toBe(0);
		expect(normalizeNumber(null)).toBe(0);
		expect(normalizeNumber(undefined, 7)).toBe(7);
	});
});

describe('normalizeArray', () => {
	it('devolve array vazio no lugar de nulo', () => {
		expect(normalizeArray(null)).toEqual([]);
		expect(normalizeArray(['a'])).toEqual(['a']);
	});
});

describe('normalizeUrl', () => {
	it('promove http para https', () => {
		expect(normalizeUrl('http://exemplo.test/a')).toBe('https://exemplo.test/a');
	});

	it('não altera https nem vazio', () => {
		expect(normalizeUrl('https://exemplo.test')).toBe('https://exemplo.test');
		expect(normalizeUrl(undefined)).toBe('');
	});
});

describe('joinArrayToString', () => {
	it('junta os autores com vírgula', () => {
		expect(joinArrayToString(['A', 'B'])).toBe('A, B');
	});

	it('usa o padrão quando a lista está vazia', () => {
		expect(joinArrayToString([])).toBe('Unknown');
		expect(joinArrayToString(undefined)).toBe('Unknown');
	});
});

describe('normalizeForSearch', () => {
	it('remove acentos e caixa para comparar textos', () => {
		expect(normalizeForSearch('Ficção Científica')).toBe('ficcao cientifica');
		expect(normalizeForSearch('  MACHADO  ')).toBe('machado');
	});
});
