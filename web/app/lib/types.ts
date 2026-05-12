import type { ComponentType } from "react";

export type SnsLinks = {
  x?: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
};

export type FontFamilyKey =
  | "auto"
  | "modern-sans"
  | "classic-serif"
  | "japan-mincho"
  | "japan-maru"
  | "japan-kaisho"
  | "tech-mono"
  | "display-bold"
  | "rounded"
  | "elegant-serif"
  | "script-cursive"
  | "script-handwriting"
  | "english-display"
  | "english-condensed";

/**
 * 自由レイアウト・フォント切替・サイズ調整の対象となる役割キー。
 * - 主要4種: name / nameEn / company / title / tagline
 * - 連絡先まとめ: contact（電話・メール・住所・Web を内包する親ブロック）
 * - 連絡先 個別: phone / email / address / website
 *   個別キーは「data-card-icon="phone"」等の SVG マーカを基に
 *   :has() セレクタで親 div を特定して transform/zoom を適用するため、
 *   テンプレ側に `data-role` を追加せずとも個別調整可能。
 */
export type FontRole =
  | "name"
  | "nameEn"
  | "company"
  | "title"
  | "contact"
  | "tagline"
  | "phone"
  | "email"
  | "address"
  | "website"
  /** 裏面の紹介文/サービス一覧などの本文ブロック。企業PRカード系テンプレで使用。 */
  | "description";

/** Visual effect for a text element. CSS-driven so it renders in PDF output too. */
export type FontEffectKey =
  | "none"
  | "shadow-soft"
  | "shadow-hard"
  | "outline"
  | "neon"
  | "glow"
  | "emboss"
  | "letterpress"
  | "gradient"
  | "highlight"
  | "underline";

export type ContactPrefix = "icon" | "text" | "minimal";

export type CardSizeKey =
  | "standard"
  | "compact"
  | "international"
  | "vertical-standard"
  | "vertical-tall";

export type CardSizeDef = {
  id: CardSizeKey;
  label: string;
  description: string;
  widthMm: number;
  heightMm: number;
  orientation: "horizontal" | "vertical";
  printerNote: string;
};

export const CARD_SIZES: CardSizeDef[] = [
  {
    id: "standard",
    label: "日本標準 91×55mm",
    description: "最も一般的なサイズ。すべての国内印刷会社が対応",
    widthMm: 91,
    heightMm: 55,
    orientation: "horizontal",
    printerNote: "ラクスル / プリントパック / グラフィック",
  },
  {
    id: "compact",
    label: "コンパクト 85×55mm",
    description: "ヨーロッパ風。やや小さめでスマート",
    widthMm: 85,
    heightMm: 55,
    orientation: "horizontal",
    printerNote: "プリントパック / グラフィック",
  },
  {
    id: "international",
    label: "国際標準 89×51mm",
    description: "クレジットカードサイズ。海外配布に最適",
    widthMm: 89,
    heightMm: 51,
    orientation: "horizontal",
    printerNote: "プリントパック / グラフィック / VistaPrint",
  },
  {
    id: "vertical-standard",
    label: "縦型・標準 55×91mm",
    description: "縦書きデザイン向け。和の業種に好まれる",
    widthMm: 55,
    heightMm: 91,
    orientation: "vertical",
    printerNote: "ラクスル / プリントパック / グラフィック",
  },
  {
    id: "vertical-tall",
    label: "縦型・スリム 50×91mm",
    description: "スリムで個性的。クリエイター向け",
    widthMm: 50,
    heightMm: 91,
    orientation: "vertical",
    printerNote: "プリントパック / グラフィック",
  },
];

export function getCardSize(id: CardSizeKey): CardSizeDef {
  return CARD_SIZES.find((s) => s.id === id) ?? CARD_SIZES[0];
}

export type FieldKey =
  | "nameEn"
  | "furigana"
  | "title"
  | "department"
  | "tagline"
  | "phone"
  | "email"
  | "postalCode"
  | "address"
  | "website"
  | "snsX"
  | "snsInstagram"
  | "snsLinkedin"
  | "snsGithub";

