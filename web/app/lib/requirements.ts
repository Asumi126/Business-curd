import { CardData } from "./types";

/**
 * Detect missing/required fields based on the current data + chosen template.
 * Returns one entry per missing item with the step number it belongs to so
 * the UI can offer a one-click jump back to fix it.
 *
 * Step numbers reflect the 9-step consolidated stepper:
 *   1=ようこそ / 2=情報入力 / 3=デザイン選択 / 4=裏面選択 /
 *   5=挿入画像 / 6=QRコード設定 / 7=カスタマイズ / 8=微調整 / 9=完成
 */

export type RequirementIssue = {
  step: number; // step number to jump to (1-9)
  label: string; // short label of what is missing
  detail: string; // user-facing explanation
  level: "error" | "warning";
};

export function checkRequirements(
  data: CardData,
  templateId: string,
): RequirementIssue[] {
  const issues: RequirementIssue[] = [];

  // 氏名は「漢字・ふりがな・ローマ字」のいずれか1つでも入力されていれば OK。
  // 海外ユーザーや日本語入力なしの利用者にも対応するため、入力ルールを緩める。
  const hasAnyName =
    !!data.nameJa?.trim() ||
    !!data.lastName?.trim() ||
    !!data.firstName?.trim() ||
    !!data.lastNameKana?.trim() ||
    !!data.firstNameKana?.trim() ||
    !!data.nameEn?.trim();
  if (!hasAnyName) {
    issues.push({
      step: 2,
      label: "氏名が未入力",
      detail: "漢字・ふりがな・ローマ字のうち、いずれか1つは入力してください",
      level: "error",
    });
  }

  if (!data.phone?.trim() && !data.email?.trim() && !data.website?.trim()) {
    issues.push({
      step: 2,
      label: "連絡先が未入力",
      detail: "電話・メール・ウェブサイトのうち最低1つは入力推奨",
      level: "warning",
    });
  }

  const isPhotoTemplate =
    templateId.startsWith("photo-") || templateId.startsWith("vertical-photo");
  const isCustomBgTemplate = templateId === "custom-background";

  if (isPhotoTemplate && !data.profilePhoto) {
    issues.push({
      step: 5,
      label: "顔写真・装飾画像が未設定",
      detail: `選択中のデザインは画像が必須です。アップロードしてください`,
      level: "error",
    });
  }
  if (isCustomBgTemplate && !data.customBackground) {
    issues.push({
      step: 5,
      label: "背景画像が未設定",
      detail: "「カスタム背景」テンプレートには画像が必須です",
      level: "error",
    });
  }

  if (!data.company?.trim() && !data.title?.trim() && !data.department?.trim()) {
    issues.push({
      step: 2,
      label: "会社名・肩書きが未入力",
      detail: "信頼感のある名刺には会社・肩書きの記載が推奨されます",
      level: "warning",
    });
  }

  return issues;
}

export const STEP_LABEL_MAP: Record<number, string> = {
  1: "ようこそ",
  2: "情報入力",
  3: "デザイン選択",
  4: "裏面選択",
  5: "挿入画像",
  6: "QRコード設定",
  7: "カラーカスタマイズ",
  8: "テキストカスタマイズ",
  9: "微調整",
  10: "完成",
};
