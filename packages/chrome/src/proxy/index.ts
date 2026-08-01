import { defaultIsolationOrigin } from "./config";

export const basePrefix = `${import.meta.env.BASE_URL}~/sj/`;

export let isolationOrigin = defaultIsolationOrigin;
export let isIsolated = isolationOrigin !== "none";

export function setIsolationOrigin(origin: string) {
	isolationOrigin = origin;
	isIsolated = origin !== "none";
}
