import React from 'react';
import type { Book } from '@/types/Book';
import { SHELF_ICONS, SHELF_LABELS, SHELF_STATUSES, type ShelfStatus } from '@/types/Shelf';
import { useFavorites } from '@/hooks/useFavorites';
import Dropdown from '@/components/Dropdown';
import Icon from '@/components/Icon';
import HeartIcon from '@/components/HeartIcon';

interface ShelfButtonProps {
	book: Book;
	className?: string;
}

const menuItem =
	'focus-inset w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors';

const Spinner = () => (
	<span className='block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin' />
);

/**
 * O único controle de estante da ficha do livro.
 *
 * Antes havia dois, e eles discordavam: o coração na barra de ações punha o
 * livro em "Quero ler", enquanto o painel lá embaixo oferecia as três estantes.
 * Quem quisesse marcar "Já li" tinha que ignorar o botão mais visível da tela.
 *
 * Fora da estante, é um botão dividido: a metade grande faz o caso comum
 * (guardar para depois) e a seta abre as três estantes. Já guardado, vira um
 * só botão que mostra onde o livro está e abre o mesmo menu — porque a partir
 * daí as únicas ações são mudar de estante ou sair dela.
 */
const ShelfButton: React.FC<ShelfButtonProps> = ({ book, className = '' }) => {
	const { findFavorite, setStatus, removeFavorite, isUpdatingBook } = useFavorites();

	const favorite = findFavorite(book.id);
	const isSaving = isUpdatingBook(book.id);

	const menu = (close: () => void) => (
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
						className={`${menuItem} ${
							isCurrent
								? 'bg-primary-50 dark:bg-primary-950 text-primary-800 dark:text-primary-200 font-medium'
								: 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700'
						}`}
					>
						<Icon name={SHELF_ICONS[status]} className='w-4 h-4 shrink-0' />
						<span className='flex-1'>{SHELF_LABELS[status]}</span>
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
					className={`${menuItem} border-t border-gray-100 dark:border-slate-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950`}
				>
					<Icon name='trash' className='w-4 h-4 shrink-0' />
					Remover da estante
				</button>
			)}
		</div>
	);

	// Já na estante: um botão só, que diz onde o livro está e abre o menu.
	if (favorite) {
		return (
			<Dropdown
				className={className}
				align='left'
				disabled={isSaving}
				ariaBusy={isSaving}
				panelClassName='w-56'
				ariaLabel={`Estante de ${book.title}: ${SHELF_LABELS[favorite.status]}. Alterar`}
				triggerClassName='flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 dark:bg-primary-950 text-primary-800 dark:text-primary-200 border border-primary-200 dark:border-primary-900 font-medium hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors disabled:opacity-60 disabled:cursor-wait'
				trigger={
					<>
						{isSaving ? (
							<Spinner />
						) : (
							<Icon name={SHELF_ICONS[favorite.status]} className='w-5 h-5' />
						)}
						<span>{SHELF_LABELS[favorite.status]}</span>
						<Icon name='chevron-down' className='w-4 h-4' />
					</>
				}
			>
				{menu}
			</Dropdown>
		);
	}

	// Fora da estante: botão dividido — ação principal à esquerda, escolha na seta.
	return (
		<div className={`inline-flex ${className}`}>
			<button
				type='button'
				onClick={() => setStatus(book, 'want_to_read')}
				disabled={isSaving}
				aria-busy={isSaving}
				className='flex items-center gap-2 px-4 py-2 rounded-l-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-wait'
			>
				{isSaving ? <Spinner /> : <HeartIcon filled={false} className='w-5 h-5' />}
				<span>Adicionar à estante</span>
			</button>

			<Dropdown
				align='left'
				disabled={isSaving}
				panelClassName='w-56'
				ariaLabel={`Escolher a estante de ${book.title}`}
				triggerClassName='flex items-center px-2 py-2 rounded-r-lg bg-primary-600 text-white border-l border-primary-500 hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-wait'
				trigger={<Icon name='chevron-down' className='w-5 h-5' />}
			>
				{menu}
			</Dropdown>
		</div>
	);
};

export default ShelfButton;
