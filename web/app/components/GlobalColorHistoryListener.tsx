"use client";

import { useEffect } from "react";
import { addColor } from "../lib/colorHistory";

/**
 * サイト全体に組み込むグローバル listener。
 * すべての <input type="color"> の change/input イベントを捕まえ、
 * 選ばれた色を自動的に「最近使った色」履歴に積む。
 *
 * これにより既存のカラーピッカー全てが（コード修正なしに）履歴対応になる。
 * UI で履歴を表示したい場所では ColorPickerWithHistory を使う or
 * listColors() を直接読む。
 */
export function GlobalColorHistoryListener() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handler = (e: Event) => {
      const t = e.target as HTMLInputElement | null;
      if (!t || t.tagName !== "INPUT" || t.type !== "color") return;
      const v = t.value;
      // 連続的なスライダー操作は addColor 内の debounce で1回にまとめられる
      if (v) addColor(v);
    };
    document.addEventListener("change", handler, true);
    document.addEventListener("input", handler, true);
    return () => {
      document.removeEventListener("change", handler, true);
      document.removeEventListener("input", handler, true);
    };
  }, []);
  return null;
}
