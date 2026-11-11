// Заглушка для сборки-превью (artifact): там service worker недоступен
export function registerSW(_opts?: unknown) { return () => Promise.resolve() }
