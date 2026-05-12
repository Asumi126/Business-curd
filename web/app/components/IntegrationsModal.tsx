"use client";

/**
 * Integrations Settings Modal — 連携シート集中管理画面
 *
 * すべてのアプリ（名札・名刺・ショップカード）から呼び出せる共通設定。
 * Googleスプレッドシート / 公開CSV のURLを登録すると、各アプリで
 * ワンクリック取込ができるようになります。
 *
 * 重要なUX原則：
 *  - 設定は1度だけ。同じシートを何度もコピペする必要なし
 *  - 用途別タブ（名札用 / 名刺用 / ショップ用）で混乱を防ぐ
 *  - 「同期テスト」ボタンで取込前にURLが正しいか確認できる
 */

import { useEffect, useState } from "react";
import {
  addIntegration,
  deleteIntegration,
  fetchSheetRows,
  type Integration,
  INTEGRATION_KIND_LABELS,
  INTEGRATION_LIMIT,
  type IntegrationKind,
  listIntegrations,
  updateIntegration,
} from "../lib/integrations";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultKind?: IntegrationKind;
};

export function IntegrationsModal({ open, onClose, defaultKind = "nametag" }: Props) {
  const [list, setList] = useState<Integration[]>([]);
  const [activeKind, setActiveKind] = useState<IntegrationKind>(defaultKind);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [draft, setDraft] = useState<{ label: string; url: string; autoSync: boolean }>({
    label: "",
    url: "",
    autoSync: true,
  });
  const [testing, setTesting] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);

  const refresh = () => setList(listIntegrations());

  useEffect(() => {
    if (open) {
      refresh();
      setActiveKind(defaultKind);
      setEditing(null);
      setShowAddForm(false);
      setDraft({ label: "", url: "", autoSync: true });
      setTestMsg("");
    }
  }, [open, defaultKind]);

  if (!open) return null;

  const filtered = list.filter((i) => i.kind === activeKind);

  const handleAdd = () => {
    if (!draft.label.trim()) {
      alert("シート名を入力してください");
      return;
    }
    if (!draft.url.trim()) {
      alert("シートのURLを入力してください");
      return;
    }
    try {
      addIntegration({
        label: draft.label.trim(),
        url: draft.url.trim(),
        kind: activeKind,
        autoSync: draft.autoSync,
      });
      refresh();
      setShowAddForm(false);
      setDraft({ label: "", url: "", autoSync: true });
    } catch (e) {
      alert(e instanceof Error ? e.message : "登録に失敗しました");
    }
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    if (!editing.label.trim() || !editing.url.trim()) {
      alert("シート名とURLは必須です");
      return;
    }
    updateIntegration(editing.id, {
      label: editing.label.trim(),
      url: editing.url.trim(),
      autoSync: editing.autoSync,
    });
    refresh();
    setEditing(null);
  };

  const handleTest = async (item: Integration) => {
    setTesting(item.id);
    setTestMsg("");
    const result = await fetchSheetRows(item.url);
    setTesting(null);
    if (result.ok && result.rows) {
      setTestMsg(`✅ ${item.label}: ${result.rows.length}件取得成功${result.hasHeader ? "（ヘッダー行検出）" : ""}`);
    } else {
      setTestMsg(`❌ ${item.label}: ${result.error}`);
    }
  };

  const handleDelete = (item: Integration) => {
    if (!confirm(`「${item.label}」の連携を削除しますか？\n（シート自体は削除されません。アプリ側で同期しなくなるだけです）`)) return;
    deleteIntegration(item.id);
    refresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div>
            <div className="text-base font-bold text-neutral-900 flex items-center gap-2">
              ⚙️ 連携設定
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                NEW
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Googleスプレッドシート・Excelシートを登録すると、すべてのアプリで取込できます。
              データはサーバに送信されません（公開シートのCSVをブラウザが直接読みます）
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 text-xl leading-none w-8 h-8 rounded hover:bg-neutral-100"
          >
            ×
          </button>
        </div>

        {/* Tab: 用途別 */}
        <div className="flex gap-1 p-2 border-b border-neutral-200 bg-neutral-50">
          {(["nametag", "contact", "shop"] as IntegrationKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setActiveKind(kind)}
              className={`text-xs px-3 py-1.5 rounded-md font-semibold ${
                activeKind === kind
                  ? "bg-white shadow-sm text-emerald-700"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {INTEGRATION_KIND_LABELS[kind]} ({list.filter((i) => i.kind === kind).length})
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {/* 設定手順 */}
          <details className="rounded-lg bg-amber-50 border border-amber-200 p-3" open>
            <summary className="cursor-pointer text-[11px] font-bold text-amber-900">
              📝 連携の準備（5分で完了）
            </summary>
            <ol className="mt-2 list-decimal list-inside text-[11px] text-amber-900 leading-relaxed space-y-1">
              <li>
                <strong>Googleスプレッドシート</strong>: 右上「共有」→「リンクを知っている全員が閲覧可能」に変更
              </li>
              <li>
                <strong>Excel</strong>: OneDrive にアップロード→共有→「リンクを知っている全員」or
                <strong>「ファイル→名前を付けて保存→CSV」</strong>でCSVファイル化（Googleドライブにアップロード）
              </li>
              <li>シートURLをコピーして下の「+ 新規登録」フォームに貼り付け</li>
              <li>「同期テスト」で取得が成功するか確認</li>
              <li>各アプリ（名札・名刺・ショップ）の「📡 連携シートから取込」で選択</li>
            </ol>
            <div className="mt-2 text-[10px] text-amber-800 bg-amber-100/60 p-2 rounded">
              <strong>⚠ プライバシー注意</strong>: 「リンク共有」設定にすると、URL を知る誰でもシートを見られます。社員名簿などプライベートデータには専用の Google アカウントを作って使うのがおすすめです。
            </div>
          </details>

          {/* シート一覧 */}
          {filtered.length === 0 && !showAddForm && (
            <div className="rounded-lg border-2 border-dashed border-neutral-200 p-8 text-center">
              <div className="text-sm text-neutral-500 mb-3">
                {INTEGRATION_KIND_LABELS[activeKind]} 用のシートがまだ登録されていません
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="text-sm px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold"
              >
                + 最初のシートを登録
              </button>
            </div>
          )}

          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-neutral-200 bg-white p-3 space-y-2"
            >
              {editing?.id === item.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editing.label}
                    onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                    placeholder="シート名"
                    className="w-full px-2 py-1.5 rounded border border-neutral-300 text-xs"
                  />
                  <input
                    type="url"
                    value={editing.url}
                    onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                    placeholder="シートURL"
                    className="w-full px-2 py-1.5 rounded border border-neutral-300 text-xs font-mono"
                  />
                  <label className="flex items-center gap-2 text-[11px]">
                    <input
                      type="checkbox"
                      checked={editing.autoSync}
                      onChange={(e) => setEditing({ ...editing, autoSync: e.target.checked })}
                      className="accent-emerald-600"
                    />
                    自動同期する（モーダルを開いた時 / 5分ごと）
                  </label>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="text-xs px-3 py-1 rounded-md border border-neutral-300 bg-white"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="text-xs px-3 py-1 rounded-md bg-emerald-600 text-white font-semibold"
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-neutral-900 truncate">
                        {item.label}
                        {item.autoSync && (
                          <span className="ml-2 text-[9px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                            自動同期 ON
                          </span>
                        )}
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-neutral-500 hover:text-emerald-700 underline truncate block"
                      >
                        {item.url}
                      </a>
                      {item.lastSync && (
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          最終同期: {new Date(item.lastSync).toLocaleString("ja-JP", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleTest(item)}
                      disabled={testing === item.id}
                      className="text-[11px] px-2.5 py-1 rounded-md border border-emerald-300 bg-emerald-50/40 text-emerald-700 disabled:opacity-50"
                    >
                      {testing === item.id ? "テスト中…" : "🔍 同期テスト"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      className="text-[11px] px-2.5 py-1 rounded-md border border-neutral-300 bg-white"
                    >
                      ✏️ 編集
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="text-[11px] px-2.5 py-1 rounded-md border border-neutral-200 text-red-600 bg-white hover:bg-red-50"
                    >
                      🗑 削除
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* 追加フォーム */}
          {showAddForm ? (
            <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50/30 p-3 space-y-2">
              <div className="text-[12px] font-bold text-neutral-900">
                ➕ 新しいシートを登録（{INTEGRATION_KIND_LABELS[activeKind]} 用）
              </div>
              <input
                type="text"
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder="シート名（例: 2026春オフ会名簿）"
                className="w-full px-2 py-1.5 rounded border border-emerald-300 text-xs"
              />
              <input
                type="url"
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-2 py-1.5 rounded border border-emerald-300 text-xs font-mono"
              />
              <label className="flex items-center gap-2 text-[11px]">
                <input
                  type="checkbox"
                  checked={draft.autoSync}
                  onChange={(e) => setDraft({ ...draft, autoSync: e.target.checked })}
                  className="accent-emerald-600"
                />
                自動同期する（おすすめ）
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setDraft({ label: "", url: "", autoSync: true });
                  }}
                  className="text-xs px-3 py-1.5 rounded-md border border-neutral-300 bg-white"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white font-semibold"
                >
                  登録
                </button>
              </div>
            </div>
          ) : filtered.length > 0 && list.length < INTEGRATION_LIMIT ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full text-sm py-2.5 rounded-md border-2 border-dashed border-emerald-300 bg-emerald-50/20 text-emerald-700 hover:bg-emerald-50 font-semibold"
            >
              + 別のシートも追加（あと{INTEGRATION_LIMIT - list.length}件登録可）
            </button>
          ) : null}

          {/* テスト結果メッセージ */}
          {testMsg && (
            <div
              className={`text-xs p-2 rounded-md border ${
                testMsg.startsWith("✅")
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              {testMsg}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-neutral-200 bg-neutral-50 text-[10px] text-neutral-500 leading-relaxed">
          🔒 シート設定はあなたのブラウザのみに保存されます（外部送信なし）。連携先のGoogleスプレッドシートは「リンクを知っている全員が閲覧可能」設定が必要です。
        </div>
      </div>
    </div>
  );
}
