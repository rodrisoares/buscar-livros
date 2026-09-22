import { isShelfStatus } from '@/types/Shelf';
import type { RawFavorite } from '@/utils/FavoritesAdapter';

/**
 * Uma forma antiga de registro e como trazê-la para a atual.
 *
 * `applies` existe para a migração poder ser testada e observada: dá para
 * perguntar "este registro precisa disto?" sem executar nada, e é o que permite
 * saber quantos registros ainda estão numa forma antiga.
 */
export interface Migration<T> {
	/** Nome curto, para teste e diagnóstico. */
	name: string;
	applies: (record: T) => boolean;
	migrate: (record: T) => T;
}

/**
 * Aplica as migrações em ordem, cada uma sobre o resultado da anterior.
 *
 * Não altera o registro recebido: a resposta da API é compartilhada pelo cache
 * do React Query, e mutá-la faria o próximo leitor ver um objeto diferente do
 * que o servidor devolveu.
 */
export const applyMigrations = <T>(record: T, migrations: Migration<T>[]): T =>
	migrations.reduce(
		(current, migration) => (migration.applies(current) ? migration.migrate(current) : current),
		record
	);

/** Quais migrações um registro ainda precisa — para testes e diagnóstico. */
export const pendingMigrations = <T>(record: T, migrations: Migration<T>[]): string[] => {
	const pending: string[] = [];
	let current = record;

	for (const migration of migrations) {
		if (!migration.applies(current)) continue;
		pending.push(migration.name);
		current = migration.migrate(current);
	}

	return pending;
};

/**
 * As formas antigas do registro de favorito, da mais velha para a mais nova.
 *
 * Elas viviam como `??` e ternários espalhados pelo adaptador, cada um com um
 * comentário explicando um caso histórico diferente. Reunidas aqui, cada caso
 * tem nome, teste e uma ordem declarada — e a próxima mudança de formato entra
 * como mais um item, em vez de mais um ramo no meio do mapeamento de campos.
 *
 * Não há campo de versão no registro: estas transformações são idempotentes e
 * rodam na leitura. Gravar uma versão de volta exigiria escrever no servidor
 * durante o carregamento, sem o usuário ter pedido.
 */
export const FAVORITE_MIGRATIONS: Migration<RawFavorite>[] = [
	{
		// Os primeiros registros guardavam o id do volume como chave do próprio
		// registro. Depois o json-server passou a gerar a chave e o id do Google
		// foi para `bookId` — sem isto, o livro salvo antes disso deixaria de ser
		// reconhecido como "já está na estante".
		name: 'bookId-a-partir-do-id',
		applies: (raw) => !raw.bookId && raw.id !== undefined,
		migrate: (raw) => ({ ...raw, bookId: String(raw.id) }),
	},
	{
		// Registros anteriores às três estantes não tinham situação nenhuma.
		name: 'status-padrao',
		applies: (raw) => !isShelfStatus(raw.status),
		migrate: (raw) => ({ ...raw, status: 'want_to_read' }),
	},
	{
		// O histórico de leitura é posterior ao campo de página atual.
		name: 'historico-de-progresso-vazio',
		applies: (raw) => !Array.isArray(raw.progressLog),
		migrate: (raw) => ({ ...raw, progressLog: [] }),
	},
	{
		// As estantes personalizadas são posteriores a tudo isso.
		name: 'estantes-proprias-vazias',
		applies: (raw) => !Array.isArray(raw.shelves),
		migrate: (raw) => ({ ...raw, shelves: [] }),
	},
];

export const migrateFavorite = (raw: RawFavorite): RawFavorite =>
	applyMigrations(raw, FAVORITE_MIGRATIONS);
