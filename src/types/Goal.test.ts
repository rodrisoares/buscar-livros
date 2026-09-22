import { MAX_READING_GOAL, clampGoalTarget } from './Goal';

describe('clampGoalTarget', () => {
	it('deixa passar uma meta comum', () => {
		expect(clampGoalTarget(24)).toBe(24);
	});

	it('corta no teto', () => {
		expect(clampGoalTarget(100000)).toBe(MAX_READING_GOAL);
		expect(clampGoalTarget(MAX_READING_GOAL + 1)).toBe(MAX_READING_GOAL);
	});

	it('corta a notação científica, que o campo numérico aceita', () => {
		// `Number('1e6')` é 1000000: o `max` do HTML não barra isso com a
		// validação nativa desligada.
		expect(clampGoalTarget(Number('1e6'))).toBe(MAX_READING_GOAL);
	});

	it('não deixa meta negativa', () => {
		expect(clampGoalTarget(-5)).toBe(0);
	});

	it('trunca fração: meia leitura não conta como meta', () => {
		expect(clampGoalTarget(12.9)).toBe(12);
	});

	it('zero continua valendo — é "sem meta"', () => {
		expect(clampGoalTarget(0)).toBe(0);
	});

	it('valor não numérico vira zero em vez de gravar NaN', () => {
		expect(clampGoalTarget(Number.NaN)).toBe(0);
		expect(clampGoalTarget(Number.POSITIVE_INFINITY)).toBe(0);
	});
});
