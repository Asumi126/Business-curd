"use client";

/**
 * データバックアップユーティリティ — 全保存データを1つのJSONとして
 * エクスポート/インポートする。ブラウザ事故・PC買い替え・引っ越し時の
 * 復元用ライフライン。
 *
 * 対象データ:
 *  - localStorage 関連すべて (mycardmaker:v1:* / shopcardmaker:v1:* など)
 *  - IndexedDB: 名簿(nametag-roster) + カスタム背景テンプレ(custom-bg-templates)
 *
 * 設計方針:
 *  - 1ファイル = 全データ。バージョン番号付きで将来のフォーマット変更に備える
 *  - IndexedDB の Blob は base64 文字列に変換して JSON 化
 *  - エクスポート時のサイズはおおよそ数MB〜十数MB (画像が含まれるため)
 */

import { openDB } from "idb";

export const BACKUP_VERSION = 1;
const NAMETAG_DB = "nametag-roster";
const CUSTOM_BG_DB = "custom-bg-templates";

/** バックアップファイルの中身 */
export type BackupPayload = {
  version: number;
  exportedAt: number;
  appVersion: string;
  /** localStorage 全エントリ (キーは "mycardmaker:" "shopcardmaker:" "nametagmaker:" などで始まる) */
  localStorage: Record<string, string>;
  /** IndexedDB: 名簿 (nametag-roster) */
  nametag?: {
    people: unknown[];
    snapshots: unknown[];
  };
  /** IndexedDB: カスタム背景テンプレ (custom-bg-templates) — Blobはbase64化 */
  customBg?: {
    templates: {
      id: string;
      name: string;
      blobBase64: string;
      blobType: string;
      thumbDataUrl: string;
      size: number;
      width: number;
      height: number;
      createdAt: number;
      updatedAt: number;
    }[];
  };
};

/** localStorage 全エントリのうち、このサイト関連のキーだけを抽出 */
function collectLocalStorage(): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof window === "undefined") return out;
  const prefixes = [
    "mycardmaker:",
    "shopcardmaker:",
    "nametagmaker:",
  ];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (prefixes.some((p) => key.startsWith(p))) {
      const v = window.localStorage.getItem(key);
      if (v != null) out[key] = v;
    }
  }
  return out;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // data:image/jpeg;base64,XXXXX -> "XXXXX" だけ抽出
        const idx = reader.result.indexOf(",");
        resolve(idx >= 0 ? reader.result.slice(idx + 1) : reader.result);
      } else {
        reject(new Error("blob → base64 変換失敗"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const len = binary.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
  return new Blob([u8], { type });
}

/** IndexedDBから名簿データを抽出 (DBが存在しなければ undefined) */
async function collectNametagDb(): Promise<BackupPayload["nametag"] | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    const db = await openDB(NAMETAG_DB);
    const people = db.objectStoreNames.contains("people")
      ? await db.getAll("people")
      : [];
    const snapshots = db.objectStoreNames.contains("snapshots")
      ? await db.getAll("snapshots")
      : [];
    db.close();
    if (people.length === 0 && snapshots.length === 0) return undefined;
    return { people, snapshots };
  } catch {
    return undefined;
  }
}

async function collectCustomBgDb(): Promise<BackupPayload["customBg"] | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    const db = await openDB(CUSTOM_BG_DB);
    if (!db.objectStoreNames.contains("templates")) {
      db.close();
      return undefined;
    }
    const all = (await db.getAll("templates")) as Array<{
      id: string;
      name: string;
      blob: Blob;
      thumbDataUrl: string;
      size: number;
      width: number;
      height: number;
      createdAt: number;
      updatedAt: number;
    }>;
    db.close();
    if (all.length === 0) return undefined;
    const templates = await Promise.all(
      all.map(async (t) => ({
        id: t.id,
        name: t.name,
        blobBase64: await blobToBase64(t.blob),
        blobType: t.blob.type || "image/jpeg",
        thumbDataUrl: t.thumbDataUrl,
        size: t.size,
        width: t.width,
        height: t.height,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    );
    return { templates };
  } catch {
    return undefined;
  }
}

/** 全データをJSON化 */
export async function exportAllData(appVersion = "1.0"): Promise<BackupPayload> {
  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    appVersion,
    localStorage: collectLocalStorage(),
    nametag: await collectNametagDb(),
    customBg: await collectCustomBgDb(),
  };
  return payload;
}

