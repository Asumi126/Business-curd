"use client";

/**
 * Integrations — 連携シート管理（Google スプレッドシート / Excel CSV）
 *
 * このモジュールはユーザーが登録した「連携シート」を一元管理します。
 * 名札・名刺・ショップカードのすべてのアプリから同じシート設定を参照でき、
 * URLを毎回コピペする必要がなくなります。
 *
 * 設計思想：
 *  - localStorage に集約保存（IndexedDBに比べて軽量、シート設定はテキストのみで小容量）
 *  - 完全クライアントサイド（サーバ不要、無料）
 *  - 公開シート方式（OAuth不要） — Googleでは「リンクを知っている全員が閲覧可能」設定
 *  - Excelユーザー向けには「OneDrive/Google Driveに公開アップロード」を案内
 *  - 自動同期はアプリ起動時 + 定期 + フォーカス時のトリプル発火
 */

export const INTEGRATIONS_KEY = "mycardmaker:v1:integrations";
export const INTEGRATION_LIMIT = 20;

export type IntegrationKind = "nametag" | "contact" | "shop";

export type Integration = {
  id: string;
  label: string;          // 表示名（例: "2026春オフ会名簿"）
  url: string;            // シートURL（生のGoogle Sheets URL or 直接CSVのURL）
  kind: IntegrationKind;  // どのアプリ向けか
  autoSync: boolean;      // 自動同期するか
  lastSync: number | null; // 最終同期時刻
  createdAt: number;
  updatedAt: number;
};

function genId(): string {
  return `int-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listIntegrations(): Integration[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(INTEGRATIONS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Integration[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function listIntegrationsByKind(kind: IntegrationKind): Integration[] {
  return listIntegrations().filter((i) => i.kind === kind);
}

export function getIntegration(id: string): Integration | null {
  return listIntegrations().find((i) => i.id === id) ?? null;
}

export function saveIntegrations(list: Integration[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function addIntegration(input: Omit<Integration, "id" | "createdAt" | "updatedAt" | "lastSync">): Integration | null {
  const list = listIntegrations();
  if (list.length >= INTEGRATION_LIMIT) {
    throw new Error(`登録上限（${INTEGRATION_LIMIT}件）に達しました`);
  }
  const now = Date.now();
  const item: Integration = {
    id: genId(),
    label: input.label,
    url: input.url,
    kind: input.kind,
    autoSync: input.autoSync,
    lastSync: null,
    createdAt: now,
    updatedAt: now,
  };
  const next = [item, ...list];
  if (!saveIntegrations(next)) return null;
  return item;
}

export function updateIntegration(id: string, patch: Partial<Omit<Integration, "id" | "createdAt">>): Integration | null {
  const list = listIntegrations();
  const idx = list.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  const updated: Integration = { ...list[idx], ...patch, id: list[idx].id, createdAt: list[idx].createdAt, updatedAt: Date.now() };
  const next = [...list];
  next[idx] = updated;
  saveIntegrations(next);
  return updated;
}

export function deleteIntegration(id: string): void {
  const list = listIntegrations();
  saveIntegrations(list.filter((i) => i.id !== id));
}

export function markIntegrationSynced(id: string): void {
  updateIntegration(id, { lastSync: Date.now() });
}

/**
 * Convert Google Sheets URL → direct CSV export URL.
 * Accepts: edit URL / share URL / already-exported URL.
 *
 * 戻り値は単一の URL（プライマリ）。HTTP 400 等で失敗したときの
 * フォールバック URL は `googleSheetCsvUrlVariants` を使用。
 */
export function googleSheetCsvUrl(input: string): string | null {
  const list = googleSheetCsvUrlVariants(input);
  return list.length > 0 ? list[0] : null;
}

/**
 * 同じシートURLから複数の CSV エクスポート形式を生成し、
 * fetchSheetRows がフォールバック試行するために使う。
 *  1) export?format=csv&gid=X  （標準。共有=「リンクを知っている全員が閲覧可能」で動く）
 *  2) gviz/tq?tqx=out:csv&gid=X  （旧 API。共有のみで動く場合あり）
 *  3) pub?output=csv&gid=X       （ファイル → ウェブに公開した場合に動く）
 *  4) 入力がすでに直接CSVっぽい場合はそのまま
 */
export function googleSheetCsvUrlVariants(input: string): string[] {
  const s = input.trim();
  if (!s) return [];
  if (s.includes("export?format=csv") || s.includes("output=csv") || s.includes("tqx=out:csv")) {
    return [s];
  }
  const m = s.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) {
    if (/^https?:\/\//.test(s)) return [s];
    return [];
  }
  const sheetId = m[1];
  // gid は #gid=N / ?gid=N / &gid=N のいずれにもマッチさせる
  const gidMatch = s.match(/[#?&]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return [
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?output=csv&gid=${gid}`,
  ];
}

