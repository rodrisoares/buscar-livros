/**
 * Smoke test de ponta a ponta contra o build de produção.
 *
 * Pré-requisitos (em outros terminais):
 *   npm run start     -> json-server em :3001
 *   npm run build && npx vite preview --port 4173
 *
 * As respostas da Google Books API são interceptadas e substituídas por dados
 * sintéticos: o teste não depende de rede nem da cota diária, e a paginação
 * pode ser verificada de forma determinística.
 */
import puppeteer from 'puppeteer';

const APP = process.env.APP_URL ?? 'http://localhost:4173';
const API = process.env.API_URL ?? 'http://localhost:3001/favorites';

const TOTAL_ITEMS = 3000;
const PAGE_SIZE = 20;

// A resposta simulada precisa dos cabeçalhos CORS: o navegador bloqueia cross-origin sem eles.
const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
const check = (name, ok, detail = '') => {
	results.push({ name, ok, detail });
	console.log(`${ok ? 'PASS ' : 'FALHOU'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

// PNG 1x1 transparente, para as capas resolverem sem acessar a internet.
const PIXEL_PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
	'base64'
);

const makeVolume = (index, orderBy) => ({
	id: `id-${index}`,
	volumeInfo: {
		title: `${orderBy === 'newest' ? 'Recente' : 'Relevante'} ${index}`,
		authors: [`Autor ${index}`],
		publisher: 'Editora Teste',
		publishedDate: '2024',
		description: `<p>Descrição do livro ${index}.</p><p>Segundo parágrafo.</p>`,
		pageCount: 100 + index,
		categories: ['Ficção'],
		imageLinks: { thumbnail: `https://books.google.com/books/content?id=${index}&zoom=1&edge=curl` },
		previewLink: 'https://preview.test',
		infoLink: 'https://info.test',
		industryIdentifiers: [
			{ type: 'ISBN_13', identifier: '9781234567897' },
			{ type: 'ISBN_10', identifier: '1234567897' },
		],
		language: 'en',
		averageRating: 4.5,
		ratingsCount: 87,
		maturityRating: 'NOT_MATURE',
	},
	saleInfo: {
		saleability: 'FOR_SALE',
		retailPrice: { amount: 39.9, currencyCode: 'BRL' },
		buyLink: 'https://compra.test',
	},
	accessInfo: {
		viewability: 'PARTIAL',
		epub: { isAvailable: true },
		pdf: { isAvailable: false },
	},
});

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();

// Sem isto o teste depende do tema do sistema onde ele roda: este Chrome
// reporta "dark", e o app (que por padrão segue o sistema) abriria no escuro.
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

