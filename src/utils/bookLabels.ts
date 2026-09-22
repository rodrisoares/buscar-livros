const VIEWABILITY_LABELS: Record<string, string> = {
	ALL_PAGES: 'Leitura completa disponível',
	PARTIAL: 'Amostra parcial disponível',
	NO_PAGES: 'Sem pré-visualização',
	UNKNOWN: 'Não informado',
};

const SALEABILITY_LABELS: Record<string, string> = {
	FOR_SALE: 'À venda',
	FOR_SALE_AND_RENTAL: 'À venda ou aluguel',
	FREE: 'Gratuito',
	NOT_FOR_SALE: 'Não está à venda',
	PREORDER: 'Pré-venda',
};

const MATURITY_LABELS: Record<string, string> = {
	NOT_MATURE: 'Livre',
	MATURE: 'Conteúdo adulto',
};

/** Traduz o `accessInfo.viewability` da API; '' quando o campo não veio. */
export const getViewabilityLabel = (viewability: string): string =>
	VIEWABILITY_LABELS[viewability] ?? '';

export const getSaleabilityLabel = (saleability: string): string =>
	SALEABILITY_LABELS[saleability] ?? '';

export const getMaturityLabel = (maturityRating: string): string =>
	MATURITY_LABELS[maturityRating] ?? '';

/** Converte o código ISO ('en', 'pt') no nome do idioma em português. */
export const getLanguageName = (code: string): string => {
	if (!code) return '';

	try {
		return new Intl.DisplayNames(['pt-BR'], { type: 'language' }).of(code) ?? code.toUpperCase();
	} catch {
		return code.toUpperCase();
	}
};

/** Lista dos formatos digitais disponíveis, já pronta para exibição. */
export const getAvailableFormats = (epub: boolean, pdf: boolean): string[] => {
	const formats: string[] = [];
	if (epub) formats.push('EPUB');
	if (pdf) formats.push('PDF');
	return formats;
};

/**
 * Só o ano de `publishedDate`. A API devolve formatos variados ('2012',
 * '2012-06', '2012-06-08'), e num card cabe o ano.
 */
export const getPublicationYear = (publishedDate: string): string =>
	/^(\d{4})/.exec(publishedDate.trim())?.[1] ?? '';

/**
 * Segmentos que a Google acrescenta ao fim do caminho sem acrescentar sentido.
 * "Fiction / Science Fiction / General" não é mais específico que o do meio.
 */
const GENERIC_CATEGORY_SEGMENTS = new Set(['general', 'other', 'miscellaneous', 'geral']);

/**
 * A parte que interessa de um caminho de categoria.
 *
 * A API devolve trilhas inteiras ("Fiction / Science Fiction / General"), que
 * num painel viram linhas truncadas e espalham a mesma categoria por várias
 * entradas — "Fiction / Science Fiction" e "Juvenile Fiction / Science Fiction"
 * contam separado quando a pergunta é só "quanta ficção científica eu tenho?".
 *
 * Fica o segmento mais específico que diga algo; um caminho só de genéricos
 * devolve o primeiro, para nunca sair vazio.
 */
export const shortenCategory = (category: string): string => {
	const segments = category
		.split('/')
		.map((segment) => segment.trim())
		.filter(Boolean);

	if (segments.length === 0) return category.trim();

	for (let index = segments.length - 1; index >= 0; index--) {
		if (!GENERIC_CATEGORY_SEGMENTS.has(segments[index].toLowerCase())) return segments[index];
	}

	return segments[0];
};
