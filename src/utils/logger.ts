const isDev = import.meta.env.DEV;

/** Diagnóstico só em desenvolvimento; erros continuam visíveis em produção. */
export const logger = {
	debug: (...args: unknown[]) => {
		if (isDev) console.debug(...args);
	},
	warn: (...args: unknown[]) => {
		if (isDev) console.warn(...args);
	},
	error: (...args: unknown[]) => {
		console.error(...args);
	},
};
