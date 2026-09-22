import React from 'react';
import type { FavoriteBook } from '@/types/Book';
import { getReadingProgress } from '@/lib/shelfStats';
import { estimateFinish } from '@/lib/progressLog';
import { formatDate } from '@/lib/dates';
import Icon from '@/components/Icon';
import { ProgressBar } from './ReadingProgress';

interface ReadingSummaryProps {
	book: FavoriteBook;
	className?: string;
}

/**
 * O estado da leitura logo abaixo do título, antes da descrição.
 *
 * Quem já tem o livro na estante volta à ficha para ver em que pé está, não
 * para reler a sinopse — e isso ficava meia tela abaixo, depois da descrição e
 * da ficha técnica. Aqui vai só o essencial; o painel completo (datas, nota,
 * anotações, tags, coleções) continua embaixo, onde se edita com calma.
 *
 * Nada aparece para quem só marcou "quero ler": não há leitura a resumir, e uma
 * faixa vazia seria só ruído acima do texto.
 */
const ReadingSummary: React.FC<ReadingSummaryProps> = ({ book, className = '' }) => {
	if (book.status === 'reading') {
		const percent = getReadingProgress(book);
		const estimate = estimateFinish(book);

		return (
			<div
				className={`rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 ${className}`}
			>
				<div className='flex items-baseline justify-between gap-3 mb-2 text-sm'>
					<span className='text-gray-700 dark:text-slate-300'>
						{book.pageCount > 0
							? `Página ${book.currentPage} de ${book.pageCount}`
							: `Página ${book.currentPage}`}
					</span>
					<span className='font-medium text-gray-900 dark:text-slate-100 tabular-nums'>
						{percent}%
					</span>
				</div>

				<ProgressBar percent={percent} />

				{estimate && (
					<p className='mt-2 text-xs text-gray-600 dark:text-slate-400'>
						No ritmo atual, termina em {estimate.daysLeft}{' '}
						{estimate.daysLeft === 1 ? 'dia' : 'dias'} ({formatDate(estimate.finishesAt)})
					</p>
				)}
			</div>
		);
	}

	if (book.status === 'read') {
		const finished = formatDate(book.finishedAt);

		return (
			<div
				className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm ${className}`}
			>
				<span className='inline-flex items-center gap-2 text-emerald-900 dark:text-emerald-200'>
					<Icon name='check-circle' className='w-4 h-4' />
					{finished ? `Concluído em ${finished}` : 'Concluído'}
				</span>

				{book.rating > 0 && (
					<span
						className='inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400'
						aria-label={`Sua nota: ${book.rating} de 5`}
					>
						{Array.from({ length: book.rating }, (_, index) => (
							<Icon key={index} name='star' className='w-3.5 h-3.5' />
						))}
					</span>
				)}
			</div>
		);
	}

	return null;
};

export default ReadingSummary;
