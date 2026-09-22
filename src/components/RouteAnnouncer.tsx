import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/** Quanto esperar o título assentar antes de anunciar. */
const SETTLE_MS = 150;

/**
 * Diz a leitores de tela que a página mudou.
 *
 * Numa aplicação de página única, navegar não recarrega nada: o foco fica onde
 * estava e o leitor de tela simplesmente não comenta — quem não enxerga clica
 * em "Painel" e não recebe sinal nenhum de que chegou. Um `aria-live` com o
 * título da tela nova resolve, que é o que o navegador faria sozinho numa
 * navegação de verdade.
 *
 * Não renderiza nada visível.
 */
const RouteAnnouncer = () => {
	const { pathname } = useLocation();
	const [message, setMessage] = useState('');

	const isFirstRender = useRef(true);
	/** Último título já anunciado — evita repetir e evita anunciar o da tela anterior. */
	const announced = useRef(typeof document === 'undefined' ? '' : document.title);

	useEffect(() => {
		// A primeira renderização não é navegação: o leitor já leu a página ao abri-la.
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}

		let settle: ReturnType<typeof setTimeout>;

		const consider = () => {
			clearTimeout(settle);

			// O título muda duas vezes numa navegação — a tela que sai devolve o
			// padrão, a que entra escreve o dela — e telas que carregam dados o
			// escrevem ainda depois. Anunciar cada passo daria três falas.
			settle = setTimeout(() => {
				if (document.title === announced.current) return;

				announced.current = document.title;
				setMessage(document.title);
			}, SETTLE_MS);
		};

		// `useDocumentTitle` escreve no <title>; observá-lo é o que permite
		// esperar o nome real da ficha em vez de anunciar "carregando".
		const titleElement = document.head.querySelector('title');
		const observer = titleElement ? new MutationObserver(consider) : null;
		observer?.observe(titleElement as Node, { childList: true });

		// Também vale para as telas cujo título já estava certo antes deste efeito.
		consider();

		return () => {
			observer?.disconnect();
			clearTimeout(settle);
		};
	}, [pathname]);

	return (
		<p aria-live='polite' aria-atomic='true' className='sr-only'>
			{message}
		</p>
	);
};

export default RouteAnnouncer;
