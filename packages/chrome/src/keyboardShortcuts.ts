type BrowserShortcutActions = {
	closeActiveTab: () => void;
	openNewTab: () => void;
	openNewWindow: () => void;
};

let actions: BrowserShortcutActions | null = null;
const registeredWindows = new WeakSet<Window>();

function handleKeydown(event: KeyboardEvent) {
	if (
		!actions ||
		!event.metaKey ||
		event.ctrlKey ||
		event.altKey ||
		event.shiftKey ||
		event.repeat ||
		event.isComposing
	) {
		return;
	}

	let action: (() => void) | null = null;
	switch (event.code) {
		case "KeyW":
			action = actions.closeActiveTab;
			break;
		case "KeyT":
			action = actions.openNewTab;
			break;
		case "KeyN":
			action = actions.openNewWindow;
	}
	if (!action) return;

	// keydown is cancelable, so claim the browser-style shortcut before the PWA does.
	// https://w3c.github.io/uievents/#event-type-keydown
	event.preventDefault();
	event.stopPropagation();
	action();
}

export function configureBrowserShortcuts(nextActions: BrowserShortcutActions) {
	actions = nextActions;
	installBrowserShortcuts(window);
}

export function installBrowserShortcuts(target: Window) {
	if (registeredWindows.has(target)) return;
	target.addEventListener("keydown", handleKeydown, { capture: true });
	registeredWindows.add(target);
}
