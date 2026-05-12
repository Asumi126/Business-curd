"use client";

import { buildFullName, CardData } from "../../lib/types";
import { Field, TextInput } from "./Field";
import { StepShell } from "./StepShell";

type Props = {
  data: CardData;
  update: (patch: Partial<CardData>) => void;
};

/**
 * 氏名入力ステップ。
 *
 * 仕様変更:
 *  - 漢字氏名を「姓」「名」に分割。
 *  - 各漢字の「上」に対応する ふりがな 入力を配置（2行 × 2列のグリッド）。
 *  - 入力に応じて nameJa を「{姓}　{名}」(全角スペース) で自動同期。
 *    日本語名刺表記の慣行（姓・名の間は1字分のスペース）に合わせる。
 *  - ローマ字 (nameEn) はこれまでどおり単一フィールド。
 */
export function Step2Basic({ data, update }: Props) {
  /** 姓・名のいずれかを更新 → 全体 nameJa も同時更新。 */
  const setNamePart = (key: "lastName" | "firstName", v: string) => {
    const next = { ...data, [key]: v };
    const composed = buildFullName(next.lastName, next.firstName);
    update({ [key]: v, nameJa: composed } as Partial<CardData>);
  };

  const setKanaPart = (key: "lastNameKana" | "firstNameKana", v: string) =>
    update({ [key]: v });

  return (
    <StepShell
      title="あなたのお名前を教えてください"
      subtitle="漢字は『姓』と『名』に分けて入力してください。上のふりがな欄も忘れずに。"
    >
      <Field
        label="氏名（漢字＋ふりがな）"
        hint="姓と名の間には自動で適切なスペースが入ります"
        example="やまだ　たろう / 山田　太郎"
      >
        {/* 新順序: 1行目=漢字（主役）、2行目=ふりがな、3項目目はローマ字（別Field）。
            海外ユーザー向けに、漢字・ふりがな・ローマ字のうち1つでも入力すれば
            必須項目クリアとする(検証は requirements.ts 側)。 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 1行目: 漢字 — 大きめのフォントで主役感 */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-neutral-700">姓（漢字）</label>
            <TextInput
              value={data.lastName ?? ""}
              onChange={(v) => setNamePart("lastName", v)}
              placeholder="山田"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-neutral-700">名（漢字）</label>
            <TextInput
              value={data.firstName ?? ""}
              onChange={(v) => setNamePart("firstName", v)}
              placeholder="太郎"
            />
          </div>
          {/* 2行目: ふりがな */}
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-neutral-500 tracking-wider">
              ふりがな（姓）
            </label>
            <TextInput
              value={data.lastNameKana ?? ""}
              onChange={(v) => setKanaPart("lastNameKana", v)}
              placeholder="やまだ"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-neutral-500 tracking-wider">
              ふりがな（名）
            </label>
            <TextInput
              value={data.firstNameKana ?? ""}
              onChange={(v) => setKanaPart("firstNameKana", v)}
              placeholder="たろう"
            />
          </div>
        </div>
        {/* 合成プレビュー */}
        {(data.lastName || data.firstName) && (
          <div className="mt-2 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1.5 text-[11px] text-blue-900 leading-tight">
            名刺表示プレビュー:
            <span className="ml-2 font-bold text-neutral-900 text-[13px]">
              {buildFullName(data.lastName, data.firstName)}
            </span>
            {(data.lastNameKana || data.firstNameKana) && (
              <span className="ml-2 text-neutral-600 text-[10px]">
                （{buildFullName(data.lastNameKana, data.firstNameKana)}）
              </span>
            )}
          </div>
        )}
      </Field>

      <Field
        label="氏名（ローマ字）"
        optional
        hint="海外の方や、英語表記が必要な場面で便利。Google翻訳でも変換できます"
        example="Taro Yamada"
      >
        <TextInput
          value={data.nameEn}
          onChange={(v) => update({ nameEn: v })}
          placeholder="Taro Yamada"
        />
      </Field>
    </StepShell>
  );
}
