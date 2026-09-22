import type { FavoriteBook, ProgressEntry } from '@/types/Book';

/**
 * Teto de marcações guardadas por livro.
 *
 * O log vive dentro do registro do favorito, e todo PATCH reenvia o vetor
 * inteiro — sem teto, um livro relido por anos carregaria um histórico que
 * ninguém olha. Quinhentas marcações são anos de leitura diária.
 */
export const MAX_PROGRESS_ENTRIES = 500;

/** Duas marcações na mesma página em menos de uma hora são a mesma sessão. */
const SAME_SESSION_MS = 60 * 60 * 1000;

const MS_PER_DAY = 86_400_000;

/**
 * Acrescenta uma marcação ao log.
 *
 * Salvar a mesma página duas vezes (corrigir um dígito, reabrir a tela) não
 * cria duas entradas: a última é atualizada. Voltar páginas é registrado como
 * qualquer outra marcação — o log conta o que aconteceu, não o que gostaríamos
 * que tivesse acontecido —, e é o cálculo de páginas lidas que ignora recuos.
 */
export const appendProgress = (
	log: ProgressEntry[],
	page: number,
	at: number = Date.now()
): ProgressEntry[] => {
	if (!Number.isFinite(page) || page < 0) return log;

	const entry: ProgressEntry = { page: Math.trunc(page), at };
	const last = log.at(-1);

	if (last && last.page === entry.page && at - last.at < SAME_SESSION_MS) {
		return [...log.slice(0, -1), entry];
	}

	// Estourou o teto: sai a marcação mais antiga.
	const next = [...log, entry];
	return next.length > MAX_PROGRESS_ENTRIES ? next.slice(next.length - MAX_PROGRESS_ENTRIES) : next;
};

/**
 * Páginas efetivamente lidas segundo o log, somando só os avanços. Um recuo
 * (correção, releitura de um trecho) não desconta o que já foi lido.
 */
export const getPagesReadFromLog = (log: ProgressEntry[]): number => {
	let total = 0;
	let previous = 0;

	for (const entry of log) {
		if (entry.page > previous) total += entry.page - previous;
		previous = Math.max(previous, entry.page);
	}

	return total;
};

export interface ReadingSpeed {
	/** Páginas por dia no período coberto pelo log. */
	pagesPerDay: number;
	/** Dias que faltam no ritmo atual. */
	daysLeft: number;
	/** Data provável de conclusão. */
	finishesAt: number;
}

/**
 * Ritmo e previsão de conclusão de um livro em leitura.
 *
 * Devolve `null` quando não há o que projetar: sem total de páginas, com menos
 * de duas marcações, ou quando o ritmo é zero ou negativo. Um palpite baseado
 * num único ponto seria invenção, não estimativa.
 */
export const estimateFinish = (book: FavoriteBook, now: number = Date.now()): ReadingSpeed | null => {
	const log = book.progressLog;
	if (book.pageCount <= 0 || log.length < 2) return null;

	const first = log[0];
	const last = log.at(-1)!;

	const pages = last.page - first.page;
	if (pages <= 0) return null;

	// Um dia inteiro no mínimo: várias marcações na mesma tarde dariam um ritmo
	// de centenas de páginas por dia e uma previsão fantasiosa.
	const days = Math.max((last.at - first.at) / MS_PER_DAY, 1);
	const pagesPerDay = pages / days;
	if (pagesPerDay <= 0) return null;

	const remaining = book.pageCount - book.currentPage;
	if (remaining <= 0) return null;

	const daysLeft = Math.ceil(remaining / pagesPerDay);

	return { pagesPerDay, daysLeft, finishesAt: now + daysLeft * MS_PER_DAY };
};

/**
 * Páginas lidas por mês num ano, somando os avanços de todos os livros.
 *
 * É o dado que faltava para o painel: antes só dava para creditar as páginas de
 * um livro ao mês em que ele foi concluído — um calhamaço lido em três meses
 * aparecia todo num mês só. Aqui cada avanço cai no mês em que aconteceu.
 */
export const getPagesByMonth = (books: FavoriteBook[], year: number): number[] => {
	const months = new Array<number>(12).fill(0);

	for (const book of books) {
		let previous = 0;

		for (const entry of book.progressLog) {
			const gain = entry.page > previous ? entry.page - previous : 0;
			previous = Math.max(previous, entry.page);
			if (gain === 0) continue;

			const when = new Date(entry.at);
			if (Number.isNaN(when.getTime()) || when.getFullYear() !== year) continue;

			months[when.getMonth()] += gain;
		}
	}

	return months;
};

/** Pontos do gráfico de ritmo do livro, já em percentual do total. */
export interface ProgressPoint {
	at: number;
	page: number;
	percent: number;
}

export const getProgressPoints = (book: FavoriteBook): ProgressPoint[] => {
	if (book.pageCount <= 0) return [];

	return book.progressLog.map((entry) => ({
		at: entry.at,
		page: entry.page,
		percent: Math.min(100, Math.round((entry.page / book.pageCount) * 100)),
	}));
};
