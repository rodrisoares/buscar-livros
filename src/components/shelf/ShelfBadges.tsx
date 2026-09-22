import React from 'react';
import { SHELF_COLOR_CLASSES, type CustomShelf } from '@/types/CustomShelf';
import Icon from '@/components/Icon';

interface ShelfBadgesProps {
	/** Chaves guardadas no livro. */
	shelfIds: string[];
	shelves: CustomShelf[];
	/** Quantos cabem antes de virar "+N"; o resto fica no título. */
	limit?: number;
	className?: string;
}

/**
 * Selos das estantes personalizadas de um livro.
 *
 * Ficam ao lado do selo de status, e não no lugar dele: status e estante
 * personalizada respondem perguntas diferentes ("em que pé está" e "que marca
 * eu pus"), e o card precisa mostrar as duas.
 */
const ShelfBadges: React.FC<ShelfBadgesProps> = ({
	shelfIds,
	shelves,
	limit = 2,
	className = '',
}) => {
	// Um id sem estante correspondente é resto de uma estante apagada noutra
	// aba: some da tela em vez de virar um selo em branco.
	const mine = shelfIds
		.map((id) => shelves.find((shelf) => shelf.recordId === id))
		.filter((shelf): shelf is CustomShelf => Boolean(shelf));

	if (mine.length === 0) return null;

	const shown = mine.slice(0, limit);
	const hidden = mine.slice(limit);

	return (
		<span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
			{shown.map((shelf) => (
				<span
					key={shelf.recordId}
					className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${SHELF_COLOR_CLASSES[shelf.color]}`}
				>
					<Icon name={shelf.icon} className='w-3 h-3' />
					{shelf.name}
				</span>
			))}

			{hidden.length > 0 && (
				<span
					className='text-xs text-gray-600 dark:text-slate-400'
					title={hidden.map((shelf) => shelf.name).join(', ')}
				>
					+{hidden.length}
				</span>
			)}
		</span>
	);
};

export default ShelfBadges;
