import { act, fireEvent, renderHook, screen, waitFor } from '@testing-library/react';
import type { Book, FavoriteBook, ShelfPatch } from '@/types/Book';
import * as favoritesApi from '@/services/favoritesApi';
import { buildStatusPatch, useFavorites } from './useFavorites';
import {
	createTestQueryClient,
	createWrapper,
	deferred,
	makeBook,
	makeFavorite,
} from '@/test/utils';

vi.mock('@/services/favoritesApi');

const mocked = vi.mocked(favoritesApi);

/** Monta o hook já com a estante carregada, para os testes começarem do zero útil. */
const setup = async (favorites: FavoriteBook[] = []) => {
	mocked.getFavorites.mockResolvedValue(favorites);

	const queryClient = createTestQueryClient();
	const view = renderHook(() => useFavorites(), { wrapper: createWrapper(queryClient) });

	await waitFor(() => expect(view.result.current.isLoading).toBe(false));

	return { ...view, queryClient };
};

beforeEach(() => {
	vi.clearAllMocks();
	// O servidor recebe o que foi enviado e devolve com a chave do registro.
	mocked.addToFavorites.mockImplementation(async (book: Book, addedAt = 1, shelf: ShelfPatch = {}) =>
		makeFavorite({ ...book, recordId: 'reg-novo', addedAt, ...shelf })
	);
	mocked.removeFromFavorites.mockResolvedValue(undefined);
	mocked.updateFavorite.mockImplementation(async (recordId: string, patch: ShelfPatch) =>
		makeFavorite({ recordId, ...patch })
	);
});

describe('inclusão otimista', () => {
	it('mostra o livro na estante antes de o servidor responder', async () => {
		const emVoo = deferred<FavoriteBook>();
		mocked.addToFavorites.mockReturnValue(emVoo.promise);

		const { result } = await setup();
		const livro = makeBook({ id: 'novo' });

		act(() => result.current.addFavorite(livro));

		// A escrita otimista acontece no `onMutate`, que primeiro cancela as
		// consultas em voo — então ela cai no microtask seguinte, não na mesma
		// linha. O que importa é que chega antes da resposta do servidor, que
		// segue pendurada em `emVoo`.
		await waitFor(() => expect(result.current.isFavorite('novo')).toBe(true));
		expect(mocked.addToFavorites).toHaveBeenCalledTimes(1);

		await act(async () => {
			emVoo.resolve(makeFavorite({ id: 'novo', recordId: 'reg-novo' }));
		});
	});

	it('entra sem recordId e o refetch preenche depois', async () => {
		const emVoo = deferred<FavoriteBook>();
		mocked.addToFavorites.mockReturnValue(emVoo.promise);

		const { result } = await setup();
		act(() => result.current.addFavorite(makeBook({ id: 'novo' })));

		await waitFor(() => expect(result.current.findFavorite('novo')?.recordId).toBe(''));

		mocked.getFavorites.mockResolvedValue([makeFavorite({ id: 'novo', recordId: 'reg-9' })]);
		await act(async () => {
			emVoo.resolve(makeFavorite({ id: 'novo', recordId: 'reg-9' }));
		});

		await waitFor(() => expect(result.current.findFavorite('novo')?.recordId).toBe('reg-9'));
	});
});

