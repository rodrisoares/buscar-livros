import type { FavoriteBook } from '@/types/Book';
import { makeFavorite } from '@/test/utils';
import {
	buildShelfEntries,
	buildStatusEntries,
	buildTagEntries,
	runInBatches,
	shelfSnapshot,
} from './shelfPatches';

const favorite = (overrides: Partial<FavoriteBook>): FavoriteBook => makeFavorite(overrides);

describe('buildStatusEntries', () => {
	it('monta uma escrita por livro, com a chave do registro', () => {
		const entries = buildStatusEntries(
			[
				favorite({ id: 'a', recordId: 'reg-a' }),
				favorite({ id: 'b', recordId: 'reg-b' }),
			],
			'reading'
		);

		expect(entries.map((entry) => [entry.bookId, entry.recordId])).toEqual([
			['a', 'reg-a'],
			['b', 'reg-b'],
		]);
	});

	it('aplica a mesma regra de datas do livro avulso', () => {
		const [entry] = buildStatusEntries(
			[favorite({ id: 'a', recordId: 'reg-a', startedAt: 0, pageCount: 300 })],
			'read'
		);

		expect(entry.patch.status).toBe('read');
		expect(entry.patch.startedAt).toBeGreaterThan(0);
		expect(entry.patch.finishedAt).toBeGreaterThan(0);
		// Concluir leva o progresso ao fim.
		expect(entry.patch.currentPage).toBe(300);
	});

	it('preserva a data de início de quem já tinha começado', () => {
		const [entry] = buildStatusEntries(
			[favorite({ id: 'a', recordId: 'reg-a', startedAt: 123 })],
			'read'
		);

		expect(entry.patch.startedAt).toBe(123);
	});

	it('pula quem já está na estante de destino — não gasta requisição à toa', () => {
		const entries = buildStatusEntries(
			[
				favorite({ id: 'a', recordId: 'reg-a', status: 'reading' }),
				favorite({ id: 'b', recordId: 'reg-b', status: 'want_to_read' }),
			],
			'reading'
		);

		expect(entries.map((entry) => entry.bookId)).toEqual(['b']);
	});

	it('ignora o que ainda não existe no servidor', () => {
		// Inclusão em voo: sem recordId não há registro para atualizar.
		const entries = buildStatusEntries([favorite({ id: 'a', recordId: '' })], 'read');

		expect(entries).toEqual([]);
	});
});

describe('buildTagEntries', () => {
	it('acrescenta a tag preservando as que já existiam', () => {
		const [entry] = buildTagEntries(
			[favorite({ id: 'a', recordId: 'reg-a', tags: ['ficção'] })],
			'relidos',
			'add'
		);

		expect(entry.patch.tags).toEqual(['ficção', 'relidos']);
	});

	it('não duplica por diferença de acento ou caixa', () => {
		const entries = buildTagEntries(
			[favorite({ id: 'a', recordId: 'reg-a', tags: ['Ficção'] })],
			'ficcao',
			'add'
		);

		expect(entries).toEqual([]);
	});

	it('remove a tag ignorando acento e caixa', () => {
		const [entry] = buildTagEntries(
			[favorite({ id: 'a', recordId: 'reg-a', tags: ['Ficção', 'relidos'] })],
			'ficcao',
			'remove'
		);

		expect(entry.patch.tags).toEqual(['relidos']);
	});

	it('pula quem não tem a tag quando o pedido é remover', () => {
		const entries = buildTagEntries(
			[favorite({ id: 'a', recordId: 'reg-a', tags: ['poesia'] })],
			'ficção',
			'remove'
		);

		expect(entries).toEqual([]);
	});

	it('tag vazia não gera escrita nenhuma', () => {
		expect(buildTagEntries([favorite({ id: 'a', recordId: 'reg-a' })], '   ', 'add')).toEqual([]);
	});
});

