import React from 'react';
import { PAGE_SIZE } from '@/lib/pagination';
import { BOOK_GRID_CLASSES } from './BookGrid';

/** Esqueleto com a mesma silhueta do BookCard, para a grade não "pular" ao carregar. */
const BookCardSkeleton: React.FC = () => (
	<div className='h-full flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 animate-pulse'>
		<div className='w-full aspect-[2/3] rounded bg-gray-200 dark:bg-slate-700 mb-4' />
		<div className='flex flex-col flex-1 gap-2'>
			<div className='h-4 rounded bg-gray-200 dark:bg-slate-700' />
			<div className='h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-700' />
			<div className='h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-700 mt-2' />
			<div className='h-3 w-3/4 rounded bg-gray-200 dark:bg-slate-700' />
			<div className='flex gap-2 mt-auto pt-4'>
				<div className='h-9 flex-1 rounded bg-gray-200 dark:bg-slate-700' />
				<div className='h-9 flex-1 rounded bg-gray-200 dark:bg-slate-700' />
			</div>
		</div>
	</div>
);

export const BookGridSkeleton: React.FC<{ count?: number }> = ({ count = PAGE_SIZE }) => (
	<div className={BOOK_GRID_CLASSES} role='status' aria-live='polite'>
		<span className='sr-only'>Carregando resultados...</span>
		{Array.from({ length: count }, (_, index) => (
			<BookCardSkeleton key={index} />
		))}
	</div>
);

export default BookCardSkeleton;
