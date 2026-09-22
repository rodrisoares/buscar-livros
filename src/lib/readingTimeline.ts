import type { FavoriteBook } from '@/types/Book';

/** Um mês do ano no gráfico. `month` é 0-11, como no `Date`. */
export interface MonthlyPoint {
	month: number;
	/** Rótulo curto em pt-BR ("jan", "fev"...). */
	label: string;
	count: number;
}

export interface ReadingPace {
	/** Sempre 12 pontos, de janeiro a dezembro — meses vazios inclusive. */
	monthly: MonthlyPoint[];
	total: number;
	/**
	 * Livros por mês. No ano corrente divide pelos meses já decorridos, não por
	 * 12: em fevereiro, dividir o ano inteiro faria o ritmo parecer seis vezes
	 * menor do que é.
	 */
	average: number;
	/** O mês mais produtivo; `null` quando nada foi concluído no ano. */
	best: MonthlyPoint | null;
	/**
	 * Quantos livros o ano fecharia mantido o ritmo. `null` para anos que já
	 * terminaram — ali não há o que projetar, o número final já é o total.
	 */
	projection: number | null;
}

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

/** "jan.", "fev."… O ponto final sai: nos rótulos do eixo ele só vira sujeira. */
const monthLabel = (month: number): string =>
	monthFormatter.format(new Date(2000, month, 1)).replace('.', '');

const MONTH_LABELS = Array.from({ length: 12 }, (_, month) => monthLabel(month));

/**
 * Conclusões mês a mês de um ano, mais os números que resumem o ritmo.
 *
 * Só `finishedAt` é histórico de verdade. `currentPage` é um retrato do agora —
 * o livro que está em 40% não diz em que mês essas páginas foram lidas —, então
 * a série conta livros concluídos, e não páginas.
 */
export const getReadingPace = (
	books: FavoriteBook[],
	year: number,
	now: Date = new Date()
): ReadingPace => {
	const counts = new Array<number>(12).fill(0);

	for (const book of books) {
		if (!book.finishedAt) continue;

		const finished = new Date(book.finishedAt);
		if (Number.isNaN(finished.getTime()) || finished.getFullYear() !== year) continue;

		counts[finished.getMonth()] += 1;
	}

	const monthly: MonthlyPoint[] = counts.map((count, month) => ({
		month,
		label: MONTH_LABELS[month],
		count,
	}));

	const total = counts.reduce((sum, count) => sum + count, 0);

	const isCurrentYear = year === now.getFullYear();
	const isFutureYear = year > now.getFullYear();

	// Ano corrente: só os meses que já começaram contam para a média.
	const elapsedMonths = isFutureYear ? 0 : isCurrentYear ? now.getMonth() + 1 : 12;
	const average = elapsedMonths > 0 ? total / elapsedMonths : 0;

	const best = total > 0 ? monthly.reduce((a, b) => (b.count > a.count ? b : a)) : null;

	return {
		monthly,
		total,
		average,
		best,
		projection: isCurrentYear ? Math.round(average * 12) : null,
	};
};

/**
 * Anos que o seletor do painel deve oferecer: todo ano em que algo foi
 * concluído, todo ano que tem meta registrada, e sempre o ano corrente — mesmo
 * que ainda esteja vazio, porque é nele que se define a meta nova.
 */
export const listReadingYears = (
	books: FavoriteBook[],
	goalYears: number[],
	currentYear: number = new Date().getFullYear()
): number[] => {
	const years = new Set<number>([currentYear]);

	for (const book of books) {
		if (!book.finishedAt) continue;

		const finished = new Date(book.finishedAt);
		if (!Number.isNaN(finished.getTime())) years.add(finished.getFullYear());
	}

	for (const year of goalYears) {
		if (Number.isFinite(year) && year > 0) years.add(year);
	}

	return [...years].sort((a, b) => b - a);
};