describe('shelfSnapshot', () => {
	it('guarda o que o "Desfazer" precisa devolver', () => {
		const snapshot = shelfSnapshot(
			favorite({
				status: 'read',
				currentPage: 120,
				progressLog: [{ page: 40, at: 10 }, { page: 120, at: 20 }],
				rating: 4,
				notes: 'ótimo',
				tags: ['x'],
				shelves: ['estante-1'],
				startedAt: 1,
				finishedAt: 2,
			})
		);

		expect(snapshot).toEqual({
			status: 'read',
			currentPage: 120,
			progressLog: [{ page: 40, at: 10 }, { page: 120, at: 20 }],
			rating: 4,
			notes: 'ótimo',
			tags: ['x'],
			shelves: ['estante-1'],
			startedAt: 1,
			finishedAt: 2,
		});
	});

	it('leva as estantes personalizadas junto', () => {
		expect(shelfSnapshot(favorite({ shelves: ['a', 'b'] })).shelves).toEqual(['a', 'b']);
	});

	it('leva o histórico de leitura junto: desfazer não pode zerar o caminho', () => {
		const log = [{ page: 10, at: 1 }, { page: 90, at: 2 }];

		expect(shelfSnapshot(favorite({ progressLog: log })).progressLog).toEqual(log);
	});
});

describe('runInBatches', () => {
	it('executa tudo, em grupos do tamanho pedido', async () => {
		const vistos: number[] = [];

		await runInBatches([1, 2, 3, 4, 5], 2, async (item) => {
			vistos.push(item);
		});

		expect(vistos.sort()).toEqual([1, 2, 3, 4, 5]);
	});

	it('não dispara o grupo seguinte antes de o anterior terminar', async () => {
		let simultaneos = 0;
		let pico = 0;

		await runInBatches([1, 2, 3, 4, 5, 6], 2, async () => {
			simultaneos += 1;
			pico = Math.max(pico, simultaneos);
			await Promise.resolve();
			simultaneos -= 1;
		});

		expect(pico).toBeLessThanOrEqual(2);
	});

	it('lista vazia não faz nada', async () => {
		const run = vi.fn();
		await runInBatches([], 5, run);

		expect(run).not.toHaveBeenCalled();
	});
});

describe('buildShelfEntries', () => {
	it('põe os livros na estante preservando as que já tinham', () => {
		const [entry] = buildShelfEntries(
			[favorite({ id: 'a', recordId: 'reg-a', shelves: ['e2'] })],
			'e1',
			'add'
		);

		expect(entry.patch.shelves).toEqual(['e2', 'e1']);
	});

	it('pula quem já está na estante', () => {
		const entries = buildShelfEntries(
			[favorite({ id: 'a', recordId: 'reg-a', shelves: ['e1'] })],
			'e1',
			'add'
		);

		expect(entries).toEqual([]);
	});

	it('tira só da estante pedida', () => {
		const [entry] = buildShelfEntries(
			[favorite({ id: 'a', recordId: 'reg-a', shelves: ['e1', 'e2'] })],
			'e1',
			'remove'
		);

		expect(entry.patch.shelves).toEqual(['e2']);
	});

	it('pula quem não está nela quando o pedido é tirar', () => {
		expect(
			buildShelfEntries([favorite({ id: 'a', recordId: 'reg-a', shelves: ['e2'] })], 'e1', 'remove')
		).toEqual([]);
	});

	it('não mexe no status do livro', () => {
		const [entry] = buildShelfEntries(
			[favorite({ id: 'a', recordId: 'reg-a', status: 'reading', shelves: [] })],
			'e1',
			'add'
		);

		expect(entry.patch.status).toBeUndefined();
	});

	it('chave vazia não gera escrita', () => {
		expect(buildShelfEntries([favorite({ id: 'a', recordId: 'reg-a' })], '', 'add')).toEqual([]);
	});

	it('ignora o que ainda não existe no servidor', () => {
		expect(buildShelfEntries([favorite({ id: 'a', recordId: '' })], 'e1', 'add')).toEqual([]);
	});
});
