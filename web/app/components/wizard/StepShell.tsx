"use client";

import { ReactNode } from "react";
import { UNDO_REDO_BTN_CLASS } from "../../lib/useUndoRedo";

type Props = {
  title: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  /** 編集ページ用 Undo/Redo (任意・存在すればタイトル右側に表示)。
   *  ヘッダーには置かず、編集ページ内で操作できるようにするため StepShell に統合。 */
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
};

export function StepShell({
  title,
  subtitle,
  icon,
  children,
  undo,
  redo,
  canUndo,
  canRedo,
}: Props) {
  const hasUndoRedo = !!undo || !!redo;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {icon && <div className="text-3xl mb-2">{icon}</div>}
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-sm sm:text-base text-neutral-600 leading-relaxed">{subtitle}</p>
          )}
        </div>
        {hasUndoRedo && (
          <div className="flex items-center gap-1.5 shrink-0 mt-1">
            <button
              type="button"
              onClick={() => undo?.()}
              disabled={!canUndo}
              className={UNDO_REDO_BTN_CLASS}
              title="一つ前の操作に戻る (⌘+Z / Ctrl+Z)"
              aria-label="元に戻す"
            >
              ↶ 戻る
            </button>
            <button
              type="button"
              onClick={() => redo?.()}
              disabled={!canRedo}
              className={UNDO_REDO_BTN_CLASS}
              title="一つ後の操作に進む (⌘+Shift+Z / Ctrl+Y)"
              aria-label="やり直す"
            >
              ↷ 進む
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );
}
