import '@testing-library/jest-dom/vitest';

/**
 * Rodado antes de cada arquivo de teste.
 *
 * O `@testing-library/react` desmonta sozinho o que foi renderizado depois de
 * cada `it`, porque o `afterEach` global está ligado (`test.globals` no
 * vite.config). Sem isso, um teste veria a árvore deixada pelo anterior.
 */
