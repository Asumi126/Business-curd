import { CardData, defaultCustomization, emptyCardData } from "./types";

const STORAGE_KEY = "mycardmaker:v1:userdata";
const TEMPLATE_KEY = "mycardmaker:v1:template";
const BACK_STYLE_KEY = "mycardmaker:v1:backstyle";
/** 「途中から続ける」で復元するための最後にいたステップ番号。 */
const LAST_STEP_KEY = "mycardmaker:v1:lastStep";

export function loadCardData(): CardData {
  if (typeof window === "undefined") return emptyCardData;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCardData;
    const parsed = JSON.parse(raw) as Partial<CardData>;
    // 旧データ互換: 旧形式は nameJa のみで lastName/firstName 未設定。
    // 半角・全角スペースで分割し、姓と名のプリセット値として埋める。
    let lastName = parsed.lastName;
    let firstName = parsed.firstName;
    if ((!lastName && !firstName) && parsed.nameJa) {
      const parts = parsed.nameJa.split(/[\s　]+/).filter(Boolean);
      if (parts.length >= 2) {
        lastName = parts[0];
        firstName = parts.slice(1).join("");
      } else if (parts.length === 1) {
        lastName = parts[0];
        firstName = "";
      }
    }
    return {
      ...emptyCardData,
      ...parsed,
      lastName: lastName ?? "",
      firstName: firstName ?? "",
      lastNameKana: parsed.lastNameKana ?? "",
      firstNameKana: parsed.firstNameKana ?? "",
      qrMode: (parsed.qrMode as "vcard" | "url") ?? "vcard",
      customBackgroundOpacity:
        typeof parsed.customBackgroundOpacity === "number" ? parsed.customBackgroundOpacity : 1,
      photoPosition: (parsed.photoPosition as CardData["photoPosition"]) ?? "none",
      sns: { ...(parsed.sns ?? {}) },
      customization: {
        ...defaultCustomization,
        ...(parsed.customization ?? {}),
        customColors: { ...(parsed.customization?.customColors ?? {}) },
        backColors: { ...(parsed.customization?.backColors ?? {}) },
        fontPerRole: { ...(parsed.customization?.fontPerRole ?? {}) },
        fineAdjust: {
          ...defaultCustomization.fineAdjust,
          ...(parsed.customization?.fineAdjust ?? {}),
          hidden: { ...(parsed.customization?.fineAdjust?.hidden ?? {}) },
          backHidden: { ...(parsed.customization?.fineAdjust?.backHidden ?? {}) },
          addressLayout:
            (parsed.customization?.fineAdjust?.addressLayout as "inline" | "stacked") ?? "inline",
        },
      },
    };
  } catch {
    return emptyCardData;
  }
}

export function saveCardData(data: CardData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // noop
  }
}

export function loadTemplateId(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(TEMPLATE_KEY) ?? fallback;
}

export function saveTemplateId(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TEMPLATE_KEY, id);
}

export function loadBackStyleId(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(BACK_STYLE_KEY) ?? fallback;
}

export function saveBackStyleId(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BACK_STYLE_KEY, id);
}

/**
 * 「途中から続ける」のために、最後にいた編集ステップ番号を保存する。
 * ステップ1（ようこそ画面）は保存対象外。
 */
export function saveLastStep(step: number): void {
  if (typeof window === "undefined") return;
  if (step <= 1) {
    window.localStorage.removeItem(LAST_STEP_KEY);
    return;
  }
  try {
    window.localStorage.setItem(LAST_STEP_KEY, String(step));
  } catch {
    // noop
  }
}

/**
 * 最後に編集していたステップ番号を取得。無効値や未保存なら null。
 */
export function loadLastStep(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(LAST_STEP_KEY);
    if (!v) return null;
    const n = parseInt(v, 10);
    if (!Number.isFinite(n) || n < 2) return null;
    return n;
  } catch {
    return null;
  }
}

export function clearLastStep(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LAST_STEP_KEY);
}
