import { useEffect } from 'react';

const SITE_NAME = 'Buscar Livros';
const DEFAULT_TITLE = `${SITE_NAME} | Sua estante virtual`;

/**
 * Define o título da aba por página. Passar `null` (enquanto os dados carregam)
 * mantém o título anterior em vez de piscar um texto vazio.
 */
export const useDocumentTitle = (title: string | null) => {
	useEffect(() => {
		if (title === null) return;

		document.title = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;

		return () => {
			document.title = DEFAULT_TITLE;
		};
	}, [title]);
};
