"use client";

/**
 * カラー履歴（localStorage 永続化）
 *
 * ユーザーがカラーピッカーで使った色を自動で記録し、サイト全体で「最近使った色」
 * として再利用できるようにする。重複は1つにまとめ、最新が先頭。
 * 最大保存数は 24 色。明示的に削除も可能。
 */

const KEY = "mycardmaker:v1:colorHistory";
const MAX_COLORS = 24;
/** 履歴に積む最小頻度（連続的なスライダー操作で大量に積まないため） */
const PUSH_DEBOUNCE_MS = 600;

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingColor: string | null = null;

/** 16進カラー（#RRGGBB / #RGB）を #RRGGBB の小文字に正規化 */
function normalize(hex: string): string | null {
  if (typeof hex !== "string") return null;
  let s = hex.trim().toLowerCase();
  if (!s.startsWith("#")) s = "#" + s;
  if (/^#[0-9a-f]{3}$/.test(s)) {
    s = "#" + s
      .slice(1)
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return /^#[0-9a-f]{6}$/.test(s) ? s : null;
}

export function listColors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((c): c is string => typeof c === "string") : [];
  } catch {
    return [];
  }
}

function save(list: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_COLORS)));
  } catch {
    /* quota exceeded — ignore */
  }
}

/**
 * 色を履歴に追加。連続呼び出しは PUSH_DEBOUNCE_MS で間引きされる。
 * 重複する色は最新位置に移動。
 */
export function addColor(hex: string): void {
  const norm = normalize(hex);
  if (!norm) return;
  pendingColor = norm;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    const color = pendingColor;
    pendingColor = null;
    if (!color) return;
    const cur = listColors();
    const filtered = cur.filter((c) => c.toLowerCase() !== color);
    filtered.unshift(color);
    save(filtered);
    // 変更通知（同タブ内コンポーネントへの再描画用）
    window.dispatchEvent(new CustomEvent("color-history-changed"));
  }, PUSH_DEBOUNCE_MS);
}

/** 履歴から1色だけ削除 */
export function removeColor(hex: string): void {
  const norm = normalize(hex);
  if (!norm) return;
  const cur = listColors();
  save(cur.filter((c) => c.toLowerCase() !== norm));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("color-history-changed"));
  }
}

/** 履歴を全クリア */
export function clearColors(): void {
  save([]);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("color-history-changed"));
  }
}
