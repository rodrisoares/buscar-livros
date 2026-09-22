import {
	DEFAULT_SHELF_COLOR,
	DEFAULT_SHELF_ICON,
	MAX_SHELF_NAME,
	isShelfColor,
	isShelfIcon,
	type CustomShelf,
	type RawCustomShelf,
	type ShelfColor,
} from '@/types/CustomShelf';
import type { IconName } from '@/components/Icon';
import { env } from '@/config/env';
import { request } from '@/lib/http';
import { normalizeNumber, normalizeString } from '@/utils/normalize';

const SHELVES_API_URL = `${env.apiUrl}/shelves`;

/** Ícone ou cor fora do conjunto conhecido caem no padrão, em vez de quebrar a tela. */
const toShelf = (raw: RawCustomShelf): CustomShelf => ({
	recordId: normalizeString(raw.id === undefined ? '' : String(raw.id)),
	name: normalizeString(raw.name).slice(0, MAX_SHELF_NAME),
	icon: isShelfIcon(raw.icon) ? raw.icon : DEFAULT_SHELF_ICON,
	color: isShelfColor(raw.color) ? raw.color : DEFAULT_SHELF_COLOR,
	position: normalizeNumber(raw.position),
});

export const getShelves = async (signal?: AbortSignal): Promise<CustomShelf[]> => {
	const raw = await request<RawCustomShelf[]>(SHELVES_API_URL, { signal });
	return (raw ?? []).map(toShelf).sort((a, b) => a.position - b.position);
};

export interface ShelfInput {
	name: string;
	icon: IconName;
	color: ShelfColor;
	position: number;
}

export const createShelf = async (input: ShelfInput): Promise<CustomShelf> => {
	const raw = await request<RawCustomShelf>(SHELVES_API_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...input, name: input.name.trim().slice(0, MAX_SHELF_NAME) }),
	});

	return toShelf(raw);
};

export const updateShelfRecord = async (
	recordId: string,
	patch: Partial<ShelfInput>
): Promise<CustomShelf> => {
	const raw = await request<RawCustomShelf>(`${SHELVES_API_URL}/${recordId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(
			patch.name === undefined ? patch : { ...patch, name: patch.name.trim().slice(0, MAX_SHELF_NAME) }
		),
	});

	return toShelf(raw);
};

export const deleteShelf = async (recordId: string): Promise<void> => {
	await request<void>(`${SHELVES_API_URL}/${recordId}`, { method: 'DELETE' });
};
