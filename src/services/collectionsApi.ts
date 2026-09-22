import {
	MAX_COLLECTION_DESCRIPTION,
	MAX_COLLECTION_NAME,
	type Collection,
	type RawCollection,
} from '@/types/Collection';
import { env } from '@/config/env';
import { request } from '@/lib/http';
import { normalizeString } from '@/utils/normalize';

const COLLECTIONS_API_URL = `${env.apiUrl}/collections`;

const toCollection = (raw: RawCollection): Collection => ({
	recordId: normalizeString(raw.id === undefined ? '' : String(raw.id)),
	name: normalizeString(raw.name).slice(0, MAX_COLLECTION_NAME),
	description: normalizeString(raw.description).slice(0, MAX_COLLECTION_DESCRIPTION),
	// A ordem é o dado central da coleção: um vetor quebrado vira vetor vazio,
	// nunca uma lista com buracos.
	bookIds: Array.isArray(raw.bookIds)
		? raw.bookIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
		: [],
});

export const getCollections = async (signal?: AbortSignal): Promise<Collection[]> => {
	const raw = await request<RawCollection[]>(COLLECTIONS_API_URL, { signal });
	return (raw ?? []).map(toCollection);
};

export interface CollectionInput {
	name: string;
	description: string;
	bookIds: string[];
}

const trim = (input: Partial<CollectionInput>): Partial<CollectionInput> => ({
	...input,
	...(input.name === undefined ? {} : { name: input.name.trim().slice(0, MAX_COLLECTION_NAME) }),
	...(input.description === undefined
		? {}
		: { description: input.description.trim().slice(0, MAX_COLLECTION_DESCRIPTION) }),
});

export const createCollection = async (input: CollectionInput): Promise<Collection> => {
	const raw = await request<RawCollection>(COLLECTIONS_API_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(trim(input)),
	});

	return toCollection(raw);
};

export const updateCollection = async (
	recordId: string,
	patch: Partial<CollectionInput>
): Promise<Collection> => {
	const raw = await request<RawCollection>(`${COLLECTIONS_API_URL}/${recordId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(trim(patch)),
	});

	return toCollection(raw);
};

export const deleteCollection = async (recordId: string): Promise<void> => {
	await request<void>(`${COLLECTIONS_API_URL}/${recordId}`, { method: 'DELETE' });
};
