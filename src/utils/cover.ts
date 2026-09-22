/**
 * A Google devolve a capa em `zoom=1` (~128px de largura), que fica borrada na
 * página de detalhes. O mesmo endpoint aceita `zoom=2`, dobrando a resolução.
 * `edge=curl` desenha aquela dobra falsa na borda e é removido.
 */
export const highResCover = (thumbnail: string): string => {
	if (!thumbnail) return '';
	if (!/books\.google|googleusercontent/.test(thumbnail)) return thumbnail;

	const withoutCurl = thumbnail.replace(/&edge=curl/g, '');

	return /([?&])zoom=\d+/.test(withoutCurl)
		? withoutCurl.replace(/([?&])zoom=\d+/, '$1zoom=2')
		: `${withoutCurl}${withoutCurl.includes('?') ? '&' : '?'}zoom=2`;
};

const CURRENCY_LOCALE: Record<string, string> = {
	BRL: 'pt-BR',
	USD: 'en-US',
	EUR: 'de-DE',
	GBP: 'en-GB',
};

/** Formata o preço na moeda devolvida pela API; string vazia quando não há preço. */
export const formatPrice = (amount: number | undefined, currencyCode: string | undefined): string => {
	if (typeof amount !== 'number' || !Number.isFinite(amount) || !currencyCode) return '';

	try {
		return new Intl.NumberFormat(CURRENCY_LOCALE[currencyCode] ?? 'pt-BR', {
			style: 'currency',
			currency: currencyCode,
		}).format(amount);
	} catch {
		return `${currencyCode} ${amount.toFixed(2)}`;
	}
};
