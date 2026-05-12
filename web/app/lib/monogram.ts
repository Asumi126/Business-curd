import { CardData } from "./types";

export type MonogramStyle = {
  id: string;
  name: string;
  description: string;
};

export const MONOGRAM_STYLES: MonogramStyle[] = [
  { id: "none", name: "表示しない（推奨）", description: "ロゴ枠なしのクリーンな名刺" },
  { id: "circle", name: "円", description: "シンプルな丸枠＋頭文字" },
  { id: "square", name: "四角", description: "塗りつぶしの四角＋頭文字" },
  { id: "outline", name: "ライン四角", description: "細い線の四角＋頭文字" },
  { id: "serif-cap", name: "セリフ", description: "上品な明朝体イニシャル" },
];

export function deriveInitials(data: CardData): string {
  const company = (data.company || "").trim();
  if (company) {
    const wordChars = company.replace(/\s+/g, " ").split(" ").filter(Boolean);
    if (wordChars.length >= 2) {
      return (wordChars[0][0] + wordChars[1][0]).toUpperCase();
    }
    const upper = company.match(/[A-Za-z]/g);
    if (upper && upper.length) return upper.slice(0, 2).join("").toUpperCase();
    return company.charAt(0).toUpperCase();
  }
  const en = (data.nameEn || "").trim();
  if (en) {
    const parts = en.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return en.charAt(0).toUpperCase();
  }
  const ja = (data.nameJa || "").trim();
  if (ja) {
    const parts = ja.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return parts[0].charAt(0) + parts[1].charAt(0);
    return ja.charAt(0);
  }
  return "MC";
}