const consoleErrors = [];
const consoleLogs = [];
page.on('console', (m) => {
	if (m.type() === 'error') consoleErrors.push(m.text());
	if (m.type() === 'log') consoleLogs.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

const searchRequests = [];
const suggestionRequests = [];
const coverRequests = [];
let failNextDelete = false;
let slowSearch = false;
/** Quando ligado, o endpoint de volume responde 429, como a cota esgotada faz. */
let quotaOnDetail = false;

await page.setRequestInterception(true);
page.on('request', (req) => {
	const url = req.url();

	if (url.includes('googleapis.com/books/v1/volumes')) {
		const parsed = new URL(url);
		const detailId = parsed.pathname.split('/volumes/')[1];

		if (detailId) {
			if (quotaOnDetail) {
				return req.respond({
					status: 429,
					contentType: 'application/json',
					headers: CORS_HEADERS,
					body: JSON.stringify({
						error: { code: 429, message: "Quota exceeded for quota metric 'Queries'" },
					}),
				});
			}

			return req.respond({
				status: 200,
				contentType: 'application/json',
				headers: CORS_HEADERS,
				body: JSON.stringify(makeVolume(Number(detailId.replace('id-', '')) || 1, 'relevance')),
			});
		}

		const startIndex = Number(parsed.searchParams.get('startIndex') ?? 0);
		const orderBy = parsed.searchParams.get('orderBy') ?? 'relevance';
		const q = parsed.searchParams.get('q') ?? '';

		// A vitrine da home consulta sozinha; ela não entra no histórico que as
		// verificações de paginação e filtro inspecionam com .at(-1).
		const daVitrine = q.startsWith('subject:"');
		if (daVitrine) suggestionRequests.push(q);
		else
			searchRequests.push({
				startIndex,
				orderBy,
				q,
				langRestrict: parsed.searchParams.get('langRestrict'),
				filter: parsed.searchParams.get('filter'),
				printType: parsed.searchParams.get('printType'),
			});

		const responder = () =>
			req.respond({
				status: 200,
				contentType: 'application/json',
				headers: CORS_HEADERS,
				body: JSON.stringify({
					kind: 'books#volumes',
					totalItems: TOTAL_ITEMS,
					items: Array.from({ length: PAGE_SIZE }, (_, i) =>
						makeVolume(startIndex + i + 1, orderBy)
					),
				}),
			});

		// Resposta lenta de propósito, para dar tempo de observar o skeleton.
		if (slowSearch) {
			setTimeout(() => responder().catch(() => {}), 1200);
			return;
		}

		return responder();
	}

	if (url.includes('books.google.com/books/content')) {
		coverRequests.push(url);
		return req.respond({ status: 200, contentType: 'image/png',
			headers: CORS_HEADERS, body: PIXEL_PNG });
	}

	if (failNextDelete && req.method() === 'DELETE' && url.includes('/favorites/')) {
		return req.abort('failed');
	}

	return req.continue();
});

// ---------------------------------------------------------------- busca e URL
await page.goto(APP, { waitUntil: 'networkidle0' });
check(
	'Home sem busca mostra o hero',
	(await page.$eval('h1', (el) => el.textContent)).includes('Que livro você procura'),
	await page.title()
);

await page.type('input[type="search"]', 'tolkien');
await page.keyboard.press('Enter');
await page.waitForFunction(() => document.body.innerText.includes('Resultados da busca'));

check('Busca vai para a URL (?q=)', page.url().includes('q=tolkien'), page.url());
check('Título da aba reflete a busca', (await page.title()).startsWith('Busca: tolkien'), await page.title());

// ------------------------------------------------------- contagem de resultados
const countText = await page.$eval('[aria-live="polite"]', (el) => el.textContent.replace(/\s+/g, ' ').trim());
check(
	'Contagem mostra a fatia e o total real (não "20 livros")',
	countText.includes('Exibindo 1–20 de 3.000 resultados'),
	countText
);

// ------------------------------------------------- barra de busca sempre visível
check(
	'Barra de busca continua acessível na tela de resultados',
	(await page.$('input[type="search"]')) !== null,
	'input presente sobre os resultados'
);

// -------------------------------------------------------------------- paginação
const firstTitleP1 = await page.$eval('h3', (el) => el.textContent.trim());
await page.click('button[aria-label="Paginação dos resultados"] ~ *, nav[aria-label="Paginação dos resultados"] button:last-child');
await page.waitForFunction(() => window.location.search.includes('page=2'));
await sleep(600);

const firstTitleP2 = await page.$eval('h3', (el) => el.textContent.trim());
const countTextP2 = await page.$eval('[aria-live="polite"]', (el) => el.textContent.replace(/\s+/g, ' ').trim());
const lastSearch = searchRequests.at(-1);

check('Próxima página muda a URL', page.url().includes('page=2'), page.url());
check('Página 2 pede startIndex=20 à API', lastSearch.startIndex === 20, `startIndex=${lastSearch.startIndex}`);
check('Página 2 traz outros resultados', firstTitleP1 !== firstTitleP2, `${firstTitleP1} -> ${firstTitleP2}`);
check('Contagem acompanha a página', countTextP2.includes('Exibindo 21–40 de 3.000'), countTextP2);

await page.goBack({ waitUntil: 'networkidle0' });
await sleep(500);
check(
	'Voltar no histórico retorna à página 1',
	!page.url().includes('page=2') && page.url().includes('q=tolkien'),
	page.url()
);

// ------------------------------------------------------------------- ordenação
await page.select('#sort-results', 'newest');
await page.waitForFunction(() => window.location.search.includes('sort=newest'));
await sleep(600);

const sortRequest = searchRequests.at(-1);
check('Ordenação vai para a URL', page.url().includes('sort=newest'), page.url());
check('Ordenação é enviada à API', sortRequest.orderBy === 'newest', `orderBy=${sortRequest.orderBy}`);
check(
	'Resultados refletem a nova ordenação',
	(await page.$eval('h3', (el) => el.textContent)).startsWith('Recente'),
	await page.$eval('h3', (el) => el.textContent.trim())
);

// -------------------------------------------------------- histórico de buscas
await page.click('input[type="search"]', { clickCount: 3 });
await page.type('input[type="search"]', 'tolk');
await sleep(500);
const suggestions = await page.$$eval('[id^="search-suggestions"] button', (els) =>
	els.map((e) => e.textContent.trim()).filter((t) => t && t !== '✕')
);
check(
	'Buscas recentes aparecem como sugestão',
	suggestions.includes('tolkien'),
	suggestions.join(', ') || 'nenhuma'
);

// -------------------------------------------------- detalhes com campos novos
await page.goto(`${APP}/book/id-7`, { waitUntil: 'networkidle0' });
await page.waitForSelector('h1');
const detailsText = await page.$eval('body', (el) => el.innerText);

check('Título da aba usa o nome do livro', (await page.title()).startsWith('Relevante 7'), await page.title());
check('Ficha técnica mostra ISBN-13', detailsText.includes('9781234567897'), 'ISBN-13');
check('Ficha técnica mostra o idioma traduzido', detailsText.includes('inglês'), 'idioma');
check('Ficha técnica mostra avaliação', detailsText.includes('4.5'), 'avaliação');
check(
	'Disponibilidade vem da API (não é mais fixa)',
	detailsText.includes('Amostra parcial disponível') && !detailsText.includes('Disponibilidade:\nDisponível'),
	'accessInfo.viewability'
);
check('Formato digital EPUB é exibido', detailsText.includes('EPUB'), 'formatos');
check('Preço formatado aparece no botão de compra', /R\$\s?39,90/.test(detailsText), 'saleInfo');
check(
	'Descrição perde as tags HTML',
	detailsText.includes('Descrição do livro 7.') && !detailsText.includes('<p>'),
	'stripHtml'
);

const coverSrc = await page.$eval('img[alt^="Capa do livro"]', (el) => el.getAttribute('src'));
check('Capa da página de detalhes pede zoom=2', coverSrc.includes('zoom=2'), coverSrc);
check('Dobra falsa (edge=curl) removida', !coverSrc.includes('edge=curl'), coverSrc);

// --------------------------------------------------------------- favoritos
// O id do volume vai em bookId — o json-server gera a própria chave do registro.
const tmp = {
	bookId: 'TMP_E2E',
	title: 'ZZZ Livro Temporario E2E',
	author: 'Teste',
	publisher: 'Editora Teste',
	categories: ['Teste'],
	addedAt: Date.now(),
};
// Um segundo livro garante que o teste do filtro seja significativo mesmo com a base vazia.
const other = {
	bookId: 'TMP_E2E_OUTRO',
	title: 'Outro Livro Qualquer',
	author: 'Fulano',
	publisher: 'Editora Teste',
	categories: ['Teste'],
	addedAt: Date.now() - 60_000,
};

for (const book of [other, tmp]) {
	await fetch(API, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(book),
	});
}

await page.goto(`${APP}/favorites`, { waitUntil: 'networkidle0' });
await sleep(800);

const badge = await page.$eval('header', (el) => el.innerText.replace(/\s+/g, ' ').trim());
const favCount = await page.$$eval('img[alt^="Capa do livro"]', (els) => els.length);
check('Header mostra o contador da estante', new RegExp(`Minha estante ${favCount}`).test(badge), badge);

const firstFav = await page.$eval('h3', (el) => el.textContent.trim());
check('Ordenação por addedAt coloca o mais novo primeiro', firstFav === tmp.title, firstFav);

// filtro dentro dos favoritos
await page.type('#favorites-filter', 'ZZZ Livro');
await sleep(400);
const filtered = await page.$$eval('img[alt^="Capa do livro"]', (els) => els.length);
check(
	'Filtro da estante reduz a lista',
	favCount >= 2 && filtered === 1,
	`${favCount} -> ${filtered}`
);

await page.click('#favorites-filter', { clickCount: 3 });
await page.keyboard.press('Backspace');
await sleep(400);

// ------------------------------------------------------- toast + desfazer
await page.click(`button[aria-label^="Remover ${tmp.title}"]`);
await sleep(900);

const toastText = await page.$eval('[role="region"][aria-label="Notificações"]', (el) => el.innerText);
const afterRemove = await page.$$eval('img[alt^="Capa do livro"]', (els) => els.length);
check('Toast confirma a remoção', toastText.includes('removido da estante'), toastText.split('\n')[0]);
check('Toast oferece Desfazer', toastText.includes('Desfazer'), 'ação presente');
check('Livro sai da estante', afterRemove === favCount - 1, `${favCount} -> ${afterRemove}`);

await page.evaluate(() => {
	const botao = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Desfazer');
	botao?.click();
});
await sleep(1200);

const afterUndo = await page.$$eval('img[alt^="Capa do livro"]', (els) => els.length);
const serverAfterUndo = await (await fetch(API)).json();
const restored = serverAfterUndo.find((b) => b.bookId === tmp.bookId);
check('Desfazer devolve o livro à estante', afterUndo === favCount, `${afterRemove} -> ${afterUndo}`);
check('Desfazer regrava o livro no servidor', Boolean(restored), `${serverAfterUndo.length} favoritos`);
check(
	'Desfazer preserva o addedAt original',
	restored?.addedAt === tmp.addedAt,
	`${restored?.addedAt} vs ${tmp.addedAt}`
);

// -------------------------------------------- erro de mutação vira toast
failNextDelete = true;
await page.click(`button[aria-label^="Remover ${tmp.title}"]`);
await sleep(2000);
const errorToast = await page.$eval('[role="region"][aria-label="Notificações"]', (el) => el.innerText);
const afterFailure = await page.$$eval('img[alt^="Capa do livro"]', (els) => els.length);
check('Falha ao remover mostra toast de erro', errorToast.includes('Não foi possível salvar'), errorToast.split('\n')[0]);
check('Rollback devolve o livro após a falha', afterFailure === favCount, `${afterFailure} cards`);
failNextDelete = false;

// ------------------------- regressão: favoritar pela interface e recarregar
// O json-server ignora o id enviado no POST. Se o app confundir a chave do
// registro com o id do volume, o coração "desmarca" sozinho no recarregamento.
await page.goto(`${APP}/?q=tolkien`, { waitUntil: 'networkidle0' });
await page.waitForSelector('button[aria-label^="Adicionar"]');

const bookTitle = await page.$eval('h3', (el) => el.textContent.trim());
await page.click('button[aria-label^="Adicionar"]');
await sleep(1500);

await page.reload({ waitUntil: 'networkidle0' });
await sleep(1200);

// O seletor precisa mirar o coração deste livro: o header também tem botões
// com aria-pressed (o seletor de tema).
const stillMarked = await page.$eval(
	`button[aria-label="Remover ${bookTitle} da estante"]`,
	(el) => el.getAttribute('aria-pressed')
);
check(
	'Livro guardado pela UI continua marcado após recarregar',
	stillMarked === 'true',
	`aria-pressed=${stillMarked} (${bookTitle})`
);

await page.goto(`${APP}/favorites`, { waitUntil: 'networkidle0' });
await sleep(900);
const detailHref = await page.$$eval('a[href^="/book/"]', (els) =>
	els.map((e) => e.getAttribute('href'))
);
check(
	'Estante aponta para o id do volume, não para a chave do registro',
	detailHref.includes('/book/id-1'),
	detailHref.join(', ')
);

// desfaz o favorito criado por este bloco
await page.click(`button[aria-label^="Remover ${bookTitle}"]`);
await sleep(1500);


// ------------------------------------------------------ filtros avançados
await page.goto(`${APP}/?q=anel`, { waitUntil: 'networkidle0' });
await page.waitForSelector('img[alt^="Capa do livro"]');

await page.click('button[aria-controls="painel-filtros"]');
await page.waitForSelector('#filtro-autor');
await page.type('#filtro-autor', 'tolkien');
await page.type('#filtro-assunto', 'fantasia');
await page.select('#filtro-idioma', 'pt');
await page.select('#filtro-disponibilidade', 'free-ebooks');
await page.click('#painel-filtros button[type="submit"]');
await sleep(1200);

const filterRequest = searchRequests.at(-1);
check(
	'Filtros vão para a URL',
	page.url().includes('autor=tolkien') && page.url().includes('idioma=pt'),
	decodeURIComponent(page.url())
);
check(
	'Operadores da API são montados corretamente',
	filterRequest.q === 'anel inauthor:tolkien subject:fantasia',
	filterRequest.q
);
check('langRestrict é enviado', filterRequest.langRestrict === 'pt', `${filterRequest.langRestrict}`);
check(
	'filter=free-ebooks é enviado',
	filterRequest.filter === 'free-ebooks',
	`${filterRequest.filter}`
);

const chips = await page.$$eval('.rounded-full', (els) => els.map((e) => e.textContent.trim()));
check(
	'Filtros ativos aparecem como selos',
	chips.some((c) => c.includes('Autoria: tolkien')) && chips.some((c) => c.includes('Idioma: Português')),
	chips.filter((c) => c.includes(':')).join(' | ')
);

// ---------------------------------------------------------------- skeleton
slowSearch = true;
await page.goto(`${APP}/?q=skeleton`, { waitUntil: 'domcontentloaded' });
await sleep(400);
const skeletonVisible = await page.evaluate(
	() => document.body.innerText.includes('Carregando resultados') || document.querySelectorAll('.animate-pulse').length > 0
);
check('Grade mostra skeleton enquanto carrega', skeletonVisible, `${skeletonVisible}`);
await page.waitForSelector('img[alt^="Capa do livro"]');
slowSearch = false;

// -------------------------------------------------------------- modo escuro
await page.click('button[aria-label="Ativar tema escuro"]');
await sleep(300);
const darkOn = await page.evaluate(() => ({
	classe: document.documentElement.classList.contains('dark'),
	guardado: localStorage.getItem('theme'),
	fundo: getComputedStyle(document.body).backgroundColor,
}));
check(
	'Modo escuro aplica a classe e persiste a escolha',
	darkOn.classe && darkOn.guardado === 'dark',
	`classe=${darkOn.classe} storage=${darkOn.guardado} fundo=${darkOn.fundo}`
);

await page.reload({ waitUntil: 'networkidle0' });
const darkAfterReload = await page.evaluate(() => document.documentElement.classList.contains('dark'));
check('Modo escuro sobrevive ao recarregamento', darkAfterReload, `${darkAfterReload}`);

await page.click('button[aria-label="Ativar tema claro"]');
await sleep(300);
check(
	'Voltar para o tema claro remove a classe',
	!(await page.evaluate(() => document.documentElement.classList.contains('dark'))),
	'ok'
);

// ------------------------------------------------------------ compartilhar
await browser.defaultBrowserContext().overridePermissions(APP, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);

const clicarCompartilhar = () =>
	page.evaluate(() => {
		const botao = [...document.querySelectorAll('button')].find((b) =>
			b.textContent.includes('Compartilhar')
		);
		botao?.click();
	});

// Caminho 1 (celular e navegadores com Web Share API): a folha nativa é aberta.
// O Chrome headless expõe navigator.share, então trocamos por um espião.
await page.evaluateOnNewDocument(() => {
	window.__compartilhado = null;
	navigator.share = (dados) => {
		window.__compartilhado = dados;
		return Promise.resolve();
	};
});

await page.goto(`${APP}/book/id-7`, { waitUntil: 'networkidle0' });
await page.waitForSelector('h1');
await page.bringToFront();
await clicarCompartilhar();
await sleep(600);

const compartilhado = await page.evaluate(() => window.__compartilhado);
check(
	'Web Share API recebe título e link do livro',
	compartilhado?.url?.endsWith('/book/id-7') && Boolean(compartilhado?.title),
	JSON.stringify(compartilhado)
);

// Caminho 2 (desktop sem Web Share API): cai para a área de transferência.
// Este script roda depois do espião, então a remoção prevalece.
await page.evaluateOnNewDocument(() => {
	// `delete` só removeria a propriedade própria e revelaria a nativa do
	// protótipo; definir como undefined é o que simula o navegador sem Web Share.
	Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
});

await page.goto(`${APP}/book/id-7`, { waitUntil: 'networkidle0' });
await page.waitForSelector('h1');
await page.bringToFront();
await clicarCompartilhar();
await sleep(800);

const clipboard = await page.evaluate(async () => {
	try {
		return await navigator.clipboard.readText();
	} catch (e) {
		return `ERRO_LEITURA: ${e.message}`;
	}
});
check('Sem Web Share, o link é copiado', clipboard.endsWith('/book/id-7'), clipboard);

const shareToast = await page.$eval('[role="region"][aria-label="Notificações"]', (el) => el.innerText);
check('Toast confirma a cópia', shareToast.includes('Link copiado'), shareToast.split('\n')[0]);

// --------------------------------------------- estantes, progresso, nota, tags
await page.evaluate(() => {
	const botao = [...document.querySelectorAll('button')].find(
		(b) => b.textContent.trim() === 'Estou lendo'
	);
	botao?.click();
});
await sleep(1500);

const painelText = await page.$eval('body', (el) => el.innerText);
check(
	'Escolher "Estou lendo" abre o painel de acompanhamento',
	painelText.includes('Minha leitura') && painelText.includes('Progresso de leitura'),
	'painel visível'
);

await page.click('#current-page', { clickCount: 3 });
await page.type('#current-page', '50');
await page.keyboard.press('Enter');
await sleep(1200);

// O volume id-7 tem 107 páginas (100 + índice), então 50 páginas ≈ 47%.
const progressoText = await page.$eval('body', (el) => el.innerText);
check('Progresso é calculado a partir da página atual', progressoText.includes('47%'), 'percentual');

await page.click('button[aria-label="4 estrelas"]');
await sleep(1200);

await page.type('input[aria-label="Adicionar tag"]', 'releitura');
await page.keyboard.press('Enter');
await sleep(1500);

const registros = await (await fetch(API)).json();
const salvo = registros.find((r) => r.bookId === 'id-7');
check('Estante, progresso, nota e tag persistem no servidor', Boolean(salvo), `${registros.length} registros`);
check('Status salvo como "reading"', salvo?.status === 'reading', `${salvo?.status}`);
check('Página atual salva', salvo?.currentPage === 50, `${salvo?.currentPage}`);
check('Nota pessoal salva', salvo?.rating === 4, `${salvo?.rating}`);
check('Tag salva', Array.isArray(salvo?.tags) && salvo.tags.includes('releitura'), `${JSON.stringify(salvo?.tags)}`);
check('startedAt preenchido ao começar a leitura', salvo?.startedAt > 0, `${salvo?.startedAt}`);

// ------------------------------------------------------ livros relacionados
const relacionadosText = await page.$eval('body', (el) => el.innerText);
check(
	'Página de detalhes sugere livros relacionados',
	relacionadosText.includes('Você também pode gostar') && relacionadosText.includes('Mais de Autor 7'),
	'seção presente'
);

// --------------------------------------------------------- abas da estante
await page.goto(`${APP}/favorites`, { waitUntil: 'networkidle0' });
await sleep(900);

await page.evaluate(() => {
	const aba = [...document.querySelectorAll('[role="tab"]')].find((b) =>
		b.textContent.includes('Lendo')
	);
	aba?.click();
});
await sleep(400);

const naAbaLendo = await page.$$eval('img[alt^="Capa do livro"]', (els) => els.length);
const selo = await page.$eval('body', (el) => el.innerText);
check('Aba "Lendo" filtra a estante', naAbaLendo === 1, `${naAbaLendo} livro(s)`);
check('Card mostra o selo da estante e o progresso', selo.includes('Lendo') && selo.includes('47% lido'), 'selo + barra');

// ----------------------------------------------------- painel e meta de leitura
await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle0' });
await sleep(900);

const painel = await page.$eval('body', (el) => el.innerText.replace(/\s+/g, ' '));
check('Painel mostra o total da estante', /Livros na estante \d+/.test(painel), 'total');
check('Painel soma as páginas lidas', painel.includes('Páginas lidas'), 'páginas');
check('Painel lista autores e categorias', painel.includes('Autores mais presentes') && painel.includes('Categorias'), 'listas');
check('Painel lista as tags do usuário', painel.includes('releitura'), 'tags');

await page.type('#goal-target', '5');
await page.evaluate(() => {
	const botao = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Salvar');
	botao?.click();
});
await sleep(1500);

const painelComMeta = await page.$eval('body', (el) => el.innerText.replace(/\s+/g, ' '));
const metasSalvas = await (await fetch(`${API.replace('/favorites', '/goals')}`)).json();
check('Meta de leitura é salva no servidor', metasSalvas.some((g) => g.target === 5), `${JSON.stringify(metasSalvas)}`);
check('Painel mostra o progresso da meta', /de 5 livros concluídos/.test(painelComMeta), 'progresso da meta');

// ------------------------------------------------------------------ 404 e menu
await page.goto(`${APP}/rota-que-nao-existe`, { waitUntil: 'networkidle0' });
check(
	'Rota inválida mostra o 404',
	(await page.$eval('h1', (el) => el.textContent)) === 'Página não encontrada',
	await page.title()
);

await page.setViewport({ width: 375, height: 800, isMobile: true });
await page.goto(APP, { waitUntil: 'networkidle0' });
const menuBefore = await page.$('#mobile-menu');
await page.click('button[aria-controls="mobile-menu"]');
await sleep(300);
check(
	'Menu mobile abre',
	menuBefore === null && (await page.$('#mobile-menu')) !== null,
	'aria-expanded=' + (await page.$eval('button[aria-controls="mobile-menu"]', (el) => el.getAttribute('aria-expanded')))
);

// --------------------------------------------- vitrine de sugestões na home
await page.setViewport({ width: 1280, height: 900 });
await page.goto(APP, { waitUntil: 'networkidle0' });
await sleep(1000);

const vitrine = await page.$('section[aria-labelledby="titulo-sugestoes"]');
const cardsDaVitrine = await page.$$eval(
	'section[aria-labelledby="titulo-sugestoes"] article',
	(els) => els.length
);
check('Home exibe a vitrine de sugestões', vitrine !== null, 'seção presente');
check('Vitrine traz cards de livros', cardsDaVitrine === 4, `${cardsDaVitrine} card(s)`);
check(
	'Vitrine usa consulta por assunto',
	suggestionRequests.length > 0 && suggestionRequests.at(-1).startsWith('subject:"'),
	suggestionRequests.at(-1) ?? 'nenhuma'
);

// ------------------------------------------------ seletor de tema como toggle
const botoesDeTema = await page.$$eval('header button[aria-label^="Ativar tema"]', (els) =>
	els.map((e) => e.getAttribute('aria-label'))
);
check(
	'Tema tem um único botão de alternância',
	botoesDeTema.length === 1,
	botoesDeTema.join(', ') || 'nenhum'
);

const rotuloInicial = botoesDeTema[0];
await page.click('header button[aria-label^="Ativar tema"]');
await sleep(400);
const rotuloDepois = await page.$eval('header button[aria-label^="Ativar tema"]', (el) =>
	el.getAttribute('aria-label')
);
check(
	'Clicar troca o ícone para o tema oposto',
	rotuloInicial !== rotuloDepois,
	`${rotuloInicial} -> ${rotuloDepois}`
);

await page.click('header button[aria-label^="Ativar tema"]');
await sleep(400);
check(
	'Segundo clique volta ao tema anterior',
	(await page.$eval('header button[aria-label^="Ativar tema"]', (el) =>
		el.getAttribute('aria-label')
	)) === rotuloInicial,
	rotuloInicial
);

// Sem escolha salva, o app segue o tema do sistema.
await page.evaluate(() => localStorage.removeItem('theme'));
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
await page.reload({ waitUntil: 'networkidle0' });
await sleep(400);
check(
	'Sem escolha salva, segue o tema do sistema',
	await page.evaluate(() => document.documentElement.classList.contains('dark')),
	'sistema escuro -> app escuro'
);
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
await page.reload({ waitUntil: 'networkidle0' });
await sleep(400);

// ------------------------- detalhes continuam abrindo com a cota da API esgotada
// Reproduz o 429 relatado: livro que já está na estante não deve depender da rede.
const naEstante = (await (await fetch(API)).json()).find((r) => r.bookId || r.id);
const idDoLivroSalvo = naEstante.bookId ?? naEstante.id;

quotaOnDetail = true;
await page.goto(`${APP}/book/${idDoLivroSalvo}`, { waitUntil: 'networkidle0' });
await sleep(1200);

const textoDetalhe = await page.$eval('body', (el) => el.innerText);
check(
	'"Ver detalhes" abre mesmo com 429, usando os dados da estante',
	textoDetalhe.includes(naEstante.title) && !textoDetalhe.includes('Livro não encontrado'),
	naEstante.title
);
check(
	'Aviso explica que a cota da API foi atingida',
	textoDetalhe.includes('cota diária da Google Books API foi atingida'),
	'aviso presente'
);

// Livro que nunca foi carregado não tem de onde vir: aí sim é erro de tela cheia.
await page.goto(`${APP}/book/id-desconhecido-999`, { waitUntil: 'networkidle0' });
await sleep(1200);
const textoSemDados = await page.$eval('body', (el) => el.innerText);
check(
	'Sem dados salvos, o erro explica a cota em vez de culpar a conexão',
	textoSemDados.includes('cota diária') && !textoSemDados.includes('Verifique sua conexão'),
	'mensagem de cota'
);
quotaOnDetail = false;

// ------------------------------------------------------- layout e navegação
await page.setViewport({ width: 1280, height: 900 });

// Busca compacta no cabeçalho, nas telas internas
await page.goto(`${APP}/favorites`, { waitUntil: 'networkidle0' });
await sleep(700);
check(
	'Cabeçalho traz busca nas telas internas',
	(await page.$('header input[type="search"]')) !== null,
	'input no header'
);

await page.type('header input[type="search"]', 'duna');
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.location.search.includes('q=duna'));
check('Busca do cabeçalho leva para a Home com o termo', page.url().includes('/?q=duna'), page.url());

