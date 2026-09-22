import type { FavoriteBook } from '@/types/Book';
import {
	EMPTY_SHELF_FILTERS,
	collectShelfTags,
	countByCustomShelf,
	countByShelfTab,
	countShelfTagMatches,
	filterAndSortShelf,
	hasActiveShelfFilters,
	parseShelfSort,
	parseShelfTab,
	parseShelfView,
	shelfTabToSlug,
} from './shelfFilters';

const book = (overrides: Partial<FavoriteBook>): FavoriteBook =>
	({
		id: 'x',
		recordId: 'r',
		title: 'Título',
		author: 'Autor',
		publisher: 'Editora',
		publishedDate: '2024',
		pageCount: 200,
		categories: [],
		description: '',
		thumbnail: '',
		previewLink: '',
		infoLink: '',
		isbn13: '',
		isbn10: '',
		language: 'pt',
		averageRating: 0,
		ratingsCount: 0,
		maturityRating: '',
		viewability: '',
		epubAvailable: false,
		pdfAvailable: false,
		saleability: '',
		price: '',
		buyLink: '',
		webReaderLink: '',
		addedAt: 0,
		status: 'want_to_read',
		currentPage: 0,
		rating: 0,
		notes: '',
		tags: [],
		startedAt: 0,
		finishedAt: 0,
		...overrides,
	}) as FavoriteBook;

describe('parseShelfTab', () => {
	it('lê o slug legível da URL', () => {
		expect(parseShelfTab('lendo')).toBe('reading');
		expect(parseShelfTab('quero-ler')).toBe('want_to_read');
		expect(parseShelfTab('lido')).toBe('read');
	});

	it('aceita o valor interno, para links antigos não quebrarem', () => {
		expect(parseShelfTab('want_to_read')).toBe('want_to_read');
	});

	it('cai em "todos" no que não reconhece', () => {
		expect(parseShelfTab(null)).toBe('all');
		expect(parseShelfTab('')).toBe('all');
		expect(parseShelfTab('inventado')).toBe('all');
	});

	it('faz a ida e volta pelo slug', () => {
		expect(parseShelfTab(shelfTabToSlug('reading'))).toBe('reading');
		expect(shelfTabToSlug('all')).toBe('');
	});
});

describe('parseShelfSort', () => {
	it('aceita as ordenações conhecidas', () => {
		expect(parseShelfSort('rating')).toBe('rating');
		expect(parseShelfSort('progress')).toBe('progress');
	});

	it('cai no padrão no que não reconhece', () => {
		expect(parseShelfSort(null)).toBe(EMPTY_SHELF_FILTERS.sort);
		expect(parseShelfSort('inventado')).toBe(EMPTY_SHELF_FILTERS.sort);
	});
});

describe('parseShelfView', () => {
	it('reconhece a lista', () => {
		expect(parseShelfView('lista')).toBe('list');
	});

	it('cai na grade no resto', () => {
		expect(parseShelfView(null)).toBe('grid');
		expect(parseShelfView('grade')).toBe('grid');
		expect(parseShelfView('inventado')).toBe('grid');
	});
});

describe('hasActiveShelfFilters', () => {
	it('ignora a ordenação: ela não estreita a lista', () => {
		expect(hasActiveShelfFilters({ ...EMPTY_SHELF_FILTERS, sort: 'title' })).toBe(false);
	});

	it('ignora a visão: grade ou lista mostram os mesmos livros', () => {
		expect(hasActiveShelfFilters({ ...EMPTY_SHELF_FILTERS, view: 'list' })).toBe(false);
	});

	it('reconhece aba, texto e tag', () => {
		expect(hasActiveShelfFilters({ ...EMPTY_SHELF_FILTERS, tab: 'read' })).toBe(true);
		expect(hasActiveShelfFilters({ ...EMPTY_SHELF_FILTERS, term: 'tolkien' })).toBe(true);
		expect(hasActiveShelfFilters({ ...EMPTY_SHELF_FILTERS, tags: ['fantasia'] })).toBe(true);
	});

	it('não conta texto que é só espaço', () => {
		expect(hasActiveShelfFilters({ ...EMPTY_SHELF_FILTERS, term: '   ' })).toBe(false);
	});
});

