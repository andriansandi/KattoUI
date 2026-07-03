export function getApiBaseUrl(): string {
	if (typeof window !== "undefined") {
		const fromWindow = (window as unknown as { __KATTO_API_URL?: string }).__KATTO_API_URL;
		if (fromWindow) return fromWindow;
	}
	return import.meta.env.VITE_API_URL ?? "http://localhost:8791";
}

export function apiUrl(path: string): string {
	const base = getApiBaseUrl();
	const prefix = path.startsWith("/") ? path : `/${path}`;
	return `${base}${prefix}`;
}

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(apiUrl(path), {
		...init,
		headers: {
			"Content-Type": "application/json",
			...init?.headers,
		},
	});
	if (!response.ok) {
		throw new Error(`API request failed: ${response.status} ${response.statusText}`);
	}
	return response.json() as Promise<T>;
}
