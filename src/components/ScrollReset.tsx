import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Leva a página ao topo quando o usuário troca de tela. Sem isso, sair da
 * página 3 dos resultados para a ficha de um livro abre a ficha no meio, na
 * mesma altura em que o card estava.
 *
 * Não renderiza nada: é só o efeito.
 */
const ScrollReset = () => {
	const { pathname } = useLocation();
	const navigationType = useNavigationType();
	const previousPathname = useRef(pathname);

	useEffect(() => {
		// Mudar só os parâmetros (?q, ?page, filtros) não é trocar de tela — e a
		// paginação já rola sozinha, com animação, em useBookSearch.
		if (previousPathname.current === pathname) return;
		previousPathname.current = pathname;

		// No voltar/avançar quem manda é a restauração do navegador: forçar o
		// topo aqui jogaria fora a posição de onde o usuário tinha saído.
		if (navigationType === 'POP') return;

		// Sem `behavior: smooth`: numa troca de tela o movimento seria da página
		// nova, que o usuário nem viu rolar.
		window.scrollTo(0, 0);
	}, [navigationType, pathname]);

	return null;
};

export default ScrollReset;
