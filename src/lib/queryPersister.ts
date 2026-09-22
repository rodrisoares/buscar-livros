import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { Query } from '@tanstack/react-query';

export const PERSIST_STORAGE_KEY = 'buscar-livros-cache';

/**
 * Muda quando o formato dos dados guardados muda.
 *
 * O cache restaurado é hidratado direto no React Query, sem passar pelo
 * adaptador: um registro no formato antigo voltaria como se fosse atual. Subir
 * este número descarta o que estava salvo e força uma leitura nova.
 */
export const PERSIST_VERSION = 'v1';

/** Uma semana: o suficiente para uma visita ocasional ainda abrir instantânea. */
export const PERSIST_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * As consultas cujos dados são do usuário.
 *
 * Só elas sobrevivem ao recarregamento. Resultados de busca ficam de fora de
 * propósito: o acervo da Google muda, e devolver uma lista de ontem sem aviso
 * nenhum seria apresentar dado velho como novo. A estante, as estantes
 * próprias, as coleções e as metas são do usuário e não envelhecem sozinhas —
 * e são justamente as que ele vê primeiro ao abrir o app.
 */
const PERSISTED_ROOTS = new Set(['favorites', 'shelves', 'collections', 'goals']);

/**
 * Uma consulta que falhou não pode ser gravada.
 *
 * Trocar o `shouldDehydrateQuery` padrão substitui também o filtro que a
 * biblioteca aplica por dentro: sem repetir o teste de status aqui, uma estante
 * que voltou em erro ia para o armazenamento e era hidratada como erro na
 * próxima visita — o app abriria quebrado por causa de uma falha de rede que já
 * tinha passado.
 */
export const shouldPersistQuery = (query: Pick<Query, 'queryKey' | 'state'>): boolean =>
	query.state.status === 'success' && PERSISTED_ROOTS.has(String(query.queryKey[0]));

/**
 * O localStorage pode existir e mesmo assim recusar escrita — janela anônima,
 * cota cheia, política do navegador. Testar antes evita que a primeira
 * gravação derrube a aplicação; sem armazenamento, o persister vira inerte e o
 * app funciona como funcionava.
 */
const usableStorage = (): Storage | undefined => {
	if (typeof window === 'undefined') return undefined;

	try {
		const probe = `${PERSIST_STORAGE_KEY}-probe`;
		window.localStorage.setItem(probe, '1');
		window.localStorage.removeItem(probe);
		return window.localStorage;
	} catch {
		return undefined;
	}
};

export const persister = createSyncStoragePersister({
	storage: usableStorage(),
	key: PERSIST_STORAGE_KEY,
});
