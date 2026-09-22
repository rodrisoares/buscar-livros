import React, { useEffect, useState } from 'react';
import notAvailable from '@/assets/not-available.png';

interface BookCoverProps {
	src: string;
	title: string;
	className?: string;
	/** Tentada antes do placeholder quando `src` falha (ex.: cair do zoom=2 para o original). */
	fallbackSrc?: string;
}

/**
 * Proporção que a Google devolve nas miniaturas (128x192).
 *
 * Os atributos não fixam o tamanho — o CSS continua mandando —, mas dão ao
 * navegador uma proporção para reservar o espaço antes de a imagem chegar. Sem
 * eles, a capa ocupa zero até carregar e empurra o que vem depois; é o caso da
 * ficha do livro, onde o contêiner não tem `aspect-ratio`.
 */
const INTRINSIC_WIDTH = 128;
const INTRINSIC_HEIGHT = 192;

/**
 * Capa com cadeia de fallback: alta resolução → original → placeholder.
 * O asset é importado (e não referenciado por caminho de `/src/...`) para
 * continuar existindo depois do build.
 */
const BookCover: React.FC<BookCoverProps> = ({ src, title, className = '', fallbackSrc }) => {
	const chain = [src, fallbackSrc, notAvailable].filter((item): item is string => Boolean(item));
	const [index, setIndex] = useState(0);

	// Novo livro (ou nova URL) recomeça a cadeia do início.
	useEffect(() => {
		setIndex(0);
	}, [src, fallbackSrc]);

	const handleError = () => {
		setIndex((current) => Math.min(current + 1, chain.length - 1));
	};

	return (
		<img
			src={chain[index] ?? notAvailable}
			alt={`Capa do livro ${title}`}
			width={INTRINSIC_WIDTH}
			height={INTRINSIC_HEIGHT}
			loading='lazy'
			// Decodificar fora da thread principal: numa grade de 24 capas, fazer
			// isso em linha trava a rolagem enquanto elas aparecem.
			decoding='async'
			onError={handleError}
			className={className}
		/>
	);
};

export default BookCover;
