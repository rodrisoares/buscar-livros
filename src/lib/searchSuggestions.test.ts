import type { Book } from '@/types/Book';
import { collectAuthorSuggestions, collectSubjectSuggestions } from './searchSuggestions';

const book = (author: string, categories: string[] = []): Book =>
	({ id: 'x', title: 't', author, categories }) as Book;

describe('collectAuthorSuggestions', () => {
	it('separa os autores que vieram unidos por vírgula', () => {
		expect(collectAuthorSuggestions([book('J. R. R. Tolkien, Christopher Tolkien')])).toEqual([
			'Christopher Tolkien',
			'J. R. R. Tolkien',
		]);
	});

	it('descarta o marcador de autoria desconhecida', () => {
		expect(collectAuthorSuggestions([book('Unknown'), book('Machado de Assis')])).toEqual([
			'Machado de Assis',
		]);
	});

	it('não repete o mesmo nome por caixa ou acento', () => {
		expect(collectAuthorSuggestions([book('Ana Gória'), book('ana goria')])).toEqual([
			'Ana Gória',
		]);
	});

	it('devolve em ordem alfabética', () => {
		expect(collectAuthorSuggestions([book('Zeca'), book('Ana'), book('Mário')])).toEqual([
			'Ana',
			'Mário',
			'Zeca',
		]);
	});

	it('respeita o limite pedido', () => {
		const livros = Array.from({ length: 30 }, (_, i) => book(`Autor ${i}`));
		expect(collectAuthorSuggestions(livros, 5)).toHaveLength(5);
	});
});

describe('collectSubjectSuggestions', () => {
	it('junta as categorias sem repetir', () => {
		const result = collectSubjectSuggestions([
			book('a', ['Fiction', 'Fantasy']),
			book('b', ['fiction', 'Poetry']),
		]);

		expect(result).toEqual(['Fantasy', 'Fiction', 'Poetry']);
	});

	it('ignora entradas vazias', () => {
		expect(collectSubjectSuggestions([book('a', ['', '  ', 'Drama'])])).toEqual(['Drama']);
	});
});
