import type { FavoriteBook } from '@/types/Book';
import { makeFavorite } from '@/test/utils';
import {
	SUGGESTION_THEMES,
	deriveShortcuts,
	deriveThemes,
	getThemeOfTheDay,
} from './suggestionThemes';

const livro = (overrides: Partial<FavoriteBook>): FavoriteBook => makeFavorite(overrides);

describe('getThemeOfTheDay', () => {
	it('devolve o mesmo tema para o mesmo dia', () => {
		const manha = getThemeOfTheDay(new Date(2026, 8, 2, 8, 30));
		const noite = getThemeOfTheDay(new Date(2026, 8, 2, 23, 59));

		expect(manha).toBe(noite);
	});

	it('troca de tema no dia seguinte', () => {
		const hoje = getThemeOfTheDay(new Date(2026, 8, 2));
		const amanha = getThemeOfTheDay(new Date(2026, 8, 3));

		expect(hoje).not.toBe(amanha);
	});

	it('percorre a lista inteira e volta ao início', () => {
		const sequencia = Array.from({ length: SUGGESTION_THEMES.length + 1 }, (_, dia) =>
			getThemeOfTheDay(new Date(2026, 8, 2 + dia))
		);

		expect(new Set(sequencia.slice(0, -1)).size).toBe(SUGGESTION_THEMES.length);
		expect(sequencia.at(-1)).toBe(sequencia[0]);
	});
});

describe('getThemeOfTheDay com uma lista própria', () => {
	const proprios = [
		{ title: 'A', query: 'subject:"A"' },
		{ title: 'B', query: 'subject:"B"' },
	];

	it('roda sobre a lista recebida, não sobre a fixa', () => {
		const dia1 = getThemeOfTheDay(new Date(2026, 8, 2), proprios);
		const dia2 = getThemeOfTheDay(new Date(2026, 8, 3), proprios);

		expect([dia1, dia2].map((t) => t.title).sort()).toEqual(['A', 'B']);
	});

	it('cai na lista fixa se a recebida vier vazia', () => {
		expect(SUGGESTION_THEMES).toContain(getThemeOfTheDay(new Date(2026, 8, 2), []));
	});
});

describe('deriveThemes', () => {
	it('não opina com estante pequena demais', () => {
		expect(deriveThemes([])).toEqual([]);
		expect(deriveThemes([livro({ id: 'a' }), livro({ id: 'b' })])).toEqual([]);
	});

	it('monta temas a partir das categorias e autorias mais presentes', () => {
		const temas = deriveThemes([
			livro({ id: 'a', author: 'Machado de Assis', categories: ['Fiction'] }),
			livro({ id: 'b', author: 'Machado de Assis', categories: ['Fiction'] }),
			livro({ id: 'c', author: 'Clarice Lispector', categories: ['Poetry'] }),
		]);

		expect(temas.map((t) => t.title)).toContain('Mais em Fiction');
		expect(temas.map((t) => t.title)).toContain('Mais de Machado de Assis');
	});

	it('gera consultas com os operadores certos', () => {
		const temas = deriveThemes([
			livro({ id: 'a', author: 'Tolkien', categories: ['Fantasy'] }),
			livro({ id: 'b', author: 'Tolkien', categories: ['Fantasy'] }),
			livro({ id: 'c', author: 'Tolkien', categories: ['Fantasy'] }),
		]);

		expect(temas.map((t) => t.query)).toContain('subject:"Fantasy"');
		expect(temas.map((t) => t.query)).toContain('inauthor:"Tolkien"');
	});

	it('usa só a primeira autoria quando a API junta várias', () => {
		const temas = deriveThemes([
			livro({ id: 'a', author: 'Ana Silva, Beto Souza' }),
			livro({ id: 'b', author: 'Ana Silva, Beto Souza' }),
			livro({ id: 'c', author: 'Ana Silva, Beto Souza' }),
		]);

		expect(temas.map((t) => t.query)).toContain('inauthor:"Ana Silva"');
		expect(temas.every((t) => !t.query.includes('Beto Souza'))).toBe(true);
	});

	it('descarta a autoria desconhecida marcada pelo adaptador', () => {
		const temas = deriveThemes([
			livro({ id: 'a', author: 'Unknown', categories: ['Fiction'] }),
			livro({ id: 'b', author: 'Unknown', categories: ['Fiction'] }),
			livro({ id: 'c', author: 'Unknown', categories: ['Fiction'] }),
		]);

		expect(temas.every((t) => !t.title.includes('Unknown'))).toBe(true);
		expect(temas.map((t) => t.title)).toContain('Mais em Fiction');
	});

	it('herda o idioma que mais aparece na estante', () => {
		const temas = deriveThemes([
			livro({ id: 'a', language: 'pt', categories: ['Fiction'] }),
			livro({ id: 'b', language: 'pt', categories: ['Fiction'] }),
			livro({ id: 'c', language: 'en', categories: ['Fiction'] }),
		]);

		expect(temas[0].lang).toBe('pt');
	});

	it('intercala categorias e autorias, para a rotação variar de tipo', () => {
		const temas = deriveThemes([
			livro({ id: 'a', author: 'A', categories: ['X'] }),
			livro({ id: 'b', author: 'B', categories: ['Y'] }),
			livro({ id: 'c', author: 'C', categories: ['Z'] }),
		]);

		expect(temas[0].query.startsWith('subject:')).toBe(true);
		expect(temas[1].query.startsWith('inauthor:')).toBe(true);
	});
});

describe('deriveShortcuts', () => {
	it('não sugere nada com estante pequena demais', () => {
		expect(deriveShortcuts([livro({ id: 'a' })])).toEqual([]);
	});

	it('devolve texto puro, sem operador de busca', () => {
		const atalhos = deriveShortcuts([
			livro({ id: 'a', author: 'Tolkien', categories: ['Fantasy'] }),
			livro({ id: 'b', author: 'Tolkien', categories: ['Fantasy'] }),
			livro({ id: 'c', author: 'Tolkien', categories: ['Fantasy'] }),
		]);

		expect(atalhos).toContain('Tolkien');
		expect(atalhos).toContain('Fantasy');
		expect(atalhos.every((a) => !a.includes(':'))).toBe(true);
	});

	it('respeita o limite pedido', () => {
		const estante = Array.from({ length: 10 }, (_, i) =>
			livro({ id: `l${i}`, author: `Autor ${i}`, categories: [`Cat ${i}`] })
		);

		expect(deriveShortcuts(estante, 4)).toHaveLength(4);
	});
});
