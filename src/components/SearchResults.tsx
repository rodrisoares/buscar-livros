import React, { useMemo } from 'react';
import BookListing from './BookListing';
import SearchFilters from './SearchFilters';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import ViewToggle from './ViewToggle';
import Icon from './Icon';
import { BookGridSkeleton } from './BookCardSkeleton';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useFavorites } from '@/hooks/useFavorites';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { collectAuthorSuggestions, collectSubjectSuggestions } from '@/lib/searchSuggestions';
import { MAX_PAGINATED_RESULTS, PAGE_SIZE_OPTIONS, getPageRange } from '@/lib/pagination';
import {
	SHELF_PRESENCES,
	SHELF_PRESENCE_LABELS,
	filterByShelfPresence,
} from '@/lib/shelfPresence';
import type { SortOption } from '@/types/GoogleBooks';

interface SearchResultsProps {
	className?: string;
}

const numberFormatter = new Intl.NumberFormat('pt-BR');

const selectClasses =
	'px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm';

const SearchResults: React.FC<SearchResultsProps> = ({ className = '' }) => {
	const {
		filters,
		query,
		activeFilterCount,
		filterChips,
		page,
		sort,
		view,
		perPage,
		presence,
		books,
		totalItems,
		totalPages,
		isLoading,
		isRefreshing,
		error,
		retry,
		applyFilters,
		removeFilter,
		goToPage,
		changeSort,
		changeView,
		changePerPage,
		changePresence,
	} = useBookSearch();

	const { favorites, isFavorite } = useFavorites();

	useDocumentTitle(query ? `Busca: ${query}` : 'Resultados da busca');

	/**
	 * O recorte por estante é local: a Google Books não sabe o que está guardado
	 * aqui. Ele vale sobre a página carregada, e o texto abaixo diz isso.
	 */
	const visibleBooks = useMemo(
		() => filterByShelfPresence(books, isFavorite, presence),
		[books, isFavorite, presence]
	);

	const { from, to } = getPageRange(page, books.length, perPage);

	/**
	 * Sugestões da busca avançada: o que já apareceu nesta página de resultados
	 * mais o que está na estante. Não custa requisição nenhuma — são dados que
	 * já estão em memória.
	 */
	const suggestionSource = useMemo(() => [...books, ...favorites], [books, favorites]);
	const authorOptions = useMemo(
		() => collectAuthorSuggestions(suggestionSource),
		[suggestionSource]
	);
	const subjectOptions = useMemo(
		() => collectSubjectSuggestions(suggestionSource),
		[suggestionSource]
	);

	// A busca fica no topo dos resultados, para não obrigar o usuário a "voltar" para buscar de novo.
	const header = (
		<div className='mb-8'>
			{/* A barra de busca vive na faixa compacta logo acima (HeroSection
			    variant="compact"); duplicá-la aqui daria dois campos na mesma tela. */}
			<SearchFilters
				filters={filters}
				activeCount={activeFilterCount}
				onApply={applyFilters}
				authorOptions={authorOptions}
				subjectOptions={subjectOptions}
			/>

			{filterChips.length > 0 && (
				<ul className='mt-4 flex flex-wrap gap-2'>
					{filterChips.map((chip) => (
						<li key={chip.key}>
							{/* Cada chip agora desfaz o próprio filtro: antes era um rótulo
							    morto e tirar um filtro exigia reabrir o painel. */}
							<button
								type='button'
								onClick={() => removeFilter(chip.key)}
								className='group inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors'
								aria-label={`Remover filtro ${chip.label}`}
							>
								{chip.label}
								<Icon name='x' className='w-3.5 h-3.5 opacity-70 group-hover:opacity-100' />
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);

	const wrapper = (children: React.ReactNode) => (
		<section className={`bg-white dark:bg-slate-900 py-12 px-6 ${className}`}>
			<div className='max-w-6xl mx-auto'>
				{header}
				{children}
			</div>
		</section>
	);

	if (isLoading) {
		return wrapper(<BookGridSkeleton />);
	}

	if (error) {
		return wrapper(
			<EmptyState
				icon='alert'
				variant='error'
				title='Não foi possível concluir a busca'
				description={error}
				actions={
					<button
						onClick={() => retry()}
						className='bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors'
					>
						Tentar novamente
					</button>
				}
			/>
		);
	}

	if (books.length === 0) {
		return wrapper(
			<EmptyState
				icon='search'
				title='Nenhum livro encontrado'
				description={
					page > 1
						? `A página ${page} não tem resultados.`
						: activeFilterCount > 0
							? 'Nenhum livro atende a todos os filtros. Tente afrouxar algum deles.'
							: `Não encontramos livros para "${query}". Tente uma busca diferente.`
				}
				actions={
					page > 1 ? (
						<button
							onClick={() => goToPage(1)}
							className='bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors'
						>
							Voltar à primeira página
						</button>
					) : null
				}
			/>
		);
	}

	return wrapper(
		<>
			{/* O título virou marco só para leitor de tela: "Resultados da busca"
			    sobre "Exibindo 1–20 de 3.000" eram dois níveis para a mesma
			    informação, e a tela já diz onde está pelo campo de busca acima. */}
			<h2 className='sr-only'>Resultados da busca</h2>

			<div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					{/* Mostra a fatia atual e o total real, em vez de "encontramos 20 livros". */}
					<p className='text-gray-700 dark:text-slate-200' aria-live='polite'>
						Exibindo {numberFormatter.format(from)}–{numberFormatter.format(to)} de{' '}
						{numberFormatter.format(totalItems)} {totalItems === 1 ? 'resultado' : 'resultados'}
						{query && ` para "${query}"`}
						{totalItems > MAX_PAGINATED_RESULTS && (
							<span className='text-gray-600 dark:text-slate-400'>
								{' '}
								(navegáveis: {numberFormatter.format(MAX_PAGINATED_RESULTS)})
							</span>
						)}
					</p>
				</div>

				<div className='flex flex-wrap items-center gap-3'>
					<label htmlFor='per-page' className='sr-only'>
						Resultados por página
					</label>
					<select
						id='per-page'
						value={perPage}
						onChange={(e) => changePerPage(Number(e.target.value))}
						className={selectClasses}
						title='Resultados por página'
					>
						{PAGE_SIZE_OPTIONS.map((size) => (
							<option key={size} value={size}>
								{size} por página
							</option>
						))}
					</select>

					<label htmlFor='sort-results' className='sr-only'>
						Ordenar por
					</label>
					<select
						id='sort-results'
						value={sort}
						onChange={(e) => changeSort(e.target.value as SortOption)}
						className={selectClasses}
						title='Ordenar por'
					>
						<option value='relevance'>Relevância</option>
						<option value='newest'>Mais recentes</option>
					</select>

					<ViewToggle value={view} onChange={changeView} />
				</div>
			</div>

			{/* Recorte pela estante — local, sobre a página carregada. */}
			<div className='mb-6 flex flex-wrap items-center gap-2'>
				<span className='text-sm text-gray-600 dark:text-slate-400'>Mostrar:</span>
				{SHELF_PRESENCES.map((value) => (
					<button
						key={value || 'todos'}
						type='button'
						onClick={() => changePresence(value)}
						aria-pressed={presence === value}
						className={`px-3 py-1 rounded-full border text-sm transition-colors ${
							presence === value
								? 'border-primary-600 bg-primary-600 text-white'
								: 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-primary-400'
						}`}
					>
						{SHELF_PRESENCE_LABELS[value]}
					</button>
				))}

				{presence !== '' && (
					<span className='text-xs text-gray-600 dark:text-slate-400' aria-live='polite'>
						{visibleBooks.length} de {books.length} nesta página
					</span>
				)}
			</div>

			<Pagination
				page={page}
				totalPages={totalPages}
				onPageChange={goToPage}
				disabled={isRefreshing}
				variant='compact'
				className='mb-6'
			/>

			{/* Trocar a grade por skeleton a cada página anulava o keepPreviousData
			    e a tela piscava inteira; esmaecer tudo a 50% era quase o mesmo
			    efeito, mais lento. Uma barra fina diz "estou buscando" sem apagar
			    a lista que o usuário está lendo — e ela continua clicável, porque
			    os resultados anteriores seguem válidos. */}
			<div aria-busy={isRefreshing}>
				<div
					className='h-0.5 mb-4 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800'
					aria-hidden='true'
				>
					{isRefreshing && <div className='h-full w-1/3 rounded-full bg-primary-500 barra-indeterminada' />}
				</div>

				{visibleBooks.length === 0 ? (
					<EmptyState
						icon='library'
						title={
							presence === 'mine'
								? 'Nenhum destes já está na sua estante'
								: 'Todos estes já estão na sua estante'
						}
						description='O recorte vale só para esta página de resultados. Veja as outras páginas ou volte para "Todos".'
						actions={
							<button
								onClick={() => changePresence('')}
								className='bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors'
							>
								Mostrar todos
							</button>
						}
					/>
				) : (
					<BookListing view={view} books={visibleBooks} />
				)}
			</div>

			<Pagination
				page={page}
				totalPages={totalPages}
				onPageChange={goToPage}
				disabled={isRefreshing}
				className='mt-12'
			/>
		</>
	);
};

export default SearchResults;