/** バックアップJSON を Blob として組み立て、ダウンロード */
export async function downloadBackupFile(filename?: string): Promise<void> {
  const payload = await exportAllData();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const datePart = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  a.download = filename ?? `mycardmaker-backup-${datePart}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type ImportResult = {
  ok: boolean;
  message: string;
  stats?: {
    localStorageKeys: number;
    nametagPeople: number;
    nametagSnapshots: number;
    customBgTemplates: number;
  };
};

/** バックアップJSONから復元。既存データは上書きされる */
export async function importBackupPayload(
  payload: BackupPayload,
): Promise<ImportResult> {
  if (typeof window === "undefined") {
    return { ok: false, message: "ブラウザ外では実行できません" };
  }
  if (!payload || typeof payload !== "object" || !payload.version) {
    return { ok: false, message: "バックアップファイルの形式が正しくありません" };
  }
  if (payload.version > BACKUP_VERSION) {
    return {
      ok: false,
      message: `このバックアップは新しいバージョン (v${payload.version}) で作成されました。アプリを更新してから読み込んでください。`,
    };
  }

  // 1) localStorage の復元 — このサイト関連のキーだけクリアして書き戻す
  const prefixes = ["mycardmaker:", "shopcardmaker:", "nametagmaker:"];
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && prefixes.some((p) => key.startsWith(p))) keysToRemove.push(key);
  }
  for (const k of keysToRemove) window.localStorage.removeItem(k);
  for (const [k, v] of Object.entries(payload.localStorage ?? {})) {
    try {
      window.localStorage.setItem(k, v);
    } catch {
      /* 容量超過は無視 */
    }
  }

  // 2) IndexedDB: 名簿
  let nametagPeople = 0;
  let nametagSnapshots = 0;
  if (payload.nametag) {
    try {
      const db = await openDB(NAMETAG_DB, 2, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("people")) {
            const store = db.createObjectStore("people", { keyPath: "id" });
            store.createIndex("by-name", "name");
            store.createIndex("by-group", "group");
            store.createIndex("by-updatedAt", "updatedAt");
          }
          if (!db.objectStoreNames.contains("snapshots")) {
            const snap = db.createObjectStore("snapshots", { keyPath: "id" });
            snap.createIndex("by-updatedAt", "updatedAt");
          }
        },
      });
      const tx = db.transaction(["people", "snapshots"], "readwrite");
      await tx.objectStore("people").clear();
      for (const p of payload.nametag.people) {
        await tx.objectStore("people").put(p);
        nametagPeople++;
      }
      await tx.objectStore("snapshots").clear();
      for (const s of payload.nametag.snapshots) {
        await tx.objectStore("snapshots").put(s);
        nametagSnapshots++;
      }
      await tx.done;
      db.close();
    } catch {
      /* スキーマ違いの場合は無視 */
    }
  }

  // 3) IndexedDB: カスタム背景テンプレ
  let customBgTemplates = 0;
  if (payload.customBg) {
    try {
      const db = await openDB(CUSTOM_BG_DB, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("templates")) {
            const store = db.createObjectStore("templates", { keyPath: "id" });
            store.createIndex("by-updatedAt", "updatedAt");
          }
        },
      });
      const tx = db.transaction("templates", "readwrite");
      await tx.store.clear();
      for (const t of payload.customBg.templates) {
        const blob = base64ToBlob(t.blobBase64, t.blobType);
        await tx.store.put({
          id: t.id,
          name: t.name,
          blob,
          thumbDataUrl: t.thumbDataUrl,
          size: t.size,
          width: t.width,
          height: t.height,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        });
        customBgTemplates++;
      }
      await tx.done;
      db.close();
    } catch {
      /* 無視 */
    }
  }

  return {
    ok: true,
    message: "復元しました。ページを再読み込みすると反映されます。",
    stats: {
      localStorageKeys: Object.keys(payload.localStorage ?? {}).length,
      nametagPeople,
      nametagSnapshots,
      customBgTemplates,
    },
  };
}

/** ファイルから読み込んでJSONパース、importを実行 */
export async function importBackupFromFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    const payload = JSON.parse(text) as BackupPayload;
    return await importBackupPayload(payload);
  } catch (e) {
    return {
      ok: false,
      message: `読み込みエラー: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
}

/** バックアップサイズの概算 (バイト) */
export async function estimateBackupSize(): Promise<number> {
  const payload = await exportAllData();
  return new Blob([JSON.stringify(payload)]).size;
}

export function bytesPretty(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / (1024 * 1024)).toFixed(2)}MB`;
}
