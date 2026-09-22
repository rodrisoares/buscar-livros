import { logger } from '@/utils/logger';

/**
 * As variáveis de ambiente do app, lidas e conferidas num lugar só.
 *
 * O endereço da API estava repetido em quatro serviços, cada um com a sua cópia
 * do valor padrão — mudar a porta do json-server pedia quatro edições, e
 * esquecer uma dava um erro que só aparecia na tela que usava aquele serviço.
 */
export interface AppConfig {
	/** Base da API do projeto (estante, metas, estantes próprias, coleções). */
	apiUrl: string;
	/** Endpoint do formulário de contato; vazio abre o cliente de e-mail. */
	contactEndpoint: string;
	/** Chave da Google Books; vazia usa a cota anônima compartilhada. */
	googleBooksApiKey: string;
}

/** Um problema encontrado na configuração, para avisar sem derrubar o app. */
export interface EnvIssue {
	variable: string;
	message: string;
}

export const DEFAULT_API_URL = 'http://localhost:3001';

const asText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** `http://host:3001/` e `http://host:3001` precisam virar a mesma coisa. */
const withoutTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const isAbsoluteUrl = (value: string): boolean => {
	try {
		const { protocol } = new URL(value);
		return protocol === 'http:' || protocol === 'https:';
	} catch {
		return false;
	}
};

/**
 * Transforma o que veio do ambiente em configuração utilizável, junto com a
 * lista do que estava errado.
 *
 * Nada aqui interrompe a aplicação: uma variável ruim vira um aviso e um valor
 * padrão. Derrubar a tela inteira porque a chave opcional da Google Books não
 * foi preenchida seria pior do que buscar na cota compartilhada.
 */
export const readEnv = (
	raw: Record<string, unknown>
): { config: AppConfig; issues: EnvIssue[] } => {
	const issues: EnvIssue[] = [];

	const rawApiUrl = asText(raw.VITE_API_URL);
	let apiUrl = withoutTrailingSlash(rawApiUrl);

	if (!rawApiUrl) {
		apiUrl = DEFAULT_API_URL;
	} else if (!isAbsoluteUrl(rawApiUrl)) {
		issues.push({
			variable: 'VITE_API_URL',
			message: `"${rawApiUrl}" não é um endereço http(s) válido; usando ${DEFAULT_API_URL}.`,
		});
		apiUrl = DEFAULT_API_URL;
	}

	const contactEndpoint = asText(raw.VITE_CONTACT_ENDPOINT);
	if (contactEndpoint && !isAbsoluteUrl(contactEndpoint)) {
		issues.push({
			variable: 'VITE_CONTACT_ENDPOINT',
			message: `"${contactEndpoint}" não é um endereço http(s) válido; o formulário vai abrir o cliente de e-mail.`,
		});
	}

	const googleBooksApiKey = asText(raw.VITE_GOOGLE_BOOKS_API_KEY);
	if (!googleBooksApiKey) {
		issues.push({
			variable: 'VITE_GOOGLE_BOOKS_API_KEY',
			message:
				'sem chave, as buscas usam a cota anônima compartilhada da Google Books e param com erro 429 quando ela esgota.',
		});
	}

	return {
		config: {
			apiUrl,
			contactEndpoint: isAbsoluteUrl(contactEndpoint) ? contactEndpoint : '',
			googleBooksApiKey,
		},
		issues,
	};
};

const { config, issues } = readEnv(import.meta.env as unknown as Record<string, unknown>);

// Um aviso por problema, uma vez só, na carga do módulo. Em produção o
// `logger.warn` fica quieto — isto é recado para quem está desenvolvendo.
for (const issue of issues) {
	logger.warn(`[env] ${issue.variable}: ${issue.message}`);
}

export const env: AppConfig = config;
