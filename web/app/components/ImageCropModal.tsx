"use client";

import { useEffect, useRef, useState } from "react";

type AspectPreset = {
  id: string;
  label: string;
  ratio: number | null; // null = free
  hint: string;
};

const PRESETS: AspectPreset[] = [
  { id: "free", label: "自由", ratio: null, hint: "好きな形で切り取り" },
  { id: "square", label: "1:1", ratio: 1, hint: "ロゴ・プロフィール写真に" },
  { id: "card", label: "名刺", ratio: 91 / 55, hint: "名刺の縦横比（背景画像に最適）" },
  { id: "wide", label: "16:9", ratio: 16 / 9, hint: "横長バナー" },
  { id: "tall", label: "3:4", ratio: 3 / 4, hint: "縦写真" },
];

type Rect = { x: number; y: number; w: number; h: number };

type Props = {
  imageDataUrl: string;
  /** Default aspect preset id. */
  defaultPreset?: string;
  /** Lock to a specific aspect (no preset chooser). */
  lockedRatio?: number;
  title?: string;
  onCancel: () => void;
  onCrop: (croppedDataUrl: string) => void;
};

export function ImageCropModal({
  imageDataUrl,
  defaultPreset = "square",
  lockedRatio,
  title = "画像を切り取り",
  onCancel,
  onCrop,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [imgDisplay, setImgDisplay] = useState({ w: 0, h: 0 });
  const [presetId, setPresetId] = useState(defaultPreset);
  const [crop, setCrop] = useState<Rect>({ x: 0, y: 0, w: 100, h: 100 });
  const [drag, setDrag] = useState<{
    type: "move" | "resize";
    handle?: "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    startCrop: Rect;
  } | null>(null);

  const activeRatio =
    lockedRatio ?? PRESETS.find((p) => p.id === presetId)?.ratio ?? null;

  // Initialize crop area to centered, fits aspect ratio
  useEffect(() => {
    if (imgDisplay.w === 0 || imgDisplay.h === 0) return;
    const margin = 0.1; // 10% margin
    let w: number;
    let h: number;
    if (activeRatio !== null) {
      // Fit aspect within image bounds
      const maxW = imgDisplay.w * (1 - margin);
      const maxH = imgDisplay.h * (1 - margin);
      if (maxW / activeRatio <= maxH) {
        w = maxW;
        h = maxW / activeRatio;
      } else {
        h = maxH;
        w = maxH * activeRatio;
      }
    } else {
      w = imgDisplay.w * (1 - margin);
      h = imgDisplay.h * (1 - margin);
    }
    setCrop({
      x: (imgDisplay.w - w) / 2,
      y: (imgDisplay.h - h) / 2,
      w,
      h,
    });
  }, [imgDisplay.w, imgDisplay.h, activeRatio]);

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setImgDisplay({ w: img.clientWidth, h: img.clientHeight });
  };

  // Drag/resize handlers
  const onPointerDown = (
    e: React.PointerEvent,
    type: "move" | "resize",
    handle?: "nw" | "ne" | "sw" | "se",
  ) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({
      type,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
    });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (drag.type === "move") {
      setCrop({
        ...drag.startCrop,
        x: clamp(drag.startCrop.x + dx, 0, imgDisplay.w - drag.startCrop.w),
        y: clamp(drag.startCrop.y + dy, 0, imgDisplay.h - drag.startCrop.h),
      });
    } else if (drag.type === "resize" && drag.handle) {
      const start = drag.startCrop;
      let nx = start.x;
      let ny = start.y;
      let nw = start.w;
      let nh = start.h;
      const min = 30;
      if (drag.handle === "se") {
        nw = clamp(start.w + dx, min, imgDisplay.w - start.x);
        nh = activeRatio !== null ? nw / activeRatio : clamp(start.h + dy, min, imgDisplay.h - start.y);
      } else if (drag.handle === "sw") {
        nw = clamp(start.w - dx, min, start.x + start.w);
        nx = start.x + start.w - nw;
        nh = activeRatio !== null ? nw / activeRatio : clamp(start.h + dy, min, imgDisplay.h - start.y);
      } else if (drag.handle === "ne") {
        nw = clamp(start.w + dx, min, imgDisplay.w - start.x);
        nh = activeRatio !== null ? nw / activeRatio : clamp(start.h - dy, min, start.y + start.h);
        ny = start.y + start.h - nh;
      } else if (drag.handle === "nw") {
        nw = clamp(start.w - dx, min, start.x + start.w);
        nx = start.x + start.w - nw;
        nh = activeRatio !== null ? nw / activeRatio : clamp(start.h - dy, min, start.y + start.h);
        ny = start.y + start.h - nh;
      }
      // Clamp to image bounds
      if (nx < 0) {
        nw += nx;
        nx = 0;
      }
      if (ny < 0) {
        nh += ny;
        ny = 0;
      }
      if (nx + nw > imgDisplay.w) nw = imgDisplay.w - nx;
      if (ny + nh > imgDisplay.h) nh = imgDisplay.h - ny;
      setCrop({ x: nx, y: ny, w: nw, h: nh });
    }
  };

  const onPointerUp = () => setDrag(null);

  const performCrop = async () => {
    if (!imgRef.current || imgNatural.w === 0) return;
    const scaleX = imgNatural.w / imgDisplay.w;
    const scaleY = imgNatural.h / imgDisplay.h;
    const sx = Math.round(crop.x * scaleX);
    const sy = Math.round(crop.y * scaleY);
    const sw = Math.round(crop.w * scaleX);
    const sh = Math.round(crop.h * scaleY);

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, sw, sh);
    const cropped = canvas.toDataURL("image/png");
    onCrop(cropped);
  };

  const useFull = () => {
    onCrop(imageDataUrl);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">✂️</span>
            <h2 className="text-base font-bold">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 flex items-center justify-center text-xl"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Aspect preset chooser */}
          {!lockedRatio && (
            <div>
              <div className="text-[10px] font-semibold text-neutral-500 tracking-[0.2em] uppercase mb-2">
                切り取りの形
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPresetId(p.id)}
                    className={`p-2 rounded-md border-2 text-center transition ${
                      presetId === p.id
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-blue-300"
                    }`}
                  >
                    <div className="text-[11px] font-bold">{p.label}</div>
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">
                {PRESETS.find((p) => p.id === presetId)?.hint}
              </div>
            </div>
          )}

          {/* Crop area */}
          <div className="bg-neutral-100 rounded-lg overflow-hidden">
            <div
              ref={containerRef}
              className="relative inline-block max-w-full max-h-[50vh] select-none"
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              style={{ touchAction: "none" }}
            >
              <img
                ref={imgRef}
                src={imageDataUrl}
                alt="クロップ対象"
                onLoad={onImgLoad}
                className="block max-w-full max-h-[50vh]"
                draggable={false}
              />

              {/* Dim overlay (4 segments around crop area) */}
              <div
                className="absolute pointer-events-none bg-black/50"
                style={{ left: 0, top: 0, right: 0, height: crop.y }}
              />
              <div
                className="absolute pointer-events-none bg-black/50"
                style={{
                  left: 0,
                  top: crop.y,
                  width: crop.x,
                  height: crop.h,
                }}
              />
              <div
                className="absolute pointer-events-none bg-black/50"
                style={{
                  left: crop.x + crop.w,
                  top: crop.y,
                  right: 0,
                  height: crop.h,
                }}
              />
              <div
                className="absolute pointer-events-none bg-black/50"
                style={{
                  left: 0,
                  top: crop.y + crop.h,
                  right: 0,
                  bottom: 0,
                }}
              />

              {/* Crop frame */}
              <div
                className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
                style={{
                  left: crop.x,
                  top: crop.y,
                  width: crop.w,
                  height: crop.h,
                  cursor: "move",
                }}
                onPointerDown={(e) => onPointerDown(e, "move")}
              >
                {/* Rule-of-thirds gridlines */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40" />
                  <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/40" />
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40" />
                  <div className="absolute top-2/3 left-0 right-0 h-px bg-white/40" />
                </div>

                {/* Corner handles */}
                {(["nw", "ne", "sw", "se"] as const).map((handle) => (
                  <div
                    key={handle}
                    onPointerDown={(e) => onPointerDown(e, "resize", handle)}
                    className="absolute w-4 h-4 bg-white border-2 border-blue-600 rounded-full"
                    style={{
                      left: handle.includes("w") ? -8 : "auto",
                      right: handle.includes("e") ? -8 : "auto",
                      top: handle.includes("n") ? -8 : "auto",
                      bottom: handle.includes("s") ? -8 : "auto",
                      cursor: handle === "nw" || handle === "se" ? "nwse-resize" : "nesw-resize",
                      touchAction: "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Info row */}
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <div>
              選択範囲：{Math.round(crop.w)} × {Math.round(crop.h)} px
              （元画像 {imgNatural.w}×{imgNatural.h}px）
            </div>
            <div>四隅をドラッグでサイズ変更／中央をドラッグで移動</div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200">
            <button
              type="button"
              onClick={useFull}
              className="text-xs px-3 py-2 rounded-md border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50"
            >
              切り取らずそのまま使う
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="text-sm px-4 py-2 rounded-md border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={performCrop}
                className="text-sm px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                ✂️ この範囲で切り取る
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
