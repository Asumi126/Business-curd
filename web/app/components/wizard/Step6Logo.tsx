"use client";

import { CardData } from "../../lib/types";
import { LogoUploader } from "../LogoUploader";
import { PhotoUploader } from "../PhotoUploader";
import { CustomBackgroundUploader } from "../CustomBackgroundUploader";
import { CustomBgTemplateLibrary } from "../CustomBgTemplateLibrary";
import { StepShell } from "./StepShell";

/**
 * アップロード/挿入の代わりに「使わない/挿入しない」と明示するための
 * 目立つチェックボックスバッジ。ON にすると赤いタグ風表示、OFF は薄め。
 * アップロードボタンのすぐ横に置くことで、ユーザーが必ず気づくようにする。
 */
function SkipBadge({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`mb-3 inline-flex items-center gap-2 cursor-pointer rounded-md border-2 px-2.5 py-1.5 transition select-none ${
        checked
          ? "border-red-500 bg-red-50 text-red-800 shadow-sm"
          : "border-red-300 bg-white text-red-700 hover:bg-red-50/60"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 shrink-0 accent-red-600"
      />
      <span className="text-[11px] font-bold leading-tight whitespace-nowrap">
        {checked ? "✓ " : "⚠ "}
        {label}
      </span>
    </label>
  );
}

export type ImageTab = "logo" | "photo" | "background";

/** 「次へ」ボタン挙動のために Wizard が共有する全タブ順序。 */
export const IMAGE_TABS: ImageTab[] = ["logo", "photo", "background"];

type Props = {
  data: CardData;
  update: (patch: Partial<CardData>) => void;
  templateId: string;
  setTemplateId: (id: string) => void;
  /** タブ状態は親（Wizard）が持つ。「次へ」ボタンが順に進められる。 */
  imageTab: ImageTab;
  setImageTab: (t: ImageTab) => void;
};

export function Step6Logo({ data, update, templateId, setTemplateId, imageTab, setImageTab }: Props) {
  // 旧「ロゴがない場合の扱い」UI は廃止。
  // ロゴ画像のアップロードが無ければ「ロゴなし」で統一して書き出される。
  // monogramStyle は型互換のため残置されているが UI からは触らない。

  // タブ状態は親(Wizard)で持ち、「次へ」「戻る」ボタンが
  // ロゴ → 写真・装飾 → カスタム背景 と順に進められるよう連動する。
  // 旧来あったテンプレに基づく自動タブ切替は、ユーザーの 次へ 操作と
  // 衝突するため廃止した。

  const tabs: { id: ImageTab; emoji: string; label: string; hint: string; ready: boolean }[] = [
    {
      id: "logo",
      emoji: "🖼",
      label: "ロゴ",
      hint: "会社・屋号のロゴ画像（透過PNG推奨）",
      ready: !!data.logoDataUrl,
    },
    {
      id: "photo",
      emoji: "👤",
      label: "顔写真・装飾",
      hint: "プロフィール写真や装飾素材（15配置から選択）",
      ready: !!data.profilePhoto,
    },
    {
      id: "background",
      emoji: "📷",
      label: "カスタム背景",
      hint: "名刺全体の背景画像（風景・パターン等）",
      ready: !!data.customBackground,
    },
  ];

  return (
    <StepShell
      title="画像をアップロード（任意）"
      subtitle="ロゴ・顔写真・背景画像をまとめてここで管理。タブで切り替えて使う画像だけ設定。"
    >
      <div className="rounded-xl border-2 border-neutral-200 bg-white p-3 sm:p-4 space-y-3">
        <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.2em]">
          📂 画像の種類を選んでアップロード
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setImageTab(t.id)}
              className={`relative p-2.5 sm:p-3 rounded-lg border-2 text-left transition ${
                imageTab === t.id
                  ? "border-blue-600 bg-blue-50/40 shadow-sm"
                  : "border-neutral-200 bg-white hover:border-neutral-400"
              }`}
            >
              {t.ready && (
                <span
                  className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white text-[8px] font-bold"
                  title="アップロード済み"
                >
                  ✓
                </span>
              )}
              <div className="text-base sm:text-lg mb-0.5">{t.emoji}</div>
              <div
                className={`text-xs sm:text-sm font-bold ${
                  imageTab === t.id ? "text-blue-700" : "text-neutral-900"
                }`}
              >
                {t.label}
              </div>
              <div className="text-[9px] sm:text-[10px] text-neutral-500 mt-0.5 leading-tight">
                {t.hint}
              </div>
            </button>
          ))}
        </div>

        {/* Selected uploader */}
        <div className="pt-3 border-t border-neutral-100">
          {imageTab === "logo" && (
            <>
              {/* スキップ宣言を最上部に大きく赤く表示。アップロードボタンの真横に
                  目立つ赤バッジ風で配置し、見落とし防止。 */}
              <SkipBadge
                label="ロゴをアップロードしない"
                checked={!!data.logoSkipped}
                onChange={(v) => update({ logoSkipped: v })}
              />
              <LogoUploader
                value={data.logoDataUrl}
                onChange={(v) => update({ logoDataUrl: v })}
                data={data}
                templateId={templateId}
                updateData={update}
              />
            </>
          )}
          {imageTab === "photo" && (
            <>
              <SkipBadge
                label="顔写真・装飾画像を挿入しない"
                checked={!!data.photoSkipped}
                onChange={(v) => update({ photoSkipped: v })}
              />
              <PhotoUploader
                value={data.profilePhoto}
                position={data.photoPosition}
                onChange={(v) => {
                  update({ profilePhoto: v });
                  if (v && templateId !== "photo-card" && templateId !== "custom-background") {
                    setTemplateId("photo-card");
                  }
                }}
                onPositionChange={(p) => update({ photoPosition: p })}
                data={data}
                templateId={templateId}
                setTemplateId={setTemplateId}
                updateData={update}
              />
            </>
          )}
          {imageTab === "background" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-pink-50 border border-pink-200 px-3 py-2 text-[11px] text-pink-900 leading-relaxed">
                💡 <strong>表面・裏面それぞれ別の画像</strong>をアップロードできます。
                どちらか片方でも、両方でもOK。
              </div>

              {/*
                両面カスタム背景を一括で「使わない」と宣言できる赤バッジ。
                ON にすると表面・裏面の両方の skip フラグが立ち、ユーザは
                各ブロックの個別チェックを操作しなくても完了扱いに。
                OFF に戻したいときは個別ブロック側のチェックでも調整可能。
              */}
              <SkipBadge
                label="両面ともカスタム背景をアップロードしない（一括）"
                checked={!!data.customBackgroundSkipped && !!data.backCustomBackgroundSkipped}
                onChange={(v) =>
                  update({
                    customBackgroundSkipped: v,
                    backCustomBackgroundSkipped: v,
                  })
                }
              />

              {/* 表面のカスタム背景 */}
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-3">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="text-[12px] font-bold text-blue-900">
                    🪪 表面のカスタム背景
                  </div>
                  <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-600 text-white shrink-0">
                    FRONT
                  </span>
                </div>
                {/* スキップ宣言を最上部に — 「使わない」を選びたい人がパッと気付ける位置 */}
                <SkipBadge
                  label="表面のカスタム背景をアップロードしない"
                  checked={!!data.customBackgroundSkipped}
                  onChange={(v) => update({ customBackgroundSkipped: v })}
                />
                <CustomBgTemplateLibrary
                  currentDataUrl={data.customBackground}
                  onPick={(dataUrl) => {
                    update({ customBackground: dataUrl });
                    if (templateId !== "custom-background") {
                      setTemplateId("custom-background");
                    }
                  }}
                />
                <CustomBackgroundUploader
                  value={data.customBackground}
                  opacity={data.customBackgroundOpacity ?? 1}
                  onChange={(v) => {
                    update({ customBackground: v });
                    if (v && templateId !== "custom-background") {
                      setTemplateId("custom-background");
                    }
                  }}
                  onOpacityChange={(v) => update({ customBackgroundOpacity: v })}
                  textAlign={data.customization.customBgTextAlign ?? "bottom-left"}
                  textOffsetXmm={data.customization.customBgTextOffsetXmm ?? 0}
                  textOffsetYmm={data.customization.customBgTextOffsetYmm ?? 0}
                  onTextAlignChange={(a) =>
                    update({
                      customization: { ...data.customization, customBgTextAlign: a },
                    })
                  }
                  onTextOffsetChange={(x, y) =>
                    update({
                      customization: {
                        ...data.customization,
                        customBgTextOffsetXmm: x,
                        customBgTextOffsetYmm: y,
                      },
                    })
                  }
                  overlayEnabled={data.customization.overlayEnabled !== false}
                  overlayColor={data.customization.overlayColor ?? "#000000"}
                  overlayOpacity={data.customization.overlayOpacity ?? 0.4}
                  onOverlayChange={(patch) =>
                    update({
                      customization: {
                        ...data.customization,
                        ...(patch.enabled !== undefined && { overlayEnabled: patch.enabled }),
                        ...(patch.color !== undefined && { overlayColor: patch.color }),
                        ...(patch.opacity !== undefined && { overlayOpacity: patch.opacity }),
                      },
                    })
                  }
                  data={data}
                  templateId={templateId}
                />
              </div>

              {/* 裏面のカスタム背景 — 裏面テンプレ「📷 カスタム背景（裏面）」用 */}
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50/30 p-3">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="text-[12px] font-bold text-amber-900">
                    🔄 裏面のカスタム背景
                  </div>
                  <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-600 text-white shrink-0">
                    BACK
                  </span>
                </div>
                {/* スキップ宣言を最上部に */}
                <SkipBadge
                  label="裏面のカスタム背景をアップロードしない"
                  checked={!!data.backCustomBackgroundSkipped}
                  onChange={(v) => update({ backCustomBackgroundSkipped: v })}
                />
                <div className="text-[10px] text-amber-800/85 mb-2 leading-relaxed">
                  裏面デザインで「📷 カスタム背景（裏面）」を選んだときに使われる画像です。
                </div>
                <CustomBackgroundUploader
                  value={data.backCustomBackground ?? ""}
                  opacity={data.backCustomBackgroundOpacity ?? 1}
                  onChange={(v) => update({ backCustomBackground: v })}
                  onOpacityChange={(v) => update({ backCustomBackgroundOpacity: v })}
                  data={data}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {imageTab === "logo" && !data.logoDataUrl && (
        <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 text-sm text-neutral-700 leading-relaxed">
          ℹ️ ロゴ画像が未アップロードのため、ロゴなしで書き出されます。
          ロゴを入れたい場合は上のアップロード欄から画像を選択してください。
        </div>
      )}

      {data.logoDataUrl && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-900 leading-relaxed">
          ✓ ロゴ画像が設定されました。テンプレートの適切な位置に自動配置されます。
        </div>
      )}

      {imageTab === "logo" && (
        <div className="rounded-xl bg-neutral-50 p-4 border border-neutral-200 text-sm leading-relaxed">
        <div className="font-semibold text-neutral-800 mb-2">📌 ヒント</div>
        <ul className="space-y-1 text-neutral-600 text-[13px]">
          <li>• 透過PNG（背景なし）が最もきれいに表示されます</li>
          <li>• 大きな画像は自動で縮小されます（保存容量を抑えるため）</li>
          <li>• ロゴが無い名刺は「シンプルで洗練」に見えます。無理に入れる必要はありません</li>
        </ul>
        </div>
      )}
    </StepShell>
  );
}
