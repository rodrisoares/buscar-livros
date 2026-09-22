import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Book, ShelfPatch } from '@/types/Book';
import * as favoritesApi from '@/services/favoritesApi';
import * as shelvesApi from '@/services/shelvesApi';
import * as collectionsApi from '@/services/collectionsApi';
import ShelfPanel from './ShelfPanel';
import { makeBook, makeFavorite, renderWithProviders } from '@/test/utils';

vi.mock('@/services/favoritesApi');
vi.mock('@/services/shelvesApi');
vi.mock('@/services/collectionsApi');

const mocked = vi.mocked(favoritesApi);

beforeEach(() => {
	vi.clearAllMocks();
	mocked.getFavorites.mockResolvedValue([]);
	mocked.updateFavorite.mockImplementation(async (recordId: string, patch: ShelfPatch) =>
		makeFavorite({ recordId, ...patch })
	);
	vi.mocked(shelvesApi).getShelves.mockResolvedValue([]);
	vi.mocked(collectionsApi).getCollections.mockResolvedValue([]);
});

const book: Book = makeBook({ id: 'livro-1' });

const comNotas = makeFavorite({
	id: 'livro-1',
	recordId: 'reg-1',
	status: 'reading',
	notes: 'Reler com calma o capítulo final.',
});

/**
 * O painel monta antes de a estante responder — é o que acontece ao abrir a
 * ficha direto pelo endereço. O `favorite` chega um instante depois, e é nessa
 * fresta que o campo vazio era gravado por cima do texto real.
 *
 * A estante precisa estar no cache porque é de lá que `updateShelf` tira a
 * chave do registro; a prop sozinha não basta.
 */
const renderizarDepoisDaEstante = async () => {
	mocked.getFavorites.mockResolvedValue([comNotas]);

	const view = renderWithProviders(<ShelfPanel book={book} favorite={undefined} />);
	await waitFor(() => expect(mocked.getFavorites).toHaveBeenCalled());

	view.rerender(<ShelfPanel book={book} favorite={comNotas} />);
	return view;
};

describe('salvamento automático das anotações', () => {
	it('não grava o campo vazio por cima das anotações que chegam depois', async () => {
		await renderizarDepoisDaEstante();

		await waitFor(() =>
			expect(screen.getByLabelText('Anotações')).toHaveValue(
				'Reler com calma o capítulo final.'
			)
		);

		// O debounce é de 800ms: esperamos mais do que isso para provar que a
		// gravação não acontece nem com atraso.
		await new Promise((resolve) => setTimeout(resolve, 1200));

		expect(mocked.updateFavorite).not.toHaveBeenCalled();
	});

	it('o texto que chega do servidor aparece no campo', async () => {
		await renderizarDepoisDaEstante();

		expect(await screen.findByDisplayValue('Reler com calma o capítulo final.')).toBeInTheDocument();
	});

	it('mas grava o que o usuário digita', async () => {
		const user = userEvent.setup();
		await renderizarDepoisDaEstante();

		const campo = await screen.findByLabelText('Anotações');
		await user.type(campo, ' Capitu!');

		await waitFor(
			() =>
				expect(mocked.updateFavorite).toHaveBeenCalledWith(
					'reg-1',
					expect.objectContaining({ notes: 'Reler com calma o capítulo final. Capitu!' })
				),
			{ timeout: 3000 }
		);
	});

	it('apagar de propósito continua valendo', async () => {
		const user = userEvent.setup();
		await renderizarDepoisDaEstante();

		const campo = await screen.findByLabelText('Anotações');
		await user.clear(campo);

		await waitFor(
			() => expect(mocked.updateFavorite).toHaveBeenCalledWith('reg-1', { notes: '' }),
			{ timeout: 3000 }
		);
	});

	it('não regrava o que acabou de voltar do servidor', async () => {
		const user = userEvent.setup();
		const { rerender } = await renderizarDepoisDaEstante();

		const campo = await screen.findByLabelText('Anotações');
		await user.clear(campo);
		await user.type(campo, 'nota nova');

		await waitFor(() => expect(mocked.updateFavorite).toHaveBeenCalledTimes(1), { timeout: 3000 });

		// A gravação volta pela releitura da estante: isto não pode disparar outra.
		rerender(<ShelfPanel book={book} favorite={{ ...comNotas, notes: 'nota nova' }} />);
		await new Promise((resolve) => setTimeout(resolve, 1200));

		expect(mocked.updateFavorite).toHaveBeenCalledTimes(1);
	});
});

describe('livro fora da estante', () => {
	it('mostra só o aviso, sem campos', () => {
		renderWithProviders(<ShelfPanel book={book} favorite={undefined} />);

		expect(screen.getByText(/Adicione este livro à sua estante/)).toBeInTheDocument();
		expect(screen.queryByLabelText('Anotações')).not.toBeInTheDocument();
	});
});
