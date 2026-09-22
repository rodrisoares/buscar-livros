import type { FavoriteBook, ProgressEntry } from '@/types/Book';
import { makeFavorite } from '@/test/utils';
import {
	MAX_PROGRESS_ENTRIES,
	appendProgress,
	estimateFinish,
	getPagesByMonth,
	getPagesReadFromLog,
	getProgressPoints,
} from './progressLog';

const DIA = 86_400_000;
const BASE = new Date(2026, 0, 1, 12).getTime();

const log = (...entradas: [page: number, dias: number][]): ProgressEntry[] =>
	entradas.map(([page, dias]) => ({ page, at: BASE + dias * DIA }));

describe('appendProgress', () => {
	it('acrescenta a marcação ao fim', () => {
		const resultado = appendProgress(log([40, 0]), 112, BASE + DIA);

		expect(resultado).toEqual([
			{ page: 40, at: BASE },
			{ page: 112, at: BASE + DIA },
		]);
	});

	it('não cria entrada nova ao salvar a mesma página de novo', () => {
		// Corrigir um dígito e salvar duas vezes não é ler duas vezes.
		const resultado = appendProgress(log([40, 0]), 40, BASE + 60_000);

		expect(resultado).toHaveLength(1);
		expect(resultado[0].at).toBe(BASE + 60_000);
	});

	it('mas a mesma página noutro dia é uma sessão nova', () => {
		const resultado = appendProgress(log([40, 0]), 40, BASE + DIA);

		expect(resultado).toHaveLength(2);
	});

	it('registra recuo: o log conta o que houve, não o que devia ter havido', () => {
		const resultado = appendProgress(log([200, 0]), 150, BASE + DIA);

		expect(resultado.at(-1)?.page).toBe(150);
	});

	it('ignora página inválida', () => {
		const original = log([40, 0]);

		expect(appendProgress(original, Number.NaN)).toBe(original);
		expect(appendProgress(original, -5)).toBe(original);
	});

	it('trunca fração: página é inteiro', () => {
		expect(appendProgress([], 40.7, BASE)[0].page).toBe(40);
	});

	it('respeita o teto, descartando as marcações mais antigas', () => {
		let lista: ProgressEntry[] = [];
		for (let i = 0; i < MAX_PROGRESS_ENTRIES + 10; i++) {
			lista = appendProgress(lista, i + 1, BASE + i * DIA);
		}

		expect(lista).toHaveLength(MAX_PROGRESS_ENTRIES);
		// As dez primeiras saíram; a última entrou.
		expect(lista[0].page).toBe(11);
		expect(lista.at(-1)?.page).toBe(MAX_PROGRESS_ENTRIES + 10);
	});

	it('não altera o vetor recebido', () => {
		const original = log([40, 0]);
		const copia = [...original];

		appendProgress(original, 90, BASE + DIA);

		expect(original).toEqual(copia);
	});
});

describe('getPagesReadFromLog', () => {
	it('soma os avanços', () => {
		expect(getPagesReadFromLog(log([40, 0], [112, 1], [200, 2]))).toBe(200);
	});

	it('um recuo não desconta o que já foi lido', () => {
		// Voltou da 200 para a 150 e depois seguiu até a 260: leu 200 + 60.
		expect(getPagesReadFromLog(log([200, 0], [150, 1], [260, 2]))).toBe(260);
	});

	it('log vazio soma zero', () => {
		expect(getPagesReadFromLog([])).toBe(0);
	});
});