await page.goto(APP, { waitUntil: 'networkidle0' });
const camposNaHome = (await page.$$('input[type="search"]')).length;
check('Home não duplica a barra de busca', camposNaHome === 1, `${camposNaHome} campo(s)`);

// O × dentro do campo substitui o antigo botão "Nova Busca"
await page.goto(`${APP}/?q=tolkien`, { waitUntil: 'networkidle0' });
await page.waitForSelector('img[alt^="Capa do livro"]');
await page.click('button[aria-label="Limpar busca"]');
await sleep(600);
check(
	'× no campo limpa a busca e volta ao hero',
	!page.url().includes('q=') && (await page.$eval('h1', (el) => el.textContent)).includes('Que livro'),
	page.url()
);

// Altura uniforme e grade unificada
await page.goto(`${APP}/?q=tolkien`, { waitUntil: 'networkidle0' });
await page.waitForSelector('article');
const alturas = await page.$$eval('article', (els) =>
	els.slice(0, 4).map((e) => Math.round(e.getBoundingClientRect().height))
);
check('Cards da grade têm altura uniforme', new Set(alturas).size === 1, alturas.join(' / '));

const gradeResultados = await page.$eval('article', (el) => el.parentElement.className);
await page.goto(`${APP}/favorites`, { waitUntil: 'networkidle0' });
await page.waitForSelector('article');
const gradeEstante = await page.$eval('article', (el) => el.parentElement.className);
check(
	'Resultados e estante usam a mesma grade',
	gradeResultados === gradeEstante,
	gradeEstante.replace('grid ', '')
);

