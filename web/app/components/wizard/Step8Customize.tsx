"use client";

import { useState } from "react";
import { CardData, ContactPrefix, FontEffectKey, FontFamilyKey, FontRole } from "../../lib/types";
import { CardRenderer } from "../CardRenderer";
import { CardBack } from "../CardBack";
import { FONTS, FONT_EFFECTS, PALETTES, PALETTE_CATEGORIES, resolvePalette } from "../../lib/customization";
import { getTemplate } from "../../templates";
import { FrontQREditor } from "./FrontQREditor";
import { StepShell } from "./StepShell";

type Props = {
  data: CardData;
  update: (patch: Partial<CardData>) => void;
  templateId: string;
  backStyleId: string;
  /** Undo/Redo は親 Wizard で hook 化済み。カラー変更欄に直接ボタンを置くために受け取る。 */
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  /** タブ状態は親（Wizard）に保持し、「次へ」ボタンで全タブを順に通れるようにする。 */
  tab?: Tab;
  setTab?: (t: Tab) => void;
  /** カラータブ内の表/裏切替も親で持ち、「次へ」で 表面→裏面→テキスト と順送りできるようにする。 */
  colorSide?: "front" | "back";
  setColorSide?: (s: "front" | "back") => void;
  /** ステップを「カラー」「テキスト」に分割した場合、内部タブ切替バーを非表示にする。 */
  hideTabSwitcher?: boolean;
};

// カスタマイズページに残るのは「カラー」と「フォント」のみ。
//  - パターンタブ: ユーザー要望により廃止
//  - QR タブ: 新ステップ「QRコード設定」(StepQRSettings) に移設
//  - その他タブ: 連絡先の見せ方をフォントタブに統合したため廃止
// 既存データの customization.patternId は型互換のため残置するが、UI からは触らない。
export type CustomizeTab = "color" | "font";
/** Wizard 側「次へ」が順に進むためのタブ順序。 */
export const CUSTOMIZE_TABS: CustomizeTab[] = ["color", "font"];

/** カラータブ内のサブ切替 (表面 / 裏面)。 */
type ColorSide = "front" | "back";
type Tab = CustomizeTab;
type ColorRole = "bg" | "fg" | "accent" | "muted";

const COLOR_ROLE_INFO: Record<ColorRole, { label: string; emoji: string; description: string }> = {
  bg: { label: "下地（背景）", emoji: "🎨", description: "カード全体のベースの色" },
  fg: { label: "文字色", emoji: "🖋", description: "氏名・主要テキストの色" },
  accent: { label: "アクセント色", emoji: "✨", description: "ライン・枠・アイコン・装飾の色" },
  muted: { label: "サブ文字色", emoji: "🔘", description: "補足テキストや薄い情報の色" },
};

