import React from 'react';
import type { MonthlyPoint } from '@/lib/readingTimeline';

/** O que as barras contam — muda o rótulo e o formato dos números. */
export type ChartUnit = 'books' | 'pages';

interface MonthlyChartProps {
	points: MonthlyPoint[];
	year: number;
	unit?: ChartUnit;
	className?: string;
}

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

const describe = (count: number, unit: ChartUnit): string =>
	unit === 'pages' ? `${count} páginas` : `${count} ${count === 1 ? 'livro' : 'livros'}`;

/**
 * Barras verticais de conclusões por mês.
 *
 * Desenhadas com flex e altura percentual, sem biblioteca de gráficos — são
 * doze valores inteiros, e a `BarList` ao lado já seguia o mesmo princípio.
 *
 * Cada barra é um item de lista com nome acessível próprio ("março: 4 livros"),
 * porque uma altura em pixels não diz nada a quem não enxerga o desenho.
 */
const MonthlyChart: React.FC<MonthlyChartProps> = ({
	points,
	year,
	unit = 'books',
	className = '',
}) => {
	const max = Math.max(...points.map((point) => point.count), 0);

	if (max === 0) {
		return (
			<p className={`text-sm text-gray-600 dark:text-slate-400 ${className}`}>
				{unit === 'pages'
					? `Nenhuma página registrada em ${year}. Anote a página em que você está na ficha de cada livro e o ritmo aparece aqui.`
					: `Nenhum livro concluído em ${year} ainda. A data de conclusão de cada livro fica na página dele.`}
			</p>
		);
	}

	return (
		<div className={className}>
			<ul
				className='flex items-end gap-1.5 sm:gap-2 h-40'
				aria-label={
					unit === 'pages'
						? `Páginas lidas por mês em ${year}`
						: `Livros concluídos por mês em ${year}`
				}
			>
				{points.map((point) => (
					<li
						key={point.month}
						className='flex-1 flex flex-col justify-end items-center h-full gap-1'
						aria-label={`${point.label}: ${describe(point.count, unit)}`}
					>
						{/* O número só aparece onde há barra; zeros poluiriam o eixo. */}
						{point.count > 0 && (
							<span className='text-xs tabular-nums text-gray-600 dark:text-slate-400'>
								{/* Páginas chegam aos milhares e não cabem sobre uma barra
								    estreita: "1,2 mil" em vez de "1247". */}
								{unit === 'pages' ? compact.format(point.count) : point.count}
							</span>
						)}
						<div
							className={`w-full rounded-t transition-[height] duration-500 ${
								point.count > 0
									? 'bg-primary-500'
									: 'bg-gray-200 dark:bg-slate-700'
							}`}
							// Meses vazios ficam com um traço de 2px: sem ele, some a
							// noção de que aquele mês existe e a escala do eixo quebra.
							style={{ height: point.count > 0 ? `${(point.count / max) * 100}%` : '2px' }}
						/>
					</li>
				))}
			</ul>

			<ul className='flex gap-1.5 sm:gap-2 mt-2' aria-hidden='true'>
				{points.map((point) => (
					<li
						key={point.month}
						className='flex-1 text-center text-xs text-gray-600 dark:text-slate-400'
					>
						{point.label}
					</li>
				))}
			</ul>
		</div>
	);
};

export default MonthlyChart;
