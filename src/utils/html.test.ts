import { stripHtml } from './html';

describe('stripHtml', () => {
	it('remove as tags que a Google Books devolve na descrição', () => {
		expect(stripHtml('<p>Um <i>ótimo</i> livro.</p>')).toBe('Um ótimo livro.');
	});

	it('transforma fim de parágrafo e <br> em quebra de linha', () => {
		expect(stripHtml('<p>Primeiro.</p><p>Segundo.</p>')).toBe('Primeiro.\nSegundo.');
		expect(stripHtml('Linha um<br>Linha dois')).toBe('Linha um\nLinha dois');
	});

	it('decodifica entidades HTML', () => {
		expect(stripHtml('<p>Bem &amp; simples</p>')).toBe('Bem & simples');
	});

	it('colapsa espaços e limita quebras em excesso', () => {
		expect(stripHtml('<p>a</p><p></p><p></p><p>b</p>')).toBe('a\n\nb');
		expect(stripHtml('muitos     espaços')).toBe('muitos espaços');
	});

	it('lida com texto vazio ou já sem HTML', () => {
		expect(stripHtml('')).toBe('');
		expect(stripHtml('texto puro')).toBe('texto puro');
	});
});
