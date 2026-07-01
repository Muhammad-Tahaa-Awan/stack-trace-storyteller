import type { AnalyzeResponse } from "./types";

export interface SharedState {
  trace: string;
  language: string;
  result: AnalyzeResponse;
}

export const SHARE_HASH_PREFIX = "#s=";

/** UTF-8 safe base64 encode (btoa only handles Latin-1). */
function toBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** UTF-8 safe base64 decode. */
function fromBase64(input: string): string {
  const binary = atob(input);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeState(state: SharedState): string {
  return toBase64(JSON.stringify(state));
}

export function decodeState(encoded: string): SharedState | null {
  try {
    const parsed = JSON.parse(fromBase64(encoded)) as Partial<SharedState>;
    if (
      parsed &&
      typeof parsed.trace === "string" &&
      typeof parsed.language === "string" &&
      parsed.result &&
      typeof parsed.result.rootCause === "string" &&
      Array.isArray(parsed.result.fixSteps)
    ) {
      return parsed as SharedState;
    }
    return null;
  } catch {
    return null;
  }
}
