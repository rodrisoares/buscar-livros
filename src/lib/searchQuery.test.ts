import {
	EMPTY_FILTERS,
	buildQueryString,
	cleanIsbn,
	countActiveFilters,
	clearFilter,
	describeFilters,
	hasSearch,
	type SearchFilters,
} from './searchQuery';

const filters = (overrides: Partial<SearchFilters> = {}): SearchFilters => ({
	...EMPTY_FILTERS,
	...overrides,
});

describe('buildQueryString', () => {
	it('usa o texto livre quando não há filtros', () => {
		expect(buildQueryString(filters({ term: 'tolkien' }))).toBe('tolkien');
	});

	it('monta os operadores da Google Books', () => {
		expect(buildQueryString(filters({ author: 'tolkien' }))).toBe('inauthor:tolkien');
		expect(buildQueryString(filters({ subject: 'fantasia' }))).toBe('subject:fantasia');
	});

	it('põe aspas em valores com espaço, para o operador valer na frase toda', () => {
		expect(buildQueryString(filters({ title: 'o hobbit' }))).toBe('intitle:"o hobbit"');
		expect(buildQueryString(filters({ author: 'machado de assis' }))).toBe(
			'inauthor:"machado de assis"'
		);
	});

	it('limpa hífens do ISBN, que a API não aceita', () => {
		expect(buildQueryString(filters({ isbn: '978-0-261-10221-7' }))).toBe('isbn:9780261102217');
	});

	it('combina texto livre e operadores', () => {
		expect(buildQueryString(filters({ term: 'anel', author: 'tolkien', subject: 'fantasia' }))).toBe(
			'anel inauthor:tolkien subject:fantasia'
		);
	});

	it('devolve vazio quando não há nada para buscar', () => {
		expect(buildQueryString(EMPTY_FILTERS)).toBe('');
		// Idioma e disponibilidade sozinhos não formam uma busca.
		expect(buildQueryString(filters({ lang: 'pt', availability: 'free-ebooks' }))).toBe('');
	});
});

describe('cleanIsbn', () => {
	it('mantém apenas dígitos e o X final', () => {
		expect(cleanIsbn('0-306-40615-x')).toBe('030640615X');
		expect(cleanIsbn('978 0261102217')).toBe('9780261102217');
	});
});

describe('countActiveFilters', () => {
	it('não conta o texto livre', () => {
		expect(countActiveFilters(filters({ term: 'tolkien' }))).toBe(0);
	});

	it('conta cada filtro avançado ativo', () => {
		expect(countActiveFilters(filters({ author: 'tolkien', lang: 'pt' }))).toBe(2);
		expect(
			countActiveFilters(filters({ title: 'a', subject: 'b', isbn: '123', availability: 'ebooks' }))
		).toBe(4);
	});

	it('conta o tipo de publicação só quando sai do padrão', () => {
		expect(countActiveFilters(filters({ printType: 'books' }))).toBe(0);
		expect(countActiveFilters(filters({ printType: 'magazines' }))).toBe(1);
	});
});

describe('hasSearch', () => {
	it('indica se há o que buscar', () => {
		expect(hasSearch(EMPTY_FILTERS)).toBe(false);
		expect(hasSearch(filters({ term: 'x' }))).toBe(true);
		expect(hasSearch(filters({ isbn: '9780261102217' }))).toBe(true);
	});
});

describe('describeFilters', () => {
	it('descreve os filtros ativos para exibir na tela', () => {
		const chips = describeFilters(filters({ author: 'Tolkien', lang: 'pt' }));

		expect(chips.map((chip) => chip.label)).toEqual([
			'Autoria: Tolkien',
			'Idioma: Português',
		]);
	});

	it('diz a que filtro cada chip pertence, para o ✕ saber o que remover', () => {
		const chips = describeFilters(filters({ author: 'Tolkien', lang: 'pt' }));

		expect(chips.map((chip) => chip.key)).toEqual(['author', 'lang']);
	});

	it('não descreve nada quando só há texto livre', () => {
		expect(describeFilters(filters({ term: 'tolkien' }))).toEqual([]);
	});
});

describe('clearFilter', () => {
	it('devolve um filtro ao padrão sem mexer nos outros', () => {
		const atual = filters({ author: 'Tolkien', lang: 'pt', title: 'hobbit' });
		const limpo = clearFilter(atual, 'author');

		expect(limpo.author).toBe('');
		expect(limpo.lang).toBe('pt');
		expect(limpo.title).toBe('hobbit');
	});

	it('preserva o texto livre: o chip é do filtro avançado, não da busca', () => {
		const limpo = clearFilter(filters({ term: 'tolkien', lang: 'pt' }), 'lang');

		expect(limpo.term).toBe('tolkien');
		expect(limpo.lang).toBe('');
	});

	it('volta o tipo de publicação para "books", que é o padrão', () => {
		expect(clearFilter(filters({ printType: 'magazines' }), 'printType').printType).toBe('books');
	});
});
