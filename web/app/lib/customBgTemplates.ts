"use client";

/**
 * カスタム背景テンプレライブラリ — IndexedDB に JPEG 圧縮した Blob で保存。
 *
 * 設計方針 (#192):
 *  - 完全無料・サードパーティ不要・データは端末ローカル
 *  - 50件まで保存可能。1件 200KB 程度を目安に画像を JPEG 圧縮
 *  - 一覧表示用のサムネ DataURL（小さい）も同時保存して取り回しを軽く
 *  - サイト全体（名刺・ショップカード・一括メーカー）で共用
 *
 * 容量見積もり: 50件 × 250KB = 12.5MB。IndexedDB の通常クォータ
 * （ブラウザ空き容量の数十%）に余裕で収まる。
 */

import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "custom-bg-templates";
const DB_VERSION = 1;
const STORE = "templates";

export const CUSTOM_BG_LIMIT = 50;
const MAX_LONG_SIDE_PX = 1600; // 印刷時に十分な解像度
const JPEG_QUALITY = 0.85;
const THUMB_SIDE_PX = 200;

export type CustomBgTemplate = {
  id: string;
  name: string;
  /** 圧縮済み JPEG Blob (本体画像) */
  blob: Blob;
  /** 一覧表示用の小さなサムネ DataURL */
  thumbDataUrl: string;
  /** 本体画像のサイズ (バイト) */
  size: number;
  /** 元画像のサイズ (px) */
  width: number;
  height: number;
  createdAt: number;
  updatedAt: number;
};

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in the browser"));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("by-updatedAt", "updatedAt");
        }
      },
    });
  }
  return dbPromise;
}

function genId(): string {
  return `cbg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 画像を読み込み、長辺を MAX_LONG_SIDE_PX に縮小して JPEG Blob と
 *  小さなサムネ DataURL を返す。 */
async function compressForStorage(
  dataUrl: string,
): Promise<{ blob: Blob; thumbDataUrl: string; width: number; height: number }> {
  const img = await loadImage(dataUrl);
  const ratio = Math.min(MAX_LONG_SIDE_PX / img.width, MAX_LONG_SIDE_PX / img.height, 1);
  const targetW = Math.round(img.width * ratio);
  const targetH = Math.round(img.height * ratio);

  // 本体画像 (JPEG 圧縮 Blob)
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetW, targetH);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new Error("圧縮に失敗しました");

  // サムネ DataURL (一覧表示・即取り出し用)
  const thumbRatio = Math.min(THUMB_SIDE_PX / img.width, THUMB_SIDE_PX / img.height, 1);
  const thumbW = Math.round(img.width * thumbRatio);
  const thumbH = Math.round(img.height * thumbRatio);
  const thumbCanvas = document.createElement("canvas");
  thumbCanvas.width = thumbW;
  thumbCanvas.height = thumbH;
  const tctx = thumbCanvas.getContext("2d");
  if (!tctx) throw new Error("canvas 2d context unavailable");
  tctx.imageSmoothingQuality = "high";
  tctx.drawImage(img, 0, 0, thumbW, thumbH);
  const thumbDataUrl = thumbCanvas.toDataURL("image/jpeg", 0.7);

  return { blob, thumbDataUrl, width: targetW, height: targetH };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = src;
  });
}

export async function listCustomBgTemplates(): Promise<CustomBgTemplate[]> {
  const db = await getDb();
  const all = await db.getAll(STORE);
  return (all as CustomBgTemplate[]).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function countCustomBgTemplates(): Promise<number> {
  const db = await getDb();
  return await db.count(STORE);
}

export type SaveResult =
  | { ok: true; template: CustomBgTemplate }
  | { ok: false; reason: "limit" | "error"; message: string };

export async function saveCustomBgTemplate(input: {
  name: string;
  dataUrl: string;
}): Promise<SaveResult> {
  try {
    const count = await countCustomBgTemplates();
    if (count >= CUSTOM_BG_LIMIT) {
      return {
        ok: false,
        reason: "limit",
        message: `カスタム背景テンプレは最大${CUSTOM_BG_LIMIT}件までです。不要なものを削除してください。`,
      };
    }
    const compressed = await compressForStorage(input.dataUrl);
    const now = Date.now();
    const template: CustomBgTemplate = {
      id: genId(),
      name: input.name.trim() || `カスタム背景 ${count + 1}`,
      blob: compressed.blob,
      thumbDataUrl: compressed.thumbDataUrl,
      size: compressed.blob.size,
      width: compressed.width,
      height: compressed.height,
      createdAt: now,
      updatedAt: now,
    };
    const db = await getDb();
    await db.put(STORE, template);
    return { ok: true, template };
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      message: `保存に失敗しました: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
}

export async function deleteCustomBgTemplate(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}

export async function renameCustomBgTemplate(id: string, name: string): Promise<void> {
  const db = await getDb();
  const existing = (await db.get(STORE, id)) as CustomBgTemplate | undefined;
  if (!existing) return;
  await db.put(STORE, { ...existing, name: name.trim() || existing.name, updatedAt: Date.now() });
}

/** Blob を DataURL に変換 (テンプレ選択時に呼び出してそのまま customBackground に流す)。 */
export async function templateToDataUrl(template: CustomBgTemplate): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("DataURL 変換に失敗しました"));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(template.blob);
  });
}

export function bytesPretty(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / (1024 * 1024)).toFixed(2)}MB`;
}
