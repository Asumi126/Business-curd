"use client";

import { useEffect, useState } from "react";
import {
  bytesPretty,
  downloadBackupFile,
  estimateBackupSize,
  importBackupFromFile,
  type ImportResult,
} from "../lib/backup";

/**
 * データバックアップモーダル — 全データのJSONエクスポート/インポート画面。
 *
 * UI設計:
 *  - 「バックアップを保存」= 全データをJSONファイルとしてダウンロード
 *  - 「バックアップから復元」= JSONファイルを選んで読み込み (既存データを上書き)
 *  - 復元前に確認ダイアログ
 *  - 復元成功後にページ再読み込みを促す
 *
 * 初心者でも安心して使えるよう、各操作の前後で説明文を必ず表示。
 */
export function BackupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const [size, setSize] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      // モーダルを開いた時点でバックアップサイズを推定 (画像含む)
      estimateBackupSize().then(setSize).catch(() => setSize(null));
      setFeedback(null);
      setImportResult(null);
      setPendingFile(null);
    }
  }, [open]);

  const handleExport = async () => {
    setBusy("export");
    setFeedback(null);
    try {
      await downloadBackupFile();
      setFeedback("✓ バックアップファイルをダウンロードしました。安全な場所(クラウドストレージ等)に保管してください。");
    } catch (e) {
      setFeedback(`✗ エクスポート失敗: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusy(null);
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingFile) return;
    setBusy("import");
    setFeedback(null);
    try {
      const result = await importBackupFromFile(pendingFile);
      setImportResult(result);
      if (result.ok) {
        setFeedback(`✓ ${result.message}`);
      } else {
        setFeedback(`✗ ${result.message}`);
      }
    } catch (e) {
      setFeedback(`✗ 復元失敗: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusy(null);
      setPendingFile(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-3 flex items-center justify-between z-10">
          <div>
            <div className="text-base font-bold text-neutral-900">💾 データのバックアップと復元</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              名刺帳・連絡帳・テンプレ・編集中データを1ファイルで保存/復元
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 説明 */}
          <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-[12px] text-blue-900 leading-relaxed">
            <strong>📌 なぜバックアップが必要？</strong>
            <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[11px]">
              <li>このアプリのデータはあなたの<strong>ブラウザ内</strong>にだけ保存されています</li>
              <li>ブラウザの履歴削除・PC買い替え・OS再インストールで消えるリスクがあります</li>
              <li>バックアップファイル1つあれば、別のブラウザ・別のPCでも同じデータを復元できます</li>
            </ul>
          </div>

          {/* 保存セクション */}
          <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📥</span>
              <div className="text-sm font-bold text-neutral-900">バックアップを保存する</div>
            </div>
            <div className="text-[11px] text-neutral-700 mb-2 leading-relaxed">
              すべてのデータを1つのJSONファイルとしてダウンロードします。<br />
              ファイルは安全な場所（Googleドライブ・iCloud Drive・USBメモリなど）に保管してください。
            </div>
            {size != null && (
              <div className="text-[10px] text-neutral-600 mb-2">
                推定サイズ: <strong>{bytesPretty(size)}</strong>
              </div>
            )}
            <button
              type="button"
              onClick={handleExport}
              disabled={!!busy}
              className="w-full px-4 py-2.5 rounded-md bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:bg-neutral-300"
            >
              {busy === "export" ? "保存中…" : "💾 バックアップファイルをダウンロード"}
            </button>
          </div>

          {/* 復元セクション */}
          <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📤</span>
              <div className="text-sm font-bold text-neutral-900">バックアップから復元する</div>
            </div>
            <div className="text-[11px] text-neutral-700 mb-2 leading-relaxed">
              以前ダウンロードしたバックアップファイルから復元します。
              <strong className="text-red-700">⚠️ 現在のデータは上書きされます。</strong>
              復元前に念のため今の状態もバックアップしておくと安心です。
            </div>

            {!pendingFile ? (
              <>
                <input
                  type="file"
                  id="backup-import-file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPendingFile(f);
                    if (e.target) e.target.value = "";
                  }}
                />
                <label
                  htmlFor="backup-import-file"
                  className="block w-full text-center px-4 py-2.5 rounded-md border-2 border-dashed border-amber-400 bg-white hover:bg-amber-50 text-sm font-bold text-amber-800 cursor-pointer"
                >
                  📂 バックアップファイルを選ぶ
                </label>
              </>
            ) : (
              <div className="space-y-2">
                <div className="rounded bg-white border border-amber-300 p-2 text-[11px]">
                  選択中: <strong>{pendingFile.name}</strong> ({bytesPretty(pendingFile.size)})
                </div>
                <div className="rounded bg-red-50 border border-red-300 p-2 text-[11px] text-red-800">
                  ⚠️ 本当にこのファイルから復元しますか？
                  <br />
                  現在のすべてのデータ（名刺帳・テンプレ・編集中の作業）は上書きされて消えます。
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingFile(null)}
                    disabled={!!busy}
                    className="flex-1 px-3 py-2 rounded-md border border-neutral-300 text-[11px] hover:bg-neutral-50"
                  >
                    やめる
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={!!busy}
                    className="flex-1 px-3 py-2 rounded-md bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 disabled:bg-neutral-300"
                  >
                    {busy === "import" ? "復元中…" : "📤 上書きして復元する"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* フィードバック */}
          {feedback && (
            <div
              className={`rounded-md border px-3 py-2 text-[11px] leading-relaxed ${
                feedback.startsWith("✓")
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-red-300 bg-red-50 text-red-900"
              }`}
            >
              {feedback}
              {importResult?.ok && importResult.stats && (
                <ul className="mt-1 pl-4 list-disc space-y-0.5">
                  <li>localStorage 項目: {importResult.stats.localStorageKeys}件</li>
                  <li>名簿: {importResult.stats.nametagPeople}名</li>
                  <li>過去作成データ: {importResult.stats.nametagSnapshots}件</li>
                  <li>カスタム背景テンプレ: {importResult.stats.customBgTemplates}件</li>
                </ul>
              )}
              {importResult?.ok && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-2 px-3 py-1.5 rounded-md bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700"
                >
                  ↻ ページを再読み込みして反映
                </button>
              )}
            </div>
          )}

          {/* Tipsエリア */}
          <details className="rounded-md border border-neutral-200 bg-neutral-50/40 p-2 text-[11px]">
            <summary className="cursor-pointer font-semibold text-neutral-700">
              💡 安心して使うためのコツ
            </summary>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-neutral-700">
              <li>名刺帳に新しいデザインを追加したタイミングで、こまめにバックアップを取りましょう</li>
              <li>バックアップファイルはクラウド（Googleドライブ・iCloud等）に置くと PCが壊れても安心</li>
              <li>ファイルサイズが大きい場合（数MB〜十数MB）はカスタム背景テンプレの画像が原因です。圧縮されたJPEGなので開封不要</li>
              <li>同じバックアップは別のブラウザ・別のPCでも復元できます（データ移行に使えます）</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
