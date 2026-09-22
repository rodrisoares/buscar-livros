import React from 'react';
import type { Book } from '@/types/Book';
import BookCard from './BookCard';

/**
 * Uma única definição de grade para resultados e estante — antes cada tela
 * usava breakpoints diferentes (sm:2 md:3 lg:4 contra md:2 lg:3 xl:4).
 */
export const BOOK_GRID_CLASSES =
	'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';

export interface BookListingProps {
	books: Book[];
	/** Modo seleção (ações em lote da estante). */
	selectable?: boolean;
	selectedIds?: ReadonlySet<string>;
	onSelectChange?: (bookId: string, selected: boolean) => void;
	className?: string;
}

const BookGrid: React.FC<BookListingProps> = ({
	books,
	selectable = false,
	selectedIds,
	onSelectChange,
	className = '',
}) => (
	<div className={`${BOOK_GRID_CLASSES} ${className}`}>
		{books.map((book) => (
			<BookCard
				key={book.id}
				book={book}
				selectable={selectable}
				selected={selectedIds?.has(book.id) ?? false}
				onSelectChange={(selected) => onSelectChange?.(book.id, selected)}
			/>
		))}
	</div>
);

export default BookGrid;
