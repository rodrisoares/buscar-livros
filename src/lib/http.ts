/** Erro HTTP com o status preservado, para decidir o que vale a pena repetir. */
export class HttpError extends Error {
	readonly status: number;

	constructor(status: number, statusText: string) {
		super(`Requisição falhou (${status}): ${statusText || 'erro desconhecido'}`);
		this.name = 'HttpError';
		this.status = status;
	}
}

const DEFAULT_TIMEOUT = 8000;

/**
 * Combina o signal do React Query com um timeout próprio, para que a requisição
 * seja de fato abortada (e não apenas ignorada) quando estourar o tempo.
 */
const withTimeout = (signal: AbortSignal | null | undefined, timeout: number): AbortSignal => {
	const timeoutSignal = AbortSignal.timeout(timeout);
	if (!signal) return timeoutSignal;
	if (typeof AbortSignal.any === 'function') return AbortSignal.any([signal, timeoutSignal]);

	const controller = new AbortController();
	const abort = () => controller.abort();
	signal.addEventListener('abort', abort, { once: true });
	timeoutSignal.addEventListener('abort', abort, { once: true });
	return controller.signal;
};

interface RequestOptions extends RequestInit {
	timeout?: number;
}

export const request = async <T>(
	url: string,
	{ timeout = DEFAULT_TIMEOUT, signal, ...init }: RequestOptions = {}
): Promise<T> => {
	const response = await fetch(url, { ...init, signal: withTimeout(signal, timeout) });

	if (!response.ok) {
		throw new HttpError(response.status, response.statusText);
	}

	// DELETE do json-server pode responder sem corpo.
	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
};

/** 4xx não é recuperável: repetir só gasta a cota da API e atrasa o erro na tela. */
export const shouldRetry = (failureCount: number, error: unknown): boolean => {
	if (error instanceof HttpError && error.status >= 400 && error.status < 500) return false;
	return failureCount < 2;
};
