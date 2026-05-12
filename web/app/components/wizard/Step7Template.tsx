"use client";

import { useMemo, useState } from "react";
import { CardData, CARD_SIZES, CardSizeKey, getCardSize } from "../../lib/types";
import { TEMPLATES } from "../../templates";
import { CardRenderer } from "../CardRenderer";
import { PALETTES, PALETTE_CATEGORIES } from "../../lib/customization";
import { StepShell } from "./StepShell";

type Props = {
  data: CardData;
  templateId: string;
  setTemplateId: (id: string) => void;
  update: (patch: Partial<CardData>) => void;
};

export function Step7Template({ data, templateId, setTemplateId, update }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const currentSize = getCardSize(data.customization.cardSize);
  const orientation = currentSize.orientation;

  const setCardSize = (id: CardSizeKey) =>
    update({ customization: { ...data.customization, cardSize: id } });

  /**
   * デザイン選択ページから「簡単に」カラーを切り替えるための簡易パレット適用。
   * 詳細なカスタマイズ（個別の色変更）は後の「⚙️ カスタマイズ」ステップで可能。
   * "auto" を選ぶとテンプレ既定に戻す（customColors / backColors / paletteId をクリア）。
   */
  const applyPalette = (id: string) => {
    const c = data.customization;
    const preset = PALETTES.find((p) => p.id === id);
    if (!preset || preset.id === "auto") {
      update({ customization: { ...c, paletteId: "auto", customColors: {}, backColors: {} } });
      return;
    }
    update({
      customization: {
        ...c,
        paletteId: id,
        customColors: {
          bg: preset.bg,
          fg: preset.fg,
          accent: preset.accent,
          muted: preset.muted,
        },
        backColors: {},
      },
    });
  };

  const [paletteFilter, setPaletteFilter] = useState<"all" | string>("all");
  const visiblePalettes = useMemo(() => {
    const nonAuto = PALETTES.filter((p) => p.id !== "auto");
    if (paletteFilter === "all") return nonAuto;
    return nonAuto.filter((p) => p.category === paletteFilter);
  }, [paletteFilter]);
  const currentPaletteId = data.customization.paletteId;

  const orientationFiltered = useMemo(
    () => TEMPLATES.filter((t) => (t.orientation ?? "horizontal") === orientation),
    [orientation],
  );

  const visible = useMemo(
    () => (filter === "all" ? orientationFiltered : orientationFiltered.filter((t) => t.category === filter)),
    [orientationFiltered, filter],
  );

  return (
    <StepShell
      title="気に入ったデザインを選んでください"
      subtitle="あなたの情報がリアルタイムで反映されています。「これだ！」と思ったものをクリック。後で何度でも変更できます。"
    >
      {/* 📐 名刺サイズ — 最上部に配置し、初期は open でユーザーが見つけやすく。
          選択した後はサマリーをクリックして閉じられる（details の標準挙動）。 */}
      <details className="rounded-lg border border-blue-200 bg-blue-50/30 group" open>
        <summary className="cursor-pointer select-none flex items-center justify-between gap-2 px-3 py-2 list-none">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm">📐</span>
            <span className="text-[12px] font-bold text-neutral-900">名刺サイズ</span>
            <span className="text-[10px] text-neutral-500 truncate">
              {CARD_SIZES.find((s) => s.id === data.customization.cardSize)?.label}
            </span>
          </div>
          <span className="text-neutral-400 text-xs group-open:rotate-180 transition">▾</span>
        </summary>
        <div className="px-3 pb-3">
          <div className="grid grid-cols-2 gap-1.5">
            {CARD_SIZES.map((s) => {
              const selected = data.customization.cardSize === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCardSize(s.id)}
                  className={`flex items-start gap-2 p-2 rounded-md border text-left transition ${
                    selected ? "border-blue-600 bg-white shadow-sm" : "border-neutral-200 bg-white hover:border-blue-400"
                  }`}
                >
                  <div
                    className="shrink-0 border border-neutral-300 bg-white mt-0.5"
                    style={{
                      width: s.orientation === "horizontal" ? "20px" : "13px",
                      height: s.orientation === "horizontal" ? "13px" : "20px",
                      borderRadius: "1px",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-neutral-900 truncate">{s.label}</div>
                    <div className="text-[9px] text-neutral-500 leading-tight truncate">{s.description}</div>
                  </div>
                  {selected && <span className="text-blue-600 text-xs shrink-0">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </details>

      {/* 上部の案内 — 1行に詰めてスクロール量を最小化 */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-[11px] text-blue-900 flex items-start gap-2">
        <span className="text-base shrink-0 leading-none">🎨</span>
        <div className="flex-1 leading-relaxed">
          下の<strong>カラーパレット</strong>でも簡単な色変更可。細かい色／フォントは後の <span className="px-1 rounded bg-white border border-blue-300 text-blue-700 text-[10px]">⚙️ カスタマイズ</span> ページで自由に変更できます。
        </div>
      </div>

      {/* 🎨 簡単カラーパレット — details で折りたたみ。標準時は閉じておきページを圧縮 */}
      <details className="rounded-lg border border-purple-200 bg-purple-50/30 group" open={currentPaletteId !== "auto"}>
        <summary className="cursor-pointer select-none flex items-center justify-between gap-2 px-3 py-2 list-none">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm">🎨</span>
            <span className="text-[12px] font-bold text-neutral-900">カラーパレット</span>
            <span className="text-[10px] text-neutral-500 truncate">
              {currentPaletteId === "auto"
                ? "テンプレ標準"
                : (PALETTES.find((p) => p.id === currentPaletteId)?.name ?? "カスタム")}
            </span>
          </div>
          <span className="text-neutral-400 text-xs group-open:rotate-180 transition">▾</span>
        </summary>
        <div className="px-3 pb-3 space-y-2">
          <div className="flex flex-wrap gap-1 items-center">
            <button
              type="button"
              onClick={() => setPaletteFilter("all")}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                paletteFilter === "all"
                  ? "bg-purple-600 border-purple-700 text-white"
                  : "bg-white border-neutral-300 text-neutral-700 hover:border-purple-400"
              }`}
            >
              すべて
            </button>
            {PALETTE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setPaletteFilter(cat.id)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                  paletteFilter === cat.id
                    ? "bg-purple-600 border-purple-700 text-white"
                    : "bg-white border-neutral-300 text-neutral-700 hover:border-purple-400"
                }`}
              >
                {cat.label}
              </button>
            ))}
            {currentPaletteId !== "auto" && (
              <button
                type="button"
                onClick={() => applyPalette("auto")}
                className="ml-auto text-[10px] px-2 py-0.5 rounded-full border border-neutral-300 text-neutral-600 bg-white hover:bg-neutral-50 transition"
              >
                ↺ 標準に戻す
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 max-h-[140px] overflow-y-auto pr-1">
            {visiblePalettes.map((p) => {
              const selected = currentPaletteId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPalette(p.id)}
                  title={p.name}
                  className={`flex items-center gap-1 p-1 rounded border text-left transition ${
                    selected
                      ? "border-purple-600 bg-purple-50 ring-1 ring-purple-300"
                      : "border-neutral-200 bg-white hover:border-purple-300"
                  }`}
                >
                  <div className="flex flex-col gap-[1px] shrink-0">
                    <div className="flex gap-[1px]">
                      <span className="block w-2.5 h-2.5 rounded-[1px] border border-black/10" style={{ backgroundColor: p.bg }} />
                      <span className="block w-2.5 h-2.5 rounded-[1px] border border-black/10" style={{ backgroundColor: p.fg }} />
                    </div>
                    <div className="flex gap-[1px]">
                      <span className="block w-2.5 h-2.5 rounded-[1px] border border-black/10" style={{ backgroundColor: p.accent }} />
                      <span className="block w-2.5 h-2.5 rounded-[1px] border border-black/10" style={{ backgroundColor: p.muted }} />
                    </div>
                  </div>
                  <span className={`text-[9px] truncate ${selected ? "font-bold text-purple-700" : "text-neutral-700"}`}>
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </details>

      {/* 旧「📐 名刺サイズ」セクションはページ最上部に移設したためここでは削除。 */}

      {/* Custom background image upload moved to Step 6 (画像) so all
        * image-related uploads live in one place. If the user already
        * uploaded a background, show a small reminder + jump-back button. */}
      {data.customBackground && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-8 rounded border border-emerald-300 overflow-hidden shrink-0">
              <img
                src={data.customBackground}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-[11px] text-emerald-900 leading-tight">
              <strong>カスタム背景画像が設定済みです</strong>
              <br />
              <span className="text-[10px] text-emerald-700">
                背景画像の変更は前のステップ「🖼 画像」へ
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Two-tier grouping: first split by purpose (default vs image-based),
       *  then within "default" further split by occupation/use-case so the
       *  user picks a design that matches their job. */}
      {(() => {
        const isPhoto = (id: string) =>
          id.startsWith("photo-") || id.startsWith("vertical-photo");
        const isCustomBg = (id: string) => id === "custom-background";
        const isStandard = (id: string) => !isPhoto(id) && !isCustomBg(id);

        const standardItems = orientationFiltered.filter((t) => isStandard(t.id));
        const photoItems = orientationFiltered.filter((t) => isPhoto(t.id));
        const customBgItems = orientationFiltered.filter((t) => isCustomBg(t.id));

        // Map legacy category values to their new bucket so existing
        // templates that still carry a legacy category still show up.
        const remap = (c: string): string => {
          if (["minimal", "business"].includes(c)) return "formal";
          if (c === "modern") return "tech";
          if (c === "premium") return "luxury";
          if (c === "japanese") return "traditional";
          return c; // formal/tech/creative/luxury/traditional/lifestyle/creative
        };

        /** カテゴリごとに色を割り当てて、見本の上に小さなタグを付ける。 */
        const tagStyleFor = (catKey: string): { label: string; cls: string } => {
          const map: Record<string, { label: string; cls: string }> = {
            formal: { label: "フォーマル", cls: "bg-blue-100 text-blue-700 border-blue-200" },
            tech: { label: "テック", cls: "bg-indigo-100 text-indigo-700 border-indigo-200" },
            creative: { label: "クリエイティブ", cls: "bg-pink-100 text-pink-700 border-pink-200" },
            luxury: { label: "ラグジュアリー", cls: "bg-amber-100 text-amber-700 border-amber-200" },
            traditional: { label: "和風", cls: "bg-red-100 text-red-700 border-red-200" },
            lifestyle: { label: "ライフスタイル", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
            photo: { label: "画像入り", cls: "bg-violet-100 text-violet-700 border-violet-200" },
            customBg: { label: "カスタム背景", cls: "bg-rose-100 text-rose-700 border-rose-200" },
          };
          return map[catKey] ?? { label: catKey, cls: "bg-neutral-100 text-neutral-700 border-neutral-200" };
        };

        /**
         * テンプレ1枚分のコンパクトカード。
         * - 見本は背景・枠なし。
         * - 見本の上にカテゴリタグを小さく重ね、色でぱっと識別。
         * - 下にテンプレ名＋短い解説を1〜2行。
         */
        const renderCard = (t: (typeof orientationFiltered)[number]) => {
          const selected = t.id === templateId;
          const catKey = isPhoto(t.id) ? "photo" : isCustomBg(t.id) ? "customBg" : remap(t.category);
          const tag = tagStyleFor(catKey);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplateId(t.id)}
              title={`${t.name} — ${t.description}`}
              data-template-cat={catKey}
              className={`group relative flex flex-col gap-1 p-1 text-left transition ${
                selected
                  ? "ring-2 ring-blue-500 rounded-md"
                  : "hover:ring-1 hover:ring-blue-300 rounded-md"
              }`}
            >
              {/* 見本: テンプレ全体デザインがサムネ内に常に収まるよう、
                  CSS Container Query(@container) で実寸に合わせて自動 scale。
                  100cqw = コンテナ幅(px) / カード幅(91mm = 343.93px) で
                  ピッタリ縮小される。グリッド幅が変わってもデザイン全体が
                  クリップされず必ず全体表示される。 */}
              <div
                className="w-full overflow-hidden relative bg-white"
                style={{
                  aspectRatio: `${currentSize.widthMm} / ${currentSize.heightMm}`,
                  containerType: "inline-size",
                }}
              >
                <div
                  className="absolute inset-0 origin-top-left"
                  style={{
                    width: `${currentSize.widthMm}mm`,
                    height: `${currentSize.heightMm}mm`,
                    transform: `scale(calc(100cqw / (${currentSize.widthMm} * 3.7795275591px)))`,
                  }}
                >
                  <CardRenderer data={data} templateId={t.id} className="w-full h-full" />
                </div>
                {/* カテゴリ色分けタグ */}
                <span
                  className={`absolute top-0.5 left-0.5 text-[8px] font-bold px-1 py-[1px] rounded border leading-none shadow-sm ${tag.cls}`}
                >
                  {tag.label}
                </span>
                {selected && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shadow">
                    ✓
                  </span>
                )}
              </div>
              {/* 見本の下に名前と1行解説 */}
              <div className="px-0.5">
                <div
                  className={`text-[10px] leading-tight truncate ${
                    selected ? "font-bold text-blue-700" : "font-semibold text-neutral-800"
                  }`}
                >
                  {t.name}
                </div>
                <div className="text-[9px] text-neutral-500 leading-tight line-clamp-2">
                  {t.description}
                </div>
              </div>
            </button>
          );
        };

        // 通常テンプレ（カスタム背景を除く）— カテゴリ見出し無しでフラット表示。
        const regularItems = [...standardItems, ...photoItems];

        // 凡例兼絞り込みチップ用カテゴリキー（customBg はここでは含めない）
        const ALL_CAT_KEYS = [
          "formal",
          "tech",
          "creative",
          "luxury",
          "traditional",
          "lifestyle",
          "photo",
        ];
        const presentCatKeys = ALL_CAT_KEYS.filter((k) =>
          regularItems.some((t) => {
            const ck = isPhoto(t.id) ? "photo" : remap(t.category);
            return ck === k;
          }),
        );
        const filteredItems = regularItems.filter((t) => {
          if (filter === "all") return true;
          const ck = isPhoto(t.id) ? "photo" : remap(t.category);
          return ck === filter;
        });

        return (
          <div className="space-y-3">
            {/* 通常テンプレ — タイトル＋背景枠でくくる（オリジナル背景枠と対比） */}
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/30 p-4">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xl shrink-0">🎨</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-blue-900">
                    テンプレートから選ぶ
                  </div>
                  <div className="text-[11px] text-blue-800/85 leading-relaxed">
                    用意されたデザインからお好きなものをクリック。色は下で簡単に変更できます。
                  </div>
                </div>
              </div>
              {/* カテゴリ凡例＋絞り込みチップ */}
              <div className="flex flex-wrap items-center gap-1 mb-2">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                    filter === "all"
                      ? "bg-neutral-900 border-neutral-900 text-white"
                      : "bg-white border-neutral-300 text-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  すべて（{regularItems.length}）
                </button>
                {presentCatKeys.map((k) => {
                  const tag = tagStyleFor(k);
                  const count = regularItems.filter((t) => {
                    const ck = isPhoto(t.id) ? "photo" : remap(t.category);
                    return ck === k;
                  }).length;
                  const active = filter === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFilter(k)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition leading-none ${
                        active ? "ring-2 ring-blue-400 " : ""
                      }${tag.cls}`}
                      title={`${tag.label}（${count}種類）でフィルタ`}
                    >
                      {tag.label}（{count}）
                    </button>
                  );
                })}
              </div>
              {/* テンプレ一覧グリッド — サイズは従来と同じ */}
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1.5">
                {filteredItems.map(renderCard)}
              </div>
              {filteredItems.length === 0 && (
                <div className="text-[11px] text-neutral-500 text-center py-6 bg-white rounded-md border border-neutral-200">
                  該当するデザインがありません。フィルタを「すべて」に戻してください。
                </div>
              )}
            </div>

            {/* 🆕 オリジナル背景アップロード枠 — 通常テンプレとは別物（自由入力系）と
                  分かるよう、専用枠で囲んで他テンプレと区別する。 */}
            {customBgItems.length > 0 && (
              <div className="rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-pink-50/40 p-4 mt-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xl shrink-0">📷</span>
                  <div>
                    <div className="text-sm font-bold text-rose-900">
                      オリジナル背景でつくる（カスタム背景）
                    </div>
                    <div className="text-[11px] text-rose-800/85 leading-relaxed">
                      <strong>テンプレートデザインではなく、オリジナルデザインをご希望の場合は、
                      カスタム背景を選択し、お持ちのデザイン画像をアップロードしてください。</strong>
                      写真・イラスト・自作のデザインを名刺の背景に使えます。
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {customBgItems.map(renderCard)}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </StepShell>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
        active
          ? "bg-neutral-900 text-white"
          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}