describe('rollback quando o servidor recusa', () => {
	/**
	 * Toda mutação termina com um `invalidateQueries`, e esse refetch sozinho já
	 * devolveria a tela ao estado do servidor — mascarando a ausência do
	 * rollback. Deixando a releitura pendurada, a única coisa capaz de corrigir
	 * a tela é o rollback, que é o que estes testes querem provar.
	 */
	const segurarRefetch = () => {
		const pendente = deferred<FavoriteBook[]>();
		mocked.getFavorites.mockReturnValue(pendente.promise);
		return pendente;
	};

	it('tira o livro da tela na hora, sem esperar a releitura', async () => {
		mocked.addToFavorites.mockRejectedValue(new Error('500'));

		const { result } = await setup();
		const refetch = segurarRefetch();

		await act(async () => {
			result.current.addFavorite(makeBook({ id: 'novo' }));
		});

		await waitFor(() => expect(result.current.isFavorite('novo')).toBe(false));

		await act(async () => refetch.resolve([]));
	});

	/**
	 * O aviso fica num teste à parte de propósito: o React Query só marca a
	 * mutação como `error` depois de aguardar o `onSettled` — que é justamente
	 * a invalidação que o teste acima segura. Com a releitura pendurada, o
	 * `actionError` continuaria nulo mesmo com tudo funcionando.
	 */
	it('avisa o usuário depois que a ação se encerra', async () => {
		mocked.addToFavorites.mockRejectedValue(new Error('500'));

		const { result } = await setup();

		await act(async () => {
			result.current.addFavorite(makeBook({ id: 'novo' }));
		});

		await waitFor(() => expect(result.current.actionError).toBeTruthy());
	});

	it('devolve o livro removido quando a exclusão falha', async () => {
		mocked.removeFromFavorites.mockRejectedValue(new Error('500'));

		const guardado = makeFavorite({ id: 'guardado', recordId: 'reg-7', title: 'Duna' });
		const { result } = await setup([guardado]);
		const refetch = segurarRefetch();

		await act(async () => {
			result.current.removeFavorite('guardado');
		});

		await waitFor(() => expect(result.current.isFavorite('guardado')).toBe(true));
		// Volta inteiro, não como uma casca com o id.
		expect(result.current.findFavorite('guardado')?.title).toBe('Duna');

		await act(async () => refetch.resolve([guardado]));
	});

	it('restaura o valor anterior quando a atualização falha', async () => {
		mocked.updateFavorite.mockRejectedValue(new Error('500'));

		const guardado = makeFavorite({ id: 'g', recordId: 'reg-7', rating: 2 });
		const { result } = await setup([guardado]);
		const refetch = segurarRefetch();

		await act(async () => {
			result.current.updateShelf('g', { rating: 5 });
		});

		await waitFor(() => expect(result.current.findFavorite('g')?.rating).toBe(2));

		await act(async () => refetch.resolve([guardado]));
	});

	it('some com o aviso de erro assim que a ação seguinte dá certo', async () => {
		mocked.addToFavorites.mockRejectedValueOnce(new Error('500'));

		const { result } = await setup();
		await act(async () => {
			result.current.addFavorite(makeBook({ id: 'a' }));
		});
		await waitFor(() => expect(result.current.actionError).toBeTruthy());

		await act(async () => {
			result.current.addFavorite(makeBook({ id: 'b' }));
		});
		await waitFor(() => expect(result.current.actionError).toBeNull());
	});
});

describe('desfazer a remoção', () => {
	it('devolve o livro com progresso, nota, anotações e tags intactos', async () => {
		const lido = makeFavorite({
			id: 'lido',
			recordId: 'reg-3',
			status: 'read',
			currentPage: 256,
			progressLog: [{ page: 120, at: 1_700_100_000_000 }, { page: 256, at: 1_700_400_000_000 }],
			rating: 5,
			notes: 'Capitu tinha olhos de ressaca.',
			tags: ['clássico', 'releitura'],
			shelves: ['estante-emprestado'],
			startedAt: 1_700_000_000_000,
			finishedAt: 1_700_500_000_000,
			addedAt: 1_699_000_000_000,
		});

		const { result } = await setup([lido]);

		// A remoção termina com um refetch; daqui em diante o servidor não tem
		// mais o livro, como aconteceria de verdade.
		mocked.getFavorites.mockResolvedValue([]);

		await act(async () => {
			result.current.removeFavorite('lido');
		});
		await waitFor(() => expect(result.current.isFavorite('lido')).toBe(false));

		const desfazer = mocked.addToFavorites;
		expect(desfazer).not.toHaveBeenCalled();

		// O "Desfazer" é o botão de ação do toast — clicar nele é o gesto real.
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }));
		});

		await waitFor(() => expect(desfazer).toHaveBeenCalledTimes(1));

		const [livro, addedAt, shelf] = desfazer.mock.calls[0];
		expect(livro.id).toBe('lido');
		// A data de inclusão original volta, senão o livro pularia para o topo.
		expect(addedAt).toBe(1_699_000_000_000);
		expect(shelf).toEqual({
			status: 'read',
			currentPage: 256,
			progressLog: [{ page: 120, at: 1_700_100_000_000 }, { page: 256, at: 1_700_400_000_000 }],
			rating: 5,
			notes: 'Capitu tinha olhos de ressaca.',
			tags: ['clássico', 'releitura'],
			shelves: ['estante-emprestado'],
			startedAt: 1_700_000_000_000,
			finishedAt: 1_700_500_000_000,
		});
	});
});

