import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import { useReadingGoal } from '@/hooks/useReadingGoal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getShelfStats, type CountedItem } from '@/lib/shelfStats';
import { getReadingPace, listReadingYears } from '@/lib/readingTimeline';
import { getPagesByMonth } from '@/lib/progressLog';
import { SHELF_SLUGS } from '@/lib/shelfFilters';
import { MAX_READING_GOAL, clampGoalTarget } from '@/types/Goal';
import { SHELF_ICONS, SHELF_LABELS, SHELF_STATUSES } from '@/types/Shelf';
import Icon, { type IconName } from '@/components/Icon';
import MonthlyChart, { type ChartUnit } from '@/components/dashboard/MonthlyChart';

const numberFormatter = new Intl.NumberFormat('pt-BR');
const paceFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

const cardClasses =
	'rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800';

const StatCard: React.FC<{ label: string; value: string; hint?: string; icon: IconName }> = ({
	label,
	value,
	hint,
	icon,
}) => (
	<div className={`${cardClasses} p-5`}>
		<div className='flex items-center gap-2 text-gray-600 dark:text-slate-400 text-sm'>
			<Icon name={icon} className='w-4 h-4' />
			{label}
		</div>
		<p className='mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100'>{value}</p>
		{hint && <p className='mt-1 text-xs text-gray-600 dark:text-slate-400'>{hint}</p>}
	</div>
);

/**
 * Barra horizontal simples — evita trazer uma biblioteca de gráficos só para isso.
 *
 * Cada linha é um link para a estante já filtrada: ver que "Tolkien" aparece
 * quatro vezes e não poder clicar para ver quais quatro era um beco sem saída,
 * ainda mais com os cartões "Por estante" logo acima fazendo exatamente isso.
 */
