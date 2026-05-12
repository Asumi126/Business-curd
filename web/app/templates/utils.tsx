import { ReactNode } from "react";
import { CardData, sampleCardData } from "../lib/types";

export function compactValue(value: string | undefined): string {
  return (value ?? "").trim();
}

/**
 * 氏名表示ヘルパー — 漢字名前にふりがな(ルビ)を自動付加して返す。
 * 苗字と名前それぞれにふりがなが指定されていれば <ruby> でルビ表示する。
 *  - lastName + lastNameKana が両方ある → 苗字部分にルビ
 *  - firstName + firstNameKana が両方ある → 名前部分にルビ
 *  - 片方しかなければその部分だけプレーン
 *  - lastName/firstName がない場合は data.nameJa にフォールバック
 *
 * 使い方: テンプレで `{nameDisplay(d)}` の代わりに `{nameDisplay(d)}` を使う。
 * ふりがな未入力時はこれまでと同じ表示。
 */
export function nameDisplay(
  d: Pick<CardData, "nameJa" | "lastName" | "firstName" | "lastNameKana" | "firstNameKana">,
): ReactNode {
  const ln = (d.lastName ?? "").trim();
  const fn = (d.firstName ?? "").trim();
  const lnK = (d.lastNameKana ?? "").trim();
  const fnK = (d.firstNameKana ?? "").trim();
  // 苗字 or 名前のどちらかが分解入力されている場合のみ ruby 構築。
  if (ln || fn) {
    return (
      <>
        {ln && (lnK ? <ruby>{ln}<rt>{lnK}</rt></ruby> : ln)}
        {ln && fn && " "}
        {fn && (fnK ? <ruby>{fn}<rt>{fnK}</rt></ruby> : fn)}
      </>
    );
  }
  return d.nameJa ?? "";
}

export function ifPresent(value: string | undefined, render: (v: string) => ReactNode): ReactNode {
  const v = compactValue(value);
  return v ? render(v) : null;
}

export function snsList(data: CardData): { kind: "x" | "ig" | "linkedin" | "github"; value: string }[] {
  const out: { kind: "x" | "ig" | "linkedin" | "github"; value: string }[] = [];
  if (data.sns.x) out.push({ kind: "x", value: data.sns.x });
  if (data.sns.instagram) out.push({ kind: "ig", value: data.sns.instagram });
  if (data.sns.linkedin) out.push({ kind: "linkedin", value: data.sns.linkedin });
  if (data.sns.github) out.push({ kind: "github", value: data.sns.github });
  return out;
}

export function addressLine(
  d: { postalCode?: string; address?: string },
  layout: "inline" | "stacked" = "inline",
): string {
  const post = (d.postalCode ?? "").trim();
  const addr = (d.address ?? "").trim();
  if (!post) return addr;
  if (!addr) return `〒${post}`;
  return layout === "stacked" ? `〒${post}\n${addr}` : `〒${post}  ${addr}`;
}

export type ResolvedCardData = CardData & { addressLine: string };

export function hasAnyUserInput(data: CardData): boolean {
  return !!(
    data.nameJa?.trim() ||
    data.nameEn?.trim() ||
    data.title?.trim() ||
    data.company?.trim() ||
    data.department?.trim() ||
    data.tagline?.trim() ||
    data.phone?.trim() ||
    data.email?.trim() ||
    data.postalCode?.trim() ||
    data.address?.trim() ||
    data.website?.trim() ||
    data.memo?.trim() ||
    data.logoDataUrl ||
    data.sns.x ||
    data.sns.instagram ||
    data.sns.linkedin ||
    data.sns.github
  );
}

/**
 * Returns user's actual data (with empty fields kept empty) IF the user has
 * entered anything. Otherwise returns sample data so the card preview isn't
 * blank on first visit.
 *
 * IMPORTANT: Once the user types ANYTHING, no field is auto-filled with sample
 * data. Empty fields are rendered as empty so the card reflects exactly what
 * the user provided — no surprise sample URLs or fake addresses.
 */
export function fallback(data: CardData): ResolvedCardData {
  const layout = data.customization.fineAdjust.addressLayout ?? "inline";
  if (hasAnyUserInput(data)) {
    return { ...data, addressLine: addressLine(data, layout) };
  }
  const seed: CardData = {
    ...sampleCardData,
    customization: data.customization,
  };
  return { ...seed, addressLine: addressLine(seed, layout) };
}
