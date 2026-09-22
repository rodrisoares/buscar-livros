import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageFallback from '@/components/PageFallback';
import ToastProvider from '@/components/toast/ToastProvider';
import ThemeProvider from '@/components/theme/ThemeProvider';
import ScrollToTop from '@/components/ScrollToTop';
import ScrollReset from '@/components/ScrollReset';
import RouteAnnouncer from '@/components/RouteAnnouncer';
import Home from '@/pages/Home';
import { queryClient } from '@/lib/queryClient';
import {
	PERSIST_MAX_AGE,
	PERSIST_VERSION,
	persister,
	shouldPersistQuery,
} from '@/lib/queryPersister';

/**
 * A tela inicial entra no pedaço principal; o resto vem sob demanda.
 *
 * Era tudo um arquivo só de meio megabyte: quem abria a Home para fazer uma
 * busca baixava também o painel com o gráfico, o formulário de contato e as
 * coleções — telas que aquela visita talvez nunca abrisse. A Home fica de fora
 * porque é o destino da primeira visita: adiá-la seria trocar um problema pelo
 * mesmo problema.
 *
 * O que as telas compartilham (cards, busca, estante) continua no pedaço
 * principal, porque o Vite junta num lugar só o que mais de uma rota usa.
 */
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Favorites = lazy(() => import('@/pages/Favorites'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Collections = lazy(() => import('@/pages/Collections'));
const CollectionDetail = lazy(() => import('@/pages/CollectionDetail'));
const BookDetails = lazy(() => import('@/pages/BookDetails'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function App() {
	return (
		<ThemeProvider>
			{/* A estante volta do armazenamento local antes de a rede responder:
			    recarregar deixa de mostrar um esqueleto por meio segundo, e as
			    telas que dependem só dela funcionam sem conexão. As buscas na
			    Google Books não são guardadas — ver `lib/queryPersister`. */}
			<PersistQueryClientProvider
				client={queryClient}
				persistOptions={{
					persister,
					maxAge: PERSIST_MAX_AGE,
					buster: PERSIST_VERSION,
					dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
				}}
			>
				<ToastProvider>
					<Router>
						<ScrollReset />
						<RouteAnnouncer />
						<Layout>
							{/* Uma exceção de render deixa de virar tela branca — inclusive a
							    de um pedaço que não conseguiu ser baixado. */}
							<ErrorBoundary>
								<Suspense fallback={<PageFallback />}>
									<Routes>
										<Route path='/' element={<Home />} />
										<Route path='/about' element={<About />} />
										<Route path='/contact' element={<Contact />} />
										<Route path='/favorites' element={<Favorites />} />
										<Route path='/dashboard' element={<Dashboard />} />
										<Route path='/colecoes' element={<Collections />} />
										<Route path='/colecoes/:id' element={<CollectionDetail />} />
										<Route path='/book/:id' element={<BookDetails />} />
										<Route path='*' element={<NotFound />} />
									</Routes>
								</Suspense>
							</ErrorBoundary>
							<ScrollToTop />
						</Layout>
					</Router>
				</ToastProvider>
			</PersistQueryClientProvider>
		</ThemeProvider>
	);
}

export default App;
