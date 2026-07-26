export const defaultWispUrl = import.meta.env.VITE_WISP_URL || "";
export const defaultIsolationOrigin =
	import.meta.env.VITE_ISOLATION_ORIGIN || window.location.origin;

function isLoopbackHostname(hostname: string) {
	return (
		hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
	);
}

export function normalizeWispUrl(value: string): string | null {
	const input = value.trim();
	if (!input) return null;

	let url: URL;
	try {
		// WHATWG URL §4.4: parsing returns failure for an invalid absolute URL.
		url = new URL(input);
	} catch {
		throw new Error("Wisp URL must be an absolute ws:// or wss:// URL.");
	}

	if (url.protocol !== "ws:" && url.protocol !== "wss:") {
		throw new Error("Wisp URL must use the ws:// or wss:// protocol.");
	}

	return url.href;
}

export function normalizeIsolationOrigin(value: string): string | null {
	const input = value.trim();
	if (!input) return null;
	if (input === "none") return "none";

	let url: URL;
	try {
		// WHATWG URL §4.4: parsing returns failure for an invalid absolute URL.
		url = new URL(input);
	} catch {
		throw new Error("Isolation origin must be an absolute URL or 'none'.");
	}

	const allowsHttp =
		url.protocol === "http:" && isLoopbackHostname(url.hostname);
	if (url.protocol !== "https:" && !allowsHttp) {
		throw new Error(
			"Isolation origin must use HTTPS (or HTTP on localhost for development)."
		);
	}

	if (url.pathname !== "/" || url.search || url.hash) {
		throw new Error(
			"Isolation origin cannot include a path, query, or fragment."
		);
	}

	return url.origin;
}