export type CsvRow = string[];
export type SyncResult = {
  ok: boolean;
  rows?: CsvRow[];
  hasHeader?: boolean;
  error?: string;
};

/**
 * 1つの URL を fetch して、結果（ok or 失敗 + status）を返す内部ヘルパ。
 */
async function tryFetchCsv(
  csvUrl: string,
): Promise<{ ok: true; text: string } | { ok: false; status: number | null; reason: string }> {
  try {
    const res = await fetch(csvUrl, { redirect: "follow" });
    if (!res.ok) {
      return { ok: false, status: res.status, reason: `HTTP ${res.status}` };
    }
    const text = (await res.text()).replace(/^﻿/, "").trim();
    return { ok: true, text };
  } catch (e) {
    return {
      ok: false,
      status: null,
      reason: e instanceof Error ? e.message : "ネットワーク失敗",
    };
  }
}

/**
 * Fetch a sheet via its URL and return parsed CSV rows.
 * 複数の URL 形式を順番に試し、最初に成功したレスポンスでパースする。
 * すべて失敗したら、ユーザー向けのわかりやすいエラー文を返す。
 */
export async function fetchSheetRows(url: string): Promise<SyncResult> {
  const variants = googleSheetCsvUrlVariants(url);
  if (variants.length === 0) return { ok: false, error: "URL形式が認識できません" };

  let lastStatus: number | null = null;
  let lastReason = "";
  let text: string | null = null;
  for (const v of variants) {
    const r = await tryFetchCsv(v);
    if (r.ok) {
      text = r.text;
      break;
    }
    lastStatus = r.status;
    lastReason = r.reason;
  }

  if (text === null) {
    if (lastStatus === 401 || lastStatus === 403) {
      return {
        ok: false,
        error:
          "シートにアクセスできません。Googleスプレッドシートの共有設定を「リンクを知っている全員が閲覧可能」に変更してください。",
      };
    }
    if (lastStatus === 404) {
      return {
        ok: false,
        error:
          "シートが見つかりません。URLが正しいか、シートが削除されていないか確認してください。",
      };
    }
    if (lastStatus === 400) {
      return {
        ok: false,
        error:
          "シートを読み込めません（HTTP 400）。次のいずれかを試してください: ① 共有設定を「リンクを知っている全員が閲覧可能」に変更 ② Googleの場合「ファイル → ウェブに公開」をONに ③ URLに「#gid=○○」が含まれているか確認（複数タブのとき必須）",
      };
    }
    return {
      ok: false,
      error: `取得失敗: ${lastReason || "原因不明"}。共有設定とURLをご確認ください。`,
    };
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { ok: false, error: "シートが空です" };
  const sep = lines[0].includes("\t") ? "\t" : ",";
  const rows: CsvRow[] = lines.map((line) =>
    line.split(sep).map((c) => c.trim().replace(/^"|"$/g, "")),
  );
  const firstRowLower = rows[0].map((c) => c.toLowerCase());
  const hasHeader = firstRowLower.some((c) => ["氏名", "名前", "name", "なまえ"].includes(c));
  return { ok: true, rows: hasHeader ? rows.slice(1) : rows, hasHeader };
}

export const INTEGRATION_KIND_LABELS: Record<IntegrationKind, string> = {
  nametag: "🏷 名札",
  contact: "📇 名刺・連絡帳",
  shop: "🏪 ショップカード",
};
