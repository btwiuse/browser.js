import { defaultIsolationOrigin } from "./config";

export const basePrefix = "/~/sj/";

export let isolationOrigin = defaultIsolationOrigin;
export let isIsolated = isolationOrigin !== "none";

export function setIsolationOrigin(origin: string) {
	isolationOrigin = origin;
	isIsolated = origin !== "none";
}
