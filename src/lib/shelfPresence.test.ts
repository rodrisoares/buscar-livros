import {
	filterByShelfPresence,
	parseShelfPresence,
	shelfPresenceToParam,
} from './shelfPresence';

const livros = [{ id: 'na-estante' }, { id: 'fora' }, { id: 'tambem-fora' }];
const naEstante = (id: string) => id === 'na-estante';

describe('parseShelfPresence', () => {
	it('lê os slugs legíveis da URL', () => {
		expect(parseShelfPresence('minha')).toBe('mine');
		expect(parseShelfPresence('fora')).toBe('others');
	});

	it('cai em "todos" no que não reconhece', () => {
		expect(parseShelfPresence(null)).toBe('');
		expect(parseShelfPresence('')).toBe('');
		expect(parseShelfPresence('inventado')).toBe('');
	});

	it('faz a ida e volta pelo slug', () => {
		expect(parseShelfPresence(shelfPresenceToParam('mine') ?? null)).toBe('mine');
		// O padrão não vai para a URL, para não sujar o endereço.
		expect(shelfPresenceToParam('')).toBeUndefined();
	});
});

describe('filterByShelfPresence', () => {
	it('mostra só o que já está guardado', () => {
		const result = filterByShelfPresence(livros, naEstante, 'mine');

		expect(result.map((livro) => livro.id)).toEqual(['na-estante']);
	});

	it('mostra só o que ainda falta guardar', () => {
		const result = filterByShelfPresence(livros, naEstante, 'others');

		expect(result.map((livro) => livro.id)).toEqual(['fora', 'tambem-fora']);
	});

	it('sem recorte, devolve a lista inteira', () => {
		expect(filterByShelfPresence(livros, naEstante, '')).toEqual(livros);
	});
});
