type BeforeInstallPromptEvent = Event & {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener("beforeinstallprompt", (event) => {
	event.preventDefault();
	deferredPrompt = event as BeforeInstallPromptEvent;
});

window.addEventListener("appinstalled", () => {
	deferredPrompt = null;
});

export function canPromptPwaInstall() {
	return deferredPrompt !== null;
}

export async function promptPwaInstall() {
	const prompt = deferredPrompt;
	if (!prompt) return false;

	deferredPrompt = null;
	await prompt.prompt();
	return (await prompt.userChoice).outcome === "accepted";
}
