import type { GoogleBooksVolume } from '@/types/GoogleBooks';
import { googleBooksAdapter } from './GoogleBooksAdapter';

const fullVolume: GoogleBooksVolume = {
	id: 'abc123',
	volumeInfo: {
		title: '  O Hobbit  ',
		authors: ['J.R.R. Tolkien', 'Christopher Tolkien'],
		publisher: 'HarperCollins',
		publishedDate: '1937',
		description: '<p>Uma aventura.</p>',
		pageCount: 310,
		categories: ['Ficção'],
		imageLinks: { thumbnail: 'http://books.google.com/capa?zoom=1' },
		previewLink: 'https://preview.test',
		infoLink: 'https://info.test',
		industryIdentifiers: [
			{ type: 'ISBN_10', identifier: '0261102214' },
			{ type: 'ISBN_13', identifier: '9780261102217' },
		],
		language: 'pt',
		averageRating: 4.5,
		ratingsCount: 120,
		maturityRating: 'NOT_MATURE',
	},
	saleInfo: {
		saleability: 'FOR_SALE',
		retailPrice: { amount: 29.9, currencyCode: 'BRL' },
		buyLink: 'https://compra.test',
	},
	accessInfo: {
		viewability: 'PARTIAL',
		webReaderLink: 'https://leitor.test',
		epub: { isAvailable: true },
		pdf: { isAvailable: false },
	},
};

describe('GoogleBooksAdapter', () => {
	it('mapeia os campos do volume completo', () => {
		const book = googleBooksAdapter.transform(fullVolume);

		expect(book.title).toBe('O Hobbit');
		expect(book.author).toBe('J.R.R. Tolkien, Christopher Tolkien');
		expect(book.isbn13).toBe('9780261102217');
		expect(book.isbn10).toBe('0261102214');
		expect(book.language).toBe('pt');
		expect(book.averageRating).toBe(4.5);
		expect(book.ratingsCount).toBe(120);
		expect(book.viewability).toBe('PARTIAL');
		expect(book.epubAvailable).toBe(true);
		expect(book.pdfAvailable).toBe(false);
		expect(book.saleability).toBe('FOR_SALE');
		expect(book.price).toMatch(/29,90/);
		expect(book.buyLink).toBe('https://compra.test');
	});

	it('força https nas URLs devolvidas em http', () => {
		expect(googleBooksAdapter.transform(fullVolume).thumbnail).toBe(
			'https://books.google.com/capa?zoom=1'
		);
	});

	it('preenche os campos ausentes com valores neutros, sem quebrar', () => {
		const book = googleBooksAdapter.transform({ id: 'x', volumeInfo: { title: 'Só o título' } });

		expect(book.author).toBe('Unknown');
		expect(book.pageCount).toBe(0);
		expect(book.categories).toEqual([]);
		expect(book.thumbnail).toBe('');
		expect(book.isbn13).toBe('');
		expect(book.averageRating).toBe(0);
		expect(book.epubAvailable).toBe(false);
		expect(book.price).toBe('');
	});

	it('transforma uma lista vazia sem estourar', () => {
		expect(googleBooksAdapter.transformArray([])).toEqual([]);
	});

	it('usa o listPrice quando não há retailPrice', () => {
		const book = googleBooksAdapter.transform({
			id: 'y',
			volumeInfo: { title: 'T' },
			saleInfo: { saleability: 'FOR_SALE', listPrice: { amount: 15, currencyCode: 'BRL' } },
		});

		expect(book.price).toMatch(/15,00/);
	});
});