describe('filterAndSortShelf', () => {
	const livros = [
		book({ id: 'a', title: 'Duna', status: 'reading', tags: ['ficção'], addedAt: 3, rating: 5, currentPage: 100 }),
		book({ id: 'b', title: 'Amora', status: 'read', tags: ['poesia'], addedAt: 1, rating: 3 }),
		book({ id: 'c', title: 'Cosmos', status: 'reading', tags: [], addedAt: 2, rating: 0, currentPage: 20 }),
	];

	it('filtra pela aba', () => {
		const lendo = filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, tab: 'reading' });
		expect(lendo.map((b) => b.id)).toEqual(['a', 'c']);
	});

	it('filtra pela tag', () => {
		const result = filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, tags: ['poesia'] });
		expect(result.map((b) => b.id)).toEqual(['b']);
	});

	it('filtra por texto ignorando caixa e acento', () => {
		const result = filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, term: 'FICCAO' });
		expect(result.map((b) => b.id)).toEqual(['a']);
	});

	it('ordena por título', () => {
		const result = filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, sort: 'title' });
		expect(result.map((b) => b.title)).toEqual(['Amora', 'Cosmos', 'Duna']);
	});

	it('ordena por inclusão mais recente por padrão', () => {
		const result = filterAndSortShelf(livros, EMPTY_SHELF_FILTERS);
		expect(result.map((b) => b.id)).toEqual(['a', 'c', 'b']);
	});

	it('ordena por progresso de leitura', () => {
		const result = filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, sort: 'progress' });
		expect(result[0].id).toBe('a');
	});

	it('combina aba e texto', () => {
		const result = filterAndSortShelf(livros, {
			...EMPTY_SHELF_FILTERS,
			tab: 'reading',
			term: 'cosmos',
		});
		expect(result.map((b) => b.id)).toEqual(['c']);
	});

	it('não altera o array recebido', () => {
		const original = [...livros];
		filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, sort: 'title' });
		expect(livros).toEqual(original);
	});
});

describe('countByShelfTab', () => {
	it('conta cada estante e o total', () => {
		const counts = countByShelfTab([
			book({ status: 'reading' }),
			book({ status: 'reading' }),
			book({ status: 'read' }),
		]);

		expect(counts).toEqual({ all: 3, want_to_read: 0, reading: 2, read: 1 });
	});
});

describe('collectShelfTags', () => {
	it('junta as tags sem repetir e em ordem', () => {
		const tags = collectShelfTags([
			book({ tags: ['fantasia', 'suspense'] }),
			book({ tags: ['ação', 'fantasia'] }),
		]);

		expect(tags).toEqual(['ação', 'fantasia', 'suspense']);
	});
});

describe('filtro por tags combinadas', () => {
	const livros = [
		book({ id: 'a', title: 'Duna', tags: ['ficção', 'relidos'] }),
		book({ id: 'b', title: 'Amora', tags: ['ficção'] }),
		book({ id: 'c', title: 'Cosmos', tags: ['relidos'] }),
	];

	it('exige todas as tags escolhidas, não qualquer uma', () => {
		const result = filterAndSortShelf(livros, {
			...EMPTY_SHELF_FILTERS,
			tags: ['ficção', 'relidos'],
		});

		expect(result.map((b) => b.id)).toEqual(['a']);
	});

	it('ignora acento e caixa na comparação', () => {
		const result = filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, tags: ['FICCAO'] });

		expect(result.map((b) => b.id)).toEqual(['a', 'b']);
	});

	it('uma tag sozinha continua funcionando como antes', () => {
		const result = filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, tags: ['relidos'] });

		expect(result.map((b) => b.id)).toEqual(['a', 'c']);
	});
});