describe('estado de "salvando" por livro', () => {
	it('marca só o livro mexido, não a estante inteira', async () => {
		const emVoo = deferred<void>();
		mocked.removeFromFavorites.mockReturnValue(emVoo.promise);

		const { result } = await setup([
			makeFavorite({ id: 'a', recordId: 'reg-a' }),
			makeFavorite({ id: 'b', recordId: 'reg-b' }),
		]);

		act(() => result.current.removeFavorite('a'));

		await waitFor(() => expect(result.current.isUpdatingBook('a')).toBe(true));
		expect(result.current.isUpdatingBook('b')).toBe(false);

		await act(async () => {
			emVoo.resolve();
		});
		await waitFor(() => expect(result.current.isUpdatingBook('a')).toBe(false));
	});

	it('vale também para a inclusão, que identifica o livro por book.id', async () => {
		const emVoo = deferred<FavoriteBook>();
		mocked.addToFavorites.mockReturnValue(emVoo.promise);

		const { result } = await setup();
		act(() => result.current.addFavorite(makeBook({ id: 'novo' })));

		await waitFor(() => expect(result.current.isUpdatingBook('novo')).toBe(true));
		expect(result.current.isUpdatingBook('outro')).toBe(false);

		await act(async () => {
			emVoo.resolve(makeFavorite({ id: 'novo' }));
		});
	});
});

describe('toggleFavorite', () => {
	it('adiciona quando o livro não está na estante', async () => {
		const { result } = await setup();

		await act(async () => {
			result.current.toggleFavorite(makeBook({ id: 'x' }));
		});

		expect(mocked.addToFavorites).toHaveBeenCalledTimes(1);
		expect(mocked.removeFromFavorites).not.toHaveBeenCalled();
	});

	it('remove quando já está', async () => {
		const { result } = await setup([makeFavorite({ id: 'x', recordId: 'reg-x' })]);

		await act(async () => {
			result.current.toggleFavorite(makeBook({ id: 'x' }));
		});

		expect(mocked.removeFromFavorites).toHaveBeenCalledWith('reg-x');
	});

	it('não tenta remover um livro cuja inclusão ainda está em voo', async () => {
		const emVoo = deferred<FavoriteBook>();
		mocked.addToFavorites.mockReturnValue(emVoo.promise);

		const { result } = await setup();
		const livro = makeBook({ id: 'novo' });

		act(() => result.current.toggleFavorite(livro));
		// Sem recordId não há o que apagar no servidor: um DELETE aqui iria para
		// uma URL sem chave e derrubaria o registro errado.
		act(() => result.current.toggleFavorite(livro));

		expect(mocked.removeFromFavorites).not.toHaveBeenCalled();

		await act(async () => {
			emVoo.resolve(makeFavorite({ id: 'novo' }));
		});
	});
});

