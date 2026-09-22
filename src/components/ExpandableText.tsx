import React, { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon';

interface ExpandableTextProps {
	text: string;
	/** Linhas visíveis no estado recolhido. */
	lines?: number;
	className?: string;
}

/**
 * Texto longo recolhido em N linhas, com "ler mais".
 *
 * A Google Books devolve sinopses de três mil caracteres, e uma delas empurrava
 * a ficha técnica e o painel de leitura para fora da tela — a página parecia
 * ser só descrição.
 *
 * O botão só aparece quando o texto de fato não cabe, e isso é medido no
 * elemento (`scrollHeight` contra `clientHeight`), não estimado por contagem
 * de caracteres: o que cabe em dez linhas depende da largura da coluna e do
 * tamanho de fonte que o leitor escolheu.
 */
const ExpandableText: React.FC<ExpandableTextProps> = ({ text, lines = 10, className = '' }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [overflows, setOverflows] = useState(false);
	const textRef = useRef<HTMLParagraphElement>(null);
	const regionId = `texto${useId()}`;

	useEffect(() => {
		// Expandido, `scrollHeight` e `clientHeight` se igualam e a medição diria
		// "cabe" — o botão sumiria no clique e não haveria como recolher.
		if (isExpanded) return;

		const element = textRef.current;
		if (!element) return;

		const measure = () => setOverflows(element.scrollHeight > element.clientHeight + 1);
		measure();

		// A coluna muda de largura ao girar o celular ou redimensionar a janela.
		if (typeof ResizeObserver === 'undefined') return;

		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, [text, lines, isExpanded]);

	return (
		<div className={className}>
			<p
				ref={textRef}
				id={regionId}
				className='text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line'
				style={
					isExpanded
						? undefined
						: {
								display: '-webkit-box',
								WebkitLineClamp: lines,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}
				}
			>
				{text}
			</p>

			{overflows && (
				<button
					type='button'
					onClick={() => setIsExpanded((open) => !open)}
					aria-expanded={isExpanded}
					aria-controls={regionId}
					className='mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-700 dark:text-primary-300 hover:underline underline-offset-4'
				>
					{isExpanded ? 'Ler menos' : 'Ler mais'}
					<Icon
						name='chevron-down'
						className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
					/>
				</button>
			)}
		</div>
	);
};

export default ExpandableText;