// Trilha de navegação e rodapé
await page.goto(`${APP}/book/id-7`, { waitUntil: 'networkidle0' });
await page.waitForSelector('h1');
const trilha = await page.$eval('nav[aria-label="Trilha de navegação"]', (el) =>
	el.innerText.replace(/\s+/g, ' ').trim()
);
check('Detalhes têm trilha de navegação', trilha.startsWith('Início'), trilha);

const rodape = await page.$eval('footer', (el) => el.innerText);
check('Rodapé credita a Google Books API', rodape.includes('Google Books API'), 'crédito presente');
check(
	'Rodapé tem links de navegação',
	rodape.includes('Minha estante') && rodape.includes('Painel'),
	'links presentes'
);

// Drawer mobile: diálogo, Esc e devolução do foco
await page.setViewport({ width: 375, height: 800, isMobile: true });
await page.goto(APP, { waitUntil: 'networkidle0' });
await page.click('button[aria-controls="mobile-menu"]');
await sleep(400);
check(
	'Drawer abre como diálogo modal',
	(await page.$('#mobile-menu[role="dialog"][aria-modal="true"]')) !== null,
	'role=dialog'
);

await page.keyboard.press('Escape');
await sleep(400);
const focoVoltou = await page.evaluate(
	() => document.activeElement?.getAttribute('aria-controls') === 'mobile-menu'
);
check('Esc fecha o drawer', (await page.$('#mobile-menu')) === null, 'fechado');
check('Foco volta para o botão do menu', focoVoltou, `${focoVoltou}`);

