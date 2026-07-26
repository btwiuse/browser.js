import type { Stateful } from "dreamland/core";
import { Service } from "./Service";
import { HistoryState } from "../Tab/History";
import { CookieJar } from "@mercuryworkshop/scramjet/bundled";
import { StatefulClass } from "../util/StatefulClass";
import type { SerializedHistoryState } from "../Tab/History";

export type ProfileServiceState = {
	globalhistory: SerializedHistoryState[];
	bookmarks: SerializedBookmarkEntry[];
	cookies: string;
};

export type SerializedBookmarkEntry = {
	url: string;
	title: string;
	favicon: string | null;
};

const GEAR_SHELL_URL = "https://gear.sh";
const GEAR_SHELL_FAVICON = "https://gear.sh/favicon.ico";

export class BookmarkEntry extends StatefulClass {
	url!: URL;
	title!: string;
	favicon!: string | null;

	constructor(partial?: Partial<BookmarkEntry>) {
		super();
		Object.assign(this, partial);
	}

	serialize(): SerializedBookmarkEntry {
		return {
			url: this.url.href,
			title: this.title,
			favicon: this.favicon,
		};
	}
	static deserialize(data: SerializedBookmarkEntry): BookmarkEntry {
		return new BookmarkEntry({
			url: new URL(data.url),
			title: data.title,
			favicon: data.favicon,
		});
	}
}

export class ProfileService extends Service {
	globalhistory: HistoryState[];
	bookmarks: BookmarkEntry[];
	cookieJar: CookieJar;

	constructor(data: ProfileServiceState | null) {
		super();
		this.cookieJar = new CookieJar();
		if (data) {
			this.cookieJar.load(data.cookies);
			this.globalhistory = data.globalhistory.map((state) =>
				HistoryState.deserialize(state)
			);
			let migratedDefaultBookmark = false;
			this.bookmarks = data.bookmarks.map((bookmark) => {
				if (
					bookmark.url === "https://developer.puter.com/" &&
					bookmark.title === "Puter Developers"
				) {
					migratedDefaultBookmark = true;
					return new BookmarkEntry({
						url: new URL(GEAR_SHELL_URL),
						title: "GearShell",
						favicon: GEAR_SHELL_FAVICON,
					});
				}
				if (
					bookmark.url === "https://gear.sh/" &&
					bookmark.title === "GearShell" &&
					bookmark.favicon === null
				) {
					migratedDefaultBookmark = true;
					return new BookmarkEntry({
						url: new URL(GEAR_SHELL_URL),
						title: "GearShell",
						favicon: GEAR_SHELL_FAVICON,
					});
				}
				return BookmarkEntry.deserialize(bookmark);
			});
			if (migratedDefaultBookmark) this.markDirty();
		} else {
			this.globalhistory = [];
			this.bookmarks = [
				new BookmarkEntry({
					url: new URL("https://www.google.com"),
					title: "Google",
					favicon: "https://www.google.com/favicon.ico",
				}),
				new BookmarkEntry({
					url: new URL("https://www.youtube.com"),
					title: "YouTube",
					favicon: "https://www.youtube.com/favicon.ico",
				}),
				new BookmarkEntry({
					url: new URL(GEAR_SHELL_URL),
					title: "GearShell",
					favicon: GEAR_SHELL_FAVICON,
				}),
			];
		}
	}

	serialize(): ProfileServiceState {
		return {
			globalhistory: this.globalhistory.map((state) => state.serialize()),
			bookmarks: this.bookmarks.map((bookmark) => bookmark.serialize()),
			cookies: this.cookieJar.dump(),
		};
	}

	save(): ProfileServiceState {
		return this.serialize();
	}
}
