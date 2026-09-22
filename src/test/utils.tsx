import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render, type RenderOptions } from '@testing-library/react';
import ToastProvider from '@/components/toast/ToastProvider';
import type { Book, FavoriteBook } from '@/types/Book';

/**
 * Um cliente por teste, sem retentativa e sem cache entre casos.
 *
 * O `queryClient` da aplicação repete requisições que falham; num teste isso
 * transformaria "a API recusou" em três segundos de espera antes do erro
 * chegar à tela.
 */
export const createTestQueryClient = (): QueryClient =>
	new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: 0, staleTime: 0 },
			mutations: { retry: false },
		},
	});

interface WrapperOptions extends Omit<RenderOptions, 'wrapper'> {
	queryClient?: QueryClient;
	/** Rota inicial, para telas que leem parâmetros da URL. */
	route?: string;
}

/**
 * Monta a árvore de contextos que a aplicação real fornece. `useFavorites`
 * depende de todos os três: React Query, os toasts (o "Desfazer" vive num) e
 * o roteador usado pelos links dos cards.
 */
export const createWrapper = (queryClient: QueryClient, route = '/') => {
	const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
		<QueryClientProvider client={queryClient}>
			<ToastProvider>
				<MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
			</ToastProvider>
		</QueryClientProvider>
	);

	return Wrapper;
};

export const renderWithProviders = (
	ui: React.ReactElement,
	{ queryClient = createTestQueryClient(), route = '/', ...options }: WrapperOptions = {}
) => ({
	queryClient,
	...render(ui, { wrapper: createWrapper(queryClient, route), ...options }),
});

/** Livro completo com os campos que interessam ao teste por cima. */
export const makeBook = (overrides: Partial<Book> = {}): Book => ({
	id: 'livro-1',
	title: 'Dom Casmurro',
	author: 'Machado de Assis',
	publishedDate: '1899-01-01',
	publisher: 'Garnier',
	pageCount: 256,
	categories: ['Ficção'],
	description: 'Bentinho e Capitu.',
	thumbnail: 'https://exemplo.test/capa.jpg',
	previewLink: 'https://exemplo.test/preview',
	infoLink: 'https://exemplo.test/info',
	isbn13: '9788535914849',
	isbn10: '8535914846',
	language: 'pt',
	averageRating: 4.5,
	ratingsCount: 87,
	maturityRating: 'NOT_MATURE',
	viewability: 'PARTIAL',
	epubAvailable: true,
	pdfAvailable: false,
	saleability: 'NOT_FOR_SALE',
	price: '',
	buyLink: '',
	webReaderLink: '',
	...overrides,
});

export const makeFavorite = (overrides: Partial<FavoriteBook> = {}): FavoriteBook => ({
	...makeBook(),
	recordId: 'reg-1',
	addedAt: 1_700_000_000_000,
	status: 'want_to_read',
	currentPage: 0,
	progressLog: [],
	rating: 0,
	notes: '',
	tags: [],
	shelves: [],
	startedAt: 0,
	finishedAt: 0,
	...overrides,
});

/** Promessa que o teste resolve na hora que quiser, para observar o estado "em voo". */
export const deferred = <T,>() => {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;

	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
};
