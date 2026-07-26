import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import http from "http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_ROOT = path.join(__dirname, "public");
const PORT = Number(process.env.PORT || 3000);

const MIME_TYPES = {
	".js": "application/javascript; charset=utf-8",
	".mjs": "application/javascript; charset=utf-8",
	".wasm": "application/wasm",
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
};

async function serveStatic(reqUrl) {
	let filePath = reqUrl === "/" ? "/index.html" : reqUrl;
	const fullPath = path.join(PUBLIC_ROOT, filePath);

	try {
		await fs.access(fullPath);
		const stat = await fs.stat(fullPath);
		if (stat.isDirectory()) {
			const indexPath = path.join(fullPath, "index.html");
			try {
				await fs.access(indexPath);
				const content = await fs.readFile(indexPath);
				res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
				res.end(content);
				return true;
			} catch {
				res.writeHead(404);
				res.end("Not Found");
				return true;
			}
		}
		const content = await fs.readFile(fullPath);
		const ext = path.extname(fullPath).toLowerCase();
		res.writeHead(200, {
			"Content-Type": MIME_TYPES[ext] || "application/octet-stream",
		});
		res.end(content);
		return true;
	} catch {
		return false;
	}
}

const server = http.createServer(async (req, res) => {
	const reqUrl = req.url?.split("?")[0] ?? "/";
	if (req.method !== "GET" && req.method !== "HEAD") {
		res.writeHead(405, { Allow: "GET, HEAD" });
		res.end("Method Not Allowed");
		return;
	}
	const handled = await serveStatic(reqUrl);
	if (!handled) {
		res.writeHead(404);
		res.end("Not Found");
	}
});

server.on("upgrade", (req, socket, head) => {
	wisp.routeRequest(req, socket, head);
});

server.listen(PORT, () => {
	console.log(`Wisp server listening on port ${PORT}`);
});
