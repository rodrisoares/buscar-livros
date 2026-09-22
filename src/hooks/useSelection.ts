import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Seleção de vários itens de uma lista.
 *
 * `availableIds` é a lista visível **depois** dos filtros, e não a página atual:
 * marcar 40 livros, virar a página e perder a seleção seria pior do que não
 * ter seleção. O que some da lista, porém, some da seleção — senão a barra
 * anunciaria "12 selecionados" com livros que já não estão mais ali.
 */
export const useSelection = (availableIds: string[]) => {
	const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set<string>());

	// Chave textual: mantém o efeito estável mesmo com um array novo a cada render.
	const availableKey = availableIds.join('|');

	useEffect(() => {
		const available = new Set(availableKey ? availableKey.split('|') : []);

		setSelected((current) => {
			if (current.size === 0) return current;

			const next = new Set([...current].filter((id) => available.has(id)));
			// Devolver o mesmo Set quando nada mudou evita um render a mais.
			return next.size === current.size ? current : next;
		});
	}, [availableKey]);

	const toggle = useCallback((id: string, isSelected: boolean) => {
		setSelected((current) => {
			const next = new Set(current);
			if (isSelected) next.add(id);
			else next.delete(id);
			return next;
		});
	}, []);

	const selectAll = useCallback(() => {
		setSelected(new Set(availableKey ? availableKey.split('|') : []));
	}, [availableKey]);

	const clear = useCallback(() => setSelected(new Set<string>()), []);

	const ids = useMemo(() => [...selected], [selected]);

	return {
		selectedIds: selected,
		ids,
		count: selected.size,
		isAllSelected: availableIds.length > 0 && selected.size === availableIds.length,
		toggle,
		selectAll,
		clear,
	};
};
