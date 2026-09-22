import { DEFAULT_API_URL, readEnv } from './env';

describe('readEnv', () => {
	describe('VITE_API_URL', () => {
		it('usa o endereço configurado', () => {
			const { config } = readEnv({ VITE_API_URL: 'https://api.exemplo.test' });

			expect(config.apiUrl).toBe('https://api.exemplo.test');
		});

		it('tira a barra do fim, para não montar "//favorites"', () => {
			const { config } = readEnv({ VITE_API_URL: 'https://api.exemplo.test/' });

			expect(config.apiUrl).toBe('https://api.exemplo.test');
		});

		it('sem variável, cai no json-server local — sem reclamar', () => {
			const { config, issues } = readEnv({});

			expect(config.apiUrl).toBe(DEFAULT_API_URL);
			expect(issues.some((i) => i.variable === 'VITE_API_URL')).toBe(false);
		});

		it('endereço inválido vira aviso e volta ao padrão', () => {
			const { config, issues } = readEnv({ VITE_API_URL: 'localhost:3001' });

			expect(config.apiUrl).toBe(DEFAULT_API_URL);
			expect(issues.map((i) => i.variable)).toContain('VITE_API_URL');
		});

		it('recusa protocolo que não seja http(s)', () => {
			const { config } = readEnv({ VITE_API_URL: 'ftp://arquivos.test' });

			expect(config.apiUrl).toBe(DEFAULT_API_URL);
		});
	});

	describe('VITE_CONTACT_ENDPOINT', () => {
		it('passa um endereço válido adiante', () => {
			const { config } = readEnv({ VITE_CONTACT_ENDPOINT: 'https://formspree.test/f/abc' });

			expect(config.contactEndpoint).toBe('https://formspree.test/f/abc');
		});

		it('vazio é o caso normal: o formulário abre o cliente de e-mail', () => {
			const { config, issues } = readEnv({});

			expect(config.contactEndpoint).toBe('');
			expect(issues.some((i) => i.variable === 'VITE_CONTACT_ENDPOINT')).toBe(false);
		});

		it('endereço inválido avisa e é descartado, em vez de gerar um POST para lugar nenhum', () => {
			const { config, issues } = readEnv({ VITE_CONTACT_ENDPOINT: 'meu-formulario' });

			expect(config.contactEndpoint).toBe('');
			expect(issues.map((i) => i.variable)).toContain('VITE_CONTACT_ENDPOINT');
		});
	});

	describe('VITE_GOOGLE_BOOKS_API_KEY', () => {
		it('passa a chave adiante', () => {
			const { config } = readEnv({ VITE_GOOGLE_BOOKS_API_KEY: 'abc123' });

			expect(config.googleBooksApiKey).toBe('abc123');
		});

		it('sem chave, avisa — mas o app segue na cota compartilhada', () => {
			const { config, issues } = readEnv({});

			expect(config.googleBooksApiKey).toBe('');
			expect(issues.map((i) => i.variable)).toContain('VITE_GOOGLE_BOOKS_API_KEY');
		});
	});

	it('ignora espaços em volta dos valores', () => {
		const { config } = readEnv({
			VITE_API_URL: '  https://api.exemplo.test  ',
			VITE_GOOGLE_BOOKS_API_KEY: '  abc  ',
		});

		expect(config.apiUrl).toBe('https://api.exemplo.test');
		expect(config.googleBooksApiKey).toBe('abc');
	});

	it('valor que não é texto é tratado como ausente', () => {
		const { config } = readEnv({ VITE_API_URL: 42, VITE_GOOGLE_BOOKS_API_KEY: null });

		expect(config.apiUrl).toBe(DEFAULT_API_URL);
		expect(config.googleBooksApiKey).toBe('');
	});

	it('nunca lança: configuração ruim vira aviso, não tela branca', () => {
		expect(() =>
			readEnv({ VITE_API_URL: '???', VITE_CONTACT_ENDPOINT: '???' })
		).not.toThrow();
	});
});
