import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BookListing from '@/components/BookListing';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import ViewToggle from '@/components/ViewToggle';
import Icon, { type IconName } from '@/components/Icon';
import BulkActionBar from '@/components/shelf/BulkActionBar';
import ManageShelves from '@/components/shelf/ManageShelves';
import ShelfTagFilter from '@/components/shelf/ShelfTagFilter';
import { useFavorites } from '@/hooks/useFavorites';
import { useCustomShelves } from '@/hooks/useCustomShelves';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSelection } from '@/hooks/useSelection';
import { useShelfFilters } from '@/hooks/useShelfFilters';
import { SHELF_PAGE_SIZE, clampLocalPage, countPages, sliceForPage } from '@/lib/pagination';
import {
	RATING_FILTERS,
	RATING_FILTER_LABELS,
	SHELF_SORTS,
	SHELF_SORT_LABELS,
	collectShelfTags,
	countByCustomShelf,
	countByShelfTab,
	countShelfTagMatches,
	toCustomTab,
	filterAndSortShelf,
	hasActiveShelfFilters,
	type RatingFilter,
	type ShelfSort,
	type ShelfTab,
} from '@/lib/shelfFilters';
import { SHELF_ICONS, SHELF_LABELS, SHELF_STATUSES } from '@/types/Shelf';

interface TabItem {
	value: ShelfTab;
	label: string;
	icon: IconName;
	count: number;
}

const PANEL_ID = 'estante-lista';

/** O valor da aba personalizada carrega `:`, que não cabe num id de elemento. */
const tabId = (value: ShelfTab) => `estante-aba-${value.replace(':', '-')}`;

const primaryButton =
	'bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium inline-block';

const numberFormatter = new Intl.NumberFormat('pt-BR');

