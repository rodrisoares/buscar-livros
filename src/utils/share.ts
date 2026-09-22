export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

interface ShareInput {
	title: string;
	text: string;
	url: string;
}

/**
 * Usa a Web Share API quando existe (celular e alguns desktops) e cai para a
 * área de transferência no resto. O retorno diz qual caminho foi usado, para a
 * interface dar a mensagem certa.
 */
export const shareLink = async ({ title, text, url }: ShareInput): Promise<ShareOutcome> => {
	if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
		try {
			await navigator.share({ title, text, url });
			return 'shared';
		} catch (error) {
			// O usuário fechar a folha de compartilhamento não é um erro.
			if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
			// Qualquer outra falha ainda pode ser resolvida copiando o link.
		}
	}

	try {
		await navigator.clipboard.writeText(url);
		return 'copied';
	} catch {
		return 'failed';
	}
};
