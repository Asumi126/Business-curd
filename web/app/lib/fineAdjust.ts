import { CardData, FieldKey } from "./types";

export const FIELD_LABELS: Record<FieldKey, string> = {
  nameEn: "氏名（ローマ字）",
  furigana: "ふりがな",
  title: "肩書き",
  department: "部署",
  tagline: "キャッチコピー",
  phone: "電話番号",
  email: "メールアドレス",
  postalCode: "郵便番号",
  address: "住所",
  website: "ウェブサイト",
  snsX: "X (Twitter)",
  snsInstagram: "Instagram",
  snsLinkedin: "LinkedIn",
  snsGithub: "GitHub",
};

export const FIELD_KEYS: FieldKey[] = [
  "nameEn",
  "furigana",
  "title",
  "department",
  "tagline",
  "phone",
  "email",
  "postalCode",
  "address",
  "website",
  "snsX",
  "snsInstagram",
  "snsLinkedin",
  "snsGithub",
];

export function applyFineAdjust(data: CardData): CardData {
  const hidden = data.customization.fineAdjust.hidden;
  const out: CardData = {
    ...data,
    nameEn: hidden.nameEn ? "" : data.nameEn,
    // ふりがな (lastNameKana / firstNameKana) を非表示にすると
    // nameDisplay() がルビを描画しなくなる。
    lastNameKana: hidden.furigana ? "" : data.lastNameKana,
    firstNameKana: hidden.furigana ? "" : data.firstNameKana,
    title: hidden.title ? "" : data.title,
    department: hidden.department ? "" : data.department,
    tagline: hidden.tagline ? "" : data.tagline,
    phone: hidden.phone ? "" : data.phone,
    email: hidden.email ? "" : data.email,
    postalCode: hidden.postalCode ? "" : data.postalCode,
    address: hidden.address ? "" : data.address,
    website: hidden.website ? "" : data.website,
    sns: {
      x: hidden.snsX ? undefined : data.sns.x,
      instagram: hidden.snsInstagram ? undefined : data.sns.instagram,
      linkedin: hidden.snsLinkedin ? undefined : data.sns.linkedin,
      github: hidden.snsGithub ? undefined : data.sns.github,
    },
  };
  return out;
}

export function getFieldValue(data: CardData, key: FieldKey): string {
  switch (key) {
    case "nameEn": return data.nameEn;
    case "furigana":
      return (
        [data.lastNameKana, data.firstNameKana].filter(Boolean).join(" ").trim()
      );
    case "title": return data.title;
    case "department": return data.department;
    case "tagline": return data.tagline;
    case "phone": return data.phone;
    case "email": return data.email;
    case "postalCode": return data.postalCode;
    case "address": return data.address;
    case "website": return data.website;
    case "snsX": return data.sns.x ?? "";
    case "snsInstagram": return data.sns.instagram ?? "";
    case "snsLinkedin": return data.sns.linkedin ?? "";
    case "snsGithub": return data.sns.github ?? "";
  }
}
