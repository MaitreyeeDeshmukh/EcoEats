const DEFAULT_SERVER_URL = "http://localhost:3001";

const SERVER_URL =
	process.env.EXPO_PUBLIC_SERVER_URL ||
	process.env.EXPO_PUBLIC_API_URL ||
	DEFAULT_SERVER_URL;

export function buildServerUrl(path: string): string {
	if (path.startsWith("http://") || path.startsWith("https://")) {
		return path;
	}

	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `${SERVER_URL}${normalizedPath}`;
}