describe('filtro por nota', () => {
	const livros = [
		book({ id: 'cinco', rating: 5 }),
		book({ id: 'quatro', rating: 4 }),
		book({ id: 'dois', rating: 2 }),
		book({ id: 'sem', rating: 0 }),
	];

	it('"4 ou mais" inclui o 5 e exclui o 2', () => {
		const result = filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, rating: '4' });

		expect(result.map((b) => b.id).sort()).toEqual(['cinco', 'quatro']);
	});

	it('"só 5" não deixa passar o 4', () => {
		const result = filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, rating: '5' });

		expect(result.map((b) => b.id)).toEqual(['cinco']);
	});

	it('"ainda sem nota" é o caminho oposto: só o que tem zero', () => {
		const result = filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, rating: 'none' });

		expect(result.map((b) => b.id)).toEqual(['sem']);
	});

	it('nota vazia não filtra nada', () => {
		expect(filterAndSortShelf(livros, EMPTY_SHELF_FILTERS)).toHaveLength(4);
	});
});

describe('filtro "só com anotações"', () => {
	const livros = [
		book({ id: 'com', notes: 'Capitu traiu?' }),
		book({ id: 'vazio', notes: '' }),
		book({ id: 'espaco', notes: '   ' }),
	];

	it('deixa passar só quem tem texto de verdade', () => {
		const result = filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, hasNotes: true });

		expect(result.map((b) => b.id)).toEqual(['com']);
	});
});

describe('ordenações novas', () => {
	it('ordena pela conclusão mais recente, com quem não terminou no fim', () => {
		const livros = [
			book({ id: 'antigo', title: 'A', finishedAt: 1_000 }),
			book({ id: 'novo', title: 'B', finishedAt: 9_000 }),
			book({ id: 'lendo', title: 'C', finishedAt: 0 }),
		];

		const result = filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, sort: 'finished' });

		expect(result.map((b) => b.id)).toEqual(['novo', 'antigo', 'lendo']);
	});

	it('ordena pelo ano de publicação, aceitando as datas parciais da API', () => {
		const livros = [
			book({ id: 'a', title: 'A', publishedDate: '1899' }),
			book({ id: 'b', title: 'B', publishedDate: '2024-05-14' }),
			book({ id: 'c', title: 'C', publishedDate: '2012-06' }),
			book({ id: 'sem', title: 'D', publishedDate: '' }),
		];

		const result = filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, sort: 'published' });

		expect(result.map((b) => b.id)).toEqual(['b', 'c', 'a', 'sem']);
	});
});

describe('hasActiveShelfFilters com os filtros novos', () => {
	it('reconhece tags, nota e anotações', () => {
		expect(hasActiveShelfFilters({ ...EMPTY_SHELF_FILTERS, tags: ['x'] })).toBe(true);
		expect(hasActiveShelfFilters({ ...EMPTY_SHELF_FILTERS, rating: '4' })).toBe(true);
		expect(hasActiveShelfFilters({ ...EMPTY_SHELF_FILTERS, hasNotes: true })).toBe(true);
	});

	it('ignora a página: ela não estreita a lista', () => {
		expect(hasActiveShelfFilters({ ...EMPTY_SHELF_FILTERS, page: 4 })).toBe(false);
	});
});

describe('countShelfTagMatches', () => {
	const livros = [
		book({ id: 'a', tags: ['ficção', 'relidos'] }),
		book({ id: 'b', tags: ['ficção'] }),
		book({ id: 'c', tags: ['poesia'] }),
	];

	it('conta quanto sobraria ao somar a tag ao filtro atual', () => {
		expect(countShelfTagMatches(livros, EMPTY_SHELF_FILTERS, 'ficção')).toBe(2);
	});

	it('enxerga a combinação que zera, para a tag poder aparecer apagada', () => {
		const comFiccao = { ...EMPTY_SHELF_FILTERS, tags: ['ficção'] };

		expect(countShelfTagMatches(livros, comFiccao, 'poesia')).toBe(0);
		expect(countShelfTagMatches(livros, comFiccao, 'relidos')).toBe(1);
	});

	it('uma tag já escolhida conta a seleção atual, não o dobro dela', () => {
		const comFiccao = { ...EMPTY_SHELF_FILTERS, tags: ['ficção'] };

		expect(countShelfTagMatches(livros, comFiccao, 'ficção')).toBe(2);
	});
});

