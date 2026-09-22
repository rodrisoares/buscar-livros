import type { RawGoal, ReadingGoal } from '@/types/Goal';
import { env } from '@/config/env';
import { request } from '@/lib/http';
import { normalizeNumber, normalizeString } from '@/utils/normalize';

const GOALS_API_URL = `${env.apiUrl}/goals`;

const toGoal = (raw: RawGoal): ReadingGoal => ({
	recordId: normalizeString(raw.id === undefined ? '' : String(raw.id)),
	year: normalizeNumber(raw.year),
	target: Math.max(0, normalizeNumber(raw.target)),
});

export const getGoals = async (signal?: AbortSignal): Promise<ReadingGoal[]> => {
	const raw = await request<RawGoal[]>(GOALS_API_URL, { signal });
	return (raw ?? []).map(toGoal);
};

/**
 * Uma meta por ano: se já existe registro para o ano, ele é atualizado;
 * senão, um novo é criado.
 */
export const saveGoal = async (
	year: number,
	target: number,
	existing?: ReadingGoal
): Promise<ReadingGoal> => {
	if (existing?.recordId) {
		const raw = await request<RawGoal>(`${GOALS_API_URL}/${existing.recordId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ target }),
		});
		return toGoal(raw);
	}

	const raw = await request<RawGoal>(GOALS_API_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ year, target }),
	});

	return toGoal(raw);
};
