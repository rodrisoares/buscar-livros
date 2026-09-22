import { favoritesAdapter, type RawFavorite } from './FavoritesAdapter';

describe('FavoritesAdapter', () => {
	it('separa a chave do registro do id do volume', () => {
		const book = favoritesAdapter.transform({
			id: 'IqNU5qRRbL4',
			bookId: 'LEnHs53G0j0C',
			title: 'Livro',
			addedAt: 1700000000000,
		});

		// `id` é o que a interface usa nos links e na checagem de favorito.
		expect(book.id).toBe('LEnHs53G0j0C');
		// `recordId` é o que a API de favoritos precisa para deletar.
		expect(book.recordId).toBe('IqNU5qRRbL4');
	});

	it('mantém compatibilidade com registros antigos, sem bookId', () => {
		const legacy = favoritesAdapter.transform({ id: 'LEnHs53G0j0C', title: 'Antigo' });

		expect(legacy.id).toBe('LEnHs53G0j0C');
		expect(legacy.recordId).toBe('LEnHs53G0j0C');
	});

	it('aceita id numérico gerado pelo servidor', () => {
		expect(favoritesAdapter.transform({ id: 7, bookId: 'abc' } as RawFavorite).recordId).toBe('7');
	});

	it('preserva o addedAt gravado no servidor', () => {
		expect(favoritesAdapter.transform({ id: 'a', addedAt: 1700000000000 }).addedAt).toBe(
			1700000000000
		);
	});

	it('usa 0 para registros salvos antes do campo existir', () => {
		expect(favoritesAdapter.transform({ id: 'x', title: 'Antigo' }).addedAt).toBe(0);
	});

	it('normaliza campos ausentes em vez de propagar undefined', () => {
		const book = favoritesAdapter.transform({ id: 'x', title: 'T' });

		expect(book.categories).toEqual([]);
		expect(book.pageCount).toBe(0);
		expect(book.thumbnail).toBe('');
		expect(book.epubAvailable).toBe(false);
	});
});
