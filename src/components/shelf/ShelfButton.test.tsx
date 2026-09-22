import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Book, FavoriteBook, ShelfPatch } from '@/types/Book';
import * as favoritesApi from '@/services/favoritesApi';
import ShelfButton from './ShelfButton';
import { deferred, makeBook, makeFavorite, renderWithProviders } from '@/test/utils';

vi.mock('@/services/favoritesApi');

const mocked = vi.mocked(favoritesApi);

/** Monta o botão já com a estante carregada. */
const renderButton = async (book: Book, favorites: FavoriteBook[] = []) => {
	mocked.getFavorites.mockResolvedValue(favorites);

	const view = renderWithProviders(<ShelfButton book={book} />);
	await waitFor(() => expect(mocked.getFavorites).toHaveBeenCalled());

	return view;
};

beforeEach(() => {
	vi.clearAllMocks();
	mocked.addToFavorites.mockImplementation(async (book: Book, addedAt = 1, shelf: ShelfPatch = {}) =>
		makeFavorite({ ...book, recordId: 'reg-novo', addedAt, ...shelf })
	);
	mocked.removeFromFavorites.mockResolvedValue(undefined);
	mocked.updateFavorite.mockImplementation(async (recordId: string, patch: ShelfPatch) =>
		makeFavorite({ recordId, ...patch })
	);
});

describe('livro fora da estante', () => {
	it('oferece a ação principal e a seta de escolha', async () => {
		await renderButton(makeBook());

		expect(screen.getByRole('button', { name: 'Adicionar à estante' })).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Escolher a estante de Dom Casmurro' })
		).toBeInTheDocument();
	});

	it('o clique principal guarda em "Quero ler"', async () => {
		const user = userEvent.setup();
		await renderButton(makeBook());

		await user.click(screen.getByRole('button', { name: 'Adicionar à estante' }));

		await waitFor(() => expect(mocked.addToFavorites).toHaveBeenCalledTimes(1));
		const [livro, , shelf] = mocked.addToFavorites.mock.calls[0];
		expect(livro.id).toBe('livro-1');
		expect(shelf?.status).toBe('want_to_read');
	});

	it('a seta abre as três estantes, sem opção de remover', async () => {
		const user = userEvent.setup();
		await renderButton(makeBook());

		await user.click(screen.getByRole('button', { name: 'Escolher a estante de Dom Casmurro' }));

		expect(screen.getByRole('menuitemradio', { name: 'Quero ler' })).toBeInTheDocument();
		expect(screen.getByRole('menuitemradio', { name: 'Lendo' })).toBeInTheDocument();
		expect(screen.getByRole('menuitemradio', { name: 'Lido' })).toBeInTheDocument();
		// Não dá para remover o que ainda não foi guardado.
		expect(screen.queryByRole('menuitem', { name: /Remover/ })).not.toBeInTheDocument();
	});

	it('escolher "Lido" pelo menu já entra com as datas de leitura', async () => {
		const user = userEvent.setup();
		await renderButton(makeBook({ pageCount: 300 }));

		await user.click(screen.getByRole('button', { name: 'Escolher a estante de Dom Casmurro' }));
		await user.click(screen.getByRole('menuitemradio', { name: 'Lido' }));

		await waitFor(() => expect(mocked.addToFavorites).toHaveBeenCalledTimes(1));
		const [, , shelf] = mocked.addToFavorites.mock.calls[0];
		expect(shelf?.status).toBe('read');
		expect(shelf?.finishedAt).toBeGreaterThan(0);
		expect(shelf?.currentPage).toBe(300);
	});

	it('o menu fecha depois da escolha', async () => {
		const user = userEvent.setup();
		await renderButton(makeBook());

		await user.click(screen.getByRole('button', { name: 'Escolher a estante de Dom Casmurro' }));
		await user.click(screen.getByRole('menuitemradio', { name: 'Lendo' }));

		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
	});
});

describe('livro já na estante', () => {
	const guardado = (overrides = {}) =>
		[makeFavorite({ id: 'livro-1', recordId: 'reg-5', status: 'reading', ...overrides })];

	it('mostra em qual estante o livro está', async () => {
		await renderButton(makeBook(), guardado());

		await waitFor(() =>
			expect(
				screen.getByRole('button', { name: 'Estante de Dom Casmurro: Lendo. Alterar' })
			).toBeInTheDocument()
		);
		// A ação de adicionar não sobra na tela depois de guardado.
		expect(screen.queryByRole('button', { name: 'Adicionar à estante' })).not.toBeInTheDocument();
	});

	it('marca a estante atual no menu', async () => {
		const user = userEvent.setup();
		await renderButton(makeBook(), guardado());

		await user.click(
			await screen.findByRole('button', { name: 'Estante de Dom Casmurro: Lendo. Alterar' })
		);

		expect(screen.getByRole('menuitemradio', { name: /Lendo/ })).toHaveAttribute(
			'aria-checked',
			'true'
		);
		expect(screen.getByRole('menuitemradio', { name: /Quero ler/ })).toHaveAttribute(
			'aria-checked',
			'false'
		);
	});

	it('move de estante pelo menu', async () => {
		const user = userEvent.setup();
		await renderButton(makeBook(), guardado());

		await user.click(
			await screen.findByRole('button', { name: 'Estante de Dom Casmurro: Lendo. Alterar' })
		);
		await user.click(screen.getByRole('menuitemradio', { name: /Lido/ }));

		await waitFor(() =>
			expect(mocked.updateFavorite).toHaveBeenCalledWith(
				'reg-5',
				expect.objectContaining({ status: 'read' })
			)
		);
	});

	it('não escreve nada ao reescolher a estante em que já está', async () => {
		const user = userEvent.setup();
		await renderButton(makeBook(), guardado());

		await user.click(
			await screen.findByRole('button', { name: 'Estante de Dom Casmurro: Lendo. Alterar' })
		);
		await user.click(screen.getByRole('menuitemradio', { name: /Lendo/ }));

		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
		expect(mocked.updateFavorite).not.toHaveBeenCalled();
	});

	it('remove pelo menu', async () => {
		const user = userEvent.setup();
		await renderButton(makeBook(), guardado());

		await user.click(
			await screen.findByRole('button', { name: 'Estante de Dom Casmurro: Lendo. Alterar' })
		);
		await user.click(screen.getByRole('menuitem', { name: 'Remover da estante' }));

		await waitFor(() => expect(mocked.removeFromFavorites).toHaveBeenCalledWith('reg-5'));
	});
});

describe('enquanto a escrita está em voo', () => {
	it('tranca o botão e anuncia o estado', async () => {
		const user = userEvent.setup();
		const emVoo = deferred<FavoriteBook>();
		mocked.addToFavorites.mockReturnValue(emVoo.promise);

		await renderButton(makeBook());

		await user.click(screen.getByRole('button', { name: 'Adicionar à estante' }));

		// A inclusão otimista já troca o botão dividido pelo de estante, então o
		// elemento não é mais o mesmo. O que precisa valer é que o controle da
		// estante está travado e diz por quê — nas duas formas do componente.
		await waitFor(() => {
			const ocupado = document.querySelector('button[aria-busy="true"]');
			expect(ocupado).not.toBeNull();
			expect(ocupado).toBeDisabled();
		});

		mocked.getFavorites.mockResolvedValue([makeFavorite({ id: 'livro-1' })]);
		emVoo.resolve(makeFavorite({ id: 'livro-1' }));

		await waitFor(() => expect(mocked.getFavorites).toHaveBeenCalledTimes(2));
	});
});
