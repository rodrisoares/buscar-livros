import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Book, FavoriteBook, ShelfPatch } from '@/types/Book';
import * as favoritesApi from '@/services/favoritesApi';
import BookCard from './BookCard';
import { deferred, makeBook, makeFavorite, renderWithProviders } from '@/test/utils';

vi.mock('@/services/favoritesApi');

const mocked = vi.mocked(favoritesApi);

/** Renderiza o card e espera a estante terminar de carregar. */
const renderCard = async (book: Book, favorites: FavoriteBook[] = []) => {
	mocked.getFavorites.mockResolvedValue(favorites);

	const view = renderWithProviders(<BookCard book={book} />);
	await waitFor(() => expect(mocked.getFavorites).toHaveBeenCalled());

	return view;
};

beforeEach(() => {
	vi.clearAllMocks();
	mocked.addToFavorites.mockImplementation(async (book: Book, addedAt = 1, shelf: ShelfPatch = {}) =>
		makeFavorite({ ...book, recordId: 'reg-novo', addedAt, ...shelf })
	);
	mocked.removeFromFavorites.mockResolvedValue(undefined);
});

describe('conteúdo do card', () => {
	it('mostra título, autoria e o link para a ficha', async () => {
		await renderCard(makeBook());

		expect(screen.getByRole('heading', { name: 'Dom Casmurro' })).toBeInTheDocument();
		expect(screen.getByText('por Machado de Assis')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Ver Detalhes' })).toHaveAttribute(
			'href',
			'/book/livro-1'
		);
	});

	it('junta ano, editora e páginas numa linha só', async () => {
		await renderCard(makeBook());

		expect(screen.getByText('1899 · Garnier · 256 págs.')).toBeInTheDocument();
		// As três linhas separadas de antes não devem voltar.
		expect(screen.queryByText(/Publicado em/)).not.toBeInTheDocument();
	});

	it('omite as partes que a API não informou', async () => {
		await renderCard(makeBook({ publishedDate: '', publisher: '', pageCount: 0 }));

		expect(screen.queryByText(/·/)).not.toBeInTheDocument();
	});

	it('esconde o botão de visualizar quando não há prévia', async () => {
		await renderCard(makeBook({ previewLink: '' }));

		expect(screen.queryByRole('link', { name: 'Visualizar' })).not.toBeInTheDocument();
	});
});

describe('livro já na estante', () => {
	it('mostra o selo da estante e a nota pessoal', async () => {
		await renderCard(
			makeBook(),
			[makeFavorite({ id: 'livro-1', status: 'reading', rating: 4, currentPage: 128 })]
		);

		await waitFor(() => expect(screen.getByText('Lendo')).toBeInTheDocument());
		expect(screen.getByLabelText('Sua nota: 4 de 5')).toBeInTheDocument();
	});

	it('mostra o progresso de quem está lendo', async () => {
		await renderCard(
			makeBook(),
			[makeFavorite({ id: 'livro-1', status: 'reading', pageCount: 256, currentPage: 128 })]
		);

		await waitFor(() => expect(screen.getByText('50% lido')).toBeInTheDocument());
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
	});

	it('não mostra progresso de quem só quer ler', async () => {
		await renderCard(makeBook(), [makeFavorite({ id: 'livro-1', status: 'want_to_read' })]);

		await waitFor(() => expect(screen.getByText('Quero ler')).toBeInTheDocument());
		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
	});

	it('prefere as tags do usuário às categorias da API', async () => {
		await renderCard(
			makeBook({ categories: ['Ficção'] }),
			[makeFavorite({ id: 'livro-1', tags: ['releitura'] })]
		);

		await waitFor(() => expect(screen.getByText('releitura')).toBeInTheDocument());
		expect(screen.queryByText('Ficção')).not.toBeInTheDocument();
	});
});

describe('botão de favoritar', () => {
	it('anuncia o estado com aria-pressed', async () => {
		await renderCard(makeBook());

		const botao = screen.getByRole('button', { name: 'Adicionar Dom Casmurro à estante' });
		expect(botao).toHaveAttribute('aria-pressed', 'false');
	});

	it('adiciona à estante no clique', async () => {
		const user = userEvent.setup();
		await renderCard(makeBook());

		await user.click(screen.getByRole('button', { name: 'Adicionar Dom Casmurro à estante' }));

		await waitFor(() => expect(mocked.addToFavorites).toHaveBeenCalledTimes(1));
		expect(mocked.addToFavorites.mock.calls[0][0].id).toBe('livro-1');
	});

	it('remove quando o livro já está guardado', async () => {
		const user = userEvent.setup();
		await renderCard(makeBook(), [makeFavorite({ id: 'livro-1', recordId: 'reg-5' })]);

		const botao = await screen.findByRole('button', {
			name: 'Remover Dom Casmurro da estante',
		});
		await user.click(botao);

		await waitFor(() => expect(mocked.removeFromFavorites).toHaveBeenCalledWith('reg-5'));
	});

	it('não segue o link do card ao clicar no coração', async () => {
		const user = userEvent.setup();
		await renderCard(makeBook());

		await user.click(screen.getByRole('button', { name: 'Adicionar Dom Casmurro à estante' }));

		// O card inteiro é clicável; sem o stopPropagation o clique navegaria.
		await waitFor(() => expect(mocked.addToFavorites).toHaveBeenCalled());
		expect(screen.getByRole('heading', { name: 'Dom Casmurro' })).toBeInTheDocument();
	});

	it('fica ocupado só enquanto a escrita deste livro está em voo', async () => {
		const user = userEvent.setup();
		const emVoo = deferred<FavoriteBook>();
		mocked.addToFavorites.mockReturnValue(emVoo.promise);

		await renderCard(makeBook());
		const botao = screen.getByRole('button', { name: 'Adicionar Dom Casmurro à estante' });

		await user.click(botao);

		await waitFor(() => expect(botao).toHaveAttribute('aria-busy', 'true'));
		expect(botao).toBeDisabled();

		mocked.getFavorites.mockResolvedValue([makeFavorite({ id: 'livro-1' })]);
		emVoo.resolve(makeFavorite({ id: 'livro-1' }));

		await waitFor(() => expect(botao).toHaveAttribute('aria-busy', 'false'));
	});
});
