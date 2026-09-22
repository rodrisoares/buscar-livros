import {
	EMPTY_CONTACT_FORM,
	hasErrors,
	isValidEmail,
	looksLikeBot,
	validateContactForm,
	type ContactFormData,
} from './contactForm';

const valido: ContactFormData = {
	name: 'Rodrigo',
	email: 'rodrigo@exemplo.com',
	subject: 'bug',
	message: 'Encontrei um problema na busca por autoria.',
	website: '',
};

describe('isValidEmail', () => {
	it('aceita endereços comuns', () => {
		expect(isValidEmail('alguem@exemplo.com')).toBe(true);
		expect(isValidEmail('nome.sobrenome+tag@sub.exemplo.com.br')).toBe(true);
	});

	it('recusa o que claramente não é e-mail', () => {
		expect(isValidEmail('alguem')).toBe(false);
		expect(isValidEmail('alguem@')).toBe(false);
		expect(isValidEmail('alguem@exemplo')).toBe(false);
		expect(isValidEmail('alguem @exemplo.com')).toBe(false);
		expect(isValidEmail('')).toBe(false);
	});
});

describe('validateContactForm', () => {
	it('não reclama de um formulário completo', () => {
		expect(validateContactForm(valido)).toEqual({});
		expect(hasErrors(validateContactForm(valido))).toBe(false);
	});

	it('aponta todos os campos vazios de uma vez', () => {
		const errors = validateContactForm(EMPTY_CONTACT_FORM);

		expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name', 'subject']);
		expect(hasErrors(errors)).toBe(true);
	});

	it('não aceita nome só de espaços', () => {
		expect(validateContactForm({ ...valido, name: '   ' }).name).toBeDefined();
	});

	it('exige um nome com ao menos duas letras', () => {
		expect(validateContactForm({ ...valido, name: 'R' }).name).toBeDefined();
	});

	it('recusa e-mail malformado', () => {
		expect(validateContactForm({ ...valido, email: 'rodrigo@' }).email).toBeDefined();
	});

	it('recusa assunto fora da lista', () => {
		expect(validateContactForm({ ...valido, subject: 'outro' }).subject).toBeDefined();
	});

	it('exige uma mensagem com algum conteúdo', () => {
		expect(validateContactForm({ ...valido, message: 'curta' }).message).toBeDefined();
		expect(validateContactForm({ ...valido, message: '            ' }).message).toBeDefined();
	});

	it('ignora a isca: ela não é campo do usuário', () => {
		expect(validateContactForm({ ...valido, website: 'http://spam' })).toEqual({});
	});
});

describe('looksLikeBot', () => {
	it('reconhece a isca preenchida', () => {
		expect(looksLikeBot({ ...valido, website: 'http://spam' })).toBe(true);
	});

	it('deixa passar quem não tocou nela', () => {
		expect(looksLikeBot(valido)).toBe(false);
		expect(looksLikeBot({ ...valido, website: '   ' })).toBe(false);
	});
});
