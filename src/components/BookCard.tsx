import React from 'react';
import { Link } from 'react-router-dom';
import type { Book } from '@/types/Book';
import { SHELF_BADGE_CLASSES, SHELF_ICONS, SHELF_LABELS } from '@/types/Shelf';
import { useFavorites } from '@/hooks/useFavorites';
import { useCustomShelves } from '@/hooks/useCustomShelves';
import { getReadingProgress } from '@/lib/shelfStats';
import { getPublicationYear } from '@/utils/bookLabels';
import BookCover from './BookCover';
import HeartIcon from './HeartIcon';
import Icon from './Icon';
import ShelfMenu from './shelf/ShelfMenu';
import ShelfBadges from './shelf/ShelfBadges';
import { ProgressBar } from './shelf/ReadingProgress';

interface BookCardProps {
	book: Book;
	/** Modo seleção da estante: o card ganha caixa de marcação e deixa de navegar pela capa. */
	selectable?: boolean;
	selected?: boolean;
	onSelectChange?: (selected: boolean) => void;
	className?: string;
}

const BookCard: React.FC<BookCardProps> = ({
	book,
	selectable = false,
	selected = false,
	onSelectChange,
	className = '',
}) => {
	const { toggleFavorite, findFavorite, isUpdatingBook } = useFavorites();
	const { shelves: customShelves } = useCustomShelves();
	const favorite = findFavorite(book.id);
	const isBookFavorite = Boolean(favorite);
	// Só este card reage: antes qualquer escrita punha spinner na grade inteira.
	const isSaving = isUpdatingBook(book.id);

	const meta = [
		getPublicationYear(book.publishedDate),
		book.publisher,
		book.pageCount > 0 ? `${book.pageCount} págs.` : '',
	].filter(Boolean);

	const handleToggleFavorite = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		toggleFavorite(book);
	};

	const toggleSelection = () => onSelectChange?.(!selected);

	const cover = (
		<div className='w-full aspect-[2/3] rounded bg-gray-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center'>
			<BookCover
				src={book.thumbnail}
				title={book.title}
				className='w-full h-full object-contain hover:opacity-80 transition-opacity'
			/>
		</div>
	);

	return (
		// h-full + flex-col deixam todos os cards da linha com a mesma altura,
		// e os botões alinhados no rodapé independentemente do conteúdo.
		<article
			className={`h-full flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg dark:shadow-slate-950/40 transition-shadow duration-300 p-4 relative ${
				selected ? 'ring-2 ring-primary-500' : ''
			} ${className}`}
		>
			{selectable && (
				<label className='absolute top-2 left-2 z-10 flex items-center gap-2 rounded-lg bg-white/90 dark:bg-slate-700/90 border border-gray-200 dark:border-slate-600 px-2 py-1.5 cursor-pointer'>
					<input
						type='checkbox'
						checked={selected}
						onChange={toggleSelection}
						className='w-4 h-4 accent-primary-600'
					/>
					<span className='sr-only'>Selecionar {book.title}</span>
				</label>
			)}

			<div className='absolute top-2 right-2 z-10 flex items-center gap-1'>
				<button
					type='button'
					onClick={handleToggleFavorite}
					disabled={isSaving}
					aria-pressed={isBookFavorite}
					aria-busy={isSaving}
					aria-label={
						isBookFavorite
							? `Remover ${book.title} da estante`
							: `Adicionar ${book.title} à estante`
					}
					className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 disabled:cursor-wait ${
						isBookFavorite
							? 'bg-red-500 hover:bg-red-600 text-white shadow-md'
							: 'bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-600 text-gray-500 dark:text-slate-300 hover:text-red-500 border border-gray-200 dark:border-slate-600'
					}`}
					title={isBookFavorite ? 'Remover da estante' : 'Adicionar à estante'}
				>
					{isSaving ? (
						<span className='block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin' />
					) : (
						<HeartIcon filled={isBookFavorite} />
					)}
				</button>

				{/* O coração resolve o caso comum; o menu resolve o caso exato. */}
				<ShelfMenu book={book} favorite={favorite} disabled={isSaving} />
			</div>

			{/* Capa proporcional (2:3) com fundo neutro: capas de tamanhos
			    diferentes deixam de esticar ou cortar. Em modo seleção ela vira
			    o alvo grande de marcar, em vez de levar para a ficha. */}
			{selectable ? (
				<button
					type='button'
					onClick={toggleSelection}
					aria-pressed={selected}
					aria-label={`Selecionar ${book.title}`}
					className='block mb-4 w-full text-left'
				>
					{cover}
				</button>
			) : (
				<Link to={`/book/${book.id}`} className='block mb-4' tabIndex={-1} aria-hidden='true'>
					{cover}
				</Link>
			)}

			<div className='flex flex-col flex-1 gap-2'>
				{favorite && (
					<div className='flex flex-wrap items-center gap-2'>
						<span
							className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${SHELF_BADGE_CLASSES[favorite.status]}`}
						>
							<Icon name={SHELF_ICONS[favorite.status]} className='w-3.5 h-3.5' />
							{SHELF_LABELS[favorite.status]}
						</span>
						{favorite.rating > 0 && (
							<span
								className='inline-flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400'
								aria-label={`Sua nota: ${favorite.rating} de 5`}
							>
								{Array.from({ length: favorite.rating }, (_, i) => (
									<Icon key={i} name='star' className='w-3 h-3' />
								))}
							</span>
						)}
						{/* Estante personalizada ao lado do status, não no lugar dele. */}
						<ShelfBadges shelfIds={favorite.shelves} shelves={customShelves} limit={1} />
					</div>
				)}

				<h3 className='font-semibold text-gray-900 dark:text-slate-100 text-sm line-clamp-2'>
					<Link
						to={`/book/${book.id}`}
						className='hover:text-primary-700 dark:hover:text-primary-300 transition-colors'
					>
						{book.title}
					</Link>
				</h3>

				{/* gray-600/400 em vez de gray-500: contraste AA no texto pequeno. */}
				<p className='text-xs text-gray-600 dark:text-slate-400'>por {book.author}</p>

				{favorite?.status === 'reading' && (
					<div>
						<ProgressBar percent={getReadingProgress(favorite)} />
						<p className='mt-1 text-xs text-gray-600 dark:text-slate-400'>
							{getReadingProgress(favorite)}% lido
						</p>
					</div>
				)}

				{/* Ano, editora e páginas numa linha só: em quatro colunas, três linhas
				    de metadados viravam ruído e empurravam os botões para baixo. */}
				{meta.length > 0 && (
					<p className='text-xs text-gray-600 dark:text-slate-400 line-clamp-1'>
						{meta.join(' · ')}
					</p>
				)}

				{(favorite?.tags.length ? favorite.tags : book.categories).length > 0 && (
					<div className='flex flex-wrap gap-1'>
						{(favorite?.tags.length ? favorite.tags : book.categories).slice(0, 2).map((label) => (
							<span
								key={label}
								className={`inline-block text-xs px-2 py-1 rounded ${
									favorite?.tags.length
										? 'bg-secondary-100 dark:bg-secondary-950 text-secondary-800 dark:text-secondary-200'
										: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
								}`}
							>
								{label}
							</span>
						))}
					</div>
				)}

				{/* mt-auto prende os botões no rodapé do card. */}
				<div className='flex gap-2 mt-auto pt-4'>
					<Link
						to={`/book/${book.id}`}
						className='flex-1 bg-primary-600 hover:bg-primary-700 text-white text-xs py-2.5 px-3 rounded transition-colors text-center font-medium'
					>
						Ver Detalhes
					</Link>
					{book.previewLink && (
						// Ação secundária em contorno, revelada no hover: com oito
						// elementos empilhados, quatro cards por linha viravam um muro.
						// Ela segue no fluxo (sem salto de layout) e alcançável pelo
						// teclado, porque o foco dentro do card também a revela.
						<a
							href={book.previewLink}
							target='_blank'
							rel='noopener noreferrer'
							className='acao-no-hover flex-1 border border-primary-600 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950 text-xs py-2.5 px-3 rounded transition-colors text-center font-medium'
						>
							Visualizar
						</a>
					)}
				</div>
			</div>
		</article>
	);
};

export default BookCard;
