"use client";

import { useEffect, useState } from "react";
import {
  bytesPretty,
  clearLibrary,
  deleteImage,
  getStorageInfo,
  IMAGE_LIBRARY_LIMIT,
  ImageKind,
  kindLabel,
  listImages,
  renameImage,
  SavedImage,
} from "../lib/imageLibrary";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Optional: when set, library acts as a picker for that kind */
  pickerKind?: ImageKind;
  onPick?: (image: SavedImage) => void;
};

export function ImageLibraryModal({ open, onClose, pickerKind, onPick }: Props) {
  const [images, setImages] = useState<SavedImage[]>([]);
  const [info, setInfo] = useState(getStorageInfo());
  const [filter, setFilter] = useState<ImageKind | "all">(pickerKind ?? "all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const refresh = () => {
    setImages(listImages());
    setInfo(getStorageInfo());
  };

  useEffect(() => {
    if (open) {
      refresh();
      setFilter(pickerKind ?? "all");
    }
  }, [open, pickerKind]);

  if (!open) return null;

  const visible = filter === "all" ? images : images.filter((i) => i.kind === filter);

  const handleDelete = (img: SavedImage) => {
    if (!confirm(`「${img.label}」を削除しますか？（元には戻せません）`)) return;
    deleteImage(img.id);
    refresh();
  };

  const handleClearAll = () => {
    if (!confirm(`画像ライブラリを全て削除しますか？（${images.length}件）`)) return;
    clearLibrary();
    refresh();
  };

  const handleRename = (img: SavedImage) => {
    if (!editLabel.trim()) {
      setEditingId(null);
      return;
    }
    renameImage(img.id, editLabel.trim());
    setEditingId(null);
    refresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-neutral-200">
          <div>
            <h2 className="text-xl font-bold tracking-tight">🖼 画像ライブラリ</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {pickerKind
                ? `${kindLabel(pickerKind)}画像を選んで使う`
                : "保存された画像の管理（最大20件・5MB）"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-3 border-b border-neutral-200 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(["all", "logo", "photo", "background"] as const).map((k) => {
              const count =
                k === "all" ? images.length : images.filter((i) => i.kind === k).length;
              const selected = filter === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilter(k)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    selected
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {k === "all" ? "すべて" : kindLabel(k as ImageKind)} ({count})
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-neutral-500">
            {info.count} / {info.limit} 件 ・ {bytesPretty(info.bytesUsed)} /{" "}
            {bytesPretty(info.bytesLimit)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {visible.length === 0 ? (
            <div className="text-sm text-neutral-500 text-center py-12 border-2 border-dashed border-neutral-200 rounded-xl">
              画像はまだ保存されていません。
              <br />
              <span className="text-xs">
                ロゴ・写真・背景のアップロード時に「ライブラリに保存」をONにすると、ここに保存されます。
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {visible.map((img) => (
                <div
                  key={img.id}
                  className="rounded-xl border border-neutral-200 overflow-hidden bg-white hover:shadow transition flex flex-col"
                >
                  <div className="aspect-square bg-neutral-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={img.dataUrl}
                      alt={img.label}
                      className={`w-full h-full ${img.kind === "background" ? "object-cover" : "object-contain"}`}
                    />
                  </div>
                  <div className="p-2 text-[11px]">
                    {editingId === img.id ? (
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onBlur={() => handleRename(img)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(img);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="w-full px-1 py-0.5 border border-blue-400 rounded text-[11px]"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(img.id);
                          setEditLabel(img.label);
                        }}
                        className="font-semibold truncate w-full text-left text-neutral-900 hover:text-blue-600"
                        title="クリックで名前変更"
                      >
                        {img.label}
                      </button>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-100">
                        {kindLabel(img.kind)}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-1">
                      {pickerKind && onPick && (
                        <button
                          type="button"
                          onClick={() => {
                            onPick(img);
                            onClose();
                          }}
                          className="flex-1 px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700"
                        >
                          使う
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(img)}
                        className="px-2 py-1 rounded border border-neutral-300 text-[10px] text-neutral-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-200 flex items-center justify-between gap-3">
          <p className="text-[10px] text-neutral-500 leading-relaxed">
            🔒 画像はあなたのMacのブラウザだけに保存されます。外部送信はしません。
          </p>
          {images.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-neutral-500 hover:text-red-600 px-2 py-1"
            >
              全削除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
