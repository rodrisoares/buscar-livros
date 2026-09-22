import React, { useId, useState } from 'react';
import Icon from './Icon';

export interface AccordionItem {
	title: string;
	content: React.ReactNode;
}

interface AccordionProps {
	items: AccordionItem[];
	/**
	 * Modo controlado: quem usa manda no que está aberto.
	 *
	 * Existe porque a tela de contato precisa abrir a primeira pergunta a partir
	 * de um botão que fica longe da lista — com estado só interno, o atalho
	 * rolaria até o FAQ e deixaria tudo fechado.
	 */
	openIndex?: number | null;
	onOpenChange?: (index: number | null) => void;
	/** Índice aberto na montagem, quando o modo controlado não é usado. */
	defaultOpen?: number | null;
	/**
	 * Nível de cabeçalho dos títulos. O botão precisa morar dentro de um
	 * heading para o leitor de tela poder saltar de pergunta em pergunta, e o
	 * nível certo depende de onde a lista é usada.
	 */
	headingLevel?: 'h3' | 'h4';
	className?: string;
}

/**
 * Lista de blocos que abrem um de cada vez.
 *
 * Saiu de dentro da tela de contato, onde vivia junto com o formulário e os
 * dados das perguntas num arquivo de quase quatrocentas linhas. Aqui é só o
 * comportamento; o conteúdo vem de fora.
 */
const Accordion: React.FC<AccordionProps> = ({
	items,
	openIndex,
	onOpenChange,
	defaultOpen = null,
	headingLevel: Heading = 'h3',
	className = '',
}) => {
	const [internalIndex, setInternalIndex] = useState<number | null>(defaultOpen);
	const isControlled = openIndex !== undefined;
	const currentIndex = isControlled ? openIndex : internalIndex;

	const toggle = (index: number) => {
		const next = currentIndex === index ? null : index;
		if (!isControlled) setInternalIndex(next);
		onOpenChange?.(next);
	};

	const uid = useId();
	const panelId = (index: number) => `${uid}-painel-${index}`;

	return (
		<div className={`space-y-3 ${className}`}>
			{items.map((item, index) => {
				const isOpen = currentIndex === index;

				return (
					<div
						key={item.title}
						className='border border-gray-200 dark:border-slate-700 rounded-lg'
					>
						<Heading>
							<button
								type='button'
								onClick={() => toggle(index)}
								aria-expanded={isOpen}
								aria-controls={panelId(index)}
								className='w-full flex items-center justify-between gap-4 px-4 py-3 text-left font-medium text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors rounded-lg'
							>
								{item.title}
								<Icon
									name='chevron-down'
									className={`w-5 h-5 shrink-0 text-gray-400 dark:text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
								/>
							</button>
						</Heading>

						{isOpen && (
							<div
								id={panelId(index)}
								className='px-4 pb-4 text-gray-600 dark:text-slate-400 text-sm leading-relaxed'
							>
								{item.content}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default Accordion;
