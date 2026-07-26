// this needs to be first
import "./sentry.tsx";

import "./reset.css";
import "./style.css";

// temp fix for vite not working
import.meta.hot?.accept(() => location.reload());

import { setWispUrl } from "./proxy/wisp.ts";
import { setIsolationOrigin } from "./proxy/index.ts";
import {
	defaultIsolationOrigin,
	defaultWispUrl,
	normalizeIsolationOrigin,
	normalizeWispUrl,
} from "./proxy/config.ts";

import { ProfileService } from "./services/ProfileService.ts";
import { SettingsService } from "./services/SettingsService.ts";
import { TabsService } from "./services/TabsService.ts";
import { DownloadsService } from "./services/DownloadsService.ts";
import { FaviconService } from "./services/FaviconService.ts";
import { KVWrapper } from "./services/KVWrapper.ts";
import { migrate } from "./migrations/index.ts";
import { mount } from "./App.tsx";

export const isPuter =
	import.meta.env.VITE_PUTER_BRANDING && puter.env == "app";
export const puterBranding = import.meta.env.VITE_PUTER_BRANDING;
export const STORAGE_VERSION = 2;

export let profileService: ProfileService;
export let settingsService: SettingsService;
export let tabsService: TabsService;
export let downloadsService: DownloadsService;
export let faviconService: FaviconService;
export let saveSettings: () => Promise<void> = async () => {};

if (import.meta.env.VITE_PUTER_BRANDING) {
	if (!puter.auth.isSignedIn()) {
		await puter.auth.signIn();
	}
}

await loadServices();

const configuredWispUrl = (() => {
	try {
		return normalizeWispUrl(settingsService.settings.wispUrl);
	} catch (error) {
		console.error("Ignoring invalid saved Wisp URL:", error);
		return null;
	}
})();
const configuredIsolationOrigin = (() => {
	try {
		return normalizeIsolationOrigin(settingsService.settings.isolationOrigin);
	} catch (error) {
		console.error("Ignoring invalid saved isolation origin:", error);
		return null;
	}
})();

setIsolationOrigin(configuredIsolationOrigin || defaultIsolationOrigin);

let wispUrl = configuredWispUrl || defaultWispUrl;
if (!wispUrl && import.meta.env.VITE_PUTER_BRANDING) {
	wispUrl = await puter.net.generateWispV1URL();
}
if (!wispUrl) {
	throw new Error("No Wisp URL configured.");
}
await setWispUrl(wispUrl);

type ProfileMetadata = {
	id: string;
	storageKey: string;
	name: string;
	lastModified: number;
};

function registerSave(service: Service, kv: KVWrapper, key: string) {
	let saving = false;

	const flush = async () => {
		if (!service.dirty || saving) return;
		saving = true;
		const data = service.save();
		service.dirty = false;
		try {
			console.log("saving", key);
			await kv.set(key, service.save());
			service.dirty = false;
			await kv.set(key, data);
		} catch (error) {
			service.dirty = true;
			// throw error;
		} finally {
			saving = false;
		}
	};

	setInterval(async () => {
		await flush();
	}, 1000);

	window.addEventListener("pagehide", () => {
		void flush();
	});
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden") {
			void flush();
		}
	});

	return flush;
}

async function loadServices() {
	await navigator.locks.request("write", async () => {
		let kv = new KVWrapper(puterBranding ? "puter" : "localstorage");
		let version;
		let skipLoad = false;
		if (await kv.has("version")) {
			version = Number(await kv.get("version"));
		} else if (await kv.has("browserstate")) {
			// pre-services
			version = 0;
		} else {
			// new install
			version = STORAGE_VERSION;
			skipLoad = true;
		}

		if (version !== STORAGE_VERSION) {
			try {
				await migrate(version, kv);
			} catch (e) {
				console.error(`error migrating storage: ${e}`);
				version = STORAGE_VERSION;
				skipLoad = true;
			}
		}
		await kv.set("version", STORAGE_VERSION);

		settingsService = new SettingsService(await kv.get("settings"));
		saveSettings = registerSave(settingsService, kv, "settings");
		faviconService = new FaviconService(await kv.get("faviconCache"));
		registerSave(faviconService, kv, "faviconCache");

		let profiles = await kv.get<ProfileMetadata[]>("profiles");
		if (!profiles) {
			profiles = [];
		}

		if (profiles.length === 0) {
			profiles.push({
				id: "default",
				name: "Default",
				lastModified: Date.now(),
				storageKey: "profile-default",
			});
		}

		let profile = profiles[0];

		profileService = new ProfileService(await kv.get(profile.storageKey));
		registerSave(profileService, kv, profile.storageKey);
		downloadsService = new DownloadsService();

		const tabsKey = `tabs-${profile.id}`;
		tabsService = new TabsService(await kv.get(tabsKey));
		registerSave(tabsService, kv, tabsKey);
	});
}

mount();
