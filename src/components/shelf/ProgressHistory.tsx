import React from 'react';
import type { FavoriteBook } from '@/types/Book';
import { estimateFinish, getProgressPoints } from '@/lib/progressLog';
import { formatDate } from '@/lib/dates';

interface ProgressHistoryProps {
	book: FavoriteBook;
	className?: string;
}

/** Precisa de dois pontos para virar linha — e de dois para haver ritmo. */
const MIN_POINTS = 2;

/**
 * O caminho até a página atual.
 *
 * `currentPage` sozinho diz onde a leitura está; o log diz como ela chegou lá.
 * Com isso a tela consegue responder a pergunta que todo leitor faz no meio de
 * um livro grande: "nesse ritmo, quando eu termino?"
 */
const ProgressHistory: React.FC<ProgressHistoryProps> = ({ book, className = '' }) => {
	const points = getProgressPoints(book);
	const estimate = estimateFinish(book);

	if (points.length < MIN_POINTS) {
		return (
			<p className={`text-xs text-gray-600 dark:text-slate-400 ${className}`}>
				Anote a página mais de uma vez e aqui aparece seu ritmo e a previsão de conclusão.
			</p>
		);
	}

	const first = points[0];
	const last = points[points.length - 1];
	const span = Math.max(last.at - first.at, 1);

	// Coordenadas no espaço 0-100, para o SVG escalar com o contêiner.
	const line = points
		.map((point) => `${((point.at - first.at) / span) * 100},${100 - point.percent}`)
		.join(' ');

	return (
		<div className={className}>
			<svg
				viewBox='0 0 100 100'
				preserveAspectRatio='none'
				className='w-full h-16 overflow-visible'
				role='img'
				aria-label={`Progresso de ${formatDate(first.at)} a ${formatDate(last.at)}: da página ${first.page} à ${last.page}`}
			>
				{/* A área sob a linha dá volume ao traço fino em telas pequenas. */}
				<polygon
					points={`0,100 ${line} 100,100`}
					className='fill-emerald-500/15'
					vectorEffect='non-scaling-stroke'
				/>
				<polyline
					points={line}
					fill='none'
					strokeWidth={2}
					className='stroke-emerald-500'
					vectorEffect='non-scaling-stroke'
					strokeLinecap='round'
					strokeLinejoin='round'
				/>
			</svg>

			<div className='mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-slate-400'>
				<span>
					{points.length} {points.length === 1 ? 'marcação' : 'marcações'} desde{' '}
					{formatDate(first.at)}
				</span>

				{estimate && (
					<span className='text-gray-700 dark:text-slate-300'>
						<strong className='font-medium'>
							{Math.round(estimate.pagesPerDay)} páginas/dia
						</strong>{' '}
						— nesse ritmo, termina em {estimate.daysLeft}{' '}
						{estimate.daysLeft === 1 ? 'dia' : 'dias'} ({formatDate(estimate.finishesAt)})
					</span>
				)}
			</div>
		</div>
	);
};

export default ProgressHistory;