describe('setStatus', () => {
	it('adiciona já na estante escolhida quando o livro é novo', async () => {
		const { result } = await setup();

		await act(async () => {
			result.current.setStatus(makeBook({ id: 'novo', pageCount: 300 }), 'reading');
		});

		const [, , shelf] = mocked.addToFavorites.mock.calls[0];
		expect(shelf?.status).toBe('reading');
		expect(shelf?.startedAt).toBeGreaterThan(0);
	});

	it('move de estante quando o livro já está guardado', async () => {
		const { result } = await setup([makeFavorite({ id: 'g', recordId: 'reg-g' })]);

		await act(async () => {
			result.current.setStatus(makeBook({ id: 'g' }), 'read');
		});

		expect(mocked.updateFavorite).toHaveBeenCalledWith('reg-g', expect.objectContaining({
			status: 'read',
		}));
	});

	it('ignora a ação quando o registro ainda não tem chave', async () => {
		const { result } = await setup([makeFavorite({ id: 'g', recordId: '' })]);

		await act(async () => {
			result.current.updateShelf('g', { rating: 4 });
		});

		expect(mocked.updateFavorite).not.toHaveBeenCalled();
	});
});

describe('buildStatusPatch', () => {
	it('começa a leitura ao entrar em "lendo" e limpa a conclusão', () => {
		const patch = buildStatusPatch(makeFavorite({ startedAt: 0, finishedAt: 999 }), 'reading');

		expect(patch.status).toBe('reading');
		expect(patch.startedAt).toBeGreaterThan(0);
		expect(patch.finishedAt).toBe(0);
	});

	it('preserva a data de início já registrada', () => {
		const patch = buildStatusPatch(makeFavorite({ startedAt: 123 }), 'reading');
		expect(patch.startedAt).toBe(123);
	});

	it('leva o progresso ao fim ao marcar como lido', () => {
		const patch = buildStatusPatch(
			makeFavorite({ pageCount: 256, currentPage: 40, startedAt: 0, finishedAt: 0 }),
			'read'
		);

		expect(patch.currentPage).toBe(256);
		expect(patch.finishedAt).toBeGreaterThan(0);
	});

	it('voltar para "quero ler" apaga a conclusão', () => {
		const patch = buildStatusPatch(makeFavorite({ finishedAt: 999 }), 'want_to_read');

		expect(patch.status).toBe('want_to_read');
		expect(patch.finishedAt).toBe(0);
	});
});

