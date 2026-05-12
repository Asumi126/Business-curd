"use client";

import { ChangeEvent, useRef, useState } from "react";
import { compressImage, dataUrlToBlob } from "../lib/imageCompress";
import { listImages, saveImage } from "../lib/imageLibrary";
import { CardData, PhotoLayout } from "../lib/types";
import { CardRenderer } from "./CardRenderer";
import { ImageCropModal } from "./ImageCropModal";
import { ImageLibraryModal } from "./ImageLibraryModal";

type Props = {
  value: string;
  position: PhotoLayout;
  onChange: (dataUrl: string) => void;
  onPositionChange: (p: PhotoLayout) => void;
  /** Optional live preview rendered next to the position picker. */
  data?: CardData;
  templateId?: string;
  /** Optional template setter so the user can switch design directly here. */
  setTemplateId?: (id: string) => void;
  /** Optional updater for the photo-frame customization object. */
  updateData?: (patch: Partial<CardData>) => void;
};

type LayoutOption = {
  id: PhotoLayout;
  label: string;
  description: string;
  preview: React.ReactNode;
  category: "bleed" | "circle" | "small" | "diagonal";
};

function MiniPreview({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full bg-neutral-100 rounded overflow-hidden border border-neutral-200" style={{ aspectRatio: "91 / 55" }}>
      {children}
    </div>
  );
}

