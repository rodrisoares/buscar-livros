import {
	MAX_RECENT_SEARCHES,
	addRecentSearch,
	filterRecentSearches,
	readRecentSearches,
	writeRecentSearches,
	RECENT_SEARCHES_KEY,
} from './recentSearches';

describe('addRecentSearch', () => {
	it('coloca o termo mais novo no topo', () => {
		expect(addRecentSearch(['tolkien'], 'machado')).toEqual(['machado', 'tolkien']);
	});

	it('ignora termos vazios', () => {
		expect(addRecentSearch(['tolkien'], '   ')).toEqual(['tolkien']);
	});

	it('não duplica o mesmo termo com caixa ou acento diferentes', () => {
		expect(addRecentSearch(['Ficção'], 'ficcao')).toEqual(['ficcao']);
		expect(addRecentSearch(['Tolkien'], 'tolkien')).toEqual(['tolkien']);
	});

	it('respeita o limite do histórico', () => {
		const list = Array.from({ length: MAX_RECENT_SEARCHES }, (_, i) => `termo ${i}`);
		const result = addRecentSearch(list, 'novo');

		expect(result).toHaveLength(MAX_RECENT_SEARCHES);
		expect(result[0]).toBe('novo');
	});
});

describe('filterRecentSearches', () => {
	const list = ['Machado de Assis', 'Ficção científica', 'TypeScript'];

	it('devolve tudo quando não há texto digitado', () => {
		expect(filterRecentSearches(list, '')).toEqual(list);
	});

	it('filtra ignorando caixa e acentos', () => {
		expect(filterRecentSearches(list, 'ficcao')).toEqual(['Ficção científica']);
		expect(filterRecentSearches(list, 'TYPE')).toEqual(['TypeScript']);
	});

	it('esconde a sugestão idêntica ao que já foi digitado', () => {
		expect(filterRecentSearches(list, 'typescript')).toEqual([]);
	});
});

describe('persistência', () => {
	beforeEach(() => localStorage.clear());

	it('faz a ida e volta pelo localStorage', () => {
		writeRecentSearches(['a', 'b']);
		expect(readRecentSearches()).toEqual(['a', 'b']);
	});

	it('devolve lista vazia quando o conteúdo está corrompido', () => {
		localStorage.setItem(RECENT_SEARCHES_KEY, '{isso não é json');
		expect(readRecentSearches()).toEqual([]);
	});

	it('descarta entradas que não são texto', () => {
		localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(['ok', 42, null]));
		expect(readRecentSearches()).toEqual(['ok']);
	});
});
