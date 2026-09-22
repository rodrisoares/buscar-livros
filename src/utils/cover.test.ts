import { formatPrice, highResCover } from './cover';

describe('highResCover', () => {
	it('troca zoom=1 por zoom=2 na URL da Google', () => {
		expect(
			highResCover('https://books.google.com/books/content?id=abc&printsec=frontcover&zoom=1')
		).toBe('https://books.google.com/books/content?id=abc&printsec=frontcover&zoom=2');
	});

	it('remove a dobra falsa da borda', () => {
		expect(highResCover('https://books.google.com/books/content?id=abc&zoom=1&edge=curl')).toBe(
			'https://books.google.com/books/content?id=abc&zoom=2'
		);
	});

	it('acrescenta zoom quando a URL não tem o parâmetro', () => {
		expect(highResCover('https://books.google.com/books/content?id=abc')).toBe(
			'https://books.google.com/books/content?id=abc&zoom=2'
		);
	});

	it('não mexe em URLs de outros domínios', () => {
		expect(highResCover('https://exemplo.test/capa.png')).toBe('https://exemplo.test/capa.png');
	});

	it('devolve vazio quando não há capa', () => {
		expect(highResCover('')).toBe('');
	});
});

describe('formatPrice', () => {
	it('formata na moeda informada', () => {
		expect(formatPrice(49.9, 'BRL')).toMatch(/R\$\s?49,90/);
	});

	it('devolve vazio quando falta preço ou moeda', () => {
		expect(formatPrice(undefined, 'BRL')).toBe('');
		expect(formatPrice(10, undefined)).toBe('');
		expect(formatPrice(Number.NaN, 'BRL')).toBe('');
	});

	it('não quebra com um código de moeda inválido', () => {
		expect(formatPrice(10, 'XYZ123')).toBe('XYZ123 10.00');
	});
});
