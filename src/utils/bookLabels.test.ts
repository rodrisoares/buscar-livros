import { getPublicationYear, shortenCategory } from './bookLabels';

describe('getPublicationYear', () => {
	it('extrai o ano dos formatos que a API devolve', () => {
		expect(getPublicationYear('2012')).toBe('2012');
		expect(getPublicationYear('2012-06')).toBe('2012');
		expect(getPublicationYear('2012-06-08')).toBe('2012');
	});

	it('ignora espaços em volta', () => {
		expect(getPublicationYear('  1998-01-01 ')).toBe('1998');
	});

	it('devolve vazio quando não há ano reconhecível', () => {
		expect(getPublicationYear('')).toBe('');
		expect(getPublicationYear('sem data')).toBe('');
		expect(getPublicationYear('99')).toBe('');
	});
});

describe('shortenCategory', () => {
	it('fica com o segmento mais específico do caminho', () => {
		expect(shortenCategory('Fiction / Science Fiction / General')).toBe('Science Fiction');
		expect(shortenCategory('Juvenile Fiction / Science Fiction')).toBe('Science Fiction');
	});

	it('é o que faz dois caminhos diferentes virarem a mesma categoria', () => {
		expect(shortenCategory('Fiction / Science Fiction / General')).toBe(
			shortenCategory('Juvenile Fiction / Science Fiction')
		);
	});

	it('descarta os segmentos genéricos do fim', () => {
		expect(shortenCategory('Computers / Programming / General')).toBe('Programming');
		expect(shortenCategory('Fiction / Other')).toBe('Fiction');
		expect(shortenCategory('History / Miscellaneous')).toBe('History');
	});

	it('categoria simples passa intacta', () => {
		expect(shortenCategory('Computers')).toBe('Computers');
	});

	it('caminho só de genéricos devolve o primeiro, para não sair vazio', () => {
		expect(shortenCategory('General / Other')).toBe('General');
	});

	it('aguenta espaços sobrando e barras soltas', () => {
		expect(shortenCategory('  Fiction /  Fantasy  / ')).toBe('Fantasy');
		expect(shortenCategory('')).toBe('');
	});

	it('não se importa com a caixa do segmento genérico', () => {
		expect(shortenCategory('Fiction / Fantasy / GENERAL')).toBe('Fantasy');
	});
});