const BarList: React.FC<{
	title: string;
	items: CountedItem[];
	emptyText: string;
	linkFor: (label: string) => string;
	/** Completa o rótulo do link: "Ver os 4 livros de Tolkien na estante". */
	describe: (item: CountedItem) => string;
}> = ({ title, items, emptyText, linkFor, describe }) => {
	const max = items[0]?.count ?? 1;

	return (
		<div className={`${cardClasses} p-6`}>
			<h2 className='text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4'>{title}</h2>

			{items.length === 0 ? (
				<p className='text-sm text-gray-600 dark:text-slate-400'>{emptyText}</p>
			) : (
				<ul className='space-y-3'>
					{items.map((item) => (
						<li key={item.label}>
							<Link
								to={linkFor(item.label)}
								aria-label={describe(item)}
								className='group block rounded focus-inset -mx-1 px-1 py-0.5 hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors'
							>
								<div className='flex items-start justify-between text-sm mb-1 gap-2'>
									{/* Duas linhas em vez de corte: mesmo encurtado, um nome como
									    "Detective and mystery stories" não cabe numa coluna de terço
									    de tela. O `title` guarda o texto inteiro. */}
									<span
										title={item.label}
										className='text-gray-700 dark:text-slate-300 line-clamp-2 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors'
									>
										{item.label}
									</span>
									<span className='text-gray-600 dark:text-slate-400 shrink-0 tabular-nums'>
										{item.count}
									</span>
								</div>
								<div className='h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden'>
									<div
										className='h-full rounded-full bg-primary-500'
										style={{ width: `${Math.round((item.count / max) * 100)}%` }}
									/>
								</div>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

const Dashboard: React.FC = () => {
	const { favorites, isLoading } = useFavorites();
	const currentYear = new Date().getFullYear();

	// O ano escolhido rege tudo que é anual: meta, concluídos e o gráfico. O
	// resto do painel continua retratando a estante inteira.
	const [year, setYear] = useState(currentYear);
	const {
		goals,
		target,
		isLoading: isLoadingGoal,
		isSaving,
		setTarget,
	} = useReadingGoal(year);
	const [draftTarget, setDraftTarget] = useState('');
	/** O valor digitado passava do teto e foi ajustado — explica o número que ficou. */
	const [wasClamped, setWasClamped] = useState(false);
	const [chartUnit, setChartUnit] = useState<ChartUnit>('books');

	useDocumentTitle('Painel da estante');

	const stats = useMemo(() => getShelfStats(favorites, year), [favorites, year]);
	const pace = useMemo(() => getReadingPace(favorites, year), [favorites, year]);

	/**
	 * Páginas mês a mês, somadas do histórico de progresso de cada livro.
	 *
	 * Isto era impossível antes: sem o log, a única data de uma leitura era a de
	 * conclusão, e um calhamaço de 900 páginas lido em três meses aparecia todo
	 * num mês só. Agora cada avanço cai no mês em que aconteceu.
	 */
	const pagePoints = useMemo(() => {
		const totals = getPagesByMonth(favorites, year);
		return pace.monthly.map((point) => ({ ...point, count: totals[point.month] }));
	}, [favorites, year, pace.monthly]);

	const goalYears = useMemo(() => goals.map((item) => item.year), [goals]);
	const years = useMemo(
		() => listReadingYears(favorites, goalYears, currentYear),
		[favorites, goalYears, currentYear]
	);

	const goalPercent =
		target > 0 ? Math.min(100, Math.round((stats.finishedThisYear / target) * 100)) : 0;
	const remaining = Math.max(0, target - stats.finishedThisYear);

	if (isLoading) {
		// O esqueleto acompanha o layout real (meta, quatro números, gráfico e
		// três listas); só quatro retângulos faziam a tela dar um salto grande
		// ao carregar.
		const bloco = 'rounded-xl bg-gray-200 dark:bg-slate-700 animate-pulse';

		return (
			<div className='max-w-7xl mx-auto px-6 py-12' role='status' aria-live='polite'>
				<span className='sr-only'>Carregando o painel...</span>
				<div className='h-10 w-64 rounded bg-gray-200 dark:bg-slate-700 animate-pulse mb-2' />
				<div className='h-6 w-80 max-w-full rounded bg-gray-200 dark:bg-slate-700 animate-pulse mb-8' />

				<div className={`h-36 mb-8 ${bloco}`} />

				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8'>
					{Array.from({ length: 4 }, (_, index) => (
						<div key={index} className={`h-28 ${bloco}`} />
					))}
				</div>

				<div className={`h-72 mb-8 ${bloco}`} />
				<div className={`h-44 mb-8 ${bloco}`} />

				<div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
					{Array.from({ length: 3 }, (_, index) => (
						<div key={index} className={`h-64 ${bloco}`} />
					))}
				</div>
			</div>
		);
	}

	if (favorites.length === 0) {
		return (
			<div className='max-w-3xl mx-auto px-6 py-24 text-center'>
				<div className='w-24 h-24 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-6'>
					<Icon name='chart' className='w-10 h-10' />
				</div>
				<h1 className='text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4'>
					Ainda não há o que mostrar
				</h1>
				<p className='text-gray-600 dark:text-slate-400 mb-8'>
					Adicione livros à sua estante e o painel passa a mostrar seu progresso, autores mais lidos
					e distribuição por categoria.
				</p>
				<Link
					to='/'
					className='bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium'
				>
					Buscar livros
				</Link>
			</div>
		);
	}

	return (
		<div className='max-w-7xl mx-auto px-6 py-12'>
			<div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
				<div>
					<h1 className='text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2'>
						Painel da estante
					</h1>
					<p className='text-xl text-gray-600 dark:text-slate-400'>
						Um retrato do que você guardou e leu
					</p>
				</div>

				<div>
					<label
						htmlFor='ano-painel'
						className='block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1'
					>
						Ano
					</label>
					<select
						id='ano-painel'
						value={year}
						onChange={(e) => {
							setYear(Number(e.target.value));
							// O rascunho era do ano anterior; deixá-lo no campo faria o
							// placeholder da meta de um ano conviver com o valor de outro.
							setDraftTarget('');
							setWasClamped(false);
						}}
						className='px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent'
					>
						{years.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Meta de leitura */}
			<section className={`${cardClasses} p-6 mb-8`}>
				<div className='flex flex-wrap items-start justify-between gap-6'>
					<div className='flex-1 min-w-64'>
						<h2 className='text-lg font-semibold text-gray-900 dark:text-slate-100'>
							Meta de leitura de {year}
						</h2>

						{/* Antes a meta só carregava depois, e no intervalo a seção
						    afirmava "defina quantos livros você quer ler" para quem já
						    tinha uma meta — que então piscava e virava outra coisa. */}
						{isLoadingGoal ? (
							<div aria-live='polite'>
								<span className='sr-only'>Carregando a meta...</span>
								<div className='mt-2 h-5 w-64 max-w-full rounded bg-gray-200 dark:bg-slate-700 animate-pulse' />
								<div className='mt-4 h-3 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse' />
							</div>
						) : target > 0 ? (
							<>
								<p className='mt-1 text-gray-600 dark:text-slate-400'>
									{stats.finishedThisYear} de {target} livros concluídos
									{remaining > 0 ? ` — faltam ${remaining}` : ' — meta batida! 🎉'}
								</p>
								<div
									className='mt-4 h-3 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden'
									role='progressbar'
									aria-valuenow={goalPercent}
									aria-valuemin={0}
									aria-valuemax={100}
									aria-label={`Progresso da meta de leitura de ${year}`}
								>
									<div
										className='h-full rounded-full bg-emerald-500 transition-[width] duration-500'
										style={{ width: `${goalPercent}%` }}
									/>
								</div>
								<p className='mt-2 text-sm text-gray-600 dark:text-slate-400'>
									{goalPercent}% da meta
								</p>
							</>
						) : (
							<p className='mt-1 text-gray-600 dark:text-slate-400'>
								{year === currentYear
									? 'Defina quantos livros você quer ler neste ano.'
									: `Nenhuma meta registrada para ${year}. Dá para lançar agora.`}
							</p>
						)}
					</div>

					{/* `noValidate` porque a validação é nossa, como no formulário de
					    contato. Com a nativa ligada, digitar 100000 não gravava nada e
					    também não dizia nada em português: o navegador barrava o envio
					    com um balão próprio e o clique em "Salvar" parecia quebrado. */}
					<form
						className='flex flex-wrap items-end gap-2'
						noValidate
						onSubmit={(e) => {
							e.preventDefault();
							const parsed = Number(draftTarget);
							if (!Number.isFinite(parsed)) return;

							const safe = clampGoalTarget(parsed);
							setWasClamped(safe !== Math.trunc(parsed));
							setTarget(safe);
							setDraftTarget('');
						}}
					>
						<div>
							<label
								htmlFor='goal-target'
								className='block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1'
							>
								{target > 0 ? 'Alterar meta' : 'Definir meta'}
							</label>
							<input
								id='goal-target'
								type='number'
								min={0}
								max={MAX_READING_GOAL}
								value={draftTarget}
								onChange={(e) => {
									setDraftTarget(e.target.value);
									setWasClamped(false);
								}}
								placeholder={target > 0 ? String(target) : '24'}
								className='w-28 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent'
							/>
						</div>
						<button
							type='submit'
							disabled={isSaving || isLoadingGoal || !draftTarget.trim()}
							className='px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50'
						>
							{isSaving ? 'Salvando...' : 'Salvar'}
						</button>

						{wasClamped && (
							<p role='status' className='w-full text-xs text-amber-700 dark:text-amber-400'>
								O máximo é {MAX_READING_GOAL} livros por ano — a meta foi ajustada.
							</p>
						)}
					</form>
				</div>
			</section>

			{/* Números gerais */}
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8'>
				<StatCard icon='library' label='Livros na estante' value={numberFormatter.format(stats.total)} />
				<StatCard
					icon='pages'
					label='Páginas lidas'
					value={numberFormatter.format(stats.pagesRead)}
					hint={`de ${numberFormatter.format(stats.pagesTotal)} na estante`}
				/>
				<StatCard
					icon='check-circle'
					label={`Concluídos em ${year}`}
					value={numberFormatter.format(stats.finishedThisYear)}
				/>
				<StatCard
					icon='star'
					label='Sua nota média'
					value={stats.ratedCount > 0 ? stats.averageRating.toFixed(1) : '—'}
					hint={
						stats.ratedCount > 0
							? `${stats.ratedCount} ${stats.ratedCount === 1 ? 'livro avaliado' : 'livros avaliados'}`
							: 'Nenhum livro avaliado ainda'
					}
				/>
			</div>

			{/* Ritmo ao longo do ano */}
			<section className={`${cardClasses} p-6 mb-8`}>
				<div className='flex flex-wrap items-start justify-between gap-4 mb-6'>
					<div>
						<h2 className='text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1'>
							{chartUnit === 'pages' ? 'Páginas mês a mês' : 'Concluídos mês a mês'}
						</h2>
						<p className='text-sm text-gray-600 dark:text-slate-400'>
							{chartUnit === 'pages'
								? 'Cada avanço anotado entra no mês em que aconteceu.'
								: 'Cada livro entra no mês em que você marcou a conclusão.'}
						</p>
					</div>

					<div
						className='inline-flex rounded-lg border border-gray-300 dark:border-slate-600 overflow-hidden'
						role='group'
						aria-label='O que contar no gráfico'
					>
						{([
							['books', 'Livros'],
							['pages', 'Páginas'],
						] as const).map(([value, label]) => (
							<button
								key={value}
								type='button'
								onClick={() => setChartUnit(value)}
								aria-pressed={chartUnit === value}
								className={`focus-inset px-3 py-2 text-sm transition-colors ${
									chartUnit === value
										? 'bg-primary-600 text-white'
										: 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
								}`}
							>
								{label}
							</button>
						))}
					</div>
				</div>

				<MonthlyChart
					points={chartUnit === 'pages' ? pagePoints : pace.monthly}
					year={year}
					unit={chartUnit}
				/>

				{pace.total > 0 && (
					<dl className='mt-8 grid gap-4 sm:grid-cols-3 border-t border-gray-100 dark:border-slate-700 pt-6'>
						<div>
							<dt className='text-sm text-gray-600 dark:text-slate-400'>Ritmo médio</dt>
							<dd className='mt-1 text-2xl font-bold text-gray-900 dark:text-slate-100'>
								{paceFormatter.format(pace.average)}
								<span className='text-sm font-normal text-gray-600 dark:text-slate-400'>
									{' '}
									livros/mês
								</span>
							</dd>
						</div>

						<div>
							<dt className='text-sm text-gray-600 dark:text-slate-400'>Melhor mês</dt>
							<dd className='mt-1 text-2xl font-bold text-gray-900 dark:text-slate-100 capitalize'>
								{pace.best?.label ?? '—'}
								{pace.best && (
									<span className='text-sm font-normal text-gray-600 dark:text-slate-400'>
										{' '}
										({pace.best.count})
									</span>
								)}
							</dd>
						</div>

						<div>
							{/* Ano encerrado não tem o que projetar: o total já é o final. */}
							<dt className='text-sm text-gray-600 dark:text-slate-400'>
								{pace.projection === null ? `Total em ${year}` : 'Projeção do ano'}
							</dt>
							<dd className='mt-1 text-2xl font-bold text-gray-900 dark:text-slate-100'>
								{numberFormatter.format(pace.projection ?? pace.total)}
								<span className='text-sm font-normal text-gray-600 dark:text-slate-400'>
									{' '}
									livros
								</span>
							</dd>
							{pace.projection !== null && target > 0 && (
								<p className='mt-1 text-xs text-gray-600 dark:text-slate-400'>
									{pace.projection >= target
										? `No ritmo atual, a meta de ${target} é batida.`
										: `No ritmo atual, faltariam ${target - pace.projection} para a meta.`}
								</p>
							)}
						</div>
					</dl>
				)}
			</section>

			{/* Distribuição por estante */}
			<section className={`${cardClasses} p-6 mb-8`}>
				<h2 className='text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4'>
					Por estante
				</h2>
				<div className='grid gap-4 sm:grid-cols-3'>
					{SHELF_STATUSES.map((status) => {
						const count = stats.byStatus[status];
						const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

						return (
							// Abre a estante já filtrada, em vez de despejar a lista inteira.
							<Link
								key={status}
								to={`/favorites?estante=${SHELF_SLUGS[status]}`}
								aria-label={`Ver os ${count} livros da estante ${SHELF_LABELS[status]}`}
								className='rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:border-primary-400 dark:hover:border-primary-500 transition-colors'
							>
								<div className='flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400'>
									<Icon name={SHELF_ICONS[status]} className='w-4 h-4' />
									{SHELF_LABELS[status]}
								</div>
								<p className='mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100'>
									{count}
								</p>
								<div className='mt-2 h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden'>
									<div
										className='h-full rounded-full bg-primary-500'
										style={{ width: `${percent}%` }}
									/>
								</div>
							</Link>
						);
					})}
				</div>
			</section>

			<div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
				{/* Autores e categorias caem no filtro de texto da estante, que já
				    casa contra autoria e categorias; tags têm filtro próprio. */}
				<BarList
					title='Autores mais presentes'
					items={stats.topAuthors}
					emptyText='Nenhum autor identificado ainda.'
					linkFor={(label) => `/favorites?busca=${encodeURIComponent(label)}`}
					describe={(item) =>
						`Ver os ${item.count} livros de ${item.label} na estante`
					}
				/>
				<BarList
					title='Categorias'
					items={stats.topCategories}
					emptyText='Os livros salvos ainda não têm categoria.'
					linkFor={(label) => `/favorites?busca=${encodeURIComponent(label)}`}
					describe={(item) => `Ver os ${item.count} livros de ${item.label} na estante`}
				/>
				<BarList
					title='Suas tags'
					items={stats.topTags}
					emptyText='Você ainda não criou tags. Elas ficam na página de cada livro.'
					linkFor={(label) => `/favorites?tag=${encodeURIComponent(label)}`}
					describe={(item) => `Ver os ${item.count} livros com a tag ${item.label}`}
				/>
			</div>
		</div>
	);
};

export default Dashboard;
