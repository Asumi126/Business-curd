"use client";

import { CardData, FrontQR, FrontQRPosition, FrontQRSource } from "../../lib/types";

type Props = {
  data: CardData;
  update: (patch: Partial<CardData>) => void;
};

const POSITIONS: { id: FrontQRPosition; label: string }[] = [
  { id: "top-left", label: "↖ 左上" },
  { id: "top-center", label: "↑ 上中央" },
  { id: "top-right", label: "↗ 右上" },
  { id: "middle-left", label: "← 左中央" },
  { id: "middle-center", label: "● 中央" },
  { id: "middle-right", label: "→ 右中央" },
  { id: "bottom-left", label: "↙ 左下" },
  { id: "bottom-center", label: "↓ 下中央" },
  { id: "bottom-right", label: "↘ 右下" },
];

const SIZE_MIN = 8;
const SIZE_MAX = 30;
const SIZE_STEP = 0.5;
const SIZE_QUICK: { sizeMm: number; label: string }[] = [
  { sizeMm: 10, label: "極小" },
  { sizeMm: 13, label: "小" },
  { sizeMm: 15, label: "中" },
  { sizeMm: 18, label: "大" },
  { sizeMm: 22, label: "特大" },
];

const SOURCES: { id: FrontQRSource; emoji: string; label: string; description: string }[] = [
  { id: "vcard", emoji: "📇", label: "連絡先（vCard）", description: "入力済みの連絡先から自動生成" },
  { id: "url", emoji: "🌐", label: "URL", description: "ウェブサイト・SNS・LINE等" },
  { id: "text", emoji: "📝", label: "テキスト", description: "任意のメッセージ" },
];

const PRESETS: { name: string; emoji: string; qrs: FrontQR[] }[] = [
  {
    name: "右下に1つ（無難）",
    emoji: "📍",
    qrs: [
      {
        id: "preset-1",
        position: "bottom-right",
        sizeMm: 15,
        source: "vcard",
        withBackground: true,
        caption: "",
      },
    ],
  },
  {
    name: "右上にURL",
    emoji: "🌐",
    qrs: [
      {
        id: "preset-2",
        position: "top-right",
        sizeMm: 13,
        source: "url",
        url: "",
        withBackground: true,
        caption: "Web",
      },
    ],
  },
  {
    name: "左右に2つ（連絡先＋URL）",
    emoji: "✨",
    qrs: [
      {
        id: "preset-3a",
        position: "bottom-left",
        sizeMm: 13,
        source: "vcard",
        withBackground: true,
        caption: "vCard",
      },
      {
        id: "preset-3b",
        position: "bottom-right",
        sizeMm: 13,
        source: "url",
        url: "",
        withBackground: true,
        caption: "Web",
      },
    ],
  },
  {
    name: "QRなし",
    emoji: "—",
    qrs: [],
  },
];