describe('estimateFinish', () => {
	const lendo = (overrides: Partial<FavoriteBook>): FavoriteBook =>
		makeFavorite({ status: 'reading', pageCount: 300, ...overrides });

	it('projeta a conclusão pelo ritmo do log', () => {
		// 100 páginas em 10 dias = 10/dia; faltam 200 → 20 dias.
		const estimativa = estimateFinish(
			lendo({ currentPage: 100, progressLog: log([0, 0], [100, 10]) }),
			BASE + 10 * DIA
		);

		expect(estimativa?.pagesPerDay).toBeCloseTo(10);
		expect(estimativa?.daysLeft).toBe(20);
		expect(estimativa?.finishesAt).toBe(BASE + 30 * DIA);
	});

	it('não projeta com uma marcação só — seria invenção, não estimativa', () => {
		expect(estimateFinish(lendo({ currentPage: 100, progressLog: log([100, 0]) }))).toBeNull();
	});

	it('não projeta sem total de páginas', () => {
		expect(
			estimateFinish(lendo({ pageCount: 0, currentPage: 100, progressLog: log([0, 0], [100, 5]) }))
		).toBeNull();
	});

	it('não projeta quando o log não avançou', () => {
		expect(
			estimateFinish(lendo({ currentPage: 50, progressLog: log([50, 0], [50, 5]) }))
		).toBeNull();
	});

	it('não projeta livro já terminado', () => {
		expect(
			estimateFinish(lendo({ currentPage: 300, progressLog: log([0, 0], [300, 10]) }))
		).toBeNull();
	});

	it('várias marcações na mesma tarde não viram um ritmo fantasioso', () => {
		// 90 páginas em duas horas: sem o piso de um dia, daria ~1000/dia.
		const estimativa = estimateFinish(
			lendo({
				currentPage: 90,
				progressLog: [
					{ page: 0, at: BASE },
					{ page: 90, at: BASE + 2 * 3_600_000 },
				],
			}),
			BASE
		);

		expect(estimativa?.pagesPerDay).toBe(90);
		expect(estimativa?.daysLeft).toBe(3);
	});
});

describe('getPagesByMonth', () => {
	it('credita cada avanço ao mês em que ele aconteceu', () => {
		// 100 páginas em janeiro e 50 em fevereiro, no mesmo livro.
		const livro = makeFavorite({
			id: 'a',
			pageCount: 300,
			progressLog: [
				{ page: 100, at: new Date(2026, 0, 20).getTime() },
				{ page: 150, at: new Date(2026, 1, 10).getTime() },
			],
		});

		const meses = getPagesByMonth([livro], 2026);

		expect(meses[0]).toBe(100);
		expect(meses[1]).toBe(50);
	});

	it('é isso que o painel não conseguia fazer com finishedAt', () => {
		// Um calhamaço lido ao longo de três meses se espalha, em vez de cair
		// inteiro no mês da conclusão.
		const calhamaco = makeFavorite({
			id: 'b',
			pageCount: 900,
			progressLog: [
				{ page: 300, at: new Date(2026, 2, 31).getTime() },
				{ page: 600, at: new Date(2026, 3, 30).getTime() },
				{ page: 900, at: new Date(2026, 4, 31).getTime() },
			],
			finishedAt: new Date(2026, 4, 31).getTime(),
		});

		expect(getPagesByMonth([calhamaco], 2026).slice(2, 5)).toEqual([300, 300, 300]);
	});

	it('soma vários livros no mesmo mês', () => {
		const a = makeFavorite({ id: 'a', pageCount: 200, progressLog: [{ page: 80, at: new Date(2026, 5, 3).getTime() }] });
		const b = makeFavorite({ id: 'b', pageCount: 200, progressLog: [{ page: 20, at: new Date(2026, 5, 9).getTime() }] });

		expect(getPagesByMonth([a, b], 2026)[5]).toBe(100);
	});

	it('ignora marcações de outro ano', () => {
		const livro = makeFavorite({
			id: 'a',
			pageCount: 300,
			progressLog: [{ page: 100, at: new Date(2025, 0, 20).getTime() }],
		});

		expect(getPagesByMonth([livro], 2026).every((p) => p === 0)).toBe(true);
	});

	it('recuo não vira página negativa no mês', () => {
		const livro = makeFavorite({
			id: 'a',
			pageCount: 300,
			progressLog: [
				{ page: 200, at: new Date(2026, 0, 5).getTime() },
				{ page: 150, at: new Date(2026, 1, 5).getTime() },
			],
		});

		expect(getPagesByMonth([livro], 2026)[1]).toBe(0);
	});
});

describe('getProgressPoints', () => {
	it('converte cada marcação em percentual do total', () => {
		const pontos = getProgressPoints(
			makeFavorite({ pageCount: 200, progressLog: log([50, 0], [100, 1]) })
		);

		expect(pontos.map((p) => p.percent)).toEqual([25, 50]);
	});

	it('sem total de páginas não há percentual que faça sentido', () => {
		expect(getProgressPoints(makeFavorite({ pageCount: 0, progressLog: log([50, 0]) }))).toEqual([]);
	});
});
