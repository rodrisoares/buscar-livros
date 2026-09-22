import { HttpError } from './http';

export const QUOTA_MESSAGE =
	'A cota diária de consultas da Google Books API foi atingida. Ela é reiniciada no início do dia; para ter um limite próprio, configure a variável VITE_GOOGLE_BOOKS_API_KEY.';

/** Erro 429 da Google Books: cota esgotada, não é falha de conexão. */
export const isQuotaError = (error: unknown): boolean =>
	error instanceof HttpError && error.status === 429;

/**
 * Traduz a falha para algo que explique o que aconteceu — "verifique sua
 * conexão" seria enganoso quando o problema é a cota da API.
 */
export const describeBooksError = (error: unknown, fallback: string): string => {
	if (!(error instanceof HttpError)) return fallback;

	if (error.status === 429) return QUOTA_MESSAGE;
	if (error.status === 404) return 'Não encontramos este livro no acervo da Google Books.';
	if (error.status === 401 || error.status === 403) {
		// 401 é chave ausente ou inválida; 403 é chave válida sem permissão para a
		// Books API. Nos dois casos o caminho é o mesmo, e nenhum é falha de rede.
		return 'A Google Books recusou a consulta. Verifique a chave configurada em VITE_GOOGLE_BOOKS_API_KEY.';
	}
	if (error.status >= 500) {
		return 'O serviço da Google Books está instável no momento. Tente de novo em instantes.';
	}

	return fallback;
};
