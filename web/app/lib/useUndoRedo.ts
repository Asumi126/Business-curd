"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Undo / Redo フック — ウィザードのデータ state を履歴管理して
 * ⌘+Z / Ctrl+Z で1つ戻る、⌘+Shift+Z / Ctrl+Y で1つ進めるショートカットと
 * 「↶ 戻る」「↷ 進む」ボタン用の API を提供します。
 *
 * 使い方:
 *   const { undo, redo, canUndo, canRedo } = useUndoRedo(data, setData);
 *
 * - `data` を変えるたびに自動で履歴に積まれる
 * - `undo()` / `redo()` を呼ぶと自動的に setData が呼ばれて state が復元される
 * - ⌘+Z / Ctrl+Z で undo、⌘+Shift+Z / Ctrl+Shift+Z / Ctrl+Y で redo（ブラウザ標準と整合）
 * - 入力欄（input / textarea）にフォーカスがある場合はブラウザ標準の Undo を優先
 */
export function useUndoRedo<T>(
  state: T,
  setState: (next: T) => void,
  options: { maxHistory?: number; debounceMs?: number } = {},
) {
  const { maxHistory = 50, debounceMs = 250 } = options;
  const historyRef = useRef<T[]>([state]);
  const pointerRef = useRef(0);
  // undo/redo 操作で state を書き戻している間は履歴に積まない
  const isRestoringRef = useRef(false);
  // タイマーで debounce — 連続変更（スライダー操作など）を1つにまとめる
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // canUndo / canRedo の再描画用カウンタ
  const [tick, setTick] = useState(0);

  // state 変化を履歴に push
  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }
    const cur = historyRef.current[pointerRef.current];
    if (cur === state) return;
    // 連続変化を debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      // ポインタ以降の履歴を破棄（redo 経路をクリア）
      const newHistory = historyRef.current.slice(0, pointerRef.current + 1);
      newHistory.push(state);
      // 上限超えたら古いものから捨てる
      while (newHistory.length > maxHistory) {
        newHistory.shift();
      }
      historyRef.current = newHistory;
      pointerRef.current = newHistory.length - 1;
      setTick((v) => v + 1);
    }, debounceMs);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [state, maxHistory, debounceMs]);

  const undo = useCallback(() => {
    if (pointerRef.current <= 0) return false;
    // 進行中の debounce を flush（履歴の整合性確保）
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pointerRef.current -= 1;
    isRestoringRef.current = true;
    const target = historyRef.current[pointerRef.current];
    setState(target);
    setTick((v) => v + 1);
    return true;
  }, [setState]);

  const redo = useCallback(() => {
    if (pointerRef.current >= historyRef.current.length - 1) return false;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pointerRef.current += 1;
    isRestoringRef.current = true;
    const target = historyRef.current[pointerRef.current];
    setState(target);
    setTick((v) => v + 1);
    return true;
  }, [setState]);

  // ⌘+Z / Ctrl+Z / ⌘+Shift+Z / Ctrl+Y ショートカット
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ブラウザのデフォルト Undo を優先したい入力欄
      const target = e.target as HTMLElement | null;
      const isEditable = !!target && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      );
      if (isEditable) return;

      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      // Redo: Cmd+Shift+Z / Ctrl+Shift+Z / Ctrl+Y
      if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
        return;
      }
      // Undo: Cmd+Z / Ctrl+Z
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // tick 参照で再描画のフリッカ防止
  void tick;
  return {
    undo,
    redo,
    canUndo: pointerRef.current > 0,
    canRedo: pointerRef.current < historyRef.current.length - 1,
  };
}

/** ↶ ↷ ボタン共通のスタイル */
export const UNDO_REDO_BTN_CLASS =
  "px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white text-neutral-700 text-xs font-semibold hover:border-blue-400 hover:text-blue-700 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed";