export type BackHiddenFields = {
  nameJa?: boolean;
  company?: boolean;
  title?: boolean;
  contact?: boolean;
  backMessage?: boolean;
  ornaments?: boolean;
  monogram?: boolean;
};

export type AddressLayout = "inline" | "stacked";

export type FineAdjust = {
  hidden: Partial<Record<FieldKey, boolean>>;
  backHidden: BackHiddenFields;
  scale: number;
  offsetY: number;
  /** Horizontal offset (mm) for the content layer only. Background stays put. */
  offsetX: number;
  hideTemplateExtras: boolean;
  customYearLabel: string;
  addressLayout: AddressLayout;
};

export const defaultFineAdjust: FineAdjust = {
  hidden: {},
  backHidden: {},
  scale: 1,
  offsetY: 0,
  offsetX: 0,
  // Default: ON. Most users prefer clean templates without prefix labels
  // (TEL—, [COMPANY], SCENE 01, EST.2026, etc.). Users who want the decorative
  // text can toggle it off in the Design Selection step.
  hideTemplateExtras: true,
  customYearLabel: "",
  addressLayout: "inline",
};

/** Position of a QR overlay on the front of the card. */
export type FrontQRPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

/** Source of QR data: vCard from contact info, URL, or arbitrary text. */
export type FrontQRSource = "vcard" | "url" | "text";

/** A QR code overlay on the front of the card. Up to 2 allowed. */
export type FrontQR = {
  id: string;
  /** Anchor preset (top-left, center, etc.) — coarse placement. */
  position: FrontQRPosition;
  /** Fine-grained nudge from the preset anchor, in mm. Lets the user place
   *  the QR anywhere on the card with millimeter precision. */
  offsetXmm?: number;
  offsetYmm?: number;
  /** Size in mm (e.g., 12, 15, 18). */
  sizeMm: number;
  source: FrontQRSource;
  /** When source = "url" */
  url?: string;
  /** When source = "text" */
  text?: string;
  /** Optional caption below the QR (small text). */
  caption?: string;
  /** White background padding around QR for readability on dark backgrounds. */
  withBackground?: boolean;
};

