import type { Book } from '@/types/Book';
import { addToFavorites, removeFromFavorites } from './favoritesApi';

const book = {
	id: 'LEnHs53G0j0C',
	title: 'Harry Potter Places',
	author: 'C. D Miller',
	categories: [],
} as unknown as Book;

describe('addToFavorites', () => {
	afterEach(() => vi.unstubAllGlobals());

	const stubPost = () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 201,
			json: async () => ({ id: 'gerado-pelo-servidor', bookId: book.id, title: book.title }),
		});
		vi.stubGlobal('fetch', fetchMock);
		return fetchMock;
	};

	it('envia o id do volume em bookId, porque o json-server descarta o id enviado', async () => {
		const fetchMock = stubPost();
		await addToFavorites(book);

		const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
		expect(body.bookId).toBe('LEnHs53G0j0C');
		expect(body.id).toBeUndefined();
	});

	it('grava a data de inclusão', async () => {
		const fetchMock = stubPost();
		await addToFavorites(book, 1700000000000);

		const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
		expect(body.addedAt).toBe(1700000000000);
	});

	it('devolve o favorito com a chave do registro e o id do volume separados', async () => {
		stubPost();
		const saved = await addToFavorites(book);

		expect(saved.recordId).toBe('gerado-pelo-servidor');
		expect(saved.id).toBe('LEnHs53G0j0C');
	});
});

describe('removeFromFavorites', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('deleta pela chave do registro, não pelo id do volume', async () => {
		const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
		vi.stubGlobal('fetch', fetchMock);

		await removeFromFavorites('gerado-pelo-servidor');

		expect(fetchMock.mock.calls[0][0]).toContain('/favorites/gerado-pelo-servidor');
		expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe('DELETE');
	});
});