const OPTIONS: LayoutOption[] = [
  {
    id: "bleed-left-half",
    label: "左半分（ハーフ）",
    description: "左半分が画像、右半分に情報",
    category: "bleed",
    preview: (
      <MiniPreview>
        <div className="absolute inset-y-0 left-0 w-1/2 bg-neutral-400" />
        <div className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-center text-[6px] text-neutral-500">情報</div>
      </MiniPreview>
    ),
  },
  {
    id: "bleed-right-half",
    label: "右半分（ハーフ）",
    description: "右半分が画像、左半分に情報",
    category: "bleed",
    preview: (
      <MiniPreview>
        <div className="absolute inset-y-0 right-0 w-1/2 bg-neutral-400" />
        <div className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-center text-[6px] text-neutral-500">情報</div>
      </MiniPreview>
    ),
  },
  {
    id: "bleed-left-third",
    label: "左1/3",
    description: "左1/3が画像、右2/3に情報",
    category: "bleed",
    preview: (
      <MiniPreview>
        <div className="absolute inset-y-0 left-0 w-1/3 bg-neutral-400" />
        <div className="absolute inset-y-0 right-0 w-2/3 flex items-center justify-center text-[6px] text-neutral-500">情報</div>
      </MiniPreview>
    ),
  },
  {
    id: "bleed-right-third",
    label: "右1/3",
    description: "右1/3が画像、左2/3に情報",
    category: "bleed",
    preview: (
      <MiniPreview>
        <div className="absolute inset-y-0 right-0 w-1/3 bg-neutral-400" />
        <div className="absolute inset-y-0 left-0 w-2/3 flex items-center justify-center text-[6px] text-neutral-500">情報</div>
      </MiniPreview>
    ),
  },
  {
    id: "bleed-top-half",
    label: "上半分",
    description: "上半分が画像、下半分に情報",
    category: "bleed",
    preview: (
      <MiniPreview>
        <div className="absolute inset-x-0 top-0 h-1/2 bg-neutral-400" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 flex items-center justify-center text-[6px] text-neutral-500">情報</div>
      </MiniPreview>
    ),
  },
  {
    id: "bleed-top-third",
    label: "上1/3",
    description: "上1/3が画像、下2/3に情報",
    category: "bleed",
    preview: (
      <MiniPreview>
        <div className="absolute inset-x-0 top-0 h-1/3 bg-neutral-400" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 flex items-center justify-center text-[6px] text-neutral-500">情報</div>
      </MiniPreview>
    ),
  },
  {
    id: "circle-tr-md",
    label: "右上に大きい円",
    description: "右上に直径22mmの円形画像",
    category: "circle",
    preview: (
      <MiniPreview>
        <div className="absolute top-1 right-1 w-7 h-7 rounded-full bg-neutral-400" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 flex items-center px-2 text-[6px] text-neutral-500">情報</div>
      </MiniPreview>
    ),
  },
  {
    id: "circle-tl-md",
    label: "左上に大きい円",
    description: "左上に直径22mmの円形画像",
    category: "circle",
    preview: (
      <MiniPreview>
        <div className="absolute top-1 left-1 w-7 h-7 rounded-full bg-neutral-400" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 flex items-center px-2 text-[6px] text-neutral-500">情報</div>
      </MiniPreview>
    ),
  },
  {
    id: "circle-tr-sm",
    label: "右上に小さい円",
    description: "右上に直径14mmの円形画像",
    category: "circle",
    preview: (
      <MiniPreview>
        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-neutral-400" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 flex items-center px-2 text-[6px] text-neutral-500">情報</div>
      </MiniPreview>
    ),
  },
  {
    id: "circle-tl-sm",
    label: "左上に小さい円",
    description: "左上に直径14mmの円形画像",
    category: "circle",
    preview: (
      <MiniPreview>
        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-neutral-400" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 flex items-center px-2 text-[6px] text-neutral-500">情報</div>
      </MiniPreview>
    ),
  },
  {
    id: "circle-center",
    label: "中央の大きい円",
    description: "中央に直径22mmの円＋下に情報",
    category: "circle",
    preview: (
      <MiniPreview>
        <div className="absolute left-1/2 top-1 -translate-x-1/2 w-7 h-7 rounded-full bg-neutral-400" />
        <div className="absolute inset-x-0 bottom-0 h-2/5 flex items-center justify-center text-[6px] text-neutral-500">情報</div>
      </MiniPreview>
    ),
  },
  {
    id: "rect-tr-sm",
    label: "右上に角丸",
    description: "右上に小さな角丸画像",
    category: "small",
    preview: (
      <MiniPreview>
        <div className="absolute top-1 right-1 w-5 h-5 rounded bg-neutral-400" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 flex items-center px-2 text-[6px] text-neutral-500">情報</div>
      </MiniPreview>
    ),
  },
  {
    id: "rect-tl-sm",
    label: "左上に角丸",
    description: "左上に小さな角丸画像",
    category: "small",
    preview: (
      <MiniPreview>
        <div className="absolute top-1 left-1 w-5 h-5 rounded bg-neutral-400" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 flex items-center px-2 text-[6px] text-neutral-500">情報</div>
      </MiniPreview>
    ),
  },
  {
    id: "diagonal-left",
    label: "斜め分割（左）",
    description: "左側を斜めにカットして画像",
    category: "diagonal",
    preview: (
      <MiniPreview>
        <div
          className="absolute inset-0 bg-neutral-400"
          style={{ clipPath: "polygon(0 0, 60% 0, 40% 100%, 0 100%)" }}
        />
        <div className="absolute right-1 inset-y-0 w-2/5 flex items-center text-[6px] text-neutral-500">情報</div>
      </MiniPreview>
    ),
  },
  {
    id: "diagonal-right",
    label: "斜め分割（右）",
    description: "右側を斜めにカットして画像",
    category: "diagonal",
    preview: (
      <MiniPreview>
        <div
          className="absolute inset-0 bg-neutral-400"
          style={{ clipPath: "polygon(40% 0, 100% 0, 100% 100%, 60% 100%)" }}
        />
        <div className="absolute left-1 inset-y-0 w-2/5 flex items-center text-[6px] text-neutral-500">情報</div>
      </MiniPreview>
    ),
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  bleed: "フルブリード（端まで画像）",
  circle: "円形",
  small: "小さく挿入",
  diagonal: "斜め分割",
};

// Templates that work well with profile photos. Listed here so the user
// can pick one inline on the photo upload step (no need to leave to Step 6
// to switch). The first one is the most flexible (15 layout options).
const PHOTO_TEMPLATES: { id: string; name: string; emoji: string; hint: string }[] = [
  { id: "photo-card", name: "写真・自由配置", emoji: "🎚", hint: "15配置から選ぶ柔軟タイプ（下で位置選択）" },
  { id: "photo-editorial", name: "エディトリアル", emoji: "📰", hint: "雑誌風セリフ書体＋左40%写真" },
  { id: "photo-noir", name: "ノワール", emoji: "🎬", hint: "全面写真＋黒オーバーレイ（劇的）" },
  { id: "photo-fresh", name: "フレッシュ", emoji: "🌿", hint: "明るく爽やか" },
  { id: "photo-frame", name: "フレーム", emoji: "🖼", hint: "額縁風ボーダーつき" },
  { id: "photo-hero", name: "ヒーロー", emoji: "🦸", hint: "上部に大きな写真でヒーロー風" },
  { id: "vertical-photo-top", name: "縦型・上写真", emoji: "📱", hint: "縦型・上半分が写真" },
  { id: "vertical-photo-circle", name: "縦型・円形写真", emoji: "⭕", hint: "縦型・円形に切り抜き" },
  { id: "vertical-photo-full", name: "縦型・全面", emoji: "📲", hint: "縦型・全面写真" },
];

export function PhotoUploader({
  value,
  position,
  onChange,
  onPositionChange,
  data,
  templateId,
  setTemplateId,
  updateData,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [cropPending, setCropPending] = useState<{ dataUrl: string; fileName: string } | null>(null);
  const libraryCount = listImages("photo").length;

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
    // Read raw image first; crop modal then handles selection.
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setCropPending({
        dataUrl: reader.result,
        fileName: file.name.replace(/\.[^.]+$/, ""),
      });
    };
    reader.readAsDataURL(file);
    // Reset the input so re-selecting the same file fires onChange again
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
      const dataUrl = await compressImage(file, { maxSize: 1200, preferTransparent: false });
      onChange(dataUrl);
      if (position === "none") onPositionChange("bleed-left-third");
      if (saveToLibrary) {
        saveImage({ kind: "photo", dataUrl, label: fileName || "写真" });
      }
    } catch {
      alert("画像の処理に失敗しました。");
    } finally {
      setWorking(false);
    }
  };

  const groupedOptions = (Object.keys(CATEGORY_LABELS) as ("bleed" | "circle" | "small" | "diagonal")[]).map((cat) => ({
    cat,
    label: CATEGORY_LABELS[cat],
    items: OPTIONS.filter((o) => o.category === cat),
  }));

  return (
    <div className="rounded-xl border-2 border-violet-200 bg-violet-50/30 p-4 space-y-3">
      <div>
        <div className="text-sm font-bold text-neutral-900">🖼 画像をアップロード（顔写真・装飾・素材なんでもOK）</div>
        <div className="text-[11px] text-neutral-600 mt-0.5">
          顔写真でも、ロゴ画像でも、装飾素材でも自由にアップロード。配置とサイズも15種から選べます。
          <br />
          画像を入れたら「👤 顔写真入り」テンプレートを選択してください。
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-lg border-2 border-dashed border-neutral-300 flex items-center justify-center bg-white overflow-hidden shrink-0">
          {value ? (
            <img src={value} alt="photo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-neutral-400 text-[10px] text-center px-2">画像未設定</span>
          )}
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <button
            type="button"
            disabled={working}
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 rounded-md bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 active:scale-95 transition disabled:opacity-60 self-start"
          >
            {working ? "処理中..." : value ? "画像を変更" : "画像をアップロード"}
          </button>
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            disabled={libraryCount === 0}
            className="px-4 py-2 rounded-md border border-violet-300 text-violet-700 bg-violet-50/40 text-sm hover:bg-violet-100 self-start disabled:opacity-60 disabled:cursor-not-allowed"
            title={libraryCount === 0 ? "保存済みの画像はまだありません" : `ライブラリから選択（${libraryCount}件）`}
          >
            📂 ライブラリから選ぶ {libraryCount > 0 ? `(${libraryCount}件)` : "（まだ保存なし）"}
          </button>
          {value && (
            <>
              <button
                type="button"
                onClick={() =>
                  setCropPending({ dataUrl: value, fileName: "photo" })
                }
                className="px-4 py-2 rounded-md border border-violet-300 text-sm text-violet-700 bg-white hover:bg-violet-50 self-start"
                title="アップロード済みの画像を再度切り取り"
              >
                ✂ 切り取り範囲を変更
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="px-4 py-2 rounded-md border border-neutral-300 text-sm text-neutral-700 hover:bg-neutral-100 self-start"
              >
                画像を削除
              </button>
            </>
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
        <div className="rounded-xl border-2 border-violet-300 bg-white p-3 space-y-3">
          <div>
            <div className="text-[10px] font-semibold text-violet-600 tracking-[0.25em] uppercase mb-2">
              🪄 配置プレビュー（リアルタイム）
            </div>
            <div className="bg-neutral-100 rounded-lg p-3 flex items-center justify-center">
              <CardRenderer data={data} templateId={templateId} />
            </div>
          </div>

          {/* Photo frame customization — only meaningful for circle/rect
              insets (not for full-bleed layouts). */}
          {updateData && data && templateId === "photo-card" && (
            position.startsWith("circle-") || position.startsWith("rect-")
          ) && (
            <div className="rounded-lg bg-violet-50/50 border border-violet-200 p-3 space-y-2.5">
              <div className="text-[10px] font-semibold text-violet-700 tracking-[0.25em] uppercase">
                🎨 写真フレームのカスタム
              </div>

              {/* size scale */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-600 font-mono w-16">サイズ</span>
                <input
                  type="range"
                  min={0.6}
                  max={1.6}
                  step={0.05}
                  value={data.customization.photoFrame?.sizeScale ?? 1}
                  onChange={(e) =>
                    updateData({
                      customization: {
                        ...data.customization,
                        photoFrame: {
                          ...(data.customization.photoFrame ?? {}),
                          sizeScale: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  className="flex-1"
                />
                <span className="text-[10px] text-neutral-700 font-mono w-12 text-right">
                  {Math.round((data.customization.photoFrame?.sizeScale ?? 1) * 100)}%
                </span>
              </div>

              {/* border width */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-600 font-mono w-16">枠の太さ</span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={data.customization.photoFrame?.borderWidthMm ?? 0.5}
                  onChange={(e) =>
                    updateData({
                      customization: {
                        ...data.customization,
                        photoFrame: {
                          ...(data.customization.photoFrame ?? {}),
                          borderWidthMm: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  className="flex-1"
                />
                <span className="text-[10px] text-neutral-700 font-mono w-12 text-right">
                  {(data.customization.photoFrame?.borderWidthMm ?? 0.5).toFixed(1)}mm
                </span>
              </div>

              {/* border color */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-600 font-mono w-16">枠の色</span>
                <label
                  className="relative w-8 h-8 rounded border border-neutral-300 cursor-pointer overflow-hidden shrink-0"
                  style={{
                    backgroundColor:
                      data.customization.photoFrame?.borderColor &&
                      !data.customization.photoFrame.borderColor.startsWith("var")
                        ? data.customization.photoFrame.borderColor
                        : "#171717",
                  }}
                >
                  <input
                    type="color"
                    value={
                      data.customization.photoFrame?.borderColor &&
                      !data.customization.photoFrame.borderColor.startsWith("var")
                        ? data.customization.photoFrame.borderColor
                        : "#171717"
                    }
                    onChange={(e) =>
                      updateData({
                        customization: {
                          ...data.customization,
                          photoFrame: {
                            ...(data.customization.photoFrame ?? {}),
                            borderColor: e.target.value,
                          },
                        },
                      })
                    }
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
                <span className="text-[10px] text-neutral-500 flex-1">
                  クリックで色を選択
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateData({
                      customization: {
                        ...data.customization,
                        photoFrame: {
                          ...(data.customization.photoFrame ?? {}),
                          borderColor: undefined,
                        },
                      },
                    })
                  }
                  className="text-[9px] text-neutral-500 hover:text-neutral-900 px-1"
                  title="アクセント色（テンプレ標準）に戻す"
                >
                  ↩
                </button>
              </div>

              {/* background */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!data.customization.photoFrame?.bgEnabled}
                  onChange={(e) =>
                    updateData({
                      customization: {
                        ...data.customization,
                        photoFrame: {
                          ...(data.customization.photoFrame ?? {}),
                          bgEnabled: e.target.checked,
                        },
                      },
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-[11px] text-neutral-800">
                  写真の周りに白背景パディングをつける
                </span>
              </label>

              {data.customization.photoFrame?.bgEnabled && (
                <div className="flex items-center gap-2 ml-6">
                  <span className="text-[10px] text-neutral-600 font-mono w-12">背景色</span>
                  <label
                    className="relative w-8 h-8 rounded border border-neutral-300 cursor-pointer overflow-hidden shrink-0"
                    style={{ backgroundColor: data.customization.photoFrame?.bgColor ?? "#ffffff" }}
                  >
                    <input
                      type="color"
                      value={data.customization.photoFrame?.bgColor ?? "#ffffff"}
                      onChange={(e) =>
                        updateData({
                          customization: {
                            ...data.customization,
                            photoFrame: {
                              ...(data.customization.photoFrame ?? {}),
                              bgColor: e.target.value,
                            },
                          },
                        })
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
              )}

              {(data.customization.photoFrame?.sizeScale !== undefined ||
                data.customization.photoFrame?.borderWidthMm !== undefined ||
                data.customization.photoFrame?.bgEnabled) && (
                <button
                  type="button"
                  onClick={() =>
                    updateData({
                      customization: {
                        ...data.customization,
                        photoFrame: {},
                      },
                    })
                  }
                  className="text-[10px] text-neutral-500 hover:text-neutral-900 underline"
                >
                  ↩ フレーム設定を全リセット
                </button>
              )}
            </div>
          )}

          {/* Inline design switcher — lets users pick a photo-friendly
              template right here instead of going back to step 6. */}
          {setTemplateId && (
            <div>
              <div className="text-[10px] font-semibold text-violet-600 tracking-[0.25em] uppercase mb-1.5">
                画像挿入用デザイン（{PHOTO_TEMPLATES.length}種類）
              </div>
              <div className="text-[10px] text-neutral-500 mb-2">
                クリックすると上のプレビューと、配置オプションがそのテンプレに合わせて切り替わります。
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {PHOTO_TEMPLATES.map((p) => {
                  const sel = templateId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTemplateId(p.id)}
                      className={`p-2 rounded-md border text-left transition ${
                        sel
                          ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                          : "bg-white text-neutral-800 border-neutral-200 hover:border-violet-400"
                      }`}
                      title={p.hint}
                    >
                      <div className="text-base mb-0.5">{p.emoji}</div>
                      <div className="text-[11px] font-bold leading-tight">{p.name}</div>
                      <div
                        className={`text-[9px] leading-tight mt-0.5 ${
                          sel ? "text-violet-100" : "text-neutral-500"
                        }`}
                      >
                        {p.hint}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Layout/size picker is only meaningful for the "photo-card" template
          (the flexible 15-position one). Other photo templates have a fixed
          built-in photo placement. */}
      {value && templateId === "photo-card" && (
        <div className="space-y-3">
          <div>
            <div className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
              画像の配置とサイズを選ぶ（{OPTIONS.length}種類）
            </div>
            <div className="text-[10px] text-neutral-500 mb-2">
              「写真・自由配置」テンプレート専用の細かい配置オプションです。
            </div>
            <button
              type="button"
              onClick={() => onPositionChange("none")}
              className={`mb-2 px-3 py-1 text-[10px] rounded-full border ${
                position === "none"
                  ? "bg-neutral-800 text-white border-neutral-800"
                  : "bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400"
              }`}
            >
              使わない
            </button>
          </div>

          {groupedOptions.map(({ cat, label, items }) => (
            <div key={cat}>
              <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                {label}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map((opt) => {
                  const selected = position === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onPositionChange(opt.id)}
                      className={`flex flex-col gap-1.5 p-2 rounded-lg border-2 transition text-left ${
                        selected
                          ? "border-violet-600 bg-white shadow-sm"
                          : "border-neutral-200 bg-white hover:border-neutral-400"
                      }`}
                    >
                      {opt.preview}
                      <div className="text-[10px] font-semibold text-neutral-900 leading-tight">
                        {opt.label}
                      </div>
                      <div className="text-[9px] text-neutral-500 leading-tight">
                        {opt.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="flex items-start gap-2 text-xs cursor-pointer p-2 rounded-md bg-violet-50/40 border border-violet-100">
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

      <div className="text-[10px] text-neutral-500 leading-relaxed">
        💡 文字とかぶらないよう、画像なしの領域に情報が配置されます。透過PNGなら背景と馴染みやすく、写真なら黒い背景＋白文字が映えます。
      </div>

      <ImageLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        pickerKind="photo"
        onPick={(img) => onChange(img.dataUrl)}
      />

      {cropPending && (
        <ImageCropModal
          imageDataUrl={cropPending.dataUrl}
          title="写真を切り取り（使う部分を選ぶ）"
          defaultPreset="square"
          onCancel={() => setCropPending(null)}
          onCrop={finishCrop}
        />
      )}
    </div>
  );
}