export type Customization = {
  paletteId: string;
  customColors: { bg?: string; fg?: string; accent?: string; muted?: string };
  backColors: {
    bg?: string;
    fg?: string;
    accent?: string;
    muted?: string;
    /** Right-half background. Used by split layouts (QRSplit, QRMemoSplit, etc.).
     *  When present, the right half of split-style backs uses this color instead of bg. */
    bgRight?: string;
    /** Right-half foreground (text color). Defaults to a contrasting color of bgRight. */
    fgRight?: string;
  };
  fontGlobal: FontFamilyKey;
  fontPerRole: Partial<Record<FontRole, FontFamilyKey>>;
  /** ★裏面専用★ 項目別フォント書体の上書き。未指定の項目は表面の fontPerRole にフォールバック。 */
  fontPerRoleBack?: Partial<Record<FontRole, FontFamilyKey>>;
  /** Font size scale per role (1.0 = template default). ★表面専用★ */
  fontSizePerRole?: Partial<Record<FontRole, number>>;
  /** ★裏面専用★ 項目別フォントサイズ倍率。 */
  fontSizePerRoleBack?: Partial<Record<FontRole, number>>;
  /** Line height multiplier per role (1.0 = template default).
   *  Stored alongside fontSizePerRole so the user can balance size+spacing. */
  lineHeightPerRole?: Partial<Record<FontRole, number>>;
  /** Per-role position offset in mm. Allows fine-grained positioning
   *  similar to nametag free-layout editor. Applied via CSS transform on
   *  the [data-role] element in addition to global fineAdjust offsets.
   *  ★表面専用★ — 裏面は layoutOffsetPerRoleBack を使用。 */
  layoutOffsetPerRole?: Partial<Record<FontRole, { x: number; y: number }>>;
  /** ★裏面専用★ 自由レイアウトエディタの項目別位置オフセット。 */
  layoutOffsetPerRoleBack?: Partial<Record<FontRole, { x: number; y: number }>>;
  /** 一括整列モード。指定時は全 [data-role] 要素を強制的に左／中央／右整列する。
   *  単純な X オフセットでは効き目が弱いため、text-align と width:100% を併用して
   *  実際にカード幅いっぱいに整列させる。"default" 相当の未指定でテンプレ既定。
   *  ★表面専用★ — 裏面は bulkTextAlignBack を使用。 */
  bulkTextAlign?: "left" | "center" | "right";
  /** ★裏面専用★ 一括整列モード。 */
  bulkTextAlignBack?: "left" | "center" | "right";
  /** Global text scale applied to every data-role text element on the card.
   *  1.0 = template default. Range typically 0.7–1.4. */
  fontGlobalScale?: number;
  /** Global text effect applied to every [data-role] element. */
  fontEffectGlobal?: FontEffectKey;
  /** Global effect tuning: color (hex) and width multiplier (1 = default). */
  fontEffectGlobalConfig?: { color?: string; widthScale?: number };
  /** Roles to EXCLUDE from the global effect (checkbox UI). Default empty
   *  = effect applies to every role with [data-role]. */
  fontEffectExcludedRoles?: FontRole[];
  /** Legacy per-role effect overrides — kept for back-compat. New UI uses
   *  fontEffectGlobal + fontEffectExcludedRoles. */
  fontEffectPerRole?: Partial<Record<FontRole, FontEffectKey>>;
  patternId: string;
  monogramStyle: string;
  contactPrefix: ContactPrefix;
  /** 裏面の連絡先の見せ方（任意・空欄なら表面と同じ contactPrefix を使用）*/
  backContactPrefix?: ContactPrefix;
  cardSize: CardSizeKey;
  fineAdjust: FineAdjust;
  /** QR codes to overlay on the front side. Max 2. */
  frontQRs?: FrontQR[];
  /** For the "📷 カスタム背景" template only: where the text block sits.
   *  9-point anchor + mm offset for free placement. */
  customBgTextAlign?: FrontQRPosition;
  customBgTextOffsetXmm?: number;
  customBgTextOffsetYmm?: number;
  /** Overlay below the text on photo-style and custom-background templates.
   *  Lets users tint the image to control text contrast. */
  overlayEnabled?: boolean;
  /** Hex color for the overlay (e.g. "#000000"). */
  overlayColor?: string;
  /** Overlay alpha 0–1. 0 = transparent (no overlay), 1 = solid. */
  overlayOpacity?: number;
  /** Logo placement override for templates that use the default monogram
   *  slot (top-right). Lets users move and resize the logo. Templates with
   *  `hasOwnLogo: true` ignore these values. */
  logoFrame?: {
    /** Default position is top-right; offsets are relative to that. */
    offsetXmm?: number;
    offsetYmm?: number;
    sizeMm?: number; // default 13mm
  };
  /** Photo frame customization for the "photo-card" template's circle/rect
   *  insets. Lets users tweak the frame just like QR code styling. */
  photoFrame?: {
    /** Show a colored backdrop behind the photo (useful for transparency). */
    bgEnabled?: boolean;
    bgColor?: string;
    /** Frame border width in mm (0 = no border). */
    borderWidthMm?: number;
    borderColor?: string;
    /** Photo size multiplier (1 = template default). 0.6–1.4 typical. */
    sizeScale?: number;
  };
};

export const defaultCustomization: Customization = {
  paletteId: "auto",
  customColors: {},
  backColors: {},
  fontGlobal: "auto",
  fontPerRole: {},
  fontSizePerRole: {},
  layoutOffsetPerRole: {},
  fontEffectGlobal: "none",
  fontEffectGlobalConfig: {},
  fontEffectExcludedRoles: [],
  fontEffectPerRole: {},
  patternId: "none",
  monogramStyle: "none",
  contactPrefix: "icon",
  cardSize: "standard",
  fineAdjust: defaultFineAdjust,
  frontQRs: [],
};

export type QrMode = "vcard" | "url";

/** Second QR on the back side (used by dual-QR back styles). */
export type SecondQR = {
  enabled: boolean;
  mode: QrMode;
  url?: string;
  caption?: string;
};

