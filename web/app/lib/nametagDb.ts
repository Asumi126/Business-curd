"use client";

/**
 * Nametag Roster Database — IndexedDB wrapper
 *
 * 名札メーカーの「保存名簿」を管理する軽量DB。最大1000名まで保存可能。
 *
 * なぜIndexedDB?
 *  - 完全無料・サードパーティ不要・環境変数不要
 *  - 数百MB〜GBの容量（1000名 ≈ 数百KBなので余裕）
 *  - オフライン動作・プライバシー保護（データは端末ローカルのみ）
 *  - localStorageと違い、構造化検索・ソート可能
 */

import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "nametag-roster";
const DB_VERSION = 2;
const STORE = "people";
const SNAPSHOT_STORE = "snapshots";

export const ROSTER_LIMIT = 1000;
export const SNAPSHOT_LIMIT = 50;

export type RosterPerson = {
  id: string;
  name: string;
  kana: string;
  affiliation: string;
  title: string;
  /** 名札に表示するQRコードのリンク先URL（任意）。
   *  CSV列5。各人ごとに異なるQRが自動生成される。 */
  url?: string;
  /** 任意のグループ・タグ（例: "オフ会2025" / "店員" / "営業部"） */
  group?: string;
  /** 自由メモ */
  note?: string;
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
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("by-name", "name");
          store.createIndex("by-group", "group");
          store.createIndex("by-updatedAt", "updatedAt");
        }
        // v2: スナップショット（過去の作成データ）ストア追加
        if (oldVersion < 2 && !db.objectStoreNames.contains(SNAPSHOT_STORE)) {
          const snap = db.createObjectStore(SNAPSHOT_STORE, { keyPath: "id" });
          snap.createIndex("by-updatedAt", "updatedAt");
        }
      },
    });
  }
  return dbPromise;
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listRoster(): Promise<RosterPerson[]> {
  const db = await getDb();
  const all = await db.getAll(STORE);
  // 最近更新順
  return (all as RosterPerson[]).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function rosterCount(): Promise<number> {
  const db = await getDb();
  return await db.count(STORE);
}

export async function addRosterPerson(
  input: Omit<RosterPerson, "id" | "createdAt" | "updatedAt">,
): Promise<RosterPerson> {
  const count = await rosterCount();
  if (count >= ROSTER_LIMIT) {
    throw new Error(`保存名簿は最大${ROSTER_LIMIT}名までです（現在${count}名）`);
  }
  const now = Date.now();
  const person: RosterPerson = {
    id: genId(),
    name: input.name,
    kana: input.kana,
    affiliation: input.affiliation,
    title: input.title,
    url: input.url,
    group: input.group,
    note: input.note,
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDb();
  await db.put(STORE, person);
  return person;
}

export async function addManyRoster(
  inputs: Omit<RosterPerson, "id" | "createdAt" | "updatedAt">[],
): Promise<{ added: number; skipped: number }> {
  const db = await getDb();
  const tx = db.transaction(STORE, "readwrite");
  let count = await tx.store.count();
  const now = Date.now();
  let added = 0;
  let skipped = 0;
  for (const input of inputs) {
    if (count >= ROSTER_LIMIT) {
      skipped++;
      continue;
    }
    const person: RosterPerson = {
      id: genId(),
      name: input.name,
      kana: input.kana,
      affiliation: input.affiliation,
      title: input.title,
      url: input.url,
      group: input.group,
      note: input.note,
      createdAt: now,
      updatedAt: now,
    };
    await tx.store.put(person);
    count++;
    added++;
  }
  await tx.done;
  return { added, skipped };
}

export async function updateRosterPerson(
  id: string,
  patch: Partial<Omit<RosterPerson, "id" | "createdAt">>,
): Promise<RosterPerson | null> {
  const db = await getDb();
  const existing = (await db.get(STORE, id)) as RosterPerson | undefined;
  if (!existing) return null;
  const updated: RosterPerson = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  };
  await db.put(STORE, updated);
  return updated;
}

export async function deleteRosterPerson(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}

export async function clearRoster(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE);
}

// === Snapshot store =========================================================

export type NametagSnapshot = {
  id: string;
  label: string;
  /** 名札データのJSON文字列（NametagData 全体）。型ループ回避のため string で保管 */
  payload: string;
  peopleCount: number;
  templateId: string;
  createdAt: number;
  updatedAt: number;
};

export async function listSnapshots(): Promise<NametagSnapshot[]> {
  const db = await getDb();
  const all = await db.getAll(SNAPSHOT_STORE);
  return (all as NametagSnapshot[]).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveSnapshot(input: {
  label: string;
  payload: string;
  peopleCount: number;
  templateId: string;
  existingId?: string;
}): Promise<NametagSnapshot> {
  const db = await getDb();
  const now = Date.now();
  if (input.existingId) {
    const existing = (await db.get(SNAPSHOT_STORE, input.existingId)) as NametagSnapshot | undefined;
    if (existing) {
      const next: NametagSnapshot = {
        ...existing,
        label: input.label,
        payload: input.payload,
        peopleCount: input.peopleCount,
        templateId: input.templateId,
        updatedAt: now,
      };
      await db.put(SNAPSHOT_STORE, next);
      return next;
    }
  }
  const count = await db.count(SNAPSHOT_STORE);
  if (count >= SNAPSHOT_LIMIT) {
    // 古いものから削除
    const all = await db.getAll(SNAPSHOT_STORE) as NametagSnapshot[];
    const oldest = all.sort((a, b) => a.updatedAt - b.updatedAt)[0];
    if (oldest) await db.delete(SNAPSHOT_STORE, oldest.id);
  }
  const snap: NametagSnapshot = {
    id: `snap-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    label: input.label,
    payload: input.payload,
    peopleCount: input.peopleCount,
    templateId: input.templateId,
    createdAt: now,
    updatedAt: now,
  };
  await db.put(SNAPSHOT_STORE, snap);
  return snap;
}

export async function deleteSnapshot(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(SNAPSHOT_STORE, id);
}

/** Export full roster as CSV (UTF-8 with BOM, Excel/Google Sheets compatible) */
export async function exportRosterCsv(): Promise<string> {
  const all = await listRoster();
  const header = ["氏名", "ふりがな", "所属", "役職", "URL", "グループ", "メモ"];
  const rows = all.map((p) => [
    p.name,
    p.kana,
    p.affiliation,
    p.title,
    p.url ?? "",
    p.group ?? "",
    p.note ?? "",
  ]);
  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          // Excel互換: ダブルクォート/カンマ/改行を含む場合は囲む
          if (/[",\n\r]/.test(s)) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(","),
    )
    .join("\n");
  // BOM付きUTF-8 — ExcelやGoogleスプレッドシートで文字化け防止
  return "﻿" + csv;
}
