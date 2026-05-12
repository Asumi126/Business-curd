"use client";

import { SavedProfile, formatDate } from "../../lib/profiles";
import { Draft, describeDraft } from "../../lib/drafts";
import { CardRenderer } from "../CardRenderer";
import { ArrowIcon } from "../../lib/icons";

type Props = {
  onUseSample: () => void;
  savedProfiles: SavedProfile[];
  onLoadProfile: (p: SavedProfile) => void;
  onOpenProfileManager: () => void;
  onOpenDesignBook?: () => void;
  onOpenContactBook?: () => void;
  onContinue: () => void;
  onCreateNew: () => void;
  hasInput: boolean;
  /** 最後に編集していたステップ番号（未保存なら null）。「途中から続ける」のヒント表示用。 */
  resumeStep?: number | null;
  /** 最後に編集していたステップのラベル（例:「カスタマイズ」）。 */
  resumeStepLabel?: string | null;
  drafts: Draft[];
  currentDraftId: string | null;
  onLoadDraft: (d: Draft) => void;
  onDeleteDraft: (id: string) => void;
};

type ChoiceConfig = {
  kind: "design-book" | "contact-book" | "continue" | "fresh";
  enabled: boolean;
  emoji: string;
  label: string;
  badge?: string;
  description: string;
  hint: string;
  accent: string;
  accentRgb: string;
  onClick: () => void;
};

