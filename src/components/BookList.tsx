import React from 'react';
import { Link } from 'react-router-dom';
import type { Book } from '@/types/Book';
import { SHELF_BADGE_CLASSES, SHELF_ICONS, SHELF_LABELS } from '@/types/Shelf';
import { useFavorites } from '@/hooks/useFavorites';
import { useCustomShelves } from '@/hooks/useCustomShelves';
import { getReadingProgress } from '@/lib/shelfStats';
import BookCover from './BookCover';
import HeartIcon from './HeartIcon';
import Icon from './Icon';
import ShelfMenu from './shelf/ShelfMenu';
import ShelfBadges from './shelf/ShelfBadges';
import type { BookListingProps } from './BookGrid';
import { ProgressBar } from './shelf/ReadingProgress';

interface BookRowProps {
	book: Book;
	selectable: boolean;
	selected: boolean;
	onSelectChange?: (selected: boolean) => void;
}

/**
 * Uma linha por livro.
 *
 * A grade de capas é boa para descobrir e ruim para percorrer oitenta livros:
 * cada card ocupa uma tela inteira de rolagem. Aqui cabem dez livros na mesma
 * altura, com estante, progresso e nota lado a lado para comparar.
 *
 * Recebe `Book`, não `FavoriteBook`: a mesma lista serve aos resultados de
 * busca, onde o livro pode não estar na estante — os dados de leitura vêm do
 * cache compartilhado quando existem.
 */
const BookRow: React.FC<BookRowProps> = ({ book, selectable, selected, onSelectChange }) => {
	const { toggleFavorite, findFavorite, isUpdatingBook } = useFavorites();
	const { shelves: customShelves } = useCustomShelves();
	const favorite = findFavorite(book.id);
	const isSaving = isUpdatingBook(book.id);
	const percent = favorite ? getReadingProgress(favorite) : 0;

	return (
		<li
			className={`flex items-center gap-4 px-4 py-3 transition-colors ${
				selected ? 'bg-primary-50 dark:bg-primary-950/40' : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'
			}`}
		>
			{selectable && (
				<label className='shrink-0 flex items-center cursor-pointer'>
					<input
						type='checkbox'
						checked={selected}
						onChange={() => onSelectChange?.(!selected)}
						className='w-4 h-4 accent-primary-600'
					/>
					<span className='sr-only'>Selecionar {book.title}</span>
				</label>
			)}

			<Link to={`/book/${book.id}`} tabIndex={-1} aria-hidden='true' className='shrink-0'>
				<div className='w-10 aspect-[2/3] rounded bg-gray-100 dark:bg-slate-700 overflow-hidden'>
					<BookCover
						src={book.thumbnail}
						title={book.title}
						className='w-full h-full object-cover'
					/>
				</div>
			</Link>

			{/* min-w-0 é o que permite o truncamento funcionar dentro do flex. */}
			<div className='min-w-0 flex-1'>
				<h3 className='font-medium text-sm text-gray-900 dark:text-slate-100 truncate'>
					<Link
						to={`/book/${book.id}`}
						className='hover:text-primary-700 dark:hover:text-primary-300 transition-colors'
					>
						{book.title}
					</Link>
				</h3>
				<p className='text-xs text-gray-600 dark:text-slate-400 truncate'>{book.author}</p>

				{/* Abaixo de `md` as colunas da direita não cabem; sem esta linha a
				    lista no celular mostrava só título e autor, e perdia a vantagem
				    que ela tem sobre a grade. */}
				{favorite && (
					<p className='md:hidden mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-600 dark:text-slate-400'>
						<span className='inline-flex items-center gap-1'>
							<Icon name={SHELF_ICONS[favorite.status]} className='w-3 h-3' />
							{SHELF_LABELS[favorite.status]}
						</span>

						{favorite.status === 'reading' && <span aria-hidden='true'>·</span>}
						{favorite.status === 'reading' && <span>{percent}% lido</span>}

						{favorite.rating > 0 && <span aria-hidden='true'>·</span>}
						{favorite.rating > 0 && (
							<span
								className='inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400'
								aria-label={`Sua nota: ${favorite.rating} de 5`}
							>
								<Icon name='star' className='w-3 h-3' />
								{favorite.rating}
							</span>
						)}
					</p>
				)}

				{favorite && (
					<ShelfBadges
						shelfIds={favorite.shelves}
						shelves={customShelves}
						limit={2}
						className='mt-1'
					/>
				)}
			</div>

			{favorite ? (
				<span
					className={`hidden md:inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-xs ${SHELF_BADGE_CLASSES[favorite.status]}`}
				>
					<Icon name={SHELF_ICONS[favorite.status]} className='w-3.5 h-3.5' />
					{SHELF_LABELS[favorite.status]}
				</span>
			) : (
				<span className='hidden md:inline text-xs text-gray-400 dark:text-slate-600 shrink-0'>
					Fora da estante
				</span>
			)}

			{/* Fora da estante as duas colunas ficam vazias, não com um travessão: numa
			    página de busca seriam vinte "—" seguidos dizendo só "não se aplica".
			    O travessão segue valendo para o que está guardado e ainda não tem
			    progresso ou nota — ali ele informa algo. */}
			<div className='hidden md:block w-28 shrink-0'>
				{favorite?.status === 'reading' ? (
					<>
						<ProgressBar percent={percent} />
						<p className='mt-1 text-xs text-gray-600 dark:text-slate-400 text-center'>
							{percent}%
						</p>
					</>
				) : favorite ? (
					<p className='text-xs text-gray-400 dark:text-slate-600 text-center'>—</p>
				) : null}
			</div>

			<div className='hidden md:flex w-16 shrink-0 justify-center text-amber-500 dark:text-amber-400'>
				{favorite && favorite.rating > 0 ? (
					<span
						className='inline-flex items-center gap-0.5 text-xs'
						aria-label={`Sua nota: ${favorite.rating} de 5`}
					>
						<Icon name='star' className='w-3.5 h-3.5' />
						{favorite.rating}
					</span>
				) : favorite ? (
					<span className='text-xs text-gray-400 dark:text-slate-600'>—</span>
				) : null}
			</div>

			<div className='shrink-0 flex items-center gap-1'>
				<button
					type='button'
					onClick={() => toggleFavorite(book)}
					disabled={isSaving}
					aria-pressed={Boolean(favorite)}
					aria-busy={isSaving}
					aria-label={
						favorite ? `Remover ${book.title} da estante` : `Adicionar ${book.title} à estante`
					}
					title={favorite ? 'Remover da estante' : 'Adicionar à estante'}
					className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:cursor-wait ${
						favorite
							? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
							: 'text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-slate-700'
					}`}
				>
					{isSaving ? (
						<span className='block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin' />
					) : (
						<HeartIcon filled={Boolean(favorite)} />
					)}
				</button>

				<ShelfMenu book={book} favorite={favorite} disabled={isSaving} />
			</div>
		</li>
	);
};

const BookList: React.FC<BookListingProps> = ({
	books,
	selectable = false,
	selectedIds,
	onSelectChange,
	className = '',
}) => (
	<div
		className={`rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto ${className}`}
	>
		<ul className='divide-y divide-gray-200 dark:divide-slate-700 min-w-md'>
			{books.map((book) => (
				<BookRow
					key={book.id}
					book={book}
					selectable={selectable}
					selected={selectedIds?.has(book.id) ?? false}
					onSelectChange={(selected) => onSelectChange?.(book.id, selected)}
				/>
			))}
		</ul>
	</div>
);

export default BookList;