describe('ações em lote', () => {
	/** Três livros guardados, cada um numa situação diferente. */
	const estante = () => [
		makeFavorite({ id: 'a', recordId: 'reg-a', title: 'A', status: 'want_to_read', tags: ['x'] }),
		makeFavorite({ id: 'b', recordId: 'reg-b', title: 'B', status: 'reading' }),
		makeFavorite({ id: 'c', recordId: 'reg-c', title: 'C', status: 'read' }),
	];

	it('move vários livros numa tacada', async () => {
		const { result } = await setup(estante());

		await act(async () => {
			result.current.setStatusMany(['a', 'b'], 'read');
		});

		expect(mocked.updateFavorite).toHaveBeenCalledTimes(2);
		expect(mocked.updateFavorite).toHaveBeenCalledWith(
			'reg-a',
			expect.objectContaining({ status: 'read' })
		);
		expect(mocked.updateFavorite).toHaveBeenCalledWith(
			'reg-b',
			expect.objectContaining({ status: 'read' })
		);
	});

	it('não escreve em quem já está na estante de destino', async () => {
		const { result } = await setup(estante());

		// 'c' já é "read": só 'a' precisa de escrita.
		await act(async () => {
			result.current.setStatusMany(['a', 'c'], 'read');
		});

		expect(mocked.updateFavorite).toHaveBeenCalledTimes(1);
		expect(mocked.updateFavorite).toHaveBeenCalledWith('reg-a', expect.anything());
	});

	it('não chama a API quando não há nada a fazer', async () => {
		const { result } = await setup(estante());

		await act(async () => {
			result.current.setStatusMany(['c'], 'read');
		});

		expect(mocked.updateFavorite).not.toHaveBeenCalled();
	});

	it('ignora ids que não estão na estante', async () => {
		const { result } = await setup(estante());

		await act(async () => {
			result.current.setStatusMany(['a', 'fantasma'], 'reading');
		});

		expect(mocked.updateFavorite).toHaveBeenCalledTimes(1);
	});

	it('aplica a tag preservando as que o livro já tinha', async () => {
		const { result } = await setup(estante());

		await act(async () => {
			result.current.tagMany(['a', 'b'], 'releitura', 'add');
		});

		expect(mocked.updateFavorite).toHaveBeenCalledWith('reg-a', { tags: ['x', 'releitura'] });
		expect(mocked.updateFavorite).toHaveBeenCalledWith('reg-b', { tags: ['releitura'] });
	});

	it('retira a tag só de quem a tem', async () => {
		const { result } = await setup(estante());

		await act(async () => {
			result.current.tagMany(['a', 'b'], 'x', 'remove');
		});

		expect(mocked.updateFavorite).toHaveBeenCalledTimes(1);
		expect(mocked.updateFavorite).toHaveBeenCalledWith('reg-a', { tags: [] });
	});

	it('some com os livros da tela antes de o servidor responder', async () => {
		const emVoo = deferred<void>();
		mocked.removeFromFavorites.mockReturnValue(emVoo.promise);

		const { result } = await setup(estante());

		act(() => result.current.removeMany(['a', 'b']));

		await waitFor(() => expect(result.current.favoritesCount).toBe(1));
		expect(result.current.isFavorite('c')).toBe(true);

		await act(async () => emVoo.resolve());
	});

	it('remove cada registro pela própria chave', async () => {
		const { result } = await setup(estante());

		await act(async () => {
			result.current.removeMany(['a', 'c']);
		});

		expect(mocked.removeFromFavorites).toHaveBeenCalledWith('reg-a');
		expect(mocked.removeFromFavorites).toHaveBeenCalledWith('reg-c');
		expect(mocked.removeFromFavorites).toHaveBeenCalledTimes(2);
	});

	it('devolve tudo ao estado anterior quando o servidor recusa', async () => {
		mocked.updateFavorite.mockRejectedValue(new Error('500'));

		const { result } = await setup(estante());
		// A releitura fica pendurada: só o rollback pode consertar a tela.
		const pendente = deferred<FavoriteBook[]>();
		mocked.getFavorites.mockReturnValue(pendente.promise);

		await act(async () => {
			result.current.setStatusMany(['a', 'b'], 'read');
		});

		await waitFor(() => expect(result.current.findFavorite('a')?.status).toBe('want_to_read'));
		expect(result.current.findFavorite('b')?.status).toBe('reading');

		await act(async () => pendente.resolve(estante()));
	});

	it('o "Desfazer" da remoção em lote devolve os livros como estavam', async () => {
		const { result } = await setup(estante());

		await act(async () => {
			result.current.removeMany(['a']);
		});

		const desfazer = await screen.findByRole('button', { name: 'Desfazer' });
		await act(async () => {
			fireEvent.click(desfazer);
		});

		expect(mocked.addToFavorites).toHaveBeenCalledTimes(1);
		const [livro, addedAt, shelf] = mocked.addToFavorites.mock.calls[0];
		expect(livro.id).toBe('a');
		expect(addedAt).toBe(1_700_000_000_000);
		expect(shelf?.tags).toEqual(['x']);
	});

	it('marca como ocupados só os livros do lote', async () => {
		const emVoo = deferred<void>();
		mocked.removeFromFavorites.mockReturnValue(emVoo.promise);

		const { result } = await setup(estante());

		act(() => result.current.removeMany(['a', 'b']));

		await waitFor(() => expect(result.current.isUpdatingBook('a')).toBe(true));
		expect(result.current.isUpdatingBook('b')).toBe(true);
		expect(result.current.isUpdatingBook('c')).toBe(false);

		await act(async () => emVoo.resolve());
	});
});
