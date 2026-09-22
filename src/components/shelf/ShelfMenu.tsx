import React from 'react';
import type { Book, FavoriteBook } from '@/types/Book';
import { SHELF_ICONS, SHELF_LABELS, SHELF_STATUSES, type ShelfStatus } from '@/types/Shelf';
import { useFavorites } from '@/hooks/useFavorites';
import Dropdown from '@/components/Dropdown';
import Icon from '@/components/Icon';

interface ShelfMenuProps {
	book: Book;
	favorite: FavoriteBook | undefined;
	disabled?: boolean;
	className?: string;
}

const itemClasses =
	'focus-inset w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors';

/**
 * As três estantes a um clique do card.
 *
 * O coração ao lado continua sendo o atalho de sempre (entra em "Quero ler"),
 * mas quem já sabe onde o livro vai parar não precisa mais abrir a ficha só
 * para escolher a estante certa.
 */
const ShelfMenu: React.FC<ShelfMenuProps> = ({ book, favorite, disabled = false, className = '' }) => {
	const { setStatus, removeFavorite } = useFavorites();

	const currentLabel = favorite ? SHELF_LABELS[favorite.status] : 'fora da estante';

	return (
		<Dropdown
			className={className}
			disabled={disabled}
			ariaLabel={`Escolher estante de ${book.title} (${currentLabel})`}
			triggerClassName='w-9 h-9 rounded-full flex items-center justify-center transition-colors bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 disabled:opacity-60 disabled:cursor-wait'
			panelClassName='w-52'
			trigger={<Icon name='chevron-down' className='w-4 h-4' />}
		>
			{(close) => (
				<div role='menu' aria-label='Estantes'>
					{SHELF_STATUSES.map((status: ShelfStatus) => {
						const isCurrent = favorite?.status === status;

						return (
							<button
								key={status}
								type='button'
								role='menuitemradio'
								aria-checked={isCurrent}
								onClick={() => {
									if (!isCurrent) setStatus(book, status);
									close();
								}}
								className={`${itemClasses} ${
									isCurrent
										? 'bg-primary-50 dark:bg-primary-950 text-primary-800 dark:text-primary-200 font-medium'
										: 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700'
								}`}
							>
								<Icon name={SHELF_ICONS[status]} className='w-4 h-4 shrink-0' />
								<span className='flex-1'>{SHELF_LABELS[status]}</span>
								{/* O ✓ marca onde o livro está hoje; o aria-checked diz o mesmo a quem não vê. */}
								{isCurrent && <Icon name='check' className='w-4 h-4 shrink-0' />}
							</button>
						);
					})}

					{favorite && (
						<button
							type='button'
							role='menuitem'
							onClick={() => {
								removeFavorite(book.id);
								close();
							}}
							className={`${itemClasses} border-t border-gray-100 dark:border-slate-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950`}
						>
							<Icon name='trash' className='w-4 h-4 shrink-0' />
							Remover da estante
						</button>
					)}
				</div>
			)}
		</Dropdown>
	);
};

export default ShelfMenu;
