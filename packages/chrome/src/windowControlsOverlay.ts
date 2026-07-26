type WindowControlsOverlay = EventTarget & {
	readonly visible: boolean;
	getTitlebarAreaRect(): DOMRect;
};

type NavigatorWithWindowControlsOverlay = Navigator & {
	windowControlsOverlay?: WindowControlsOverlay;
};

const root = document.documentElement;
const windowControlsOverlay = (navigator as NavigatorWithWindowControlsOverlay)
	.windowControlsOverlay;

function setInset(name: string, value: number) {
	const inset = Math.max(0, value);
	root.style.setProperty(
		name,
		inset === 0 ? "0px" : `calc(${inset}px + var(--space-sm))`
	);
}

function updateWindowControlsOverlayInsets() {
	if (!windowControlsOverlay?.visible) {
		setInset("--window-controls-overlay-left", 0);
		setInset("--window-controls-overlay-right", 0);
		return;
	}

	const titlebar = windowControlsOverlay.getTitlebarAreaRect();
	const viewportWidth = document.documentElement.clientWidth;

	// WCO's titlebar rect excludes native controls; the remaining space is an inset.
	// https://wicg.github.io/window-controls-overlay/#dom-windowcontrolsoverlay-gettitlebararearect
	setInset("--window-controls-overlay-left", titlebar.x);
	setInset(
		"--window-controls-overlay-right",
		viewportWidth - titlebar.x - titlebar.width
	);
}

if (windowControlsOverlay) {
	windowControlsOverlay.addEventListener(
		"geometrychange",
		updateWindowControlsOverlayInsets
	);
	window.addEventListener("resize", updateWindowControlsOverlayInsets);
	updateWindowControlsOverlayInsets();
}
