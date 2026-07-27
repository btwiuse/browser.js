import { rewriteUrl } from "@mercuryworkshop/scramjet/bundled";
import { installBrowserShortcuts } from "../keyboardShortcuts";
import { Controller, controllerForURL } from "./Controller";

export class ProxyFrame {
	frame: HTMLIFrameElement;
	controller: Controller | null = null;
	constructor() {
		this.frame = document.createElement("iframe");
		this.frame.addEventListener("load", () => {
			try {
				const frameWindow = this.frame.contentWindow;
				if (frameWindow) installBrowserShortcuts(frameWindow);
			} catch {
				// A custom isolation origin can make the proxy frame cross-origin.
			}
		});
	}

	async go(url: URL) {
		let controller = await controllerForURL(url);
		this.controller = controller;

		const prefix = controller.prefix;

		this.frame.src = rewriteUrl(url, controller.fetchHandler.context, {
			origin: prefix, // origin/base don't matter here because we're always sending an absolute URL
			base: prefix,
		});
	}

	reload() {
		this.frame.contentWindow?.location.reload();
	}
}
