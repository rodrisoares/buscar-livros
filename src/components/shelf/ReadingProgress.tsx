import React, { useEffect, useState } from 'react';
import type { FavoriteBook } from '@/types/Book';
import { getReadingProgress } from '@/lib/shelfStats';
import ProgressHistory from './ProgressHistory';

interface ReadingProgressProps {
	book: FavoriteBook;
	onChange: (currentPage: number) => void;
	disabled?: boolean;
}

/** Barra fina, usada nos cards (somente leitura). */
export const ProgressBar: React.FC<{ percent: number; className?: string }> = ({
	percent,
	className = '',
}) => (
	<div
		className={`h-1.5 w-full rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden ${className}`}
		role='progressbar'
		aria-valuenow={percent}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-label='Progresso de leitura'
	>
		<div
			className='h-full rounded-full bg-emerald-500 transition-[width] duration-300'
			style={{ width: `${percent}%` }}
		/>
	</div>
);

const ReadingProgress: React.FC<ReadingProgressProps> = ({ book, onChange, disabled = false }) => {
	const [page, setPage] = useState(String(book.currentPage));
	const percent = getReadingProgress(book);

	// Reflete atualizações vindas do servidor (ou de outra tela) no campo.
	useEffect(() => {
		setPage(String(book.currentPage));
	}, [book.currentPage]);

	const commit = () => {
		const parsed = Number(page);
		if (!Number.isFinite(parsed)) {
			setPage(String(book.currentPage));
			return;
		}

		// Nunca passa do total de páginas nem fica negativo.
		const limit = book.pageCount > 0 ? book.pageCount : parsed;
		const next = Math.max(0, Math.min(Math.trunc(parsed), limit));

		setPage(String(next));
		if (next !== book.currentPage) onChange(next);
	};

	return (
		<div className='space-y-3'>
			<div className='flex items-center justify-between text-sm'>
				<span className='text-gray-700 dark:text-slate-300'>Progresso de leitura</span>
				<span className='text-gray-600 dark:text-slate-400'>{percent}%</span>
			</div>

			<ProgressBar percent={percent} />

			<div className='flex items-center gap-2'>
				<label
					htmlFor='current-page'
					className='text-sm text-gray-600 dark:text-slate-400'
				>
					Página
				</label>
				<input
					id='current-page'
					type='number'
					min={0}
					max={book.pageCount || undefined}
					value={page}
					disabled={disabled}
					onChange={(e) => setPage(e.target.value)}
					onBlur={commit}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							commit();
						}
					}}
					className='w-24 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60'
				/>
				<span className='text-sm text-gray-600 dark:text-slate-400'>
					{book.pageCount > 0 ? `de ${book.pageCount}` : '(total desconhecido)'}
				</span>
			</div>

			{/* Só faz sentido enquanto o livro está em leitura: concluído, o ritmo
			    passado não projeta nada, e "quero ler" ainda não tem caminho. */}
			{book.status === 'reading' && book.pageCount > 0 && (
				<ProgressHistory book={book} className='pt-2' />
			)}
		</div>
	);
};

export default ReadingProgress;
