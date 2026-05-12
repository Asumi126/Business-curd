"use client";

import { useEffect, useState } from "react";
import {
  CUSTOM_BG_LIMIT,
  CustomBgTemplate,
  bytesPretty,
  deleteCustomBgTemplate,
  listCustomBgTemplates,
  renameCustomBgTemplate,
  saveCustomBgTemplate,
  templateToDataUrl,
} from "../lib/customBgTemplates";

/**
 * カスタム背景テンプレライブラリ (#192) — IndexedDB に圧縮保存した
 * オリジナル背景画像を一覧表示し、選択/登録/削除/リネームできるパネル。
 *
 * 使い方: customBackground UI の近くに置き、`currentDataUrl` を渡せば
 * 「現在の画像をテンプレ登録」ボタンが押せる。`onPick` で選択された
 * テンプレの DataURL を呼び出し側に流す。
 */
export function CustomBgTemplateLibrary({
  currentDataUrl,
  onPick,
}: {
  currentDataUrl?: string;
  onPick: (dataUrl: string) => void;
}) {
  const [templates, setTemplates] = useState<CustomBgTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setTemplates(await listCustomBgTemplates());
    } catch {
      setTemplates([]);
    }
  };

  useEffect(() => {
    if (open) {
      refresh();
    }
  }, [open]);

  const showMsg = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSave = async () => {
    if (!currentDataUrl) {
      showMsg("先に背景画像をアップロードしてください");
      return;
    }
    const name = window.prompt(
      "このカスタム背景をテンプレとして登録します。\n名前を入力してください (空欄なら自動命名):",
      "",
    );
    if (name === null) return; // ユーザーがキャンセル
    setBusy(true);
    const result = await saveCustomBgTemplate({
      name: name ?? "",
      dataUrl: currentDataUrl,
    });
    setBusy(false);
    if (result.ok) {
      showMsg(`✓ 「${result.template.name}」をテンプレとして登録しました`);
      await refresh();
    } else {
      showMsg(`✗ ${result.message}`);
    }
  };

  const handleDelete = async (t: CustomBgTemplate) => {
    if (!window.confirm(`「${t.name}」を削除しますか？`)) return;
    await deleteCustomBgTemplate(t.id);
    await refresh();
    showMsg(`✓ 削除しました`);
  };

  const handleRename = async (t: CustomBgTemplate) => {
    const next = window.prompt("新しい名前を入力してください:", t.name);
    if (!next || next.trim() === t.name) return;
    await renameCustomBgTemplate(t.id, next);
    await refresh();
  };

  const handlePick = async (t: CustomBgTemplate) => {
    setBusy(true);
    try {
      const dataUrl = await templateToDataUrl(t);
      onPick(dataUrl);
      showMsg(`✓ 「${t.name}」を読み込みました`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50/30 p-3 space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="flex items-center gap-1.5">
          <span className="text-base">📚</span>
          <span className="text-[12px] font-bold text-neutral-900">
            カスタム背景 テンプレライブラリ
          </span>
          <span className="text-[10px] text-neutral-500">
            ({templates.length} / {CUSTOM_BG_LIMIT}件)
          </span>
        </span>
        <span className={`transition-transform text-[11px] ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>
      <div className="text-[10px] text-neutral-600 leading-snug">
        オリジナル背景画像をブラウザに保存。最大 {CUSTOM_BG_LIMIT} 件まで無料で繰り返し使えます。
      </div>

      {open && (
        <div className="space-y-2">
          {/* 保存ボタン */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!currentDataUrl || busy}
              className="flex-1 px-2.5 py-1.5 rounded-md bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 disabled:bg-neutral-300 disabled:cursor-not-allowed"
              title={currentDataUrl ? "現在の背景画像をテンプレとして登録" : "先に画像をアップロードしてください"}
            >
              💾 現在の画像をテンプレ登録
            </button>
            <button
              type="button"
              onClick={refresh}
              className="px-2 py-1.5 rounded-md border border-neutral-300 bg-white text-[10px] text-neutral-700 hover:border-rose-400"
              title="一覧を再読み込み"
            >
              ↻
            </button>
          </div>

          {feedback && (
            <div className="text-[11px] text-rose-700 bg-white border border-rose-300 rounded px-2 py-1">
              {feedback}
            </div>
          )}

          {/* 一覧 */}
          {templates.length === 0 ? (
            <div className="rounded border-2 border-dashed border-neutral-200 p-3 text-[11px] text-neutral-500 text-center">
              登録されたテンプレはありません
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="rounded border border-neutral-200 bg-white p-1.5 space-y-1 text-[10px]"
                >
                  <button
                    type="button"
                    onClick={() => handlePick(t)}
                    disabled={busy}
                    className="w-full block"
                    title="クリックでこのテンプレを読み込み"
                  >
                    <img
                      src={t.thumbDataUrl}
                      alt={t.name}
                      className="w-full aspect-[91/55] object-cover rounded border border-neutral-200"
                    />
                  </button>
                  <div className="font-semibold text-neutral-800 truncate" title={t.name}>
                    {t.name}
                  </div>
                  <div className="text-[9px] text-neutral-500">{bytesPretty(t.size)}</div>
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleRename(t)}
                      className="flex-1 text-[9px] px-1 py-0.5 rounded border border-neutral-200 hover:border-blue-400 text-neutral-600"
                    >
                      ✎ 名前
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t)}
                      className="flex-1 text-[9px] px-1 py-0.5 rounded border border-neutral-200 hover:border-red-400 text-neutral-600 hover:text-red-600"
                    >
                      ✕ 削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
