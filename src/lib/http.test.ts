import { HttpError, request, shouldRetry } from './http';

describe('shouldRetry', () => {
	it('não repete erros 4xx, que não vão mudar de resposta', () => {
		expect(shouldRetry(0, new HttpError(404, 'Not Found'))).toBe(false);
		expect(shouldRetry(0, new HttpError(429, 'Too Many Requests'))).toBe(false);
	});

	it('repete falhas de rede e erros de servidor, até o limite', () => {
		expect(shouldRetry(0, new TypeError('Failed to fetch'))).toBe(true);
		expect(shouldRetry(1, new HttpError(500, 'Server Error'))).toBe(true);
		expect(shouldRetry(2, new HttpError(500, 'Server Error'))).toBe(false);
	});
});

describe('request', () => {
	afterEach(() => vi.unstubAllGlobals());

	const stubFetch = (response: Partial<Response>) =>
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, ...response }));

	it('devolve o JSON quando a resposta é ok', async () => {
		stubFetch({ json: async () => ({ total: 3 }) });
		await expect(request<{ total: number }>('https://exemplo.test')).resolves.toEqual({ total: 3 });
	});

	it('lança HttpError preservando o status', async () => {
		stubFetch({ ok: false, status: 404, statusText: 'Not Found' });

		await expect(request('https://exemplo.test')).rejects.toMatchObject({
			name: 'HttpError',
			status: 404,
		});
	});

	it('aceita 204 sem corpo', async () => {
		stubFetch({ status: 204 });
		await expect(request('https://exemplo.test', { method: 'DELETE' })).resolves.toBeUndefined();
	});

	it('sempre passa um signal, para a requisição poder ser abortada', async () => {
		const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
		vi.stubGlobal('fetch', fetchMock);

		await request('https://exemplo.test');

		const init = fetchMock.mock.calls[0][1] as RequestInit;
		expect(init.signal).toBeInstanceOf(AbortSignal);
	});
});
