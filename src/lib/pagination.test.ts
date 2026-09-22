import {
	MAX_PAGINATED_RESULTS,
	PAGE_SIZE,
	clampLocalPage,
	clampPage,
	countPages,
	getPageRange,
	getPageWindow,
	getStartIndex,
	getTotalPages,
	parsePageSize,
	sliceForPage,
} from './pagination';

describe('getTotalPages', () => {
	it('sempre devolve ao menos uma página, mesmo sem resultados', () => {
		expect(getTotalPages(0)).toBe(1);
		expect(getTotalPages(-5)).toBe(1);
	});

	it('arredonda a última página incompleta para cima', () => {
		expect(getTotalPages(PAGE_SIZE)).toBe(1);
		expect(getTotalPages(PAGE_SIZE + 1)).toBe(2);
	});

	it('limita a janela navegável para não oferecer páginas que a API não devolve', () => {
		expect(getTotalPages(100000)).toBe(MAX_PAGINATED_RESULTS / PAGE_SIZE);
	});
});

describe('clampPage', () => {
	it('corrige valores inválidos vindos da URL', () => {
		expect(clampPage(0, 200)).toBe(1);
		expect(clampPage(-3, 200)).toBe(1);
		expect(clampPage(Number.NaN, 200)).toBe(1);
	});

	it('não deixa passar da última página existente', () => {
		expect(clampPage(99, 60)).toBe(3);
	});
});

describe('getStartIndex', () => {
	it('converte página em índice inicial da API', () => {
		expect(getStartIndex(1)).toBe(0);
		expect(getStartIndex(2)).toBe(PAGE_SIZE);
		expect(getStartIndex(5)).toBe(PAGE_SIZE * 4);
	});
});

describe('getPageRange', () => {
	it('descreve a fatia exibida na página', () => {
		expect(getPageRange(1, 20)).toEqual({ from: 1, to: 20 });
		expect(getPageRange(3, 20)).toEqual({ from: 41, to: 60 });
	});

	it('respeita uma última página incompleta', () => {
		expect(getPageRange(2, 7)).toEqual({ from: 21, to: 27 });
	});
});

describe('getPageWindow', () => {
	it('mostra todas as páginas quando cabem na janela', () => {
		expect(getPageWindow(1, 3)).toEqual([1, 2, 3]);
	});

	it('centraliza a página atual', () => {
		expect(getPageWindow(5, 10)).toEqual([3, 4, 5, 6, 7]);
	});

	it('não ultrapassa os limites nas pontas', () => {
		expect(getPageWindow(1, 10)).toEqual([1, 2, 3, 4, 5]);
		expect(getPageWindow(10, 10)).toEqual([6, 7, 8, 9, 10]);
	});
});

describe('tamanho de página variável', () => {
	it('lê do parâmetro só os tamanhos oferecidos', () => {
		expect(parsePageSize('40')).toBe(40);
		expect(parsePageSize('10')).toBe(10);
	});

	it('cai no padrão no que não reconhece', () => {
		expect(parsePageSize(null)).toBe(PAGE_SIZE);
		expect(parsePageSize('7')).toBe(PAGE_SIZE);
		// A Google Books recusa maxResults acima de 40.
		expect(parsePageSize('100')).toBe(PAGE_SIZE);
	});

	it('o salto entre páginas acompanha o tamanho escolhido', () => {
		expect(getStartIndex(2, 40)).toBe(40);
		expect(getStartIndex(3, 10)).toBe(20);
	});

	it('a janela navegável encurta quando cabem mais por página', () => {
		expect(getTotalPages(100000, 40)).toBe(MAX_PAGINATED_RESULTS / 40);
		expect(getTotalPages(100000, 10)).toBe(MAX_PAGINATED_RESULTS / 10);
	});

	it('descreve a fatia usando o tamanho corrente', () => {
		expect(getPageRange(2, 40, 40)).toEqual({ from: 41, to: 80 });
	});
});

describe('countPages', () => {
	it('não aplica o teto da Google Books: a estante é local', () => {
		expect(countPages(100000, 24)).toBe(Math.ceil(100000 / 24));
	});

	it('sempre devolve ao menos uma página', () => {
		expect(countPages(0, 24)).toBe(1);
		expect(countPages(-3, 24)).toBe(1);
	});
});

describe('clampLocalPage', () => {
	it('corrige valores inválidos', () => {
		expect(clampLocalPage(0, 100, 24)).toBe(1);
		expect(clampLocalPage(Number.NaN, 100, 24)).toBe(1);
	});

	it('cai na última página quando a lista encolhe', () => {
		// Foi removido em lote estando na página 9: sobraram 2 páginas.
		expect(clampLocalPage(9, 30, 24)).toBe(2);
	});
});

describe('sliceForPage', () => {
	const itens = Array.from({ length: 30 }, (_, i) => i + 1);

	it('devolve a fatia da página pedida', () => {
		expect(sliceForPage(itens, 1, 24)).toHaveLength(24);
		expect(sliceForPage(itens, 2, 24)).toEqual([25, 26, 27, 28, 29, 30]);
	});

	it('uma página fora da faixa cai na última existente, em vez de vir vazia', () => {
		expect(sliceForPage(itens, 99, 24)).toEqual([25, 26, 27, 28, 29, 30]);
	});

	it('lista vazia não quebra', () => {
		expect(sliceForPage([], 3, 24)).toEqual([]);
	});
});