/** A single line of custom text on the "custom-text" back style. */
export type BackCustomLine = {
  id: string;
  text: string;
  /** Font family key from the FONTS catalog. "auto" = inherit. */
  fontKey: FontFamilyKey | "auto";
  /** Font size in pt. */
  sizePt: number;
  /** Text alignment. */
  align: "left" | "center" | "right";
  bold?: boolean;
  italic?: boolean;
  /** Optional color override (hex). */
  color?: string;
};

export type CardData = {
  /**
   * 漢字氏名（フルネーム）。表示・テンプレで使われる主要フィールド。
   * 旧データ互換のため残置するが、入力 UI は lastName / firstName に分割。
   * 値は「{lastName}　{firstName}」（U+3000 全角スペース区切り、日本語の慣行）で同期される。
   */
  nameJa: string;
  /** 姓（漢字）— Step2Basic で分割入力。 */
  lastName?: string;
  /** 名（漢字）— Step2Basic で分割入力。 */
  firstName?: string;
  /** 姓（ふりがな） */
  lastNameKana?: string;
  /** 名（ふりがな） */
  firstNameKana?: string;
  nameEn: string;
  title: string;
  company: string;
  department: string;
  tagline: string;
  phone: string;
  email: string;
  postalCode: string;
  address: string;
  website: string;
  sns: SnsLinks;
  logoDataUrl: string;
  /** ロゴを意図的に「使わない」と選んでいる場合 true。完成判定で挿入画像ステップを
   *  ロゴアップロードなしでもクリアさせる用途。 */
  logoSkipped?: boolean;
  /** 顔写真・装飾を「使わない」フラグ。同上。 */
  photoSkipped?: boolean;
  /** 表面のカスタム背景を「使わない」フラグ。同上。 */
  customBackgroundSkipped?: boolean;
  /** 裏面のカスタム背景を「使わない」フラグ。同上。 */
  backCustomBackgroundSkipped?: boolean;
  /** 表面QR (frontQRs) を「設定しない」フラグ。 */
  frontQrSkipped?: boolean;
  /** 裏面QR を「設定しない」フラグ。 */
  backQrSkipped?: boolean;
  memo: string;
  backText: string;
  backMessage: string;
  qrMode: QrMode;
  qrUrl: string;
  qrCaption: string;
  /** Second QR for dual-QR back styles (optional). */
  qr2?: SecondQR;
  /** Custom text lines for the "custom-text" back style. */
  backCustomLines?: BackCustomLine[];
  /** Background image for the "custom-bg-back" back style (data URL). */
  backCustomBackground?: string;
  /** カスタム背景(裏面)で文字オーバーレイを表示するかどうか。既定は false で、
   *  画像のみのクリーンな裏面になる。true にすると tagline / backText /
   *  backMessage が中央に重ねて描画される。 */
  backCustomBgShowText?: boolean;
  /** Opacity 0–1 of the back background image. */
  backCustomBackgroundOpacity?: number;
  customBackground: string;
  customBackgroundOpacity: number;
  profilePhoto: string;
  photoPosition: PhotoLayout;
  backCard: BackCardOverride;
  customization: Customization;
};

export type PhotoLayout =
  | "none"
  | "bleed-left-half"
  | "bleed-right-half"
  | "bleed-left-third"
  | "bleed-right-third"
  | "bleed-top-half"
  | "bleed-top-third"
  | "circle-tr-sm"
  | "circle-tl-sm"
  | "circle-tr-md"
  | "circle-tl-md"
  | "circle-center"
  | "rect-tr-sm"
  | "rect-tl-sm"
  | "diagonal-left"
  | "diagonal-right"
  // legacy aliases
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "circle-large";

export type BackCardOverride = {
  enabled: boolean;
  heading: string;
  subheading: string;
  description: string;
  url: string;
  services: string[];
  contactPhone: string;
  contactEmail: string;
  /** PR ポスター裏面の左上「PR」ラベル文字（カスタマイズ可）。空なら "PR"。 */
  prLabel?: string;
  /** PR ポスター裏面の「詳しくはこちら」CTA 文字（カスタマイズ可）。空なら既定値。 */
  prCta?: string;
};

export const defaultBackCard: BackCardOverride = {
  enabled: false,
  heading: "",
  subheading: "",
  description: "",
  url: "",
  services: [],
  contactPhone: "",
  contactEmail: "",
  prLabel: "",
  prCta: "",
};

