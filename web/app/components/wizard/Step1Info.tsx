"use client";

import { CardData } from "../../lib/types";
import { Step2Basic } from "./Step2Basic";
import { Step3Work } from "./Step3Work";
import { Step4Contact } from "./Step4Contact";
import { Step5Sns } from "./Step5Sns";
import { StepShell } from "./StepShell";

export type InfoSection = "name" | "work" | "contact" | "sns";

export const INFO_SECTIONS: { id: InfoSection; emoji: string; label: string; hint: string }[] = [
  { id: "name", emoji: "👤", label: "お名前", hint: "氏名・読み仮名" },
  { id: "work", emoji: "💼", label: "お仕事", hint: "会社名・肩書き" },
  { id: "contact", emoji: "📞", label: "連絡先", hint: "電話・メール・住所" },
  { id: "sns", emoji: "🌐", label: "ウェブ・SNS", hint: "サイト・X・Instagram" },
];

type Props = {
  data: CardData;
  update: (patch: Partial<CardData>) => void;
  /** 親（Wizard）から制御するセクション状態。次へ/戻るボタンが順に進めるための仕組み。 */
  section: InfoSection;
  setSection: (s: InfoSection) => void;
};

/**
 * 情報入力をひとつのステップに集約したラッパー。
 * 旧 Step2〜Step5 を内部タブで切替表示し、ステッパー上は「1ステップ」として表示。
 * セクション状態は親 Wizard で保持し、「次へ」「戻る」ボタンが
 * 名前 → 仕事 → 連絡先 → SNS の順に1つずつ進めるよう連動させる。
 */
export function Step1Info({ data, update, section, setSection }: Props) {
  // 入力済み判定 — 入力された情報は ✓ で見える化
  const filled: Record<InfoSection, boolean> = {
    name: !!(data.nameJa?.trim() || data.nameEn?.trim()),
    work: !!(data.company?.trim() || data.title?.trim()),
    contact: !!(data.phone || data.email || data.address || data.website),
    sns: !!(data.sns && Object.values(data.sns).some((v) => v?.trim())),
  };

  const currentIdx = INFO_SECTIONS.findIndex((s) => s.id === section);
  const sectionLabel = INFO_SECTIONS[currentIdx]?.label ?? "";

  return (
    <StepShell
      title="あなたの情報を入力してください"
      subtitle={`「次へ」を押すと ${INFO_SECTIONS.map((s) => s.label).join(" → ")} の順に進みます。SNS まで入力するとデザイン選択へ。`}
    >
      {/* セクション切替タブ — クリックでも直接ジャンプ可。緑✓ で入力済み視認化 */}
      <div className="sticky top-[148px] sm:top-[148px] z-20 -mx-4 px-3 py-1.5 bg-white border-y border-blue-200 shadow-sm">
        <div className="grid grid-cols-4 gap-1.5">
          {INFO_SECTIONS.map((s, idx) => {
            const active = section === s.id;
            const done = filled[s.id];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={`flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-md border transition ${
                  active
                    ? "bg-blue-600 border-blue-700 text-white shadow"
                    : "bg-white border-neutral-200 text-neutral-700 hover:border-blue-400"
                }`}
                title={s.hint}
                aria-current={active ? "true" : undefined}
              >
                <div className="flex items-center gap-1">
                  <span className="text-base leading-none">{s.emoji}</span>
                  <span className={`text-[9px] font-mono leading-none ${active ? "text-blue-100" : "text-neutral-400"}`}>
                    {idx + 1}/{INFO_SECTIONS.length}
                  </span>
                  {done && (
                    <span className={`text-[10px] leading-none ${active ? "text-emerald-200" : "text-emerald-600"}`}>
                      ✓
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-bold leading-tight">{s.label}</div>
              </button>
            );
          })}
        </div>
        {/* 現在地ヒント */}
        <div className="text-[10px] text-neutral-500 mt-1 text-center leading-tight">
          {currentIdx + 1} / {INFO_SECTIONS.length} —「{sectionLabel}」を入力中
          {currentIdx < INFO_SECTIONS.length - 1 ? (
            <span className="ml-1">（次へ → 「{INFO_SECTIONS[currentIdx + 1].label}」）</span>
          ) : (
            <span className="ml-1">（次へ → 「デザイン選択」へ進みます）</span>
          )}
        </div>
      </div>

      {/* 各セクション本体 — 旧 Step コンポーネントをそのまま再利用 */}
      <div>
        {section === "name" && <Step2Basic data={data} update={update} />}
        {section === "work" && <Step3Work data={data} update={update} />}
        {section === "contact" && <Step4Contact data={data} update={update} />}
        {section === "sns" && <Step5Sns data={data} update={update} />}
      </div>
    </StepShell>
  );
}