export function FrontQREditor({ data, update }: Props) {
  const qrs = data.customization.frontQRs ?? [];

  const setQRs = (next: FrontQR[]) => {
    update({
      customization: { ...data.customization, frontQRs: next.slice(0, 2) },
    });
  };

  const updateQR = (index: number, patch: Partial<FrontQR>) => {
    const next = [...qrs];
    next[index] = { ...next[index], ...patch };
    setQRs(next);
  };

  const addQR = () => {
    if (qrs.length >= 2) return;
    setQRs([
      ...qrs,
      {
        id: `qr-${Date.now()}`,
        position: qrs.length === 0 ? "bottom-right" : "bottom-left",
        sizeMm: 15,
        source: "vcard",
        withBackground: true,
      },
    ]);
  };

  const removeQR = (index: number) => {
    setQRs(qrs.filter((_, i) => i !== index));
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setQRs(preset.qrs.map((q, i) => ({ ...q, id: `preset-${Date.now()}-${i}` })));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-[12px] text-blue-900 leading-relaxed">
        <strong>表面にQRコードを配置</strong>できます（最大2つまで）。
        まず下のプリセットからクリックで選択、必要に応じて位置やサイズを微調整してください。
      </div>

      {/* プリセット */}
      <div>
        <div className="text-[10px] font-semibold text-neutral-500 tracking-[0.25em] uppercase mb-2">
          ワンクリックプリセット
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-left p-3 rounded-lg border-2 border-neutral-200 bg-white hover:border-blue-400 hover:bg-blue-50/30 transition"
            >
              <div className="text-base mb-0.5">{p.emoji}</div>
              <div className="text-xs font-bold text-neutral-900">{p.name}</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">
                {p.qrs.length === 0 ? "QRを表示しません" : `QR ${p.qrs.length}個`}
              </div>
            </button>
          ))}
        </div>
      </div>

      {qrs.length === 0 && (
        <button
          type="button"
          onClick={addQR}
          className="w-full p-3 rounded-lg border-2 border-dashed border-blue-300 text-blue-700 bg-blue-50/30 hover:bg-blue-50 text-sm font-medium"
        >
          + 手動でQRを追加する
        </button>
      )}

      {/* 個別QR編集 */}
      {qrs.map((qr, index) => (
        <div
          key={qr.id}
          className="rounded-xl border-2 border-blue-300 bg-white p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <span className="text-sm font-bold text-neutral-900">
                QR {index + 1}
              </span>
            </div>
            <button
              type="button"
              onClick={() => removeQR(index)}
              className="text-[11px] px-2 py-1 rounded border border-red-200 text-red-600 bg-white hover:bg-red-50"
            >
              削除
            </button>
          </div>

          {/* Position grid */}
          <div>
            <div className="text-[11px] font-semibold text-neutral-700 mb-1.5">
              配置位置
            </div>
            <div className="grid grid-cols-3 gap-1">
              {POSITIONS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => updateQR(index, { position: p.id })}
                  className={`p-2 rounded-md text-[10px] font-medium border transition ${
                    qr.position === p.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-blue-400"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size: slider + quick presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-neutral-700">サイズ</span>
              <span className="text-[10px] font-mono text-neutral-700">
                {qr.sizeMm.toFixed(1)} mm × {qr.sizeMm.toFixed(1)} mm
              </span>
            </div>
            <input
              type="range"
              min={SIZE_MIN}
              max={SIZE_MAX}
              step={SIZE_STEP}
              value={qr.sizeMm}
              onChange={(e) => updateQR(index, { sizeMm: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[9px] text-neutral-400 font-mono mt-0.5">
              <span>{SIZE_MIN}mm（極小）</span>
              <span>標準 15mm</span>
              <span>{SIZE_MAX}mm（特大）</span>
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {SIZE_QUICK.map((s) => (
                <button
                  key={s.sizeMm}
                  type="button"
                  onClick={() => updateQR(index, { sizeMm: s.sizeMm })}
                  className={`text-[10px] px-2 py-1 rounded border transition ${
                    Math.abs(qr.sizeMm - s.sizeMm) < 0.01
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-blue-400"
                  }`}
                >
                  {s.label} {s.sizeMm}mm
                </button>
              ))}
            </div>
          </div>

          {/* Fine-grained position offset (mm) — lets the user place the QR
              anywhere on the card after picking a coarse anchor above. */}
          <div className="rounded-md bg-blue-50/40 border border-blue-200 p-2.5">
            <div className="text-[11px] font-semibold text-neutral-700 mb-2">
              位置の微調整（プリセットからのズラし）
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] text-neutral-500 font-mono w-12">横（X）</span>
              <input
                type="range"
                min={-30}
                max={30}
                step={0.5}
                value={qr.offsetXmm ?? 0}
                onChange={(e) =>
                  updateQR(index, { offsetXmm: parseFloat(e.target.value) })
                }
                className="flex-1"
              />
              <span className="text-[10px] text-neutral-700 font-mono w-14 text-right">
                {(qr.offsetXmm ?? 0) > 0 ? "+" : ""}
                {(qr.offsetXmm ?? 0).toFixed(1)}mm
              </span>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] text-neutral-500 font-mono w-12">縦（Y）</span>
              <input
                type="range"
                min={-30}
                max={30}
                step={0.5}
                value={qr.offsetYmm ?? 0}
                onChange={(e) =>
                  updateQR(index, { offsetYmm: parseFloat(e.target.value) })
                }
                className="flex-1"
              />
              <span className="text-[10px] text-neutral-700 font-mono w-14 text-right">
                {(qr.offsetYmm ?? 0) > 0 ? "+" : ""}
                {(qr.offsetYmm ?? 0).toFixed(1)}mm
              </span>
            </div>
            {((qr.offsetXmm ?? 0) !== 0 || (qr.offsetYmm ?? 0) !== 0) && (
              <button
                type="button"
                onClick={() =>
                  updateQR(index, { offsetXmm: 0, offsetYmm: 0 })
                }
                className="w-full text-[10px] px-2 py-1 rounded border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-600"
              >
                ↩ 位置をプリセットに戻す
              </button>
            )}
            <div className="text-[9px] text-neutral-500 mt-1.5">
              ヒント：プリセット位置を選んだあとに、ここで mm 単位で細かく動かせます（±30mm）。
            </div>
          </div>

          {/* Source */}
          <div>
            <div className="text-[11px] font-semibold text-neutral-700 mb-1.5">
              内容
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => updateQR(index, { source: s.id })}
                  className={`p-2 rounded-md text-left border transition ${
                    qr.source === s.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-blue-400"
                  }`}
                >
                  <div className="text-base mb-0.5">{s.emoji}</div>
                  <div className="text-[10px] font-bold">{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          {qr.source === "url" && (
            <div>
              <div className="text-[11px] font-semibold text-neutral-700 mb-1">
                URL
              </div>
              <input
                type="text"
                value={qr.url ?? ""}
                onChange={(e) => updateQR(index, { url: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {qr.source === "text" && (
            <div>
              <div className="text-[11px] font-semibold text-neutral-700 mb-1">
                テキスト
              </div>
              <textarea
                value={qr.text ?? ""}
                onChange={(e) => updateQR(index, { text: e.target.value })}
                placeholder="QRコードに埋め込むテキスト（500文字程度まで）"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          )}

          <div>
            <div className="text-[11px] font-semibold text-neutral-700 mb-1">
              ラベル（QRの下に表示・任意）
            </div>
            <input
              type="text"
              value={qr.caption ?? ""}
              onChange={(e) => updateQR(index, { caption: e.target.value })}
              placeholder="例: vCard / Web / LINE"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-[12px] text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={qr.withBackground ?? true}
              onChange={(e) => updateQR(index, { withBackground: e.target.checked })}
              className="w-4 h-4"
            />
            <span>白い背景を付ける（暗い色のカードに置く時に必要）</span>
          </label>
        </div>
      ))}

      {qrs.length === 1 && (
        <button
          type="button"
          onClick={addQR}
          className="w-full p-3 rounded-lg border-2 border-dashed border-blue-300 text-blue-700 bg-blue-50/30 hover:bg-blue-50 text-sm font-medium"
        >
          + 2つ目のQRを追加（最大2つまで）
        </button>
      )}
    </div>
  );
}
