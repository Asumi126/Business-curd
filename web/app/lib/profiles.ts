import { CardData } from "./types";

import { scopedKey } from "./auth";
const BASE_PROFILES_KEY = "mycardmaker:v1:profiles";
const PROFILES_KEY_FN = () => scopedKey(BASE_PROFILES_KEY);

export const PROFILE_LIMIT = 10;
/** 連絡帳（contact kind）の上限 — CSV取込で大量登録できるように500名まで */
export const CONTACT_LIMIT = 500;
export const STORAGE_BUDGET_BYTES = 4 * 1024 * 1024; // 4MB safe budget under typical 5MB localStorage cap

/**
 * Two persistence "kinds":
 *  - "card"    : 名刺帳 (max 10) — full snapshot including design
 *                (template, customization, QR layouts, etc.). Loading
 *                restores the saved design.
 *  - "contact" : 連絡先リスト — text-only contact info. Loading restores
 *                personal info but leaves the design at defaults so the
 *                user can rebuild a fresh look.
 */
export type SavedProfileKind = "card" | "contact";

export type SavedProfile = {
  id: string;
  label: string;
  /** "card" (default) keeps design; "contact" stores text only. */
  kind?: SavedProfileKind;
  data: CardData;
  templateId: string;
  backStyleId: string;
  createdAt: number;
  updatedAt: number;
};

export type StorageInfo = {
  count: number;
  limit: number;
  bytesUsed: number;
  bytesLimit: number;
  percentage: number;
};

function genId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function readRaw(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return window.localStorage.getItem(PROFILES_KEY_FN()) ?? "[]";
  } catch {
    return "[]";
  }
}

export function listProfiles(): SavedProfile[] {
  try {
    const arr = JSON.parse(readRaw()) as SavedProfile[];
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

export function getStorageInfo(): StorageInfo {
  const raw = readRaw();
  const profiles = listProfiles();
  const bytesUsed = new Blob([raw]).size;
  return {
    count: profiles.length,
    limit: PROFILE_LIMIT,
    bytesUsed,
    bytesLimit: STORAGE_BUDGET_BYTES,
    percentage: Math.min(100, Math.round((bytesUsed / STORAGE_BUDGET_BYTES) * 100)),
  };
}

export type SaveResult =
  | { ok: true; profile: SavedProfile }
  | { ok: false; reason: "limit" | "size" | "error"; message: string };

/**
 * Strip design-only fields from CardData before persisting. Profiles are
 * treated as "personal info lists" — only the text content (name, phone,
 * etc.) needs to be remembered. Saving the customization snapshot would
 * pin past design choices and prevent the user from starting fresh.
 */
function stripDesignFields(data: CardData): CardData {
  return {
    ...data,
    // Reset all visual customization
    customization: {
      ...data.customization,
      paletteId: "auto",
      customColors: {},
      backColors: {},
      fontGlobal: "auto",
      fontPerRole: {},
      fontSizePerRole: {},
      fontEffectPerRole: {},
      patternId: "none",
      monogramStyle: "none",
      contactPrefix: "icon",
      // Keep cardSize since it's structural, not visual
      fineAdjust: {
        hidden: data.customization.fineAdjust?.hidden ?? {},
        backHidden: data.customization.fineAdjust?.backHidden ?? {},
        scale: 1,
        offsetY: 0,
        offsetX: 0,
        hideTemplateExtras: false,
        customYearLabel: "",
        addressLayout: data.customization.fineAdjust?.addressLayout ?? "inline",
      },
      frontQRs: [],
      customBgTextAlign: undefined,
      customBgTextOffsetXmm: 0,
      customBgTextOffsetYmm: 0,
    },
    // Reset back image / 2nd QR design
    customBackground: "",
    customBackgroundOpacity: 1,
    qr2: { enabled: false, mode: "url", url: "", caption: "" },
    backCard: data.backCard, // back card text content (not design) is kept
  };
}

export function saveProfile(input: {
  label: string;
  kind: SavedProfileKind;
  data: CardData;
  templateId: string;
  backStyleId: string;
  existingId?: string;
}): SaveResult {
  if (typeof window === "undefined") return { ok: false, reason: "error", message: "ブラウザ外" };
  const now = Date.now();
  const profiles = listProfiles();
  // For contact kind, drop design fields. For card kind, keep the full snapshot.
  const persistedData =
    input.kind === "contact" ? stripDesignFields(input.data) : input.data;
  let next: SavedProfile[];
  let saved: SavedProfile;

  if (input.existingId) {
    const found = profiles.find((p) => p.id === input.existingId);
    if (!found) {
      return { ok: false, reason: "error", message: "更新対象が見つかりません" };
    }
    saved = {
      ...found,
      label: input.label,
      kind: input.kind,
      data: persistedData,
      templateId: input.templateId,
      backStyleId: input.backStyleId,
      updatedAt: now,
    };
    next = profiles.map((p) => (p.id === saved.id ? saved : p));
  } else {
    // Limit only applies to design-snapshot saves ("card"). Contact-only
    // entries are unlimited within the storage budget.
    if (input.kind === "card") {
      const cardCount = profiles.filter((p) => (p.kind ?? "card") === "card").length;
      if (cardCount >= PROFILE_LIMIT) {
        return {
          ok: false,
          reason: "limit",
          message: `名刺帳は最大${PROFILE_LIMIT}件までです。古いものを削除してください。`,
        };
      }
    }
    if (input.kind === "contact") {
      const contactCount = profiles.filter((p) => p.kind === "contact").length;
      if (contactCount >= CONTACT_LIMIT) {
        return {
          ok: false,
          reason: "limit",
          message: `連絡帳は最大${CONTACT_LIMIT}件までです。古いものを削除してください。`,
        };
      }
    }
    saved = {
      id: genId(),
      label: input.label,
      kind: input.kind,
      data: persistedData,
      templateId: input.templateId,
      backStyleId: input.backStyleId,
      createdAt: now,
      updatedAt: now,
    };
    next = [saved, ...profiles];
  }

  const json = JSON.stringify(next);
  const size = new Blob([json]).size;
  if (size > STORAGE_BUDGET_BYTES) {
    return {
      ok: false,
      reason: "size",
      message: `保存サイズが上限（4MB）を超えました。ロゴ画像のサイズを小さくするか、不要なプロフィールを削除してください。`,
    };
  }

  try {
    window.localStorage.setItem(PROFILES_KEY_FN(), json);
    return { ok: true, profile: saved };
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      message: `保存に失敗しました: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
}

export function deleteProfile(id: string): boolean {
  if (typeof window === "undefined") return false;
  const profiles = listProfiles();
  const next = profiles.filter((p) => p.id !== id);
  if (next.length === profiles.length) return false;
  try {
    window.localStorage.setItem(PROFILES_KEY_FN(), JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function getProfile(id: string): SavedProfile | undefined {
  return listProfiles().find((p) => p.id === id);
}

export function bytesPretty(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / (1024 * 1024)).toFixed(2)}MB`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${h}:${mi}`;
}
