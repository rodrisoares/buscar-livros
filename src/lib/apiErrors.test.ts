import { HttpError } from './http';
import { QUOTA_MESSAGE, describeBooksError, isQuotaError } from './apiErrors';

const FALLBACK = 'Não foi possível buscar os livros.';

describe('isQuotaError', () => {
	it('reconhece o 429 da Google Books', () => {
		expect(isQuotaError(new HttpError(429, 'Too Many Requests'))).toBe(true);
	});

	it('não confunde com outros erros', () => {
		expect(isQuotaError(new HttpError(500, 'Server Error'))).toBe(false);
		expect(isQuotaError(new TypeError('Failed to fetch'))).toBe(false);
		expect(isQuotaError(undefined)).toBe(false);
	});
});

describe('describeBooksError', () => {
	it('explica a cota esgotada em vez de culpar a conexão', () => {
		const mensagem = describeBooksError(new HttpError(429, 'Too Many Requests'), FALLBACK);

		expect(mensagem).toBe(QUOTA_MESSAGE);
		expect(mensagem).toContain('VITE_GOOGLE_BOOKS_API_KEY');
		expect(mensagem).not.toContain('conexão');
	});

	it('aponta a chave inválida no 401 e no 403', () => {
		for (const status of [401, 403]) {
			const mensagem = describeBooksError(new HttpError(status, 'Recusado'), FALLBACK);

			expect(mensagem).toContain('VITE_GOOGLE_BOOKS_API_KEY');
			expect(mensagem).not.toBe(FALLBACK);
		}
	});

	it('trata livro inexistente', () => {
		expect(describeBooksError(new HttpError(404, 'Not Found'), FALLBACK)).toContain(
			'Não encontramos este livro'
		);
	});

	it('separa instabilidade do servidor', () => {
		expect(describeBooksError(new HttpError(503, 'Unavailable'), FALLBACK)).toContain('instável');
	});

	it('cai no texto padrão para falha de rede', () => {
		expect(describeBooksError(new TypeError('Failed to fetch'), FALLBACK)).toBe(FALLBACK);
	});
});
