"use client";

import { useEffect, useState } from "react";
import { CardData } from "../lib/types";
import {
  bytesPretty,
  deleteProfile,
  formatDate,
  getStorageInfo,
  listProfiles,
  PROFILE_LIMIT,
  saveProfile,
  SavedProfile,
  StorageInfo,
} from "../lib/profiles";
import { CardRenderer } from "./CardRenderer";

type Props = {
  open: boolean;
  onClose: () => void;
  currentData: CardData;
  currentTemplateId: string;
  currentBackStyleId: string;
  currentProfileId: string | null;
  /** Which list to focus when the manager opens. Defaults to "card". */
  initialKind?: "card" | "contact";
  onLoad: (profile: SavedProfile) => void;
  onEdit?: (profile: SavedProfile) => void;
  onCreateNewContact?: () => void;
  onSavedAs: (profile: SavedProfile) => void;
};

export function ProfileManager({
  open,
  onClose,
  currentData,
  currentTemplateId,
  currentBackStyleId,
  currentProfileId,
  initialKind = "card",
  onLoad,
  onEdit,
  onCreateNewContact,
  onSavedAs,
}: Props) {
  const [activeKind, setActiveKind] = useState<"card" | "contact">(initialKind);
  // Sync with prop on open
  useEffect(() => {
    if (open) setActiveKind(initialKind);
  }, [open, initialKind]);
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [info, setInfo] = useState<StorageInfo>({
    count: 0,
    limit: PROFILE_LIMIT,
    bytesUsed: 0,
    bytesLimit: 4 * 1024 * 1024,
    percentage: 0,
  });
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // saveWithDesign mirrors the active tab so what you save matches the
  // list you're currently viewing.
  const saveWithDesign = activeKind === "card";
  const setSaveWithDesign = (v: boolean) => setActiveKind(v ? "card" : "contact");

  const refresh = () => {
    setProfiles(listProfiles());
    setInfo(getStorageInfo());
  };

  useEffect(() => {
    if (open) {
      refresh();
      setError(null);
      setSuccess(null);
      setLabel(suggestLabel(currentData));
    }
  }, [open, currentData.nameJa, currentData.company]);

  if (!open) return null;

  const handleSaveNew = () => {
    setError(null);
    setSuccess(null);
    const trimmed = label.trim();
    if (!trimmed) {
      setError("プロフィール名を入力してください");
      return;
    }
    const result = saveProfile({
      label: trimmed,
      kind: saveWithDesign ? "card" : "contact",
      data: currentData,
      templateId: currentTemplateId,
      backStyleId: currentBackStyleId,
    });
    if (result.ok) {
      setSuccess(`「${trimmed}」として保存しました`);
      onSavedAs(result.profile);
      refresh();
    } else {
      setError(result.message);
    }
  };

  const handleSaveOver = () => {
    if (!currentProfileId) return;
    setError(null);
    setSuccess(null);
    const trimmed = label.trim();
    if (!trimmed) {
      setError("プロフィール名を入力してください");
      return;
    }
    const result = saveProfile({
      label: trimmed,
      kind: saveWithDesign ? "card" : "contact",
      data: currentData,
      templateId: currentTemplateId,
      backStyleId: currentBackStyleId,
      existingId: currentProfileId,
    });
    if (result.ok) {
      setSuccess(`「${trimmed}」を上書き保存しました`);
      onSavedAs(result.profile);
      refresh();
    } else {
      setError(result.message);
    }
  };

  const handleDelete = (p: SavedProfile) => {
    if (!confirm(`「${p.label}」を削除しますか？`)) return;
    deleteProfile(p.id);
    refresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-neutral-200">
          <div>
            <h2 className="text-xl font-bold tracking-tight">📂 名刺帳</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              過去に作った名刺を最大{PROFILE_LIMIT}件まで保存できます
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

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-neutral-800">
                💾 現在のデータを保存
              </div>
              <div className="text-xs text-neutral-500">
                {info.count} / {info.limit} 件 ・ {bytesPretty(info.bytesUsed)} / {bytesPretty(info.bytesLimit)}
              </div>
            </div>
            <div className="h-1 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${Math.max(2, info.percentage)}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="名前・ラベル（例: メイン名刺、田中さん）"
                className="flex-1 min-w-[200px] px-3 py-2 rounded-md border border-neutral-300 text-sm"
              />
              <button
                type="button"
                onClick={handleSaveNew}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                ＋ 新規保存
              </button>
              {currentProfileId && (
                <button
                  type="button"
                  onClick={handleSaveOver}
                  className="px-4 py-2 rounded-md bg-neutral-800 text-white text-sm font-medium hover:bg-neutral-700"
                >
                  上書き保存
                </button>
              )}
            </div>
            <label className="mt-2 flex items-start gap-2 text-[12px] cursor-pointer p-2 rounded-md bg-blue-50/40 border border-blue-200">
              <input
                type="checkbox"
                checked={saveWithDesign}
                onChange={(e) => setSaveWithDesign(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-neutral-700 leading-relaxed">
                <strong>🎨 デザインも一緒に保存（名刺帳）</strong>
                <span className="block text-[10px] text-neutral-600 mt-0.5">
                  チェック ON：作りかけ・完成済みのデザインを丸ごと保存（最大10件）。
                  <br />
                  チェック OFF：連絡先のテキスト情報だけを保存（連絡先リスト・無制限）。
                </span>
              </span>
            </label>
            {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
            {success && <div className="mt-2 text-xs text-green-600">{success}</div>}
          </div>

          <div>
            {/* Tabs: デザイン帳 / 連絡帳 */}
            <div className="flex border-b-2 border-neutral-200 mb-3">
              {(
                [
                  { kind: "card" as const, label: "🎨 デザイン帳", color: "purple" },
                  { kind: "contact" as const, label: "📇 連絡帳", color: "emerald" },
                ]
              ).map((t) => {
                const count = profiles.filter((p) => (p.kind ?? "card") === t.kind).length;
                const active = activeKind === t.kind;
                return (
                  <button
                    key={t.kind}
                    type="button"
                    onClick={() => setActiveKind(t.kind)}
                    className={`flex-1 px-3 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition ${
                      active
                        ? t.color === "purple"
                          ? "text-purple-700 border-purple-600 bg-purple-50/30"
                          : "text-emerald-700 border-emerald-600 bg-emerald-50/30"
                        : "text-neutral-500 border-transparent hover:text-neutral-800"
                    }`}
                  >
                    {t.label}
                    {count > 0 && (
                      <span
                        className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-bold ${
                          active
                            ? t.color === "purple"
                              ? "bg-purple-600 text-white"
                              : "bg-emerald-600 text-white"
                            : "bg-neutral-200 text-neutral-600"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] text-neutral-600 leading-relaxed">
                {activeKind === "card"
                  ? "🎨 デザイン込みで保存。読み込むとデザインそのまま復元。最大10件。"
                  : "📇 連絡先テキストのみ。読み込むとデザインはデフォルトから新しく作れます。"}
              </div>
              {activeKind === "contact" && onCreateNewContact && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onCreateNewContact();
                      onClose();
                    }}
                    className="text-xs px-3 py-1.5 rounded-md border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 font-semibold whitespace-nowrap"
                  >
                    + 新規連絡先
                  </button>
                  <label className="text-xs px-3 py-1.5 rounded-md border border-emerald-400 bg-emerald-50/40 text-emerald-700 hover:bg-emerald-100 font-semibold cursor-pointer whitespace-nowrap">
                    📥 CSVから一括取込
                    <input
                      type="file"
                      accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (!f) return;
                        try {
                          const text = (await f.text()).replace(/^﻿/, "").trim();
                          const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
                          if (lines.length === 0) {
                            alert("ファイルが空です");
                            return;
                          }
                          const sep = lines[0].includes("\t") ? "\t" : ",";
                          const looksLikeHeader = lines[0]
                            .split(sep)
                            .map((c) => c.trim().toLowerCase().replace(/^"|"$/g, ""))
                            .some((c) => ["氏名", "名前", "name"].includes(c));
                          const dataLines = looksLikeHeader ? lines.slice(1) : lines;
                          // 列順: 氏名 / ふりがな or 英名 / 会社 / 肩書き / 電話 / メール / 住所 / Webサイト / タグライン
                          let added = 0;
                          let skipped = 0;
                          for (const line of dataLines) {
                            const cols = line
                              .split(sep)
                              .map((c) => c.trim().replace(/^"|"$/g, ""));
                            if (!cols[0]) continue;
                            // CardData の最低限のフィールド
                            const newProfile: CardData = {
                              ...currentData,
                              nameJa: cols[0] || "",
                              nameEn: cols[1] || "",
                              company: cols[2] || "",
                              title: cols[3] || "",
                              phone: cols[4] || "",
                              email: cols[5] || "",
                              address: cols[6] || "",
                              website: cols[7] || "",
                              tagline: cols[8] || "",
                              // デザイン情報はクリア
                              profilePhoto: "",
                              logoDataUrl: "",
                            };
                            const result = saveProfile({
                              label: cols[0] || `連絡先${added + 1}`,
                              kind: "contact",
                              data: newProfile,
                              templateId: currentTemplateId,
                              backStyleId: currentBackStyleId,
                            });
                            if (result.ok) added++;
                            else skipped++;
                          }
                          alert(`✅ ${added}件取込${skipped > 0 ? ` / ${skipped}件スキップ` : ""}`);
                          refresh();
                        } catch {
                          alert("CSV読み込みに失敗しました");
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            {(() => {
              const filteredProfiles = profiles.filter(
                (p) => (p.kind ?? "card") === activeKind,
              );
              if (filteredProfiles.length === 0) {
                return (
                  <div className="text-sm text-neutral-500 text-center py-8 border-2 border-dashed border-neutral-200 rounded-xl">
                    {activeKind === "card"
                      ? "まだデザイン帳に保存されたデータはありません。"
                      : "まだ連絡帳に保存されたデータはありません。"}
                    <br />
                    上の「新規保存」ボタンから追加できます。
                  </div>
                );
              }
              if (activeKind === "contact") {
                // Compact text-list layout for the address book
                return (
                  <div className="rounded-lg border border-neutral-200 overflow-hidden bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase tracking-wider text-neutral-500">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">名前</th>
                          <th className="px-3 py-2 text-left font-semibold hidden sm:table-cell">会社・肩書き</th>
                          <th className="px-3 py-2 text-left font-semibold">連絡先</th>
                          <th className="px-3 py-2 text-right font-semibold">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProfiles.map((p) => {
                          const isCurrent = p.id === currentProfileId;
                          const d = p.data;
                          return (
                            <tr
                              key={p.id}
                              className={`border-b border-neutral-100 last:border-b-0 ${
                                isCurrent ? "bg-emerald-50/40" : "hover:bg-neutral-50"
                              }`}
                            >
                              <td className="px-3 py-2">
                                <div className="font-semibold text-neutral-900 text-sm">
                                  {d.nameJa || p.label || "（無名）"}
                                </div>
                                {d.nameEn && (
                                  <div className="text-[10px] text-neutral-500">{d.nameEn}</div>
                                )}
                                {p.label && p.label !== d.nameJa && (
                                  <div className="text-[10px] text-emerald-700">📑 {p.label}</div>
                                )}
                                {isCurrent && (
                                  <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold mt-0.5">
                                    現在表示中
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 hidden sm:table-cell text-[12px] text-neutral-700">
                                {d.company && <div className="truncate">{d.company}</div>}
                                {d.title && (
                                  <div className="text-[10px] text-neutral-500 truncate">
                                    {d.title}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-[11px] text-neutral-700 leading-tight">
                                {d.phone && <div>📞 {d.phone}</div>}
                                {d.email && (
                                  <div className="truncate max-w-[180px]">
                                    ✉ {d.email}
                                  </div>
                                )}
                                {!d.phone && !d.email && (
                                  <span className="text-neutral-400">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onLoad(p);
                                    onClose();
                                  }}
                                  className="text-[11px] px-2 py-1 rounded bg-neutral-900 text-white hover:bg-neutral-700 mr-1"
                                >
                                  読込
                                </button>
                                {onEdit && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onEdit(p);
                                      onClose();
                                    }}
                                    className="text-[11px] px-2 py-1 rounded border border-blue-300 text-blue-700 hover:bg-blue-50 mr-1"
                                  >
                                    編集
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDelete(p)}
                                  className="text-[11px] px-2 py-1 rounded border border-neutral-300 text-neutral-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                                >
                                  削除
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              }
              return (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredProfiles.map((p) => (
                  <ProfileItem
                    key={p.id}
                    profile={p}
                    isCurrent={p.id === currentProfileId}
                    onEdit={
                      onEdit
                        ? () => {
                            onEdit(p);
                            onClose();
                          }
                        : undefined
                    }
                    onLoad={() => {
                      onLoad(p);
                      onClose();
                    }}
                    onDelete={() => handleDelete(p)}
                  />
                ))}
              </div>
              );
            })()}
          </div>
        </div>

        <div className="p-4 border-t border-neutral-200 text-xs text-neutral-500 leading-relaxed">
          🔒 デザイン帳・連絡帳のデータはあなたのブラウザだけに保存されます。外部送信はしません。
        </div>
      </div>
    </div>
  );
}

function ProfileItem({
  profile,
  isCurrent,
  onLoad,
  onEdit,
  onDelete,
}: {
  profile: SavedProfile;
  isCurrent: boolean;
  onLoad: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`rounded-xl border-2 p-3 flex flex-col gap-2 transition ${
        isCurrent ? "border-blue-600 bg-blue-50/40" : "border-neutral-200 bg-white"
      }`}
    >
      <div className="aspect-[91/55] rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center">
        <div
          style={{
            transform: "scale(0.6)",
            transformOrigin: "top left",
            width: "91mm",
            height: "55mm",
          }}
        >
          <CardRenderer
            data={profile.data}
            templateId={profile.templateId}
          />
        </div>
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-neutral-900 truncate">
            {profile.label} {isCurrent && <span className="text-blue-600 text-xs">(現在)</span>}
          </div>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            {(profile.kind ?? "card") === "card" ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">
                🎨 名刺帳
              </span>
            ) : (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                📇 連絡先のみ
              </span>
            )}
            <span className="text-[10px] text-neutral-500">
              {profile.data.nameJa || "（無名）"} ・ {formatDate(profile.updatedAt)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onLoad}
          className="flex-1 px-3 py-1.5 rounded-md bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-700"
        >
          {(profile.kind ?? "card") === "card" ? "読み込む" : "読み込んで作る"}
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1.5 rounded-md border border-blue-300 text-blue-700 text-xs hover:bg-blue-50"
            title="このリストの内容（連絡先テキスト）を直接編集"
          >
            ✎ 編集
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="px-3 py-1.5 rounded-md border border-neutral-300 text-neutral-700 text-xs hover:bg-red-50 hover:border-red-300 hover:text-red-600"
        >
          削除
        </button>
      </div>
    </div>
  );
}

function suggestLabel(data: CardData): string {
  const parts: string[] = [];
  if (data.company) parts.push(data.company);
  if (data.nameJa) parts.push(data.nameJa);
  if (parts.length === 0) parts.push(`名刺 ${new Date().toLocaleDateString("ja-JP")}`);
  return parts.join(" / ");
}
