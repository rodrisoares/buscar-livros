import React from 'react';
import type { ListView } from '@/lib/listView';
import BookGrid, { type BookListingProps } from './BookGrid';
import BookList from './BookList';

/**
 * Escolhe grade ou lista. Existe para a estante e os resultados de busca não
 * repetirem o mesmo ternário — e para que qualquer formato novo entre num
 * lugar só.
 */
const BookListing: React.FC<BookListingProps & { view: ListView }> = ({ view, ...props }) =>
	view === 'list' ? <BookList {...props} /> : <BookGrid {...props} />;

export default BookListing;
