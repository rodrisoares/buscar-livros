/** Meta de leitura de um ano ("24 livros em 2026"). */
export interface ReadingGoal {
	/** Chave do registro na API. */
	recordId: string;
	year: number;
	target: number;
}

/**
 * Teto da meta anual.
 *
 * O campo já dizia `max={999}`, mas `max` no HTML só vale para as setinhas e
 * para a validação nativa do formulário — que está desligada aqui. Digitar
 * 100000 (ou colar "1e6", que o `Number` aceita) passava direto e gravava uma
 * meta que nenhuma barra de progresso consegue representar.
 */
export const MAX_READING_GOAL = 999;

/** Inteiro entre 0 e o teto; 0 significa "sem meta". */
export const clampGoalTarget = (value: number): number => {
	if (!Number.isFinite(value)) return 0;
	return Math.min(Math.max(Math.trunc(value), 0), MAX_READING_GOAL);
};

export interface RawGoal {
	id?: string | number;
	year?: number;
	target?: number;
}
