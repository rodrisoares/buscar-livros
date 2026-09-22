import type { RawFavorite } from '@/utils/FavoritesAdapter';
import {
	FAVORITE_MIGRATIONS,
	applyMigrations,
	migrateFavorite,
	pendingMigrations,
	type Migration,
} from './migrations';

describe('applyMigrations', () => {
	const dobrar: Migration<{ n: number }> = {
		name: 'dobrar',
		applies: (r) => r.n < 10,
		migrate: (r) => ({ n: r.n * 2 }),
	};
	const somar: Migration<{ n: number }> = {
		name: 'somar',
		applies: () => true,
		migrate: (r) => ({ n: r.n + 1 }),
	};

	it('aplica em ordem, cada uma sobre o resultado da anterior', () => {
		expect(applyMigrations({ n: 3 }, [dobrar, somar])).toEqual({ n: 7 });
	});

	it('pula a que não se aplica', () => {
		expect(applyMigrations({ n: 20 }, [dobrar, somar])).toEqual({ n: 21 });
	});

	it('não altera o registro recebido', () => {
		const original = { n: 3 };
		applyMigrations(original, [dobrar, somar]);

		expect(original).toEqual({ n: 3 });
	});

	it('sem migração nenhuma devolve o mesmo objeto', () => {
		const original = { n: 3 };
		expect(applyMigrations(original, [])).toBe(original);
	});
});

describe('pendingMigrations', () => {
	it('lista o que um registro antigo ainda precisa', () => {
		const antigo: RawFavorite = { id: 'vol-01', title: 'Duna' };

		expect(pendingMigrations(antigo, FAVORITE_MIGRATIONS)).toEqual([
			'bookId-a-partir-do-id',
			'status-padrao',
			'historico-de-progresso-vazio',
			'estantes-proprias-vazias',
		]);
	});

	it('não lista nada para um registro já em dia', () => {
		const atual: RawFavorite = {
			id: 'reg-1',
			bookId: 'vol-01',
			status: 'reading',
			progressLog: [],
			shelves: [],
		};

		expect(pendingMigrations(atual, FAVORITE_MIGRATIONS)).toEqual([]);
	});
});

describe('migrateFavorite', () => {
	it('usa a chave do registro como id do volume nos registros mais antigos', () => {
		// Antes de `bookId` existir, o id do Google era a própria chave.
		expect(migrateFavorite({ id: 'LEnHs53G0j0C' }).bookId).toBe('LEnHs53G0j0C');
	});

	it('não mexe no bookId de quem já tem', () => {
		expect(migrateFavorite({ id: 'reg-1', bookId: 'vol-09' }).bookId).toBe('vol-09');
	});

	it('livro salvo antes das estantes entra em "quero ler"', () => {
		expect(migrateFavorite({ id: 'reg-1', bookId: 'v' }).status).toBe('want_to_read');
	});

	it('status inventado também cai no padrão', () => {
		expect(migrateFavorite({ id: 'reg-1', bookId: 'v', status: 'lendo' }).status).toBe(
			'want_to_read'
		);
	});

	it('preserva um status válido', () => {
		expect(migrateFavorite({ id: 'reg-1', bookId: 'v', status: 'read' }).status).toBe('read');
	});

	it('dá histórico e estantes vazios a quem não tem', () => {
		const migrado = migrateFavorite({ id: 'reg-1', bookId: 'v' });

		expect(migrado.progressLog).toEqual([]);
		expect(migrado.shelves).toEqual([]);
	});

	it('preserva histórico e estantes existentes', () => {
		const migrado = migrateFavorite({
			id: 'reg-1',
			bookId: 'v',
			status: 'reading',
			progressLog: [{ page: 40, at: 1 }],
			shelves: ['sh-1'],
		});

		expect(migrado.progressLog).toEqual([{ page: 40, at: 1 }]);
		expect(migrado.shelves).toEqual(['sh-1']);
	});

	it('é idempotente: migrar duas vezes dá o mesmo resultado', () => {
		const uma = migrateFavorite({ id: 'LEnHs53G0j0C', title: 'Antigo' });
		const duas = migrateFavorite(uma);

		expect(duas).toEqual(uma);
	});

	it('não altera o registro recebido', () => {
		const original: RawFavorite = { id: 'LEnHs53G0j0C' };
		migrateFavorite(original);

		expect(original).toEqual({ id: 'LEnHs53G0j0C' });
	});
});