await page.setViewport({ width: 1280, height: 900 });

// Limpeza: remove só o que este teste criou, pela chave real do registro.
// O título também é conferido, para varrer sobras de execuções interrompidas.
const finalList = await (await fetch(API)).json();
const criadosPeloTeste = [tmp.bookId, other.bookId, 'id-1', 'id-7'];
const titulosDoTeste = [tmp.title, other.title];

for (const record of finalList) {
	if (criadosPeloTeste.includes(record.bookId) || titulosDoTeste.includes(record.title)) {
		await fetch(`${API}/${record.id}`, { method: 'DELETE' });
	}
}

// As metas criadas pelo teste também saem.
const GOALS_API = API.replace('/favorites', '/goals');
for (const goal of await (await fetch(GOALS_API)).json()) {
	await fetch(`${GOALS_API}/${goal.id}`, { method: 'DELETE' });
}

// ------------------------------------------------------------------- console
const noisy = consoleLogs.filter((l) => /\[SearchContext\]|\[FavoritesContext\]|\[FavoritesApi\]|Tentativa \d+ de/.test(l));
check('Sem logs de debug em produção', noisy.length === 0, noisy.join(' | ') || 'nenhum');

const realErrors = consoleErrors.filter(
	(e) =>
		!e.includes('Failed to load resource') &&
		!e.includes('net::ERR_FAILED') &&
		// Erro provocado de propósito no teste de rollback acima.
		!e.includes('[useFavorites] Falha ao remover')
);
check('Sem erros inesperados no console', realErrors.length === 0, realErrors.join(' | ') || 'nenhum');

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} verificações passaram.`);
if (failed.length) {
	console.log('Falhas:\n' + failed.map((f) => `  - ${f.name}`).join('\n'));
	process.exit(1);
}
