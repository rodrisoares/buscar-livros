import { buildStatusPatch } from '@/lib/shelfPatches';
import { useShelfMutations } from './useShelfMutations';
import { useShelfQuery } from './useShelfQuery';

/** Reexportado: a regra mora em `lib/shelfPatches`, mas o hook é onde se procura por ela. */
export { buildStatusPatch };

/**
 * Fonte única de verdade da estante: o cache do React Query é compartilhado por
 * todos os componentes, então card, página de detalhes e painel nunca divergem
 * entre si.
 *
 * Aqui só se juntam as duas metades. Elas moram separadas porque respondem a
 * perguntas diferentes — `useShelfQuery` diz o que está guardado, e
 * `useShelfMutations` muda o que está guardado —, e porque juntas passavam de
 * quinhentas linhas num arquivo só, onde ler a regra de uma ação exigia rolar
 * por três mutações que não tinham nada a ver com ela.
 *
 * A interface continua a mesma: quem chama `useFavorites` não precisa saber
 * que existem duas partes, e uma tela que só lê pode usar `useShelfQuery`
 * direto, sem arrastar as mutações junto.
 */
export const useFavorites = () => {
	const query = useShelfQuery();
	const mutations = useShelfMutations();

	return { ...query, ...mutations };
};
