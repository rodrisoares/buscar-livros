import type { Book, FavoriteBook, ShelfPatch } from '@/types/Book';
import { env } from '@/config/env';
import { request } from '@/lib/http';
import { favoritesAdapter, type RawFavorite } from '@/utils/FavoritesAdapter';

const FAVORITES_API_URL = `${env.apiUrl}/favorites`;

export const getFavorites = async (signal?: AbortSignal): Promise<FavoriteBook[]> => {
	const raw = await request<RawFavorite[]>(FAVORITES_API_URL, { signal });
	return favoritesAdapter.transformArray(raw ?? []);
};

/** Estado inicial de um livro que acabou de entrar na estante. */
const shelfDefaults = (): Required<ShelfPatch> => ({
	status: 'want_to_read',
	currentPage: 0,
	progressLog: [],
	rating: 0,
	notes: '',
	tags: [],
	shelves: [],
	startedAt: 0,
	finishedAt: 0,
});

/**
 * O id do volume vai em `bookId`, e não em `id`: o json-server gera a própria
 * chave do registro e descarta a que enviamos. Sem essa separação, o livro
 * salvo deixaria de ser reconhecido no próximo carregamento.
 *
 * `addedAt` e `shelf` são parametrizáveis para que o "Desfazer" devolva o livro
 * exatamente como estava, sem perder progresso, notas ou nota pessoal.
 */
export const addToFavorites = async (
	book: Book,
	addedAt = Date.now(),
	shelf: ShelfPatch = {}
): Promise<FavoriteBook> => {
	const { id, ...bookData } = book;
	const payload = { ...bookData, ...shelfDefaults(), ...shelf, bookId: id, addedAt };

	const raw = await request<RawFavorite>(FAVORITES_API_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});

	return favoritesAdapter.transform(raw);
};

/** Atualiza só os campos da estante, preservando os dados do volume. */
export const updateFavorite = async (
	recordId: string,
	patch: ShelfPatch
): Promise<FavoriteBook> => {
	const raw = await request<RawFavorite>(`${FAVORITES_API_URL}/${recordId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(patch),
	});

	return favoritesAdapter.transform(raw);
};

/** Recebe a chave do registro (`recordId`), não o id do volume. */
export const removeFromFavorites = async (recordId: string): Promise<void> => {
	await request<void>(`${FAVORITES_API_URL}/${recordId}`, { method: 'DELETE' });
};