const Favorites: React.FC = () => {
	const {
		favorites,
		favoritesCount,
		isLoading,
		loadError,
		refreshError,
		isRefreshing,
		refetch,
		isBulkPending,
		setStatusMany,
		tagMany,
		shelfMany,
		removeMany,
	} = useFavorites();

	const { shelves: customShelves } = useCustomShelves();

	const {
		filters,
		setTab,
		setSort,
		setTerm,
		setTags,
		toggleTag,
		setRating,
		setHasNotes,
		setView,
		setPage,
		clearFilters,
	} = useShelfFilters(customShelves);

	useDocumentTitle('Minha estante');

	// O campo de texto responde à digitação na hora e só depois escreve na URL.
	const [draftTerm, setDraftTerm] = useState(filters.term);
	const debouncedTerm = useDebouncedValue(draftTerm, 300);
	const [isSelecting, setIsSelecting] = useState(false);
	const [isManagingShelves, setIsManagingShelves] = useState(false);
	const tabRefs = useRef(new Map<ShelfTab, HTMLButtonElement | null>());

	// A URL é a fonte da verdade: voltar no histórico ou abrir um link pronto
	// precisa preencher o campo.
	useEffect(() => {
		setDraftTerm(filters.term);
	}, [filters.term]);

	useEffect(() => {
		if (debouncedTerm.trim() === filters.term) return;
		setTerm(debouncedTerm);
	}, [debouncedTerm, filters.term, setTerm]);

	const counts = useMemo(() => countByShelfTab(favorites), [favorites]);
	const shelfCounts = useMemo(() => countByCustomShelf(favorites), [favorites]);
	const allTags = useMemo(() => collectShelfTags(favorites), [favorites]);

	// As três fixas primeiro, as criadas pelo usuário depois, na ordem delas.
	const tabs = useMemo<TabItem[]>(
		() => [
			{ value: 'all', label: 'Todos', icon: 'library', count: counts.all },
			...SHELF_STATUSES.map((status) => ({
				value: status as ShelfTab,
				label: SHELF_LABELS[status],
				icon: SHELF_ICONS[status],
				count: counts[status],
			})),
			...customShelves.map((shelf) => ({
				value: toCustomTab(shelf.recordId),
				label: shelf.name,
				icon: shelf.icon,
				count: shelfCounts[shelf.recordId] ?? 0,
			})),
		],
		[counts, shelfCounts, customShelves]
	);
	const visibleBooks = useMemo(
		() => filterAndSortShelf(favorites, filters),
		[favorites, filters]
	);

	// A seleção acompanha a lista filtrada inteira, não só a página visível.
	const visibleIds = useMemo(() => visibleBooks.map((book) => book.id), [visibleBooks]);
	const selection = useSelection(visibleIds);

	const totalPages = countPages(visibleBooks.length, SHELF_PAGE_SIZE);
	const currentPage = clampLocalPage(filters.page, visibleBooks.length, SHELF_PAGE_SIZE);
	const pageBooks = useMemo(
		() => sliceForPage(visibleBooks, currentPage, SHELF_PAGE_SIZE),
		[visibleBooks, currentPage]
	);

	const firstOnPage = visibleBooks.length === 0 ? 0 : (currentPage - 1) * SHELF_PAGE_SIZE + 1;
	const lastOnPage = firstOnPage === 0 ? 0 : firstOnPage + pageBooks.length - 1;

	/** Sair do modo seleção não pode deixar marcações penduradas e invisíveis. */
	const stopSelecting = () => {
		setIsSelecting(false);
		selection.clear();
	};

	/** Setas percorrem as abas, como manda o padrão de `tablist`. */
	const handleTabKeyDown = (event: React.KeyboardEvent, index: number) => {
		const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
		let next = -1;

		if (event.key in offsets) next = (index + offsets[event.key] + tabs.length) % tabs.length;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = tabs.length - 1;
		else return;

		event.preventDefault();
		setTab(tabs[next].value);
		tabRefs.current.get(tabs[next].value)?.focus();
	};

	const filterLabelClasses = 'block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1';

	const fieldClasses =
		'px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm';

	return (
		<div className='max-w-7xl mx-auto px-6 py-12'>
			<div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
				<div>
					<h1 className='text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2'>
						Minha estante
					</h1>
					<p className='text-xl text-gray-600 dark:text-slate-400'>
						O que você quer ler, está lendo e já leu
					</p>
				</div>
				<Link
					to='/dashboard'
					className='text-sm font-medium text-primary-700 dark:text-primary-300 hover:underline underline-offset-4'
				>
					Ver painel da estante →
				</Link>
			</div>

			{/* A estante veio do cache e a atualização falhou: os livros ficam na
			    tela, com o aviso de que podem estar desatualizados e um botão para
			    tentar de novo. Esconder tudo atrás de um erro entregaria menos. */}
			{refreshError && (
				<div
					role='status'
					className='mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200'
				>
					<span className='flex-1'>{refreshError}</span>
					<button
						onClick={() => refetch()}
						disabled={isRefreshing}
						className='rounded-md border border-amber-400 px-3 py-1 font-medium transition-colors hover:bg-amber-100 disabled:opacity-60 dark:border-amber-600 dark:hover:bg-amber-900/40'
					>
						{isRefreshing ? 'Atualizando...' : 'Tentar novamente'}
					</button>
				</div>
			)}

			{isLoading ? (
				<div className='text-center py-16' role='status' aria-live='polite'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto'></div>
					<p className='mt-4 text-gray-600 dark:text-slate-400'>Carregando sua estante...</p>
				</div>
			) : loadError ? (
				<EmptyState
					icon='alert'
					variant='error'
					title='Erro ao carregar a estante'
					description={loadError}
					/* Sem esta saída a tela era um beco: só restava recarregar a página. */
					actions={
						<>
							<button onClick={() => refetch()} className={primaryButton}>
								Tentar novamente
							</button>
							<Link
								to='/'
								className='border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium'
							>
								Ir para a busca
							</Link>
						</>
					}
				/>
			) : favoritesCount === 0 ? (
				<EmptyState
					icon='library'
					title='Sua estante está vazia'
					description='Busque um livro e escolha se quer ler, está lendo ou já leu.'
					actions={
						<Link to='/' className={primaryButton}>
							Explorar livros
						</Link>
					}
				/>
			) : (
				<div>
					<div
						className='flex flex-wrap gap-2 border-b border-gray-200 dark:border-slate-700 mb-6'
						role='tablist'
						aria-label='Estantes'
					>
						{tabs.map((item, index) => {
							const isSelected = filters.tab === item.value;

							return (
								<button
									key={item.value}
									ref={(node) => {
										tabRefs.current.set(item.value, node);
									}}
									type='button'
									role='tab'
									id={tabId(item.value)}
									aria-selected={isSelected}
									aria-controls={PANEL_ID}
									// Só a aba ativa entra na ordem de tabulação: dentro do grupo
									// quem navega são as setas.
									tabIndex={isSelected ? 0 : -1}
									onClick={() => setTab(item.value)}
									onKeyDown={(event) => handleTabKeyDown(event, index)}
									className={`px-4 py-2 -mb-px border-b-2 text-sm transition-colors ${
										isSelected
											? 'border-primary-600 text-primary-700 dark:text-primary-300 font-semibold'
											: 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
									}`}
								>
									<span className='inline-flex items-center gap-1.5'>
										<Icon name={item.icon} className='w-4 h-4' />
										{item.label}
									</span>
									<span className='ml-2 text-xs text-gray-600 dark:text-slate-400'>
										{item.count}
									</span>
								</button>
							);
						})}
					</div>

					{/* Uma linha só que quebra por controle.
					    Era uma grade que só mudava de forma em `lg`: entre 640 e 1024
					    o campo de texto ficava sozinho numa linha e os quatro controles
					    se espremiam na seguinte, com sobras irregulares. Aqui cada
					    controle tem largura mínima própria e desce inteiro quando não
					    cabe — o campo de busca cresce e ocupa o que sobrar. */}
					<div className='mb-4 flex flex-wrap items-end gap-3'>
						<div className='flex-1 min-w-64'>
							<label htmlFor='favorites-filter' className={filterLabelClasses}>
								Filtrar
							</label>
							<input
								id='favorites-filter'
								type='search'
								value={draftTerm}
								onChange={(e) => setDraftTerm(e.target.value)}
								placeholder='Título, autor, editora, tag...'
								className={`w-full ${fieldClasses}`}
							/>
						</div>

						{allTags.length > 0 && (
							<div className='flex-1 sm:flex-none min-w-36'>
								<span className={filterLabelClasses}>Tags</span>
								<ShelfTagFilter
									allTags={allTags}
									selected={filters.tags}
									countFor={(tag) => countShelfTagMatches(favorites, filters, tag)}
									onToggle={toggleTag}
									onClear={() => setTags([])}
									className='w-full'
								/>
							</div>
						)}

						<div className='flex-1 sm:flex-none min-w-40'>
							<label htmlFor='rating-filter' className={filterLabelClasses}>
								Nota
							</label>
							<select
								id='rating-filter'
								value={filters.rating}
								onChange={(e) => setRating(e.target.value as RatingFilter)}
								className={`w-full ${fieldClasses}`}
							>
								{RATING_FILTERS.map((value) => (
									<option key={value || 'any'} value={value}>
										{RATING_FILTER_LABELS[value]}
									</option>
								))}
							</select>
						</div>

						<div className='flex-1 sm:flex-none min-w-48'>
							<label htmlFor='sort-select' className={filterLabelClasses}>
								Ordenar por
							</label>
							<select
								id='sort-select'
								value={filters.sort}
								onChange={(e) => setSort(e.target.value as ShelfSort)}
								className={`w-full ${fieldClasses}`}
							>
								{SHELF_SORTS.map((sort) => (
									<option key={sort} value={sort}>
										{SHELF_SORT_LABELS[sort]}
									</option>
								))}
							</select>
						</div>

						<div>
							<span className={filterLabelClasses}>Visão</span>
							<ViewToggle value={filters.view} onChange={setView} />
						</div>
					</div>

					{/* Segunda linha: o que não é campo — alternador de anotações e seleção. */}
					<div className='mb-6 flex flex-wrap items-center gap-4'>
						<label className='inline-flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 cursor-pointer'>
							<input
								type='checkbox'
								checked={filters.hasNotes}
								onChange={(e) => setHasNotes(e.target.checked)}
								className='w-4 h-4 accent-primary-600'
							/>
							Só com anotações
						</label>

						{filters.tags.length > 0 && (
							<ul className='flex flex-wrap gap-2'>
								{filters.tags.map((tag) => (
									<li key={tag}>
										<button
											type='button'
											onClick={() => toggleTag(tag)}
											aria-label={`Remover a tag ${tag} do filtro`}
											className='group inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-secondary-100 dark:bg-secondary-950 text-secondary-800 dark:text-secondary-200 text-xs hover:bg-secondary-200 dark:hover:bg-secondary-900 transition-colors'
										>
											{tag}
											<Icon name='x' className='w-3.5 h-3.5 opacity-70 group-hover:opacity-100' />
										</button>
									</li>
								))}
							</ul>
						)}

						<div className='ml-auto flex items-center gap-2'>
							<button
								type='button'
								onClick={() => setIsManagingShelves((open) => !open)}
								aria-expanded={isManagingShelves}
								aria-controls='painel-estantes'
								className='inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors'
							>
								<Icon name='bookmark' className='w-4 h-4' />
								Gerenciar estantes
								<Icon
									name='chevron-down'
									className={`w-4 h-4 transition-transform ${isManagingShelves ? 'rotate-180' : ''}`}
								/>
							</button>

							<button
								type='button'
								onClick={() => (isSelecting ? stopSelecting() : setIsSelecting(true))}
								aria-pressed={isSelecting}
								className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
									isSelecting
										? 'border-primary-600 bg-primary-600 text-white'
										: 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
								}`}
							>
								<Icon name='check' className='w-4 h-4' />
								{isSelecting ? 'Sair da seleção' : 'Selecionar'}
							</button>
						</div>
					</div>

					{isManagingShelves && (
						<div id='painel-estantes' className='mb-6'>
							<ManageShelves counts={shelfCounts} />
						</div>
					)}

					<div id={PANEL_ID} role='tabpanel' aria-labelledby={tabId(filters.tab)} tabIndex={-1}>
						<p className='text-gray-600 dark:text-slate-300 mb-6' aria-live='polite'>
							{hasActiveShelfFilters(filters)
								? `${numberFormatter.format(visibleBooks.length)} de ${numberFormatter.format(favoritesCount)} ${favoritesCount === 1 ? 'livro' : 'livros'}`
								: `${numberFormatter.format(favoritesCount)} ${favoritesCount !== 1 ? 'livros' : 'livro'} na sua estante`}
							{totalPages > 1 && (
								<span className='text-gray-600 dark:text-slate-400'>
									{' '}
									· exibindo {numberFormatter.format(firstOnPage)}–
									{numberFormatter.format(lastOnPage)}
								</span>
							)}
						</p>

						{visibleBooks.length === 0 ? (
							<EmptyState
								icon='search'
								title='Nenhum livro nesta seleção'
								description='Tente outro termo, outra tag ou volte para todas as estantes.'
								actions={
									<button
										onClick={() => {
											setDraftTerm('');
											clearFilters();
										}}
										className={primaryButton}
									>
										Limpar filtros
									</button>
								}
							/>
						) : (
							<>
								<BookListing
									view={filters.view}
									books={pageBooks}
									selectable={isSelecting}
									selectedIds={selection.selectedIds}
									onSelectChange={selection.toggle}
								/>

								<Pagination
									page={currentPage}
									totalPages={totalPages}
									onPageChange={setPage}
									className='mt-10'
								/>
							</>
						)}
					</div>

					{isSelecting && selection.count > 0 && (
						<BulkActionBar
							count={selection.count}
							totalVisible={visibleBooks.length}
							isAllSelected={selection.isAllSelected}
							disabled={isBulkPending}
							tagSuggestions={allTags}
							customShelves={customShelves}
							onToggleShelf={(shelfId, shelfName, mode) => {
								shelfMany(selection.ids, shelfId, shelfName, mode);
								selection.clear();
							}}
							onSelectAll={selection.selectAll}
							onClear={selection.clear}
							onSetStatus={(status) => {
								setStatusMany(selection.ids, status);
								selection.clear();
							}}
							onTag={(tag, mode) => {
								tagMany(selection.ids, tag, mode);
								selection.clear();
							}}
							onRemove={() => {
								removeMany(selection.ids);
								selection.clear();
							}}
						/>
					)}

				</div>
			)}
		</div>
	);
};

export default Favorites;
