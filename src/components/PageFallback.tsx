/**
 * O que ocupa a tela enquanto o código de uma rota chega.
 *
 * Cada página vive num pedaço próprio do build, baixado só quando alguém vai
 * até ela. Entre o clique e o pedaço chegar existe um instante — numa conexão
 * boa, um piscar; numa ruim, alguns segundos — e sem nada no lugar a tela
 * ficaria vazia, sem sinal de que algo está acontecendo.
 *
 * A altura mínima segura o rodapé embaixo: sem ela, ele subiria para o meio da
 * tela e desceria de novo quando a página aparecesse.
 */
const PageFallback = () => (
	<div
		className='max-w-7xl mx-auto px-6 py-24 min-h-[60vh] flex flex-col items-center justify-center'
		role='status'
		aria-live='polite'
	>
		<div className='animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600' />
		<p className='mt-4 text-sm text-gray-600 dark:text-slate-400'>Carregando a página...</p>
	</div>
);

export default PageFallback;