export function Step8Customize({
  data,
  update,
  templateId,
  backStyleId,
  undo,
  redo,
  canUndo,
  canRedo,
  tab: tabProp,
  setTab: setTabProp,
  colorSide: colorSideProp,
  setColorSide: setColorSideProp,
  hideTabSwitcher,
}: Props) {
  // タブ state は外部制御を優先（Wizard の「次へ」と連動）。
  // 単独利用時のフォールバックも残す。
  const [tabLocal, setTabLocal] = useState<Tab>("color");
  const tab = tabProp ?? tabLocal;
  const setTab = setTabProp ?? setTabLocal;
  // カラータブ内の表/裏切替（StepQRSettings と同じ思想で 2タブ構成）
  // 親 Wizard から制御を受け取る場合はそちらを優先（次へボタンの順送り連動）。
  const [colorSideLocal, setColorSideLocal] = useState<ColorSide>("front");
  const colorSide = colorSideProp ?? colorSideLocal;
  const setColorSide = setColorSideProp ?? setColorSideLocal;
  const c = data.customization;
  const template = getTemplate(templateId);
  const resolved = resolvePalette(data, template.swatch);

  // 裏面カラー操作ヘルパ (Step9Back から移設)
  const backColors = c.backColors;
  const setBackColor = (key: "bg" | "fg" | "accent" | "muted", value: string) =>
    update({ customization: { ...c, backColors: { ...backColors, [key]: value } } });
  const clearBackColor = (key: "bg" | "fg" | "accent" | "muted") => {
    const next = { ...backColors };
    delete next[key];
    update({ customization: { ...c, backColors: next } });
  };
  const copyAllFromFront = () => {
    update({
      customization: {
        ...c,
        backColors: {
          bg: resolved.bg,
          fg: resolved.fg,
          accent: resolved.accent,
          muted: resolved.muted,
        },
      },
    });
  };
  const resetAllBackColors = () =>
    update({ customization: { ...c, backColors: {} } });

  const setPaletteAll = (id: string) => {
    const preset = PALETTES.find((p) => p.id === id);
    if (!preset || preset.id === "auto") {
      update({ customization: { ...c, paletteId: "auto", customColors: {}, backColors: {} } });
      return;
    }
    // Setting front palette also resets back overrides so back follows front
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

  const setSingleColor = (role: ColorRole, value: string) => {
    // Front color change clears the matching back override so back follows front automatically
    const nextBack = { ...c.backColors };
    delete nextBack[role];
    update({
      customization: {
        ...c,
        paletteId: "custom",
        customColors: { ...c.customColors, [role]: value },
        backColors: nextBack,
      },
    });
  };

  const clearSingleColor = (role: ColorRole) => {
    const next = { ...c.customColors };
    delete next[role];
    update({
      customization: {
        ...c,
        paletteId: Object.keys(next).length === 0 ? "auto" : "custom",
        customColors: next,
      },
    });
  };

  const resetAllColors = () =>
    update({ customization: { ...c, paletteId: "auto", customColors: {}, backColors: {} } });

  const setFontGlobal = (id: FontFamilyKey) =>
    update({ customization: { ...c, fontGlobal: id } });

  /**
   * フォント関連の選択をすべてテンプレ既定（auto）に戻す。
   * 全体フォント＋項目別フォント上書きをまとめてリセット。
   */
  const resetAllFonts = () =>
    update({
      customization: { ...c, fontGlobal: "auto", fontPerRole: {} },
    });

  const setFontEffectGlobal = (effect: FontEffectKey) =>
    update({ customization: { ...c, fontEffectGlobal: effect } });

  const setEffectConfig = (patch: { color?: string; widthScale?: number }) =>
    update({
      customization: {
        ...c,
        fontEffectGlobalConfig: {
          ...(c.fontEffectGlobalConfig ?? {}),
          ...patch,
        },
      },
    });

  const toggleEffectExcluded = (role: FontRole) => {
    const current = c.fontEffectExcludedRoles ?? [];
    const next = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    update({ customization: { ...c, fontEffectExcludedRoles: next } });
  };

  /** 表面/裏面どちらの項目別フォントを操作するか。 */
  const setFontRole = (
    role: "name" | "nameEn" | "company" | "title" | "contact" | "tagline",
    id: FontFamilyKey,
    side: "front" | "back" = "front",
  ) =>
    update({
      customization:
        side === "front"
          ? { ...c, fontPerRole: { ...c.fontPerRole, [role]: id } }
          : {
              ...c,
              fontPerRoleBack: { ...(c.fontPerRoleBack ?? {}), [role]: id },
            },
    });

  // ※ サイズ・行間・位置の項目別調整は「最後の微調整」ステップの
  //   「🎨 自由レイアウト・エディタ」に集約しました。
  //   ここではフォント書体の選択のみ提供します。

  // パターンタブ廃止に伴い setPattern も削除。
  // patternId は型互換のため残置（既存データを壊さないため）。

  const setContactPrefix = (mode: ContactPrefix) =>
    update({ customization: { ...c, contactPrefix: mode } });

  // 裏面の連絡先見せ方 — undefined なら表面と同じ
  const setBackContactPrefix = (mode: ContactPrefix | undefined) =>
    update({ customization: { ...c, backContactPrefix: mode } });

  return (
    <StepShell
      title="自分だけのカスタマイズ"
      subtitle="色は項目ごとに細かく変えられます。下地はそのままに線だけ変えるなど、セミオーダー感覚で自由にカスタムしてください。"
    >
      <div className="lg:hidden bg-neutral-100 rounded-xl p-4 flex flex-col gap-3 items-center">
        <CardRenderer data={data} templateId={templateId} className="scale-[0.85]" />
        <CardBack data={data} templateId={templateId} backStyleId={backStyleId} className="scale-[0.85]" />
      </div>

      {/* Tab bar — pinned to the top of *this step's* content so it stays
          visible while scrolling through long customization sections, but
          appears below the global progress header. The big top offset
          (~148px) clears: top header (~64px) + step nav (~80px) + progress
          line (~4px). z-20 stays under the global z-30 header so the
          progress bar always wins on overlap. */}
      {/*
        タブメニューバー — sticky 配置で常に最上部に固定。
        背景と同化しないよう、グラデーション+太めのボーダー+はっきりした影で
        視認性を強化。アクティブタブは塗りで強調する。
      */}
      <div
        hidden={hideTabSwitcher}
        className="sticky top-[148px] sm:top-[148px] z-20 -mx-4 px-3 py-1.5 bg-gradient-to-b from-white via-white to-neutral-50 border-y-2 border-blue-200 shadow-[0_4px_10px_-2px_rgba(37,99,235,0.18)]"
      >
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(
            [
              { id: "color", label: "🎨 カラー" },
              { id: "font", label: "✒️ テキスト" },
            ] as { id: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 text-sm font-bold transition whitespace-nowrap rounded-lg ${
                tab === t.id
                  ? "bg-blue-600 text-white shadow-md scale-[1.02]"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:border-blue-400 hover:text-blue-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "color" && (
        <div className="space-y-3">
          {/* 表/裏サブタブ — StepQRSettings と同じ思想で表面と裏面の色を分けて編集 */}
          <div className="sticky top-[148px] sm:top-[148px] z-20 -mx-4 px-3 py-1.5 bg-white border-y border-blue-200 shadow-sm">
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: "front" as const, label: "表面のカラー", emoji: "🪪" },
                  { id: "back" as const, label: "裏面のカラー", emoji: "🔄" },
                ]
              ).map((t) => {
                const active = colorSide === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setColorSide(t.id)}
                    className={`flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-md border transition ${
                      active
                        ? "bg-blue-600 border-blue-700 text-white shadow"
                        : "bg-white border-neutral-200 text-neutral-700 hover:border-blue-400"
                    }`}
                    aria-current={active ? "true" : undefined}
                  >
                    <span className="text-base leading-none">{t.emoji}</span>
                    <span className="text-[10px] font-bold leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 操作履歴の Undo/Redo — 色を変えたあと「やっぱり前のに戻したい」を
              1クリックで叶えるためのバー。⌘Z / Ctrl+Z でも同じ動作。 */}
          {(undo || redo) && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50/40 px-3 py-2">
              <div className="text-[11px] text-blue-900 leading-tight">
                <span className="font-bold">↶ 1つ戻す / ↷ 1つ進める</span>
                <span className="hidden sm:inline text-blue-700/70"> — 色変更などをやり直せます（⌘Z / Ctrl+Z）</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => undo?.()}
                  disabled={!canUndo}
                  className="flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
                  title="1つ前の状態に戻す（⌘Z / Ctrl+Z）"
                >
                  <span className="text-base leading-none">↶</span>
                  <span>1つ戻す</span>
                </button>
                <button
                  type="button"
                  onClick={() => redo?.()}
                  disabled={!canRedo}
                  className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-white border-2 border-blue-400 hover:bg-blue-50 px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400"
                  title="やり直し（⌘Shift+Z / Ctrl+Y）"
                >
                  <span>1つ進める</span>
                  <span className="text-base leading-none">↷</span>
                </button>
              </div>
            </div>
          )}

          {/* 表面カラー UI 群 — 既存の Per-color picker / プリセットパレット など */}
          {colorSide === "front" && (
          <>
          {/* Per-color picker (PRIMARY) */}
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-neutral-900">🎯 項目ごとに色を選ぶ（セミオーダー）</div>
                <div className="text-[11px] text-neutral-600 mt-0.5">
                  下地・文字・アクセント・サブ文字をそれぞれ独立して変更できます
                  <br />
                  <span className="text-[10px] text-blue-700">表面の色を変えると、裏面も自動で同じ色に連動します</span>
                </div>
              </div>
              <button
                type="button"
                onClick={resetAllColors}
                title="下地・文字・アクセント・サブ文字をテンプレ既定（デフォルト）の色に戻します"
                className="text-[10px] font-semibold text-blue-700 bg-white hover:bg-blue-50 px-2 py-0.5 rounded-full border border-blue-300 hover:border-blue-500 transition shrink-0"
              >
                ↺ デフォルト
              </button>
            </div>

            <div className="grid gap-3">
              {(Object.keys(COLOR_ROLE_INFO) as ColorRole[]).map((role) => {
                const info = COLOR_ROLE_INFO[role];
                const currentValue = (c.customColors[role] ?? resolved[role]) || "#000000";
                const isCustomized = !!c.customColors[role];
                return (
                  <div
                    key={role}
                    className={`rounded-lg border-2 p-3 transition bg-white ${
                      isCustomized ? "border-blue-500 shadow-sm" : "border-neutral-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <label
                        className="relative w-12 h-12 rounded-lg border border-neutral-300 cursor-pointer overflow-hidden shrink-0"
                        style={{ backgroundColor: currentValue }}
                      >
                        <input
                          type="color"
                          value={normalizeHex(currentValue)}
                          onChange={(e) => setSingleColor(role, e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </label>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{info.emoji}</span>
                          <span className="text-sm font-semibold text-neutral-900">{info.label}</span>
                          {isCustomized && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                              カスタム
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">{info.description}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            value={c.customColors[role] ?? ""}
                            onChange={(e) => {
                              const v = e.target.value.trim();
                              if (v === "") clearSingleColor(role);
                              else if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setSingleColor(role, v);
                            }}
                            placeholder={resolved[role]}
                            className="flex-1 px-2 py-1 rounded border border-neutral-300 text-xs font-mono"
                          />
                          {isCustomized && (
                            <button
                              type="button"
                              onClick={() => clearSingleColor(role)}
                              className="text-[10px] text-neutral-500 hover:text-red-600 px-2 py-1"
                            >
                              リセット
                            </button>
                          )}
                        </div>
                        <div className="text-[9px] text-neutral-400 mt-1.5 flex items-center gap-2 flex-wrap">
                          <span className="font-mono">HEX: {normalizeHex(currentValue).toUpperCase()}</span>
                          <span className="font-mono">RGB: {hexToRgb(currentValue)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preset palettes (SECONDARY) */}
          <details className="rounded-xl border border-neutral-200 p-4 group">
            <summary className="cursor-pointer text-sm font-semibold text-neutral-800 select-none flex items-center justify-between">
              <span>🎁 プリセットパレットから一括設定</span>
              <span className="text-neutral-400 group-open:rotate-180 transition">▾</span>
            </summary>
            <div className="mt-3 space-y-3">
              <div className="text-[11px] text-neutral-500">
                4色がまとめて設定されます。お気に入りの組み合わせから始めて、上で個別に微調整するのがおすすめ。
              </div>
              {PALETTE_CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    {cat.label}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {PALETTES.filter((p) => p.category === cat.id).map((p) => {
                      const selected = c.paletteId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPaletteAll(p.id)}
                          className={`flex flex-col items-start gap-1 p-2 rounded-lg border-2 transition ${
                            selected ? "border-blue-600 shadow" : "border-neutral-200 hover:border-neutral-400"
                          }`}
                        >
                          <div className="flex w-full h-5 rounded overflow-hidden">
                            <div className="flex-1" style={{ backgroundColor: p.bg }} />
                            <div className="flex-1" style={{ backgroundColor: p.fg }} />
                            <div className="flex-1" style={{ backgroundColor: p.accent }} />
                          </div>
                          <div className="text-[10px] text-neutral-700 leading-tight font-medium">{p.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </details>
          </>
          )}

          {/* 裏面カラー UI — 旧 Step9Back から移設。
              backColors が未設定の項目は表面カラーにフォールバック表示。 */}
          {colorSide === "back" && (
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50/30 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="text-sm font-bold text-neutral-900">
                    🔄 裏面の色を表面と別に変える
                  </div>
                  <div className="text-[11px] text-neutral-600 mt-0.5">
                    表面と裏面の色を分けたい場合に使います。何も設定しなければ表面と同じ色になります。
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={copyAllFromFront}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-amber-300 text-amber-800 bg-white hover:bg-amber-50"
                  >
                    📋 表面の色を全てコピー
                  </button>
                  {Object.keys(backColors).length > 0 && (
                    <button
                      type="button"
                      onClick={resetAllBackColors}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-neutral-300 text-neutral-600 bg-white hover:bg-neutral-50"
                    >
                      ↩ 表面と連動に戻す
                    </button>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                {(Object.keys(COLOR_ROLE_INFO) as ColorRole[]).map((role) => {
                  const info = COLOR_ROLE_INFO[role];
                  const current = (backColors[role] ?? resolved[role]) || "#000000";
                  const overridden = !!backColors[role];
                  return (
                    <div
                      key={role}
                      className={`flex items-start gap-3 p-2 rounded-lg border-2 bg-white ${
                        overridden ? "border-amber-500 shadow-sm" : "border-neutral-200"
                      }`}
                    >
                      <label
                        className="relative w-10 h-10 rounded-md border border-neutral-300 cursor-pointer overflow-hidden shrink-0"
                        style={{ backgroundColor: current }}
                      >
                        <input
                          type="color"
                          value={normalizeHex(current)}
                          onChange={(e) => setBackColor(role, e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </label>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm">{info.emoji}</span>
                          <span className="text-xs font-semibold text-neutral-900">
                            裏面の{info.label}
                          </span>
                          {overridden ? (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                              独立
                            </span>
                          ) : (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-neutral-100 text-neutral-500 font-medium">
                              表面と同じ
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-500 leading-tight mt-0.5">
                          {info.description}
                        </div>
                        <div className="text-[9px] font-mono text-neutral-400 mt-1">
                          {normalizeHex(current).toUpperCase()}
                        </div>
                      </div>
                      {overridden && (
                        <button
                          type="button"
                          onClick={() => clearBackColor(role)}
                          className="text-[9px] px-2 py-1 rounded border border-neutral-200 text-neutral-500 bg-white hover:bg-neutral-50 whitespace-nowrap"
                          title="表面と連動に戻す"
                        >
                          連動に戻す
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "font" && (
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-900 leading-relaxed">
            💡 <strong>全体のフォントサイズ</strong>は次の「🎚 微調整」ページで変更できます。
            ここでは書体（フォント）と項目別の細かい調整を行ってください。
          </div>

          {/* 全体フォント + 全体テキストエフェクト を横並びに配置。
              両ブロックとも同じ装飾枠（rounded-xl + border-2 + bg）で揃え、
              items-stretch（grid 既定）で縦サイズを揃える。
              エフェクト側は各行を flex-1 で配分して、フォント側の高さに自動追随。 */}
          <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-4 flex flex-col h-full">
            <div className="mb-2 shrink-0">
              <div className="text-sm font-bold text-neutral-900">
                ✒️ 全体のフォント
              </div>
            </div>
            {/* ユーザー要望: スクロールなしで全フォントを一覧化。
                内側の max-h と overflow を廃止し、行数が多い場合は親が伸びる。 */}
            <div className="grid grid-cols-2 gap-1.5 pr-1">
              {FONTS.map((f) => {
                const selected = c.fontGlobal === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFontGlobal(f.id)}
                    title={f.description}
                    className={`flex items-start gap-1.5 p-1.5 rounded border text-left transition ${
                      selected ? "border-blue-500 bg-blue-50/50 shadow-sm" : "border-neutral-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${selected ? "bg-blue-500" : "bg-neutral-200"}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] font-semibold leading-tight truncate ${selected ? "text-blue-700" : "text-neutral-900"}`}>
                        {f.name}{selected && <span className="ml-1 text-[9px] text-blue-600">✓</span>}
                      </div>
                      <div
                        className="text-[11px] mt-0.5 truncate text-neutral-700"
                        style={{ fontFamily: f.cssFamily, fontWeight: f.weight, letterSpacing: f.letterSpacing }}
                      >
                        Aa あ亜 123
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border-2 border-pink-200 bg-pink-50/30 p-4 flex flex-col h-full">
            <div className="text-sm font-bold text-neutral-900 mb-2 shrink-0">
              ✨ 全体のテキストエフェクト
            </div>
            {/*
              エフェクト一覧 — 横長の行を縦に並べて、見本テキストと名前を
              横並びで一望できる構成。各行 flex-1 で残り高さを均等配分し、
              全体フォントブロック(隣)と縦サイズを一致させる。
            */}
            <div className="flex flex-col gap-1 flex-1 min-h-0">
              {FONT_EFFECTS.map((fx) => {
                const selected = (c.fontEffectGlobal ?? "none") === fx.id;
                const styleMap: Record<string, React.CSSProperties> = {
                  none: {},
                  "shadow-soft": { textShadow: "0 1px 3px rgba(0,0,0,0.25)" },
                  "shadow-hard": { textShadow: "2px 2px 0 #ec4899" },
                  outline: {
                    textShadow:
                      "-1px 0 #ec4899, 1px 0 #ec4899, 0 -1px #ec4899, 0 1px #ec4899",
                  },
                  neon: {
                    textShadow: "0 0 4px #ec4899, 0 0 10px #ec4899, 0 0 18px #ec4899",
                  },
                  glow: {
                    textShadow: "0 0 6px currentColor, 0 0 12px rgba(0,0,0,0.5)",
                  },
                  emboss: {
                    textShadow:
                      "1px 1px 0 rgba(255,255,255,0.55), -1px -1px 0 rgba(0,0,0,0.35)",
                  },
                  letterpress: {
                    textShadow:
                      "0 1px 0 rgba(255,255,255,0.6), 0 -1px 0 rgba(0,0,0,0.35)",
                  },
                  gradient: {
                    background: "linear-gradient(135deg, #171717, #ec4899)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  },
                  highlight: {
                    background: "rgba(236,72,153,0.55)",
                    boxShadow:
                      "0.15em 0 0 rgba(236,72,153,0.55), -0.15em 0 0 rgba(236,72,153,0.55)",
                  },
                  underline: {
                    textDecoration: "underline 0.1em #ec4899",
                    textUnderlineOffset: "0.18em",
                  },
                };
                return (
                  <button
                    key={fx.id}
                    type="button"
                    onClick={() => setFontEffectGlobal(fx.id)}
                    title={fx.description}
                    className={`flex-1 min-h-[32px] flex items-center gap-2 px-2.5 py-1 rounded-md border transition text-left ${
                      selected
                        ? "border-pink-500 bg-white shadow-sm"
                        : "border-neutral-200 bg-white hover:border-pink-400"
                    }`}
                  >
                    {/* 選択インジケーター（左端） */}
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        selected ? "bg-pink-500" : "bg-neutral-200"
                      }`}
                    />
                    {/* 見本テキスト（中央左） */}
                    <span
                      className="text-[13px] font-bold tracking-wide leading-none shrink-0"
                      style={styleMap[fx.id] ?? {}}
                    >
                      Aa 山田
                    </span>
                    {/* エフェクト名（残り幅を使う） */}
                    <span
                      className={`flex-1 min-w-0 text-[11px] truncate ${
                        selected ? "font-bold text-pink-700" : "text-neutral-700"
                      }`}
                    >
                      {fx.label}
                    </span>
                    {selected && (
                      <span className="text-[9px] text-pink-600 font-bold shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Effect color & width fine-tuning — only when active */}
            {(c.fontEffectGlobal ?? "none") !== "none" && (
              <div className="rounded-lg bg-white border border-pink-200 p-3 space-y-2.5 mb-2">
                <div className="text-[11px] font-semibold text-neutral-900">
                  🎨 エフェクトの調整
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-600 font-mono w-12">影の色</span>
                  <input
                    type="color"
                    value={c.fontEffectGlobalConfig?.color || "#ec4899"}
                    onChange={(e) => setEffectConfig({ color: e.target.value })}
                    className="w-10 h-7 rounded border border-neutral-300 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setEffectConfig({ color: undefined })}
                    className="text-[10px] text-neutral-500 hover:text-neutral-900 underline"
                    title="アクセントカラーを使う"
                  >
                    アクセント色を使う
                  </button>
                  <span className="text-[10px] text-neutral-500 ml-auto">
                    {c.fontEffectGlobalConfig?.color || "（アクセント）"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-600 font-mono w-12">幅・強さ</span>
                  <input
                    type="range"
                    min={0.3}
                    max={3}
                    step={0.1}
                    value={c.fontEffectGlobalConfig?.widthScale ?? 1}
                    onChange={(e) => setEffectConfig({ widthScale: parseFloat(e.target.value) })}
                    className="flex-1 accent-pink-600"
                  />
                  <span className="text-[10px] text-neutral-700 font-mono w-10 text-right">
                    {(c.fontEffectGlobalConfig?.widthScale ?? 1).toFixed(1)}x
                  </span>
                  {(c.fontEffectGlobalConfig?.widthScale ?? 1) !== 1 && (
                    <button
                      type="button"
                      onClick={() => setEffectConfig({ widthScale: 1 })}
                      className="text-[9px] text-neutral-500 hover:text-neutral-900 px-1"
                      title="標準に戻す"
                    >
                      ↩
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-neutral-500 leading-relaxed">
                  影の色や濃さを変えるとエフェクトの印象が大きく変わります。「アクセント色を使う」で配色と統一できます。
                </div>
              </div>
            )}

            {/* Apply-to checklist — only show when an effect is active. */}
            {(c.fontEffectGlobal ?? "none") !== "none" && (
              <div className="rounded-lg bg-white border border-pink-200 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-neutral-900">
                    🎯 エフェクトを適用する項目
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          customization: { ...c, fontEffectExcludedRoles: [] },
                        })
                      }
                      className="text-[10px] text-pink-700 hover:text-pink-900 underline"
                    >
                      全部に適用
                    </button>
                    <span className="text-[10px] text-neutral-300">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          customization: {
                            ...c,
                            fontEffectExcludedRoles: [
                              "name",
                              "nameEn",
                              "company",
                              "title",
                              "contact",
                              "tagline",
                            ],
                          },
                        })
                      }
                      className="text-[10px] text-neutral-500 hover:text-neutral-900 underline"
                    >
                      全部解除
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(
                    [
                      { role: "name", label: "氏名（漢字）" },
                      { role: "nameEn", label: "氏名（英）" },
                      { role: "company", label: "屋号・会社" },
                      { role: "title", label: "肩書き" },
                      { role: "tagline", label: "キャッチコピー" },
                      { role: "contact", label: "連絡先" },
                    ] as { role: FontRole; label: string }[]
                  ).map(({ role, label }) => {
                    const excluded = (c.fontEffectExcludedRoles ?? []).includes(role);
                    const checked = !excluded;
                    return (
                      <label
                        key={role}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border cursor-pointer transition ${
                          checked
                            ? "border-pink-400 bg-pink-50/60 text-neutral-900"
                            : "border-neutral-200 bg-white text-neutral-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEffectExcluded(role)}
                          className="accent-pink-600"
                        />
                        <span className="text-[11px] font-medium">{label}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="text-[10px] text-neutral-500 leading-relaxed">
                  チェックを外した項目はエフェクトが適用されません。デフォルトはすべての項目にON。
                </div>
              </div>
            )}
          </div>
          </div>{/* /grid A+B */}

          {/*
            項目別フォント — ブロック内オーバーフロー対策のため
            表面/裏面を「上下に積む」レイアウトに変更（旧 md:grid-cols-2 → 縦並び）。
            各カードは固定行構成:
              [emoji] [ラベル + バッジ]  [サンプル text]  [select]
            すべて min-w-0 + truncate で枠内に確実に収まるよう調整。
          */}
          {(() => {
            // setFontRole の引数型に合わせた狭めの Role 型 (phone/email/address/website は除外)
            type PerRoleKey = "name" | "nameEn" | "company" | "title" | "contact" | "tagline";
            const ROLES: { role: PerRoleKey; label: string; emoji: string; fallback: string }[] = [
              { role: "name", label: "氏名（漢字）", emoji: "🪪", fallback: "山田 太郎" },
              { role: "nameEn", label: "氏名（ローマ字）", emoji: "🔤", fallback: "Taro Yamada" },
              { role: "company", label: "屋号・会社名", emoji: "🏢", fallback: "YAMADA DESIGN" },
              { role: "title", label: "肩書き", emoji: "💼", fallback: "Web デザイナー" },
              { role: "tagline", label: "キャッチコピー（スローガン）", emoji: "💬", fallback: "Design that moves people." },
              { role: "contact", label: "連絡先", emoji: "📞", fallback: "090-1234-5678" },
            ];
            const userValueOf = (role: PerRoleKey): string | undefined => {
              if (role === "name") return data.nameJa;
              if (role === "nameEn") return data.nameEn;
              if (role === "company") return data.company;
              if (role === "title") return data.title;
              if (role === "tagline") return data.tagline;
              if (role === "contact") return data.phone || data.email;
              return undefined;
            };

            const renderRoleRow = (
              args: {
                role: PerRoleKey;
                label: string;
                emoji: string;
                fallback: string;
                sel: string;
                effectiveId: string;
                onChange: (id: FontFamilyKey) => void;
                extraOption?: { value: string; label: string }[];
                showAutoBadge?: boolean;
              },
            ) => {
              const { role, label, emoji, fallback, sel, effectiveId, onChange, extraOption, showAutoBadge } = args;
              const font = FONTS.find((f) => f.id === effectiveId) ?? FONTS[0];
              const userValue = userValueOf(role);
              const sampleText = userValue?.trim() ? userValue : fallback;
              const isUserData = !!userValue?.trim();
              return (
                <div
                  key={role}
                  className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-white border border-neutral-200 min-w-0"
                >
                  {/* 左: emoji + ラベル + バッジ（1行・コンパクト） */}
                  <span className="text-sm leading-none shrink-0">{emoji}</span>
                  <span className="text-[11px] font-semibold text-neutral-900 shrink-0 whitespace-nowrap leading-tight">
                    {label}
                  </span>
                  {isUserData && (
                    <span className="text-[8px] px-1 rounded bg-emerald-100 text-emerald-700 font-bold shrink-0 leading-tight">
                      ✓
                    </span>
                  )}
                  {showAutoBadge && sel === "auto" && (
                    <span className="text-[8px] px-1 rounded bg-amber-100 text-amber-700 font-bold shrink-0 leading-tight">
                      表と同じ
                    </span>
                  )}
                  {/* 中央: サンプル text（残り幅、truncate） */}
                  <span
                    className="flex-1 min-w-0 truncate text-[10px] text-neutral-400 italic"
                    style={{
                      fontFamily: font.cssFamily,
                      fontWeight: font.weight,
                      letterSpacing: font.letterSpacing,
                    }}
                    title={sampleText}
                  >
                    {sampleText || fallback}
                  </span>
                  {/* 右: select(プルダウンは常に右端) */}
                  <select
                    className="ml-auto px-1.5 py-0.5 rounded border border-neutral-300 text-[10px] w-[140px] shrink-0 bg-white"
                    value={sel}
                    onChange={(e) => onChange(e.target.value as FontFamilyKey)}
                  >
                    {extraOption?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                    {FONTS.filter((f) => !extraOption || f.id !== "auto").map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            };

            return (
              <div className="space-y-3">
                {/* 表面 */}
                <div className="rounded-xl border-2 border-purple-200 bg-purple-50/30 p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="text-sm font-bold text-neutral-900">
                      ✏️ 項目ごとに別のフォントを使う
                      <span className="ml-2 text-[10px] font-normal text-neutral-500">
                        （表面）
                      </span>
                    </div>
                    <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-purple-600 text-white shrink-0">
                      FRONT
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-600 mb-3 leading-snug">
                    氏名は明朝、屋号は筆記体、連絡先はモダンサンセリフ…のように混ぜられます。
                    「テンプレ標準」のままなら全体フォントが使われます。
                  </div>
                  <div className="flex flex-col gap-2">
                    {ROLES.map(({ role, label, emoji, fallback }) => {
                      const sel = c.fontPerRole[role] ?? "auto";
                      return renderRoleRow({
                        role,
                        label,
                        emoji,
                        fallback,
                        sel,
                        effectiveId: sel,
                        onChange: (id) => setFontRole(role, id),
                      });
                    })}
                  </div>
                </div>

                {/* 裏面 */}
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50/30 p-4">
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="text-sm font-bold text-neutral-900">
                      🔄 裏面の項目ごとのフォント
                      <span className="ml-2 text-[10px] font-normal text-neutral-500">
                        （裏面だけ別書体）
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => update({ customization: { ...c, fontPerRoleBack: {} } })}
                        disabled={!c.fontPerRoleBack || Object.keys(c.fontPerRoleBack).length === 0}
                        className="text-[10px] px-2 py-0.5 rounded-full border border-amber-300 text-amber-800 bg-white hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        title="裏面の項目別フォント上書きを全てクリア"
                      >
                        ↺ 裏面リセット
                      </button>
                      <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-600 text-white">
                        BACK
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-neutral-600 mb-3 leading-snug">
                    未指定（テンプレ標準）の項目は<strong>表面の設定にフォールバック</strong>します。
                  </div>
                  <div className="flex flex-col gap-2">
                    {ROLES.map(({ role, label, emoji, fallback }) => {
                      const sel = c.fontPerRoleBack?.[role] ?? "auto";
                      const effectiveId =
                        sel !== "auto" ? sel : c.fontPerRole[role] ?? c.fontGlobal;
                      return renderRoleRow({
                        role,
                        label,
                        emoji,
                        fallback,
                        sel,
                        effectiveId,
                        onChange: (id) => setFontRole(role, id, "back"),
                        extraOption: [{ value: "auto", label: "— 表面と同じ —" }],
                        showAutoBadge: true,
                      });
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 連絡先の見せ方 (表面 / 裏面) — フォントタブ末尾に統合。
              旧「その他」タブから移設。表面=青、裏面=琥珀の横並び2ブロック構成。 */}
          <div className="grid gap-3 md:grid-cols-2">
            {/* 表面 */}
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[12px] font-bold text-blue-900">
                  📞 連絡先の見せ方（表面）
                </div>
                <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-600 text-white">
                  FRONT
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: "icon" as ContactPrefix, label: "🎯 アイコン", desc: "推奨" },
                    { id: "text" as ContactPrefix, label: "Aa テキスト", desc: "T. E." },
                    { id: "minimal" as ContactPrefix, label: "— なし", desc: "ラベル無" },
                  ]
                ).map((opt) => {
                  const selected = c.contactPrefix === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setContactPrefix(opt.id)}
                      className={`flex flex-col items-start gap-0.5 p-2 rounded-md border text-left transition ${
                        selected
                          ? "border-blue-600 bg-blue-50 shadow-sm"
                          : "border-neutral-200 bg-white hover:border-blue-400"
                      }`}
                    >
                      <div className="text-[11px] font-semibold">{opt.label}</div>
                      <div className="text-[9px] text-neutral-500">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* 裏面 — 表面と同じ3択構成（「表と同じ」選択は廃止） */}
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[12px] font-bold text-amber-900">
                  📞 連絡先の見せ方（裏面）
                </div>
                <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-600 text-white">
                  BACK
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: "icon" as ContactPrefix, label: "🎯 アイコン", desc: "推奨" },
                    { id: "text" as ContactPrefix, label: "Aa テキスト", desc: "T. E." },
                    { id: "minimal" as ContactPrefix, label: "— なし", desc: "ラベル無" },
                  ]
                ).map((opt) => {
                  // backContactPrefix が未指定の場合は表面 (contactPrefix) を初期表示
                  const effective = c.backContactPrefix ?? c.contactPrefix;
                  const selected = effective === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBackContactPrefix(opt.id)}
                      className={`flex flex-col items-start gap-0.5 p-2 rounded-md border text-left transition ${
                        selected
                          ? "border-amber-600 bg-amber-50 shadow-sm"
                          : "border-neutral-200 bg-white hover:border-amber-400"
                      }`}
                    >
                      <div className="text-[11px] font-semibold">{opt.label}</div>
                      <div className="text-[9px] text-neutral-500">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 📍 住所の配置 — テキストタブ末尾に移設（旧 微調整ステップから）。
              下に小さな注意書きを併設。 */}
          <div className="rounded-xl border-2 border-purple-200 bg-purple-50/30 p-3">
            <div className="text-sm font-bold text-neutral-900 mb-1">📍 住所の配置</div>
            <div className="text-[11px] text-neutral-600 mb-2 leading-snug">
              郵便番号と住所をどう並べるか選べます
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    id: "inline" as const,
                    label: "横並び",
                    preview: "〒150-0001  東京都渋谷区...",
                    description: "1行に収まり、コンパクト",
                  },
                  {
                    id: "stacked" as const,
                    label: "上下分け",
                    preview: "〒150-0001\n東京都渋谷区...",
                    description: "2行に分けて、読みやすい",
                  },
                ]
              ).map((opt) => {
                const fa = data.customization.fineAdjust;
                const selected = (fa.addressLayout ?? "inline") === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      update({
                        customization: {
                          ...data.customization,
                          fineAdjust: { ...fa, addressLayout: opt.id },
                        },
                      })
                    }
                    className={`flex flex-col items-start gap-1 p-2.5 rounded-lg border-2 transition text-left ${
                      selected
                        ? "border-purple-600 bg-white shadow-sm"
                        : "border-neutral-200 bg-white hover:border-purple-400"
                    }`}
                  >
                    <div className="text-[12px] font-semibold text-neutral-900">{opt.label}</div>
                    <div className="text-[10px] text-neutral-500">{opt.description}</div>
                    <div
                      className="mt-0.5 px-1.5 py-0.5 rounded bg-neutral-50 text-[9px] text-neutral-700 font-mono leading-tight"
                      style={{ whiteSpace: "pre-line" }}
                    >
                      {opt.preview}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* 小さな注意書き — 住所配置の直下 */}
            <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 leading-snug">
              ✏️ <strong>改行を入れたい場合:</strong> 住所欄で Enter キーを押すと改行できます。
            </div>
          </div>
        </div>
      )}

      {/*
        旧「📱 表面QR」タブは QR ステップ (StepQRSettings) に、
        旧「⚙️ その他」タブの内容（連絡先の見せ方）は フォントタブ末尾に統合した。
        オーバーレイ調整・RGB 解説などは UI を簡素化するため一旦撤去。
        必要なら後日 画像アップロード周辺へ復活可。
      */}
    </StepShell>
  );
}

function normalizeHex(value: string): string {
  if (!value) return "#000000";
  if (value.startsWith("#") && (value.length === 7 || value.length === 4)) return value;
  return "#000000";
}

function hexToRgb(hex: string): string {
  const h = normalizeHex(hex);
  const trimmed = h.startsWith("#") ? h.slice(1) : h;
  if (trimmed.length === 3) {
    const r = parseInt(trimmed[0] + trimmed[0], 16);
    const g = parseInt(trimmed[1] + trimmed[1], 16);
    const b = parseInt(trimmed[2] + trimmed[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  if (trimmed.length === 6) {
    const r = parseInt(trimmed.slice(0, 2), 16);
    const g = parseInt(trimmed.slice(2, 4), 16);
    const b = parseInt(trimmed.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return "—";
}
