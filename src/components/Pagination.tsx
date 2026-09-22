import React from 'react';
import { getPageWindow } from '@/lib/pagination';

interface PaginationProps {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	disabled?: boolean;
	/**
	 * `compact` é a versão que vai acima da lista: só anterior/próxima e a
	 * posição atual. A paginação numerada existia só no rodapé, então quem
	 * queria a próxima página rolava vinte cards até encontrá-la.
	 */
	variant?: 'full' | 'compact';
	className?: string;
}

const baseButton =
	'min-w-10 h-10 px-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const outlineButton = `${baseButton} border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800`;

const Pagination: React.FC<PaginationProps> = ({
	page,
	totalPages,
	onPageChange,
	disabled = false,
	variant = 'full',
	className = '',
}) => {
	if (totalPages <= 1) return null;

	if (variant === 'compact') {
		return (
			<nav
				className={`flex items-center justify-end gap-3 ${className}`}
				aria-label='Paginação dos resultados (topo)'
			>
				<button
					type='button'
					onClick={() => onPageChange(page - 1)}
					disabled={disabled || page <= 1}
					className={outlineButton}
				>
					Anterior
				</button>
				<span className='text-sm text-gray-600 dark:text-slate-400 tabular-nums'>
					Página {page} de {totalPages}
				</span>
				<button
					type='button'
					onClick={() => onPageChange(page + 1)}
					disabled={disabled || page >= totalPages}
					className={outlineButton}
				>
					Próxima
				</button>
			</nav>
		);
	}

	const pages = getPageWindow(page, totalPages);

	return (
		<nav
			className={`flex items-center justify-center gap-2 flex-wrap ${className}`}
			aria-label='Paginação dos resultados'
		>
			<button
				type='button'
				onClick={() => onPageChange(page - 1)}
				disabled={disabled || page <= 1}
				className={`${baseButton} border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800`}
			>
				Anterior
			</button>

			{pages[0] > 1 && (
				<>
					<button
						type='button'
						onClick={() => onPageChange(1)}
						disabled={disabled}
						className={`${baseButton} border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800`}
					>
						1
					</button>
					{pages[0] > 2 && (
						<span className='text-gray-400 dark:text-slate-500 px-1' aria-hidden='true'>
							…
						</span>
					)}
				</>
			)}

			{pages.map((item) => (
				<button
					key={item}
					type='button'
					onClick={() => onPageChange(item)}
					disabled={disabled}
					aria-current={item === page ? 'page' : undefined}
					className={`${baseButton} ${
						item === page
							? 'bg-primary-600 text-white'
							: 'border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
					}`}
				>
					{item}
				</button>
			))}

			{pages[pages.length - 1] < totalPages && (
				<>
					{pages[pages.length - 1] < totalPages - 1 && (
						<span className='text-gray-400 dark:text-slate-500 px-1' aria-hidden='true'>
							…
						</span>
					)}
					<button
						type='button'
						onClick={() => onPageChange(totalPages)}
						disabled={disabled}
						className={`${baseButton} border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800`}
					>
						{totalPages}
					</button>
				</>
			)}

			<button
				type='button'
				onClick={() => onPageChange(page + 1)}
				disabled={disabled || page >= totalPages}
				className={`${baseButton} border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800`}
			>
				Próxima
			</button>
		</nav>
	);
};

export default Pagination;
