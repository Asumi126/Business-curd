"use client";

import { ChangeEvent, useRef, useState } from "react";
import { compressImage, dataUrlToBlob } from "../lib/imageCompress";
import { listImages, saveImage } from "../lib/imageLibrary";
import { CardData } from "../lib/types";
import { CardRenderer } from "./CardRenderer";
import { ImageCropModal } from "./ImageCropModal";
import { ImageLibraryModal } from "./ImageLibraryModal";

type Props = {
  value: string;
  opacity: number;
  onChange: (dataUrl: string) => void;
  onOpacityChange: (v: number) => void;
  /** Text-block placement controls (only meaningful when a background is set). */
  textAlign?: import("../lib/types").FrontQRPosition;
  textOffsetXmm?: number;
  textOffsetYmm?: number;
  onTextAlignChange?: (a: import("../lib/types").FrontQRPosition) => void;
  onTextOffsetChange?: (x: number, y: number) => void;
  /** Overlay (text-readability tint) controls. */
  overlayEnabled?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  onOverlayChange?: (patch: {
    enabled?: boolean;
    color?: string;
    opacity?: number;
  }) => void;
  /** Optional live preview rendered with the current background. */
  data?: CardData;
  templateId?: string;
};

export function CustomBackgroundUploader({
  value,
  opacity,
  onChange,
  onOpacityChange,
  textAlign = "bottom-left",
  textOffsetXmm = 0,
  textOffsetYmm = 0,
  onTextAlignChange,
  onTextOffsetChange,
  overlayEnabled = true,
  overlayColor = "#000000",
  overlayOpacity = 0.4,
  onOverlayChange,
  data,
  templateId,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [cropPending, setCropPending] = useState<{ dataUrl: string; fileName: string } | null>(null);
  const libraryCount = listImages("background").length;

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選んでください（PNG / JPG）");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert("ファイルが大きすぎます。15MB以下にしてください。");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setCropPending({
        dataUrl: reader.result,
        fileName: file.name.replace(/\.[^.]+$/, ""),
      });
    };
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const finishCrop = async (croppedDataUrl: string) => {
    if (!cropPending) return;
    const { fileName } = cropPending;
    setCropPending(null);
    setWorking(true);
    try {
      const blob = dataUrlToBlob(croppedDataUrl);
      const file = new File([blob], `${fileName}.png`, { type: blob.type || "image/png" });
      const dataUrl = await compressImage(file, { maxSize: 1600 });
      onChange(dataUrl);
      if (saveToLibrary) {
        saveImage({ kind: "background", dataUrl, label: fileName || "背景" });
      }
    } catch (err) {
      console.error("Custom background crop failed:", err);
      alert(`画像の処理に失敗しました。\n${err instanceof Error ? err.message : "不明なエラー"}`);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-pink-200 bg-pink-50/30 p-4 space-y-3">
      <div>
        <div className="text-sm font-bold text-neutral-900">📷 カスタム背景画像（オリジナル素材）</div>
        <div className="text-[11px] text-neutral-600 mt-0.5">
          フリー素材サイトの背景画像、自作デザイン、写真などをアップロードして名刺の背景に使えます。
          <br />
          「📷 カスタム背景」テンプレートを選ぶと適用されます。
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-24 h-16 rounded-lg border-2 border-dashed border-neutral-300 flex items-center justify-center bg-white overflow-hidden shrink-0">
          {value ? (
            <img src={value} alt="bg preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-neutral-400 text-xs text-center px-2">背景未設定</span>
          )}
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <button
            type="button"
            disabled={working}
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 rounded-md bg-pink-600 text-white text-sm font-medium hover:bg-pink-700 active:scale-95 transition disabled:opacity-60 self-start"
          >
            {working ? "処理中..." : value ? "背景を変更" : "背景画像をアップロード"}
          </button>
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            disabled={libraryCount === 0}
            className="px-4 py-2 rounded-md border border-pink-300 text-pink-700 bg-pink-50/40 text-sm hover:bg-pink-100 self-start disabled:opacity-60 disabled:cursor-not-allowed"
            title={libraryCount === 0 ? "保存済みの背景画像はまだありません" : `ライブラリから選択（${libraryCount}件）`}
          >
            📂 ライブラリから選ぶ {libraryCount > 0 ? `(${libraryCount}件)` : "（まだ保存なし）"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() =>
                setCropPending({ dataUrl: value, fileName: "background" })
              }
              className="px-4 py-2 rounded-md border border-pink-300 text-sm text-pink-700 bg-white hover:bg-pink-50 self-start"
              title="アップロード済みの背景を再度切り取り"
            >
              ✂ 切り取り範囲を変更
            </button>
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-4 py-2 rounded-md border border-neutral-300 text-sm text-neutral-700 hover:bg-neutral-100 self-start"
            >
              背景を削除
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>

      {value && data && templateId && (
        <div className="rounded-xl border-2 border-pink-300 bg-white p-3">
          <div className="text-[10px] font-semibold text-pink-600 tracking-[0.25em] uppercase mb-2">
            🪄 背景反映プレビュー（リアルタイム）
          </div>
          <div className="bg-neutral-100 rounded-lg p-3 flex items-center justify-center">
            <CardRenderer data={data} templateId={templateId} />
          </div>
          <div className="text-[10px] text-neutral-500 mt-1.5 text-center">
            濃さ・文字位置・オーバーレイの調整がここに即反映されます
          </div>
        </div>
      )}

      {value && onOverlayChange && (
        <div className="rounded-lg bg-purple-50/40 border border-purple-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🎭</span>
              <span className="text-xs font-bold text-neutral-900">
                文字下のオーバーレイ
              </span>
            </div>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={overlayEnabled}
                onChange={(e) => onOverlayChange({ enabled: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-[11px]">{overlayEnabled ? "ON" : "OFF"}</span>
            </label>
          </div>
          <div className="text-[10px] text-neutral-600 leading-relaxed">
            背景画像の上に半透明の色を重ねて文字を読みやすくします。色と濃さを調整できます。
          </div>

          {overlayEnabled && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-600 w-12">色</span>
                <label
                  className="relative w-8 h-8 rounded border-2 border-neutral-300 cursor-pointer overflow-hidden shrink-0"
                  style={{ backgroundColor: overlayColor }}
                >
                  <input
                    type="color"
                    value={overlayColor}
                    onChange={(e) => onOverlayChange({ color: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
                <span className="text-[10px] font-mono text-neutral-700">
                  {overlayColor.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-600 w-12">濃さ</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={overlayOpacity}
                  onChange={(e) =>
                    onOverlayChange({ opacity: parseFloat(e.target.value) })
                  }
                  className="flex-1"
                />
                <span className="text-[10px] font-mono text-neutral-700 w-10 text-right">
                  {Math.round(overlayOpacity * 100)}%
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { label: "黒40%", c: "#000000", o: 0.4 },
                  { label: "黒70%", c: "#000000", o: 0.7 },
                  { label: "白50%", c: "#ffffff", o: 0.5 },
                  { label: "ネイビー", c: "#0f172a", o: 0.55 },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() =>
                      onOverlayChange({ enabled: true, color: p.c, opacity: p.o })
                    }
                    className="text-[10px] px-2 py-1 rounded border border-neutral-300 bg-white hover:border-purple-500 text-neutral-700 hover:text-purple-700"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {value && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-semibold text-neutral-700">背景の濃さ</div>
            <div className="text-[10px] text-neutral-500 font-mono">{Math.round(opacity * 100)}%</div>
          </div>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[9px] text-neutral-400 mt-0.5">
            <span>薄い</span>
            <span>標準</span>
          </div>
        </div>
      )}

      {value && onTextAlignChange && (
        <div className="rounded-lg bg-white border border-pink-200 p-3 space-y-2">
          <div className="text-xs font-bold text-neutral-900">📐 文字の配置位置</div>
          <div className="text-[10px] text-neutral-500 leading-relaxed">
            背景画像のどこに文字情報を置くかを選びます。下のクイックパターン3種から選ぶか、
            9つの細かい位置から指定 + mm単位で微調整できます。
          </div>

          {/* Quick 3-pattern presets — left-aligned / centered / right-aligned */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {(
              [
                {
                  id: "middle-left" as const,
                  label: "左寄せ",
                  desc: "情報を左サイドに",
                  preview: (
                    <div className="w-full h-full flex flex-col justify-center items-start gap-[2px] pl-1">
                      <div className="h-[2px] w-[35%] bg-current rounded" />
                      <div className="h-[1.5px] w-[28%] bg-current/60 rounded" />
                      <div className="h-[1.5px] w-[40%] bg-current/60 rounded" />
                    </div>
                  ),
                },
                {
                  id: "middle-center" as const,
                  label: "中央",
                  desc: "情報を真ん中に",
                  preview: (
                    <div className="w-full h-full flex flex-col justify-center items-center gap-[2px]">
                      <div className="h-[2px] w-[40%] bg-current rounded" />
                      <div className="h-[1.5px] w-[30%] bg-current/60 rounded" />
                      <div className="h-[1.5px] w-[45%] bg-current/60 rounded" />
                    </div>
                  ),
                },
                {
                  id: "middle-right" as const,
                  label: "右寄せ",
                  desc: "情報を右サイドに",
                  preview: (
                    <div className="w-full h-full flex flex-col justify-center items-end gap-[2px] pr-1">
                      <div className="h-[2px] w-[35%] bg-current rounded" />
                      <div className="h-[1.5px] w-[28%] bg-current/60 rounded" />
                      <div className="h-[1.5px] w-[40%] bg-current/60 rounded" />
                    </div>
                  ),
                },
              ]
            ).map((p) => {
              const isActive = textAlign === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onTextAlignChange(p.id);
                    onTextOffsetChange?.(0, 0); // reset fine offset
                  }}
                  className={`flex flex-col gap-1 p-2 rounded-md border-2 transition text-left ${
                    isActive
                      ? "border-pink-600 bg-pink-50/60 text-pink-700"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-pink-300"
                  }`}
                >
                  <div
                    className="w-full h-7 rounded bg-neutral-100 border border-neutral-200 text-pink-600 overflow-hidden"
                  >
                    {p.preview}
                  </div>
                  <div className="text-[11px] font-bold leading-tight">{p.label}</div>
                  <div className="text-[9px] text-neutral-500 leading-tight">{p.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="text-[10px] text-neutral-500 mt-1 mb-1">
            ── または9点配置から細かく指定 ──
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(
              [
                { id: "top-left", label: "↖" },
                { id: "top-center", label: "↑" },
                { id: "top-right", label: "↗" },
                { id: "middle-left", label: "←" },
                { id: "middle-center", label: "●" },
                { id: "middle-right", label: "→" },
                { id: "bottom-left", label: "↙" },
                { id: "bottom-center", label: "↓" },
                { id: "bottom-right", label: "↘" },
              ] as { id: import("../lib/types").FrontQRPosition; label: string }[]
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onTextAlignChange(p.id)}
                className={`p-2 rounded-md text-[12px] font-bold border transition ${
                  textAlign === p.id
                    ? "bg-pink-600 text-white border-pink-600"
                    : "bg-white text-neutral-700 border-neutral-200 hover:border-pink-400"
                }`}
                title={p.id}
              >
                {p.label}
              </button>
            ))}
          </div>

          {onTextOffsetChange && (
            <>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-neutral-500 font-mono w-12">横（X）</span>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  step={0.5}
                  value={textOffsetXmm}
                  onChange={(e) => onTextOffsetChange(parseFloat(e.target.value), textOffsetYmm)}
                  className="flex-1"
                />
                <span className="text-[10px] text-neutral-700 font-mono w-12 text-right">
                  {textOffsetXmm > 0 ? "+" : ""}
                  {textOffsetXmm.toFixed(1)}mm
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-500 font-mono w-12">縦（Y）</span>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  step={0.5}
                  value={textOffsetYmm}
                  onChange={(e) => onTextOffsetChange(textOffsetXmm, parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-[10px] text-neutral-700 font-mono w-12 text-right">
                  {textOffsetYmm > 0 ? "+" : ""}
                  {textOffsetYmm.toFixed(1)}mm
                </span>
              </div>
              {(textOffsetXmm !== 0 || textOffsetYmm !== 0) && (
                <button
                  type="button"
                  onClick={() => onTextOffsetChange(0, 0)}
                  className="w-full text-[10px] px-2 py-1 rounded border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-600"
                >
                  ↩ 微調整をリセット
                </button>
              )}
            </>
          )}
        </div>
      )}

      <label className="flex items-start gap-2 text-xs cursor-pointer p-2 rounded-md bg-pink-50/40 border border-pink-100">
        <input
          type="checkbox"
          checked={saveToLibrary}
          onChange={(e) => setSaveToLibrary(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-neutral-700 leading-relaxed">
          <strong>アップロードした画像をライブラリに保存する</strong>
          <span className="block text-[10px] text-neutral-500 mt-0.5">
            次回以降、再アップロードせずに使えます。
          </span>
        </span>
      </label>

      <div className="text-[10px] text-neutral-500 leading-relaxed">
        💡 <strong>おすすめ：</strong>文字が映えるように、明るすぎず暗すぎない画像を選んでください。
        パターン素材なら濃さを「50%以下」にすると文字が読みやすくなります。
      </div>

      <ImageLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        pickerKind="background"
        onPick={(img) => onChange(img.dataUrl)}
      />

      {cropPending && (
        <ImageCropModal
          imageDataUrl={cropPending.dataUrl}
          title="背景画像を切り取り（使う部分を選ぶ）"
          defaultPreset="card"
          onCancel={() => setCropPending(null)}
          onCrop={finishCrop}
        />
      )}
    </div>
  );
}