describe('estantes personalizadas', () => {
	const emprestado = {
		recordId: 'e1',
		name: 'Emprestado p/ Ana',
		icon: 'bookmark' as const,
		color: 'sky' as const,
		position: 0,
	};
	const relendo = {
		recordId: 'e2',
		name: 'Relendo',
		icon: 'bookmark' as const,
		color: 'amber' as const,
		position: 1,
	};
	const minhas = [emprestado, relendo];

	describe('parseShelfTab', () => {
		it('reconhece o nome da estante em forma de slug', () => {
			expect(parseShelfTab('emprestado-p-ana', minhas)).toBe('shelf:e1');
			expect(parseShelfTab('relendo', minhas)).toBe('shelf:e2');
		});

		it('os três status continuam tendo prioridade', () => {
			expect(parseShelfTab('lendo', minhas)).toBe('reading');
		});

		it('slug de estante apagada (ou renomeada) cai em "todos"', () => {
			expect(parseShelfTab('emprestado-p-ana', [])).toBe('all');
		});

		it('sem a lista carregada ainda, cai em "todos" em vez de quebrar', () => {
			expect(parseShelfTab('relendo')).toBe('all');
		});
	});

	describe('shelfTabToSlug', () => {
		it('devolve o nome da estante em slug', () => {
			expect(shelfTabToSlug('shelf:e1', minhas)).toBe('emprestado-p-ana');
		});

		it('faz a ida e volta', () => {
			expect(parseShelfTab(shelfTabToSlug('shelf:e2', minhas), minhas)).toBe('shelf:e2');
		});

		it('estante que não existe mais não vira parâmetro', () => {
			expect(shelfTabToSlug('shelf:sumiu', minhas)).toBe('');
		});
	});

	describe('filterAndSortShelf', () => {
		const livros = [
			book({ id: 'a', status: 'reading', shelves: ['e1'] }),
			book({ id: 'b', status: 'read', shelves: ['e1', 'e2'] }),
			book({ id: 'c', status: 'reading', shelves: [] }),
		];

		it('filtra pelo pertencimento à estante, não pelo status', () => {
			const result = filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, tab: 'shelf:e1' });

			// 'a' está lendo e 'b' já leu: as duas coisas convivem com a estante.
			expect(result.map((b) => b.id).sort()).toEqual(['a', 'b']);
		});

		it('um livro pode estar em várias estantes ao mesmo tempo', () => {
			const result = filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, tab: 'shelf:e2' });

			expect(result.map((b) => b.id)).toEqual(['b']);
		});

		it('estante vazia devolve lista vazia, não a estante inteira', () => {
			expect(filterAndSortShelf(livros, { ...EMPTY_SHELF_FILTERS, tab: 'shelf:sumiu' })).toEqual([]);
		});

		it('combina com os outros filtros', () => {
			const result = filterAndSortShelf(livros, {
				...EMPTY_SHELF_FILTERS,
				tab: 'shelf:e1',
				term: 'título',
			});

			expect(result).toHaveLength(2);
		});
	});

	describe('countByCustomShelf', () => {
		it('conta cada estante separadamente', () => {
			const counts = countByCustomShelf([
				book({ id: 'a', shelves: ['e1'] }),
				book({ id: 'b', shelves: ['e1', 'e2'] }),
				book({ id: 'c', shelves: [] }),
			]);

			expect(counts).toEqual({ e1: 2, e2: 1 });
		});

		it('estante sem livro nenhum simplesmente não aparece', () => {
			expect(countByCustomShelf([book({ id: 'a', shelves: [] })])).toEqual({});
		});
	});

	it('hasActiveShelfFilters reconhece a aba personalizada', () => {
		expect(hasActiveShelfFilters({ ...EMPTY_SHELF_FILTERS, tab: 'shelf:e1' })).toBe(true);
	});
});
