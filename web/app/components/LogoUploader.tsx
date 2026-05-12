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
  onChange: (dataUrl: string) => void;
  data?: CardData;
  templateId?: string;
  /** Optional updater for full data so we can edit logoFrame here. */
  updateData?: (patch: Partial<CardData>) => void;
};

export function LogoUploader({ value, onChange, data, templateId, updateData }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [cropPending, setCropPending] = useState<{ dataUrl: string; fileName: string; isSvg: boolean } | null>(null);

  const libraryCount = listImages("logo").length;

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選んでください（PNG / JPG / SVG）");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("ファイルが大きすぎます。10MB以下の画像を使ってください。");
      return;
    }
    // SVG cannot be canvas-cropped reliably — apply directly
    const isSvg = file.type === "image/svg+xml";
    if (isSvg) {
      setWorking(true);
      try {
        const dataUrl = await compressImage(file, { maxSize: 800 });
        onChange(dataUrl);
        if (saveToLibrary) {
          const fileName = file.name.replace(/\.[^.]+$/, "");
          saveImage({ kind: "logo", dataUrl, label: fileName || "ロゴ" });
        }
      } finally {
        setWorking(false);
      }
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setCropPending({
        dataUrl: reader.result,
        fileName: file.name.replace(/\.[^.]+$/, ""),
        isSvg: false,
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
      // CSP セーフな data:URL → Blob 変換（fetch を使わない）
      const blob = dataUrlToBlob(croppedDataUrl);
      const file = new File([blob], `${fileName}.png`, { type: blob.type || "image/png" });
      const dataUrl = await compressImage(file, { maxSize: 800 });
      onChange(dataUrl);
      if (saveToLibrary) {
        saveImage({ kind: "logo", dataUrl, label: fileName || "ロゴ" });
      }
    } catch (err) {
      console.error("Logo crop failed:", err);
      alert(`画像の処理に失敗しました。\n${err instanceof Error ? err.message : "不明なエラー"}`);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-lg border-2 border-dashed border-neutral-300 flex items-center justify-center bg-neutral-50 overflow-hidden">
          {value ? (
            <img src={value} alt="logo preview" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-neutral-400 text-xs text-center px-2">ロゴ未設定</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={working}
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:scale-95 transition disabled:opacity-60"
          >
            {working ? "圧縮中..." : value ? "ロゴを変更" : "ロゴをアップロード"}
          </button>
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            disabled={libraryCount === 0}
            className="px-4 py-2 rounded-md border border-blue-300 text-blue-700 bg-blue-50/30 text-sm hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed"
            title={libraryCount === 0 ? "保存済みのロゴはまだありません" : `ライブラリから選択（${libraryCount}件）`}
          >
            📂 ライブラリから選ぶ {libraryCount > 0 ? `(${libraryCount}件)` : "（まだ保存なし）"}
          </button>
          {value && !value.includes("svg") && (
            <button
              type="button"
              onClick={() =>
                setCropPending({ dataUrl: value, fileName: "logo", isSvg: false })
              }
              className="px-4 py-2 rounded-md border border-blue-300 text-sm text-blue-700 bg-white hover:bg-blue-50"
              title="アップロード済みのロゴを再度切り取り"
            >
              ✂ 切り取り範囲を変更
            </button>
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-4 py-2 rounded-md border border-neutral-300 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              ロゴを削除
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>

      {value && data && templateId && (
        <div className="rounded-xl border-2 border-blue-300 bg-white p-3 space-y-3">
          <div>
            <div className="text-[10px] font-semibold text-blue-600 tracking-[0.25em] uppercase mb-2">
              🪄 ロゴ反映プレビュー（リアルタイム）
            </div>
            <div className="bg-neutral-100 rounded-lg p-3 flex items-center justify-center">
              <CardRenderer data={data} templateId={templateId} />
            </div>
          </div>

          {updateData && (() => {
            const lf = data.customization.logoFrame ?? {};
            const setLF = (patch: Partial<typeof lf>) =>
              updateData({
                customization: {
                  ...data.customization,
                  logoFrame: { ...lf, ...patch },
                },
              });
            const sizeMm = lf.sizeMm ?? 13;
            const dx = lf.offsetXmm ?? 0;
            const dy = lf.offsetYmm ?? 0;
            return (
              <div className="rounded-lg bg-blue-50/50 border border-blue-200 p-2.5 space-y-2">
                <div className="text-[10px] font-semibold text-blue-700 tracking-[0.25em] uppercase">
                  🎯 ロゴの位置・サイズ
                </div>
                <div className="text-[10px] text-neutral-600 leading-relaxed">
                  デフォルトは右上に 13mm。下のスライダーで自由に調整できます。
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-600 font-mono w-12">サイズ</span>
                  <input
                    type="range"
                    min={6}
                    max={24}
                    step={0.5}
                    value={sizeMm}
                    onChange={(e) => setLF({ sizeMm: parseFloat(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-[10px] font-mono w-12 text-right">{sizeMm.toFixed(1)}mm</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-600 font-mono w-12">横（X）</span>
                  <input
                    type="range"
                    min={-50}
                    max={5}
                    step={0.5}
                    value={dx}
                    onChange={(e) => setLF({ offsetXmm: parseFloat(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-[10px] font-mono w-14 text-right">
                    {dx > 0 ? "+" : ""}{dx.toFixed(1)}mm
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-600 font-mono w-12">縦（Y）</span>
                  <input
                    type="range"
                    min={-3}
                    max={45}
                    step={0.5}
                    value={dy}
                    onChange={(e) => setLF({ offsetYmm: parseFloat(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-[10px] font-mono w-14 text-right">
                    {dy > 0 ? "+" : ""}{dy.toFixed(1)}mm
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[
                    { label: "右上", x: 0, y: 0 },
                    { label: "中央", x: -33, y: 21 },
                    { label: "左上", x: -73, y: 0 },
                    { label: "右下", x: 0, y: 39 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setLF({ offsetXmm: p.x, offsetYmm: p.y })}
                      className="text-[10px] px-2 py-1 rounded border border-neutral-300 bg-white hover:border-blue-400 hover:text-blue-700"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {(dx !== 0 || dy !== 0 || sizeMm !== 13) && (
                  <button
                    type="button"
                    onClick={() => setLF({ offsetXmm: 0, offsetYmm: 0, sizeMm: 13 })}
                    className="text-[10px] text-neutral-500 hover:text-neutral-900 underline"
                  >
                    ↩ デフォルト（右上 13mm）に戻す
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      <label className="flex items-start gap-2 text-xs cursor-pointer p-2 rounded-md bg-blue-50/40 border border-blue-100">
        <input
          type="checkbox"
          checked={saveToLibrary}
          onChange={(e) => setSaveToLibrary(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-neutral-700 leading-relaxed">
          <strong>アップロードした画像をライブラリに保存する</strong>
          <span className="block text-[10px] text-neutral-500 mt-0.5">
            次回以降、再アップロードせずに使えます。設定画面でいつでも削除できます。
          </span>
        </span>
      </label>

      <p className="text-xs text-neutral-500 leading-relaxed">
        💡 透過PNG（背景なし）が最もきれいに表示されます。<br />
        💡 大きな画像は自動で縮小されます（保存容量を抑えるため）。
      </p>

      <ImageLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        pickerKind="logo"
        onPick={(img) => onChange(img.dataUrl)}
      />

      {cropPending && (
        <ImageCropModal
          imageDataUrl={cropPending.dataUrl}
          title="ロゴを切り取り（使う部分を選ぶ）"
          defaultPreset="square"
          onCancel={() => setCropPending(null)}
          onCrop={finishCrop}
        />
      )}
    </div>
  );
}
