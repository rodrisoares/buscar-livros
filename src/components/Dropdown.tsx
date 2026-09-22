import React, { useEffect, useId, useRef, useState } from 'react';

interface DropdownProps {
	/** Conteúdo do botão que abre o painel. */
	trigger: React.ReactNode;
	/** Nome acessível do botão, quando o `trigger` é só um ícone. */
	ariaLabel?: string;
	triggerClassName?: string;
	panelClassName?: string;
	align?: 'left' | 'right';
	/**
	 * Para onde o painel cresce. `up` existe para quem abre a partir do rodapé:
	 * na barra de seleção em lote, um menu que descesse sairia pela borda de
	 * baixo da tela e as últimas opções ficariam inalcançáveis no celular.
	 */
	direction?: 'down' | 'up';
	disabled?: boolean;
	/**
	 * O gatilho está esperando uma escrita terminar. Anda junto com `disabled`:
	 * sem isto, um leitor de tela só ouve "botão indisponível", sem saber que é
	 * temporário.
	 */
	ariaBusy?: boolean;
	/** Recebe uma função para fechar: quase toda opção fecha o painel ao ser usada. */
	children: (close: () => void) => React.ReactNode;
	className?: string;
}

/**
 * Painel suspenso com o mínimo que um menu precisa para não ser uma armadilha:
 * fecha ao clicar fora, fecha no Esc devolvendo o foco ao botão, e anuncia o
 * estado com `aria-expanded`.
 *
 * Existe porque o mesmo comportamento passou a ser necessário em três lugares
 * (menu de estante do card, filtro de tags e ações em lote) — e a `SearchBar`
 * já tinha uma cópia manual dele.
 */
const Dropdown: React.FC<DropdownProps> = ({
	trigger,
	ariaLabel,
	triggerClassName = '',
	panelClassName = '',
	align = 'right',
	direction = 'down',
	disabled = false,
	ariaBusy,
	children,
	className = '',
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const panelId = `menu${useId()}`;

	const closeAndRefocus = () => {
		setIsOpen(false);
		triggerRef.current?.focus();
	};

	useEffect(() => {
		if (!isOpen) return;

		const handlePointerDown = (event: MouseEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.stopPropagation();
			setIsOpen(false);
			triggerRef.current?.focus();
		};

		document.addEventListener('mousedown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('mousedown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen]);

	// O painel sai da árvore ao desabilitar (ex.: gravação em lote em andamento).
	useEffect(() => {
		if (disabled) setIsOpen(false);
	}, [disabled]);

	return (
		<div ref={containerRef} className={`relative ${className}`}>
			<button
				ref={triggerRef}
				type='button'
				disabled={disabled}
				onClick={(event) => {
					// Dentro de um card clicável, abrir o menu não pode navegar.
					event.preventDefault();
					event.stopPropagation();
					setIsOpen((open) => !open);
				}}
				aria-expanded={isOpen}
				aria-haspopup='true'
				aria-controls={isOpen ? panelId : undefined}
				aria-busy={ariaBusy}
				aria-label={ariaLabel}
				title={ariaLabel}
				className={triggerClassName}
			>
				{trigger}
			</button>

			{isOpen && (
				<div
					id={panelId}
					// Sem isto, um clique no painel dentro de um card seguiria o link do card.
					onClick={(event) => event.stopPropagation()}
					onKeyDown={(event) => {
						if (event.key === 'Tab') return;
						event.stopPropagation();
					}}
					className={`absolute z-40 ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} ${align === 'right' ? 'right-0' : 'left-0'} rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden ${panelClassName}`}
				>
					{children(closeAndRefocus)}
				</div>
			)}
		</div>
	);
};

export default Dropdown;
