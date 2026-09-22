import type { FavoriteBook } from '@/types/Book';
import { makeFavorite } from '@/test/utils';
import { getReadingPace, listReadingYears } from './readingTimeline';

/** Livro concluído num mês específico. `mes` é 0-11, como no `Date`. */
const concluido = (ano: number, mes: number, dia = 15): FavoriteBook =>
	makeFavorite({
		id: `${ano}-${mes}-${dia}`,
		status: 'read',
		finishedAt: new Date(ano, mes, dia, 12).getTime(),
	});

describe('getReadingPace', () => {
	it('devolve sempre os doze meses, mesmo os vazios', () => {
		const pace = getReadingPace([concluido(2026, 2)], 2026, new Date(2026, 11, 31));

		expect(pace.monthly).toHaveLength(12);
		expect(pace.monthly.map((m) => m.count)).toEqual([0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
	});

	it('conta cada livro no mês em que foi concluído', () => {
		const pace = getReadingPace(
			[concluido(2026, 0), concluido(2026, 0), concluido(2026, 5)],
			2026,
			new Date(2026, 11, 31)
		);

		expect(pace.monthly[0].count).toBe(2);
		expect(pace.monthly[5].count).toBe(1);
		expect(pace.total).toBe(3);
	});

	it('ignora livros de outros anos', () => {
		const pace = getReadingPace(
			[concluido(2025, 3), concluido(2026, 3)],
			2026,
			new Date(2026, 11, 31)
		);

		expect(pace.total).toBe(1);
	});

	it('ignora quem não tem data de conclusão', () => {
		const pace = getReadingPace(
			[makeFavorite({ id: 'lendo', status: 'reading', finishedAt: 0 })],
			2026,
			new Date(2026, 11, 31)
		);

		expect(pace.total).toBe(0);
	});

	it('usa o mês local, não o UTC', () => {
		// 31 de janeiro às 22h no Brasil ainda é janeiro; em UTC já é fevereiro.
		const virada = makeFavorite({
			id: 'virada',
			status: 'read',
			finishedAt: new Date(2026, 0, 31, 22).getTime(),
		});

		const pace = getReadingPace([virada], 2026, new Date(2026, 11, 31));

		expect(pace.monthly[0].count).toBe(1);
		expect(pace.monthly[1].count).toBe(0);
	});

	describe('ritmo médio', () => {
		it('no ano corrente divide pelos meses já decorridos', () => {
			// Três livros até março: 3 ÷ 3 = 1 por mês, não 3 ÷ 12.
			const pace = getReadingPace(
				[concluido(2026, 0), concluido(2026, 1), concluido(2026, 2)],
				2026,
				new Date(2026, 2, 20)
			);

			expect(pace.average).toBe(1);
		});

		it('em ano encerrado divide pelos doze meses', () => {
			const pace = getReadingPace(
				[concluido(2025, 0), concluido(2025, 6)],
				2025,
				new Date(2026, 2, 20)
			);

			expect(pace.average).toBeCloseTo(2 / 12);
		});
	});

	describe('melhor mês', () => {
		it('aponta o mês de maior contagem', () => {
			const pace = getReadingPace(
				[concluido(2026, 1), concluido(2026, 4), concluido(2026, 4)],
				2026,
				new Date(2026, 11, 31)
			);

			expect(pace.best?.month).toBe(4);
			expect(pace.best?.count).toBe(2);
		});

		it('é nulo quando nada foi concluído', () => {
			expect(getReadingPace([], 2026, new Date(2026, 5, 1)).best).toBeNull();
		});
	});

	describe('projeção', () => {
		it('estende o ritmo atual até dezembro', () => {
			// 4 livros em 4 meses = 1/mês → 12 no ano.
			const pace = getReadingPace(
				[concluido(2026, 0), concluido(2026, 1), concluido(2026, 2), concluido(2026, 3)],
				2026,
				new Date(2026, 3, 28)
			);

			expect(pace.projection).toBe(12);
		});

		it('não projeta ano encerrado: o total já é o número final', () => {
			const pace = getReadingPace([concluido(2025, 0)], 2025, new Date(2026, 3, 1));

			expect(pace.projection).toBeNull();
		});
	});

	it('rotula os meses em português', () => {
		const pace = getReadingPace([], 2026, new Date(2026, 0, 1));

		expect(pace.monthly[0].label).toBe('jan');
		expect(pace.monthly[11].label).toBe('dez');
		// O ponto do "jan." abreviado sai: no eixo ele vira sujeira.
		expect(pace.monthly.every((m) => !m.label.includes('.'))).toBe(true);
	});
});

describe('listReadingYears', () => {
	it('inclui o ano corrente mesmo sem nada nele', () => {
		expect(listReadingYears([], [], 2026)).toEqual([2026]);
	});

	it('junta anos de conclusão, anos com meta e o ano corrente', () => {
		const anos = listReadingYears([concluido(2024, 1), concluido(2022, 5)], [2023], 2026);

		expect(anos).toEqual([2026, 2024, 2023, 2022]);
	});

	it('não repete um ano que aparece nas duas origens', () => {
		expect(listReadingYears([concluido(2025, 0)], [2025], 2026)).toEqual([2026, 2025]);
	});

	it('ordena do mais recente para o mais antigo', () => {
		const anos = listReadingYears([concluido(2020, 0), concluido(2024, 0)], [2022], 2026);

		expect(anos).toEqual([...anos].sort((a, b) => b - a));
	});

	it('descarta anos inválidos vindos de registros antigos', () => {
		expect(listReadingYears([], [0, Number.NaN], 2026)).toEqual([2026]);
	});
});