/**
 * 苗字と名前から「山田　太郎」形式のフルネーム文字列を組み立てる。
 * 苗字と名前の間は U+3000（全角スペース）で揃え、日本語の名刺表記慣行に合わせる。
 * 片方しか入っていない場合はそのまま、両方空ならフォールバック値を返す。
 */
export function buildFullName(last?: string, first?: string, fallback?: string): string {
  const L = (last ?? "").trim();
  const F = (first ?? "").trim();
  if (L && F) return `${L}　${F}`;
  if (L) return L;
  if (F) return F;
  return (fallback ?? "").trim();
}

export const emptyCardData: CardData = {
  nameJa: "",
  lastName: "",
  firstName: "",
  lastNameKana: "",
  firstNameKana: "",
  nameEn: "",
  title: "",
  company: "",
  department: "",
  tagline: "",
  phone: "",
  email: "",
  postalCode: "",
  address: "",
  website: "",
  sns: {},
  logoDataUrl: "",
  memo: "",
  backText: "",
  backMessage: "",
  qrMode: "vcard",
  qrUrl: "",
  qrCaption: "",
  qr2: { enabled: false, mode: "url", url: "", caption: "" },
  customBackground: "",
  customBackgroundOpacity: 1,
  profilePhoto: "",
  photoPosition: "none",
  backCard: defaultBackCard,
  customization: defaultCustomization,
};

export const sampleCardData: CardData = {
  nameJa: "山田　太郎",
  lastName: "山田",
  firstName: "太郎",
  lastNameKana: "やまだ",
  firstNameKana: "たろう",
  nameEn: "Taro Yamada",
  title: "代表 / Webデザイナー",
  company: "YAMADA DESIGN",
  department: "",
  tagline: "Design that moves people.",
  phone: "090-1234-5678",
  email: "yamada@example.com",
  postalCode: "150-0001",
  address: "東京都渋谷区神宮前1-2-3",
  website: "yamada-design.com",
  sns: {
    x: "@yamada_design",
    instagram: "@yamada_design",
  },
  logoDataUrl: "",
  memo: "",
  backText: "",
  backMessage: "",
  qrMode: "vcard",
  qrUrl: "",
  qrCaption: "",
  qr2: { enabled: false, mode: "url", url: "", caption: "" },
  customBackground: "",
  customBackgroundOpacity: 1,
  profilePhoto: "",
  photoPosition: "none",
  backCard: defaultBackCard,
  customization: defaultCustomization,
};

/**
 * Template categories. The list combines legacy values (minimal/business/
 * modern/premium/japanese) with the new occupation-oriented buckets
 * (formal/tech/luxury/traditional/lifestyle) so users can pick a design
 * by *what they do* rather than by abstract style names.
 */
export type TemplateCategory =
  // New occupation-oriented categories
  | "formal"        // 士業・経営層・金融・コンサル
  | "tech"          // IT・エンジニア・スタートアップ
  | "creative"      // デザイナー・アーティスト・クリエイター
  | "luxury"        // 高級・エグゼクティブ・ハイエンド
  | "traditional"   // 和風・伝統業種・士業（和テイスト）
  | "lifestyle"     // 接客・サロン・個人事業・小売
  // Legacy values kept for backwards compatibility (mapped at runtime)
  | "minimal"
  | "business"
  | "modern"
  | "premium"
  | "japanese";

export type TemplateMeta = {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  swatch: { bg: string; fg: string; accent: string };
};

export type TemplateOrientation = "horizontal" | "vertical";

export type CardTemplate = TemplateMeta & {
  orientation?: TemplateOrientation;
  Component: ComponentType<{ data: CardData }>;
};

export type BackStyleMeta = {
  id: string;
  name: string;
  description: string;
  category: "memo" | "qr" | "minimal" | "branded" | "info" | "company";
};

export type BackStyle = BackStyleMeta & {
  Component: ComponentType<{
    data: CardData;
    template: CardTemplate;
    qrDataUrl: string;
    /** Second QR for dual-QR styles. Empty string for non-dual styles. */
    qrDataUrl2?: string;
  }>;
};
