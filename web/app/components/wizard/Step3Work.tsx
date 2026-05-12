"use client";

import { CardData } from "../../lib/types";
import { Field, TextInput } from "./Field";
import { StepShell } from "./StepShell";

type Props = {
  data: CardData;
  update: (patch: Partial<CardData>) => void;
};

export function Step3Work({ data, update }: Props) {
  return (
    <StepShell
      title="お仕事のことを教えてください"
      subtitle="あなたが何をしている人なのか、ひと目で伝わる情報。屋号や肩書きは「自分の専門は何か」を表す大事なキーワードです。"
    >
      <Field
        label="屋号・会社名"
        hint="フリーランスの方は屋号を。屋号がなければ「フリーランス + 専門分野」でもOK"
        example="YAMADA DESIGN / 山田太郎事務所 / フリーランス Webデザイナー"
      >
        <TextInput
          value={data.company}
          onChange={(v) => update({ company: v })}
          placeholder="YAMADA DESIGN"
          autoFocus
        />
      </Field>
      <Field
        label="肩書き・職種"
        hint="「Webデザイナー」「税理士」「料理研究家」など、あなたを一言で説明する言葉。複数あれば「/」で区切って2つまでが見やすいです"
        example="代表 / Webデザイナー"
      >
        <TextInput
          value={data.title}
          onChange={(v) => update({ title: v })}
          placeholder="代表 / Webデザイナー"
        />
      </Field>
      <Field
        label="部署名"
        optional
        hint="会社員の方は部署を。フリーランスや個人事業主の方は空欄でOK"
        example="マーケティング部"
      >
        <TextInput
          value={data.department}
          onChange={(v) => update({ department: v })}
          placeholder=""
        />
      </Field>
    </StepShell>
  );
}
