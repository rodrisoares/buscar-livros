import { useEffect, useRef, useState } from 'react';

/**
 * Avisa quando o elemento chega perto da tela — uma vez só.
 *
 * Serve para adiar trabalho caro até que ele seja de fato necessário: as
 * sugestões "você também pode gostar" custam duas consultas à Google Books, e
 * elas saíam em toda abertura de ficha, mesmo para quem lia a sinopse e voltava
 * sem nunca rolar até o fim da página. Numa cota compartilhada, isso é o dobro
 * de requisições por visita sem nenhum retorno.
 *
 * `rootMargin` antecipa o disparo: com 300px, a busca começa antes de o bloco
 * aparecer e o conteúdo já está lá quando o usuário chega.
 */
export const useInView = <T extends Element>(rootMargin = '300px') => {
	const ref = useRef<T>(null);
	const [inView, setInView] = useState(false);

	useEffect(() => {
		// Visto uma vez, não volta atrás: sair da tela não deve descartar o que
		// já foi carregado nem disparar a consulta de novo na volta.
		if (inView) return;

		const element = ref.current;
		if (!element) return;

		// Ambiente sem a API (jsdom, navegador antigo): mostra tudo de uma vez,
		// que é o comportamento de antes — adiar é a melhoria, não o requisito.
		if (typeof IntersectionObserver === 'undefined') {
			setInView(true);
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) setInView(true);
			},
			{ rootMargin }
		);

		observer.observe(element);
		return () => observer.disconnect();
	}, [inView, rootMargin]);

	return { ref, inView };
};