export function Step1Welcome({
  savedProfiles,
  onLoadProfile,
  onOpenProfileManager,
  onOpenDesignBook,
  onOpenContactBook,
  onContinue,
  onCreateNew,
  onUseSample,
  hasInput,
  drafts,
  currentDraftId,
  onLoadDraft,
  onDeleteDraft,
  resumeStep,
  resumeStepLabel,
}: Props) {
  const cardCount = savedProfiles.filter((p) => (p.kind ?? "card") === "card").length;
  const contactCount = savedProfiles.filter((p) => p.kind === "contact").length;
  const hasDrafts = drafts.length > 0;

  const openDesign = onOpenDesignBook ?? onOpenProfileManager;
  const openContact = onOpenContactBook ?? onOpenProfileManager;

  const choices: ChoiceConfig[] = [
    {
      kind: "design-book",
      enabled: cardCount > 0,
      emoji: "",
      label: "デザイン帳から",
      badge: cardCount > 0 ? `${cardCount}件保存済み` : undefined,
      description: "保存済みデザインをそのまま読込。",
      hint: cardCount > 0
        ? "デザイン込みで丸ごと復元します"
        : "デザイン帳に保存があると、ここから読み込めます",
      accent: "#a855f7",
      accentRgb: "168, 85, 247",
      onClick: () => {
        if (cardCount > 0) openDesign();
      },
    },
    {
      kind: "contact-book",
      enabled: contactCount > 0,
      emoji: "",
      label: "連絡帳から",
      badge: contactCount > 0 ? `${contactCount}件保存済み` : undefined,
      description: "連絡先だけを読み込んで新しくデザイン。",
      hint: contactCount > 0
        ? "連絡先テキストを反映、デザインは新規"
        : "連絡帳に保存があると、ここから読み込めます",
      accent: "#10b981",
      accentRgb: "16, 185, 129",
      onClick: () => {
        if (contactCount > 0) openContact();
      },
    },
    {
      kind: "continue",
      enabled: hasInput,
      emoji: "",
      label: "途中から続ける",
      badge: hasInput
        ? resumeStepLabel
          ? `${resumeStepLabel} から再開`
          : "前回データあり"
        : undefined,
      description: hasInput
        ? resumeStepLabel
          ? `前回は「${resumeStepLabel}」で作業を中断しました。同じ場所から再開します。`
          : "前回の入力を続けて編集。"
        : "前回の入力を続けて編集。",
      hint: hasInput
        ? resumeStep
          ? `Step ${resumeStep}${resumeStepLabel ? ` (${resumeStepLabel})` : ""} の状態を復元します`
          : "途中まで作った内容が残っています"
        : "途中まで入力されたデータはまだありません",
      accent: "#f59e0b",
      accentRgb: "245, 158, 11",
      onClick: () => {
        if (hasInput) onContinue();
      },
    },
    {
      kind: "fresh",
      enabled: true,
      emoji: "",
      label: "新規で作成",
      badge: "おすすめ",
      description: "一から新しい名刺を作る。",
      hint: "11ステップで完成します",
      accent: "#6366f1",
      accentRgb: "99, 102, 241",
      onClick: onCreateNew,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* The "ようこそ" hero is shown on the AppSelector (top page) instead. */}

      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-[10px] font-semibold text-blue-600 tracking-[0.25em] uppercase">
              Step 1
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
              名刺を作成する方法を選んでください
            </h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">4つのスタート方法から選択</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {choices.map((c) => (
            <button
              key={c.kind}
              type="button"
              disabled={!c.enabled}
              onClick={c.onClick}
              className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-all min-h-[180px] flex flex-col ${
                c.enabled
                  ? "border-neutral-200 bg-white hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer"
                  : "border-dashed border-neutral-200 bg-neutral-50/40 cursor-not-allowed"
              }`}
              style={
                c.enabled
                  ? {
                      borderColor: `rgba(${c.accentRgb}, 0.3)`,
                    }
                  : undefined
              }
            >
              {c.enabled && (
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% -20%, rgba(${c.accentRgb}, 0.08), transparent 70%)`,
                  }}
                />
              )}
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none transition-all"
                style={{
                  background: c.enabled
                    ? `radial-gradient(circle, rgba(${c.accentRgb}, 0.12), transparent 70%)`
                    : "transparent",
                }}
              />

              <div className="relative flex items-start justify-between gap-2 mb-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110 ${
                    c.enabled ? "" : "grayscale opacity-50"
                  }`}
                  style={
                    c.enabled
                      ? {
                          backgroundColor: `rgba(${c.accentRgb}, 0.12)`,
                        }
                      : { backgroundColor: "#f5f5f5" }
                  }
                >
                  {c.emoji}
                </div>
                {c.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      c.enabled ? "" : "bg-neutral-100 text-neutral-400"
                    }`}
                    style={
                      c.enabled
                        ? {
                            backgroundColor: `rgba(${c.accentRgb}, 0.12)`,
                            color: c.accent,
                          }
                        : undefined
                    }
                  >
                    {c.badge}
                  </span>
                )}
              </div>

              <div className="relative flex-1 flex flex-col justify-between">
                <div>
                  <div
                    className={`text-base font-bold leading-tight whitespace-nowrap ${
                      c.enabled ? "text-neutral-900" : "text-neutral-400"
                    }`}
                  >
                    {c.label}
                  </div>
                  <div
                    className={`text-xs mt-1 leading-relaxed ${
                      c.enabled ? "text-neutral-600" : "text-neutral-400"
                    }`}
                  >
                    {c.description}
                  </div>
                  <div
                    className={`text-[10px] mt-1.5 leading-snug ${
                      c.enabled ? "text-neutral-500" : "text-neutral-400"
                    }`}
                  >
                    {c.hint}
                  </div>
                </div>

                {c.enabled && (
                  <div
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold transition-transform group-hover:translate-x-1"
                    style={{ color: c.accent }}
                  >
                    始める
                    <ArrowIcon size={14} />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {hasDrafts && (
        <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/40 to-teal-50/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-semibold text-emerald-700 tracking-[0.25em] uppercase">
                作成中の下書き（最大5件）
              </div>
              <div className="text-sm font-bold text-neutral-900 mt-0.5">
                途中の作業を再開（{drafts.length}件）
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {drafts.map((d) => {
              const isCurrent = d.id === currentDraftId;
              return (
                <div
                  key={d.id}
                  className={`group flex gap-3 items-center p-2.5 rounded-xl border transition ${
                    isCurrent
                      ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
                      : "border-neutral-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30 hover:shadow-sm"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onLoadDraft(d)}
                    className="flex gap-3 items-center flex-1 min-w-0 text-left"
                  >
                    <div className="w-[20mm] h-[12mm] overflow-hidden rounded-md shrink-0 bg-neutral-100 ring-1 ring-neutral-200">
                      <div
                        style={{
                          transform: "scale(0.22)",
                          transformOrigin: "top left",
                          width: "91mm",
                          height: "55mm",
                        }}
                      >
                        <CardRenderer data={d.data} templateId={d.templateId} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate text-neutral-900 flex items-center gap-1.5">
                        {describeDraft(d)}
                        {isCurrent && (
                          <span className="text-[8px] px-1 py-0 rounded bg-emerald-600 text-white font-bold">
                            編集中
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                        {formatDate(d.updatedAt).slice(5, 16)}
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("この下書きを削除しますか？")) onDeleteDraft(d.id);
                    }}
                    className="shrink-0 w-7 h-7 rounded-full text-neutral-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center text-sm"
                    title="削除"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-[10px] text-emerald-700 leading-relaxed">
            💡 「新しく作る」を押すと、現在の作業はここに自動保存されます（古い物から順に削除）
          </div>
        </div>
      )}

      {savedProfiles.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-semibold text-amber-600 tracking-[0.25em] uppercase">
                ショートカット
              </div>
              <div className="text-sm font-bold text-neutral-900 mt-0.5">
                保存済みの名刺（クリックで即読込）
              </div>
            </div>
            {savedProfiles.length > 4 && (
              <button
                type="button"
                onClick={onOpenProfileManager}
                className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap"
              >
                すべて見る →
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {savedProfiles.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onLoadProfile(p)}
                className="group flex gap-3 items-center p-2.5 rounded-xl border border-neutral-200 hover:border-amber-400 hover:bg-amber-50/30 hover:shadow-sm active:scale-[0.99] transition text-left"
              >
                <div className="w-[20mm] h-[12mm] overflow-hidden rounded-md shrink-0 bg-neutral-100 ring-1 ring-neutral-200 group-hover:ring-amber-300 transition">
                  <div
                    style={{
                      transform: "scale(0.22)",
                      transformOrigin: "top left",
                      width: "91mm",
                      height: "55mm",
                    }}
                  >
                    <CardRenderer data={p.data} templateId={p.templateId} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate text-neutral-900">{p.label}</div>
                  <div className="text-[10px] text-neutral-500 truncate mt-0.5">
                    {p.data.nameJa || "（無名）"}
                  </div>
                  <div className="text-[9px] text-neutral-400 mt-0.5 font-mono">
                    {formatDate(p.updatedAt).slice(5, 16)}
                  </div>
                </div>
                <ArrowIcon
                  size={14}
                  className="text-neutral-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition shrink-0"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CREATION GUIDE — clear step-by-step walkthrough */}
      <details className="rounded-2xl border-2 border-blue-200 bg-blue-50/30 group overflow-hidden">
        <summary className="cursor-pointer px-5 py-4 select-none flex items-center justify-between hover:bg-blue-50/60 transition">
          <div>
            <div className="text-[10px] font-semibold text-blue-700 tracking-[0.25em] uppercase">
              作成手順
            </div>
            <div className="text-sm font-semibold text-neutral-900 mt-0.5">
              全10ステップで完成（クリックで詳細を見る）
            </div>
          </div>
          <span className="text-neutral-400 group-open:rotate-180 transition text-xl">⌄</span>
        </summary>
        <div className="px-5 pb-6 pt-2 bg-white border-t border-blue-100">
          <ol className="relative">
            {[
              {
                title: "TOP（今ここ）",
                description: "アプリの説明、サンプルデータ、保存リストなどから始められます",
                required: false,
              },
              {
                title: "情報入力",
                description: "氏名（漢字／ふりがな／ローマ字いずれか1つ）・連絡先・SNS・お仕事情報まで一括入力",
                required: true,
              },
              {
                title: "デザイン選択",
                description: "業種別カテゴリから本格テンプレートを選択（標準＋画像系＋カスタム背景）",
                required: true,
              },
              {
                title: "裏面選択",
                description: "QR＋連絡先／QR＋メモ／QR×2／企業紹介／スローガンなど、用途別の裏面スタイル",
                required: false,
              },
              {
                title: "挿入画像",
                description: "ロゴ／顔写真／カスタム背景。各タブでアップロード（不要なら「アップロードしない」で進める）",
                required: false,
              },
              {
                title: "QRコード設定",
                description: "表面・裏面のQRコードを個別設定。連絡先QR・URL QR・ラベル付きなど",
                required: false,
              },
              {
                title: "カラーカスタマイズ",
                description: "表面/裏面別にカラー・パレット・パターン・透明度を調整",
                required: false,
              },
              {
                title: "テキストカスタマイズ",
                description: "書体・項目別フォント・エフェクト・文字配置を表面/裏面で細かく調整",
                required: false,
              },
              {
                title: "微調整",
                description: "全体フォントサイズ／文字位置（X/Y）／表示項目ON-OFF。仕上げの最終調整",
                required: false,
              },
              {
                title: "完成 → ダウンロード／印刷",
                description: "PDF発注用／A4自宅印刷／PNG／名刺帳ワンクリック保存。最終チェック付き",
                required: false,
              },
            ].map((item, i, arr) => (
              <li key={i} className="relative flex gap-4 pb-4 last:pb-0">
                {/* connector line */}
                {i < arr.length - 1 && (
                  <span
                    className="absolute left-[15px] top-9 bottom-0 w-px bg-blue-200"
                    aria-hidden="true"
                  />
                )}
                {/* step number */}
                <div className="relative z-10 shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shadow-sm">
                    {i + 1}
                  </div>
                </div>
                {/* content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-bold text-neutral-900">
                      {item.title}
                    </span>
                    {item.required ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                        必須
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 font-medium">
                        任意
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-neutral-600 mt-0.5 leading-relaxed">
                    {item.description}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 pt-3 border-t border-blue-100 grid sm:grid-cols-3 gap-2 text-[11px]">
            <div className="text-neutral-700">所要時間 <strong>5〜10分</strong></div>
            <div className="text-neutral-700">いつでも前ステップに戻れる</div>
            <div className="text-neutral-700">途中保存・名刺帳機能あり</div>
          </div>
        </div>
      </details>

      <button
        type="button"
        onClick={onUseSample}
        className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-neutral-300 bg-white hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-sm transition self-start"
      >
        <span className="w-9 h-9 rounded-full bg-neutral-100 group-hover:bg-blue-100 flex items-center justify-center text-base transition">
          🎨
        </span>
        <span className="text-left">
          <span className="block text-sm font-semibold text-neutral-900">
            サンプルデータでテンプレを試す
          </span>
          <span className="block text-[11px] text-neutral-500 mt-0.5">
            入力をスキップして、いきなりデザイン選択画面へ
          </span>
        </span>
        <span className="text-neutral-400 group-hover:text-blue-600 group-hover:translate-x-1 transition">
          →
        </span>
      </button>
    </div>
  );
}
