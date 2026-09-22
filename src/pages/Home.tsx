import HeroSection from '@/components/HeroSection';
import SearchResults from '@/components/SearchResults';
import SuggestedBooks from '@/components/SuggestedBooks';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

function Home() {
	// A presença do termo na URL decide a tela: nada de estado espelhado em storage.
	const { hasSearch } = useBookSearch();

	// Com busca ativa, quem define o título é o SearchResults.
	useDocumentTitle(hasSearch ? null : '');

	// Com busca ativa a faixa compacta fica por cima dos resultados: a tela
	// continua sendo a Home, só que mostrando o que foi encontrado.
	if (hasSearch) {
		return (
			<>
				<HeroSection variant='compact' />
				<SearchResults />
			</>
		);
	}

	return (
		<>
			<HeroSection />
			<SuggestedBooks />
		</>
	);
}

export default Home;
