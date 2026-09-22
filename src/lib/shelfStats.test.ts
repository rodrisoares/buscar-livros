import type { FavoriteBook } from '@/types/Book';
import type { ShelfStatus } from '@/types/Shelf';
import { getReadingProgress, getShelfStats } from './shelfStats';

const book = (overrides: Partial<FavoriteBook> = {}): FavoriteBook =>
	({
		id: 'x',
		recordId: 'r',
		title: 'Livro',
		author: 'Autor',
		categories: [],
		tags: [],
		pageCount: 100,
		currentPage: 0,
		rating: 0,
		notes: '',
		status: 'want_to_read' as ShelfStatus,
		addedAt: 0,
		startedAt: 0,
		finishedAt: 0,
		...overrides,
	}) as FavoriteBook;

describe('getShelfStats', () => {
	it('conta os livros de cada estante', () => {
		const stats = getShelfStats([
			book({ status: 'want_to_read' }),
			book({ status: 'reading' }),
			book({ status: 'read' }),
			book({ status: 'read' }),
		]);

		expect(stats.total).toBe(4);
		expect(stats.byStatus).toEqual({ want_to_read: 1, reading: 1, read: 2 });
	});

	it('conta o livro concluído inteiro e o em leitura pela página atual', () => {
		const stats = getShelfStats([
			book({ status: 'read', pageCount: 300 }),
			book({ status: 'reading', pageCount: 200, currentPage: 50 }),
			// Quero ler não soma nada em páginas lidas.
			book({ status: 'want_to_read', pageCount: 400 }),
		]);

		expect(stats.pagesRead).toBe(350);
		expect(stats.pagesTotal).toBe(900);
	});

	it('não deixa a página atual passar do total do livro', () => {
		const stats = getShelfStats([book({ status: 'reading', pageCount: 100, currentPage: 500 })]);
		expect(stats.pagesRead).toBe(100);
	});

	it('calcula a média só entre os livros com nota', () => {
		const stats = getShelfStats([book({ rating: 5 }), book({ rating: 3 }), book({ rating: 0 })]);

		expect(stats.ratedCount).toBe(2);
		expect(stats.averageRating).toBe(4);
	});

	it('devolve média zero quando nada foi avaliado', () => {
		expect(getShelfStats([book()]).averageRating).toBe(0);
	});

	it('conta apenas as conclusões do ano consultado', () => {
		const stats = getShelfStats(
			[
				book({ status: 'read', finishedAt: new Date('2026-03-01').getTime() }),
				book({ status: 'read', finishedAt: new Date('2025-12-31').getTime() }),
				book({ status: 'read', finishedAt: 0 }),
			],
			2026
		);

		expect(stats.finishedThisYear).toBe(1);
	});

	it('ranqueia autores por frequência e desempata em ordem alfabética', () => {
		const stats = getShelfStats([
			book({ author: 'Tolkien' }),
			book({ author: 'Tolkien' }),
			book({ author: 'Zulmira' }),
			book({ author: 'Ana' }),
		]);

		expect(stats.topAuthors[0]).toEqual({ label: 'Tolkien', count: 2 });
		expect(stats.topAuthors.slice(1).map((item) => item.label)).toEqual(['Ana', 'Zulmira']);
	});

	it('agrega categorias e tags de todos os livros', () => {
		const stats = getShelfStats([
			book({ categories: ['Ficção', 'Fantasia'], tags: ['favorito'] }),
			book({ categories: ['Ficção'], tags: ['favorito', 'releitura'] }),
		]);

		expect(stats.topCategories[0]).toEqual({ label: 'Ficção', count: 2 });
		expect(stats.topTags[0]).toEqual({ label: 'favorito', count: 2 });
	});

	it('lida com estante vazia', () => {
		const stats = getShelfStats([]);

		expect(stats.total).toBe(0);
		expect(stats.pagesRead).toBe(0);
		expect(stats.topAuthors).toEqual([]);
	});
});

describe('getReadingProgress', () => {
	it('livro concluído é sempre 100%', () => {
		expect(getReadingProgress(book({ status: 'read', pageCount: 0 }))).toBe(100);
	});

	it('calcula o percentual pela página atual', () => {
		expect(getReadingProgress(book({ status: 'reading', pageCount: 200, currentPage: 50 }))).toBe(25);
	});

	it('devolve 0 sem progresso ou sem total de páginas', () => {
		expect(getReadingProgress(book({ status: 'reading', pageCount: 200 }))).toBe(0);
		expect(getReadingProgress(book({ status: 'reading', pageCount: 0, currentPage: 10 }))).toBe(0);
	});
});

describe('categorias no painel', () => {
	it('soma caminhos diferentes que terminam na mesma categoria', () => {
		const stats = getShelfStats([
			book({ id: 'a', categories: ['Fiction / Science Fiction / General'] }),
			book({ id: 'b', categories: ['Juvenile Fiction / Science Fiction'] }),
			book({ id: 'c', categories: ['Fiction / Fantasy / Epic'] }),
		]);

		expect(stats.topCategories).toEqual([
			{ label: 'Science Fiction', count: 2 },
			{ label: 'Epic', count: 1 },
		]);
	});

	it('um livro conta uma vez, mesmo carregando dois caminhos iguais', () => {
		const stats = getShelfStats([
			book({
				id: 'a',
				categories: ['Fiction / Science Fiction / General', 'Juvenile Fiction / Science Fiction'],
			}),
		]);

		expect(stats.topCategories).toEqual([{ label: 'Science Fiction', count: 1 }]);
	});

	it('categoria simples continua como está', () => {
		const stats = getShelfStats([book({ id: 'a', categories: ['Computers'] })]);

		expect(stats.topCategories).toEqual([{ label: 'Computers', count: 1 }]);
	});
});
