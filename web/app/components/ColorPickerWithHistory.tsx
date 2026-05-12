"use client";

import { useEffect, useState } from "react";
import { addColor, listColors, removeColor } from "../lib/colorHistory";

/**
 * カラーピッカー + 履歴付き。
 *
 * - <input type="color"> と同じ感覚で `value` / `onChange` を渡す
 * - 値が変わると自動的にカラー履歴に追加（debounce 済み）
 * - 「最近使った色」をチップで表示。クリックで再利用、×で履歴から削除
 * - サイト内のどのカラー設定からも履歴は共有される
 */
type Props = {
  value: string;
  onChange: (hex: string) => void;
  /** 履歴チップを表示するか（小さなスペースでは false） */
  showHistory?: boolean;
  /** ピッカー自体の追加クラス */
  className?: string;
};

export function ColorPickerWithHistory({
  value,
  onChange,
  showHistory = true,
  className = "",
}: Props) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(listColors());
    const sync = () => setHistory(listColors());
    window.addEventListener("color-history-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("color-history-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handleChange = (hex: string) => {
    onChange(hex);
    addColor(hex);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <input
        type="color"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className={`w-full h-8 rounded border border-neutral-200 cursor-pointer ${className}`}
      />
      {showHistory && history.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] text-neutral-500 font-mono shrink-0">最近使った色</span>
          {history.slice(0, 12).map((c) => (
            <span
              key={c}
              className="relative group inline-block"
            >
              <button
                type="button"
                onClick={() => handleChange(c)}
                className="w-5 h-5 rounded-sm border border-neutral-300 hover:scale-110 transition cursor-pointer"
                style={{ backgroundColor: c }}
                title={`${c} を使う`}
              />
              <button
                type="button"
                onClick={() => removeColor(c)}
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-neutral-700 text-white text-[8px] leading-none opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                title="履歴から削除"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
