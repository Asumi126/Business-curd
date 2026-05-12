import { scopedKey } from "./auth";
const BASE_LIBRARY_KEY = "mycardmaker:v1:imageLibrary";
const LIBRARY_KEY_FN = () => scopedKey(BASE_LIBRARY_KEY);
const LIBRARY_KEY = ""; // legacy placeholder, replaced below
void LIBRARY_KEY;
export const IMAGE_LIBRARY_LIMIT = 20;
export const IMAGE_LIBRARY_BYTES = 5 * 1024 * 1024;

export type ImageKind = "logo" | "photo" | "background";

export type SavedImage = {
  id: string;
  kind: ImageKind;
  dataUrl: string;
  label: string;
  createdAt: number;
};

function genId(): string {
  return `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function readRaw(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return window.localStorage.getItem(LIBRARY_KEY_FN()) ?? "[]";
  } catch {
    return "[]";
  }
}

export function listImages(kind?: ImageKind): SavedImage[] {
  try {
    const arr = JSON.parse(readRaw()) as SavedImage[];
    if (!Array.isArray(arr)) return [];
    const sorted = arr.sort((a, b) => b.createdAt - a.createdAt);
    return kind ? sorted.filter((i) => i.kind === kind) : sorted;
  } catch {
    return [];
  }
}

export function getStorageInfo() {
  const raw = readRaw();
  const list = listImages();
  const bytesUsed = new Blob([raw]).size;
  return {
    count: list.length,
    limit: IMAGE_LIBRARY_LIMIT,
    bytesUsed,
    bytesLimit: IMAGE_LIBRARY_BYTES,
    percentage: Math.min(100, Math.round((bytesUsed / IMAGE_LIBRARY_BYTES) * 100)),
  };
}

export type SaveImageResult =
  | { ok: true; image: SavedImage }
  | { ok: false; reason: "limit" | "size" | "duplicate" | "error"; message: string };

export function saveImage(input: {
  kind: ImageKind;
  dataUrl: string;
  label?: string;
}): SaveImageResult {
  if (typeof window === "undefined") {
    return { ok: false, reason: "error", message: "ブラウザ外" };
  }
  const list = listImages();

  // Skip if duplicate (same dataUrl exists already)
  if (list.some((i) => i.dataUrl === input.dataUrl)) {
    const existing = list.find((i) => i.dataUrl === input.dataUrl);
    return existing
      ? { ok: true, image: existing }
      : { ok: false, reason: "duplicate", message: "既に保存されています" };
  }

  if (list.length >= IMAGE_LIBRARY_LIMIT) {
    return {
      ok: false,
      reason: "limit",
      message: `画像は最大${IMAGE_LIBRARY_LIMIT}件までです。古い画像を削除してください。`,
    };
  }

  const image: SavedImage = {
    id: genId(),
    kind: input.kind,
    dataUrl: input.dataUrl,
    label: input.label || `${kindLabel(input.kind)} ${list.length + 1}`,
    createdAt: Date.now(),
  };
  const next = [image, ...list];
  const json = JSON.stringify(next);
  const size = new Blob([json]).size;
  if (size > IMAGE_LIBRARY_BYTES) {
    return {
      ok: false,
      reason: "size",
      message: "ライブラリ容量上限を超えました。古い画像を削除してください。",
    };
  }
  try {
    window.localStorage.setItem(LIBRARY_KEY_FN(), json);
    return { ok: true, image };
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      message: `保存に失敗しました: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
}

export function deleteImage(id: string): boolean {
  if (typeof window === "undefined") return false;
  const list = listImages();
  const next = list.filter((i) => i.id !== id);
  if (next.length === list.length) return false;
  try {
    window.localStorage.setItem(LIBRARY_KEY_FN(), JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function clearLibrary(): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.removeItem(LIBRARY_KEY_FN());
    return true;
  } catch {
    return false;
  }
}

export function renameImage(id: string, label: string): boolean {
  if (typeof window === "undefined") return false;
  const list = listImages();
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], label };
  try {
    window.localStorage.setItem(LIBRARY_KEY_FN(), JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function kindLabel(kind: ImageKind): string {
  switch (kind) {
    case "logo":
      return "ロゴ";
    case "photo":
      return "写真";
    case "background":
      return "背景";
  }
}

export function bytesPretty(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / (1024 * 1024)).toFixed(2)}MB`;
}
