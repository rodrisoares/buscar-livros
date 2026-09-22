import { PAGE_SIZE } from '@/lib/pagination';
import { buildSearchUrl, searchBooks } from './googleBooksApi';

describe('buildSearchUrl', () => {
	it('traduz página em startIndex', () => {
		expect(buildSearchUrl('tolkien', { page: 1 })).toContain('startIndex=0');
		expect(buildSearchUrl('tolkien', { page: 3 })).toContain(`startIndex=${PAGE_SIZE * 2}`);
	});

	it('envia a ordenação escolhida', () => {
		expect(buildSearchUrl('tolkien', { sort: 'newest' })).toContain('orderBy=newest');
		expect(buildSearchUrl('tolkien')).toContain('orderBy=relevance');
	});

	it('codifica o termo buscado', () => {
		expect(buildSearchUrl('harry potter & cia')).toContain('q=harry+potter+%26+cia');
	});

	it('restringe o idioma só quando pedido', () => {
		expect(buildSearchUrl('tolkien', { lang: 'pt' })).toContain('langRestrict=pt');
		expect(buildSearchUrl('tolkien')).not.toContain('langRestrict');
	});

	it('aplica o filtro de disponibilidade só quando pedido', () => {
		expect(buildSearchUrl('tolkien', { availability: 'free-ebooks' })).toContain(
			'filter=free-ebooks'
		);
		expect(buildSearchUrl('tolkien')).not.toContain('filter=');
	});

	it('usa o tipo de publicação escolhido', () => {
		expect(buildSearchUrl('tolkien', { printType: 'magazines' })).toContain('printType=magazines');
		expect(buildSearchUrl('tolkien')).toContain('printType=books');
	});

	it('permite pedir menos resultados, para as sugestões relacionadas', () => {
		expect(buildSearchUrl('tolkien', { maxResults: 12 })).toContain('maxResults=12');
	});
});

describe('chave da API', () => {
	// O módulo lê import.meta.env na importação, então cada caso reimporta.
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
		vi.resetModules();
	});

	it('não envia key quando a variável está vazia', async () => {
		vi.stubEnv('VITE_GOOGLE_BOOKS_API_KEY', '');
		vi.resetModules();

		const { buildSearchUrl } = await import('./googleBooksApi');
		expect(buildSearchUrl('tolkien')).not.toContain('key=');
	});

	it('envia a chave na busca quando configurada', async () => {
		vi.stubEnv('VITE_GOOGLE_BOOKS_API_KEY', 'chave-de-teste');
		vi.resetModules();

		const { buildSearchUrl } = await import('./googleBooksApi');
		expect(buildSearchUrl('tolkien')).toContain('key=chave-de-teste');
	});

	it('envia a chave também na consulta de um volume', async () => {
		vi.stubEnv('VITE_GOOGLE_BOOKS_API_KEY', 'chave-de-teste');
		vi.resetModules();

		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ id: 'abc', volumeInfo: { title: 'Livro' } }),
		});
		vi.stubGlobal('fetch', fetchMock);

		const { getBookById } = await import('./googleBooksApi');
		await getBookById('abc');

		expect(String(fetchMock.mock.calls[0][0])).toContain('key=chave-de-teste');
	});
});

describe('searchBooks', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('não chama a API para busca vazia', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		await expect(searchBooks('   ')).resolves.toEqual({ books: [], totalItems: 0 });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('sobrevive à resposta sem "items", que a API devolve quando nada é encontrado', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({ kind: 'books#volumes', totalItems: 0 }),
			})
		);

		await expect(searchBooks('asdkjhasd')).resolves.toEqual({ books: [], totalItems: 0 });
	});

	it('devolve os livros já normalizados e o total', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({
					kind: 'books#volumes',
					totalItems: 1234,
					items: [{ id: 'a', volumeInfo: { title: 'Livro A' } }],
				}),
			})
		);

		const result = await searchBooks('tolkien');

		expect(result.totalItems).toBe(1234);
		expect(result.books).toHaveLength(1);
		expect(result.books[0]).toMatchObject({ id: 'a', title: 'Livro A' });
	});
});
