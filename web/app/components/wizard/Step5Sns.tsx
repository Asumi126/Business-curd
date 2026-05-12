"use client";

import { CardData } from "../../lib/types";
import { Field, TextInput } from "./Field";
import { StepShell } from "./StepShell";

type Props = {
  data: CardData;
  update: (patch: Partial<CardData>) => void;
};

export function Step5Sns({ data, update }: Props) {
  const updateSns = (key: keyof CardData["sns"], value: string) =>
    update({ sns: { ...data.sns, [key]: value } });

  return (
    <StepShell
      title="ウェブサイトやSNSはありますか？"
      subtitle="名刺の裏面に入るQRコードからもアクセスできるようになります。空欄でもOKです。"
    >
      <Field
        label="ウェブサイトURL"
        optional
        hint="ポートフォリオやコーポレートサイトのURL"
        example="https://yamada-design.example.com"
      >
        <TextInput
          value={data.website}
          onChange={(v) => update({ website: v })}
          placeholder="https://example.com"
          autoFocus
        />
      </Field>
      <Field
        label="X (旧Twitter)"
        optional
        hint="@マークから始まるユーザー名、またはURL"
        example="@yamada_design"
      >
        <TextInput
          value={data.sns.x ?? ""}
          onChange={(v) => updateSns("x", v)}
          placeholder="@username"
        />
      </Field>
      <Field
        label="Instagram"
        optional
        example="@yamada_design"
      >
        <TextInput
          value={data.sns.instagram ?? ""}
          onChange={(v) => updateSns("instagram", v)}
          placeholder="@username"
        />
      </Field>
      <Field
        label="LinkedIn"
        optional
        hint="ビジネスSNS。海外取引や転職で名刺を渡す予定がある方に推奨"
      >
        <TextInput
          value={data.sns.linkedin ?? ""}
          onChange={(v) => updateSns("linkedin", v)}
          placeholder="taro-yamada-12345"
        />
      </Field>
      <Field
        label="GitHub"
        optional
        hint="エンジニア・開発者の方向け"
      >
        <TextInput
          value={data.sns.github ?? ""}
          onChange={(v) => updateSns("github", v)}
          placeholder="taro-yamada"
        />
      </Field>
    </StepShell>
  );
}
