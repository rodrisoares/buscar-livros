import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
/**
 * A Poppins vem no próprio build, em vez de vir do Google.
 *
 * Pelo `@import` que havia na primeira linha do CSS, o navegador só descobria a
 * fonte depois de baixar e ler aquele arquivo, e então ainda precisava abrir
 * conexão com dois domínios novos antes de pintar o texto — o pior lugar
 * possível para uma dependência externa. Local, ela carrega em paralelo.
 *
 * Importada daqui, e não do CSS: o Vite só reescreve os caminhos dos `.woff2`
 * quando a folha entra pelo JS.
 *
 * Só os subconjuntos latinos: o pacote completo traz devanagari, que este app
 * nunca usa. `latin-ext` fica para nomes como "Stanisław Lem".
 */
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-ext-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-ext-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-ext-600.css';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
