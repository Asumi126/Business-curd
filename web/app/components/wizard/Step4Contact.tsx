"use client";

import { CardData } from "../../lib/types";
import { Field, TextArea, TextInput } from "./Field";
import { StepShell } from "./StepShell";

type Props = {
  data: CardData;
  update: (patch: Partial<CardData>) => void;
};

export function Step4Contact({ data, update }: Props) {
  return (
    <StepShell
      title="連絡先を教えてください"
      subtitle="名刺をもらった人が、あなたに連絡するための情報。最低でも「電話 or メール」のどちらかは入れておくのがおすすめです。"
    >
      <Field
        label="電話番号"
        optional
        hint="ハイフン入りでもOK。仕事用と個人用、どちらを載せるか考えて選んでください"
        example="090-1234-5678 / 03-1234-5678"
      >
        <TextInput
          value={data.phone}
          onChange={(v) => update({ phone: v })}
          placeholder="090-1234-5678"
          type="tel"
          autoFocus
        />
      </Field>
      <Field
        label="メールアドレス"
        hint="仕事用のメールアドレスを推奨。Gmail等のフリーメールでもOKです"
        example="yamada@example.com"
      >
        <TextInput
          value={data.email}
          onChange={(v) => update({ email: v })}
          placeholder="yamada@example.com"
          type="email"
        />
      </Field>
      <Field
        label="郵便番号"
        optional
        hint="ハイフン込みで7桁。住所と分けて入力すると、テンプレートで「〒」マーク付きで美しく整形されます"
        example="150-0001"
      >
        <TextInput
          value={data.postalCode}
          onChange={(v) => update({ postalCode: v })}
          placeholder="150-0001"
        />
      </Field>
      <Field
        label="住所"
        optional
        hint="郵便番号は上で入力済みなのでここでは不要。県・市レベルで止めてもOK"
        example="東京都渋谷区神宮前1-2-3"
      >
        <TextArea
          value={data.address}
          onChange={(v) => update({ address: v })}
          placeholder="東京都渋谷区神宮前1-2-3"
          rows={2}
        />
      </Field>
    </StepShell>
  );
}
