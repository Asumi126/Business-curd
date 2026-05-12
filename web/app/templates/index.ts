import { CardTemplate } from "../lib/types";
import { MinimalWhite } from "./MinimalWhite";
import { MinimalBlack } from "./MinimalBlack";
import { CorporateBlue } from "./CorporateBlue";
import { CorporateNavyBar } from "./CorporateNavyBar";
import { ModernGradientBlue } from "./ModernGradientBlue";
import { JapaneseWabi } from "./JapaneseWabi";
import { TechMono } from "./TechMono";
import { DarkNeon } from "./DarkNeon";
import { SplitDiagonal } from "./SplitDiagonal";
import { SunsetGradient } from "./SunsetGradient";
import { StripeGradient } from "./StripeGradient";
import { WallStreet } from "./WallStreet";
import { EmbossedGold } from "./EmbossedGold";
import { Architectural } from "./Architectural";
import { VerticalMincho } from "./VerticalMincho";
import { VerticalModern } from "./VerticalModern";
import { VerticalLuxe } from "./VerticalLuxe";
import { VerticalSidebar } from "./VerticalSidebar";
import { VerticalMinimal } from "./VerticalMinimal";
import { CustomBackground } from "./CustomBackground";
import { PhotoCard } from "./PhotoCard";
import { PhotoEditorial } from "./PhotoEditorial";
import { PhotoNoir } from "./PhotoNoir";
import { PhotoFresh } from "./PhotoFresh";
import { PhotoFrame } from "./PhotoFrame";
import { PhotoHero } from "./PhotoHero";
import { VerticalPhotoTop } from "./VerticalPhotoTop";
import { VerticalPhotoCircle } from "./VerticalPhotoCircle";
import { VerticalPhotoFull } from "./VerticalPhotoFull";

type ExtendedTemplate = CardTemplate & { hasOwnLogo?: boolean; logoTone?: "light" | "dark" };

export const TEMPLATES: ExtendedTemplate[] = [
  {
    id: "minimal-white",
    name: "ミニマル・ホワイト",
    description: "白地・極シンプル。汎用性が最も高い。士業・コンサル・フリーランス",
    category: "formal",
    swatch: { bg: "#ffffff", fg: "#171717", accent: "#171717" },
    Component: MinimalWhite,
    hasOwnLogo: true,
    logoTone: "dark",
  },
  {
    id: "minimal-black",
    name: "ミニマル・ブラック",
    description: "黒地・極シンプル。クール&洗練。経営層・コンサル",
    category: "formal",
    swatch: { bg: "#0a0a0a", fg: "#fafafa", accent: "#fafafa" },
    Component: MinimalBlack,
    hasOwnLogo: true,
    logoTone: "light",
  },
  {
    id: "corporate-blue",
    name: "コーポレート・ブルー",
    description: "信頼感のある青系サイドバー。IT・コンサル・営業職定番",
    category: "formal",
    swatch: { bg: "#ffffff", fg: "#1e3a8a", accent: "#2563eb" },
    Component: CorporateBlue,
    hasOwnLogo: true,
  },
  {
    id: "corporate-navy-bar",
    name: "コーポレート・ネイビー",
    description: "上下にネイビーバー、伝統的でフォーマル。金融・法務・経理",
    category: "formal",
    swatch: { bg: "#ffffff", fg: "#0f172a", accent: "#0f172a" },
    Component: CorporateNavyBar,
    logoTone: "dark",
  },
  {
    id: "split-diagonal",
    name: "スプリット・ダイアゴナル",
    description: "斜め分割のモダンツートン。スタートアップ・営業・新規事業",
    category: "tech",
    swatch: { bg: "#ffffff", fg: "#0f172a", accent: "#22d3ee" },
    Component: SplitDiagonal,
    logoTone: "dark",
  },
  {
    id: "wall-street",
    name: "ウォール街・トラディショナル",
    description: "ネイビー＋ゴールドの伝統格式。役員クラス・投資・士業",
    category: "luxury",
    swatch: { bg: "#0a1628", fg: "#fde68a", accent: "#d4af37" },
    Component: WallStreet,
    hasOwnLogo: true,
    logoTone: "light",
  },
  {
    id: "stripe-gradient",
    name: "ソフト・グラデーション",
    description: "Stripe風の優しいグラデ。SaaS・スタートアップ・PdM",
    category: "tech",
    swatch: { bg: "#ffffff", fg: "#0a2540", accent: "#635bff" },
    Component: StripeGradient,
    hasOwnLogo: true,
  },
  {
    id: "modern-gradient-blue",
    name: "モダン・ブルーグラデ",
    description: "青〜シアンの滑らかなグラデ。IT・テック・データサイエンス",
    category: "tech",
    swatch: { bg: "#1e3a8a", fg: "#ffffff", accent: "#06b6d4" },
    Component: ModernGradientBlue,
    logoTone: "light",
  },
  {
    id: "sunset-gradient",
    name: "サンセット・グラデーション",
    description: "暖色グラデ。クリエイター・カウンセラー・ヨガインストラクター",
    category: "creative",
    swatch: { bg: "#f59e0b", fg: "#ffffff", accent: "#8b5cf6" },
    Component: SunsetGradient,
    hasOwnLogo: true,
    logoTone: "light",
  },
  {
    id: "dark-neon",
    name: "ダーク・テック",
    description: "黒地にネオンの輝き。エンジニア・ゲーム業界・サイバーセキュリティ",
    category: "tech",
    swatch: { bg: "#020617", fg: "#22d3ee", accent: "#a855f7" },
    Component: DarkNeon,
    logoTone: "light",
  },
  {
    id: "tech-mono",
    name: "テック・モノスペース",
    description: "ターミナル風、エンジニア・OSS開発者・SREに最適",
    category: "tech",
    swatch: { bg: "#0a0e1a", fg: "#a3e635", accent: "#86efac" },
    Component: TechMono,
    logoTone: "light",
  },
  {
    id: "embossed-gold",
    name: "プレミアム・ブラック&ゴールド",
    description: "黒地にゴールド枠、最上級の高級感。役員・ホテル・高級店",
    category: "luxury",
    swatch: { bg: "#0a0a0a", fg: "#d4af37", accent: "#d4af37" },
    Component: EmbossedGold,
    hasOwnLogo: true,
    logoTone: "light",
  },
  {
    id: "japanese-wabi",
    name: "和モダン・侘",
    description: "和紙風の落ち着き。和食店・伝統工芸・茶道・着物・士業",
    category: "traditional",
    swatch: { bg: "#f5f1e8", fg: "#171717", accent: "#7c2d12" },
    Component: JapaneseWabi,
    hasOwnLogo: true,
    logoTone: "dark",
  },
  {
    id: "architectural",
    name: "アーキテクチュラル",
    description: "技術図面風グリッド。建築・インテリア・プロダクトデザイナー",
    category: "tech",
    swatch: { bg: "#fbfaf6", fg: "#0a0a0a", accent: "#0a0a0a" },
    Component: Architectural,
    hasOwnLogo: true,
    logoTone: "dark",
  },
  {
    id: "vertical-mincho",
    name: "縦型・和明朝",
    description: "縦書き和風。士業・伝統工芸・茶華道・着物店",
    category: "traditional",
    orientation: "vertical",
    swatch: { bg: "#f5f1e8", fg: "#171717", accent: "#7c2d12" },
    Component: VerticalMincho,
    hasOwnLogo: true,
  },
  {
    id: "vertical-modern",
    name: "縦型・モダン",
    description: "中央寄せの縦型モダン。クリエイター・スタイリスト・カメラマン",
    category: "creative",
    orientation: "vertical",
    swatch: { bg: "#ffffff", fg: "#171717", accent: "#2563eb" },
    Component: VerticalModern,
    hasOwnLogo: true,
  },
  {
    id: "vertical-luxe",
    name: "縦型・プレミアム",
    description: "黒地ゴールドの縦型。VIP・ラグジュアリーブランド・宝飾店",
    category: "luxury",
    orientation: "vertical",
    swatch: { bg: "#0a0a0a", fg: "#d4af37", accent: "#d4af37" },
    Component: VerticalLuxe,
    hasOwnLogo: true,
    logoTone: "light",
  },
  {
    id: "vertical-sidebar",
    name: "縦型・サイドバー",
    description: "縦型ビジネス。コーポレートコンパクト。営業・総務",
    category: "formal",
    orientation: "vertical",
    swatch: { bg: "#ffffff", fg: "#171717", accent: "#1e3a8a" },
    Component: VerticalSidebar,
    hasOwnLogo: true,
  },
  {
    id: "vertical-minimal",
    name: "縦型・ミニマル",
    description: "縦型シンプル。汎用性が高い。フリーランス全般・コンサル",
    category: "formal",
    orientation: "vertical",
    swatch: { bg: "#ffffff", fg: "#171717", accent: "#171717" },
    Component: VerticalMinimal,
    hasOwnLogo: true,
  },
  {
    id: "custom-background",
    name: "📷 カスタム背景",
    description: "アップロードした画像を背景にして自由にカスタム",
    category: "creative",
    swatch: { bg: "#ffffff", fg: "#171717", accent: "#171717" },
    Component: CustomBackground,
    hasOwnLogo: true,
  },
  {
    id: "photo-card",
    name: "👤 写真・自由配置",
    description: "写真を15種の配置から自由に選択（フレキシブル）",
    category: "creative",
    swatch: { bg: "#ffffff", fg: "#171717", accent: "#171717" },
    Component: PhotoCard,
    hasOwnLogo: true,
  },
  {
    id: "photo-editorial",
    name: "📰 写真・エディトリアル",
    description: "雑誌風セリフ書体＋左40%写真。クリエイター系",
    category: "creative",
    swatch: { bg: "#fbfaf6", fg: "#0a0a0a", accent: "#0a0a0a" },
    Component: PhotoEditorial,
    hasOwnLogo: true,
  },
  {
    id: "photo-noir",
    name: "🎬 写真・ノワール",
    description: "全面写真＋ドラマチックな黒オーバーレイ。インパクト重視",
    category: "creative",
    swatch: { bg: "#0a0a0a", fg: "#fafafa", accent: "#fde68a" },
    Component: PhotoNoir,
    hasOwnLogo: true,
  },
  {
    id: "photo-fresh",
    name: "🌊 写真・フレッシュ",
    description: "明るいグラデ背景＋丸枠写真。カウンセラー・ヒーラー系",
    category: "creative",
    swatch: { bg: "#f0f9ff", fg: "#0c4a6e", accent: "#06b6d4" },
    Component: PhotoFresh,
    hasOwnLogo: true,
  },
  {
    id: "photo-frame",
    name: "🖼 写真・フレーム",
    description: "額装風セリフ＋左サイド写真。和の落ち着き",
    category: "creative",
    swatch: { bg: "#f5f1e8", fg: "#1c1917", accent: "#7c2d12" },
    Component: PhotoFrame,
    hasOwnLogo: true,
  },
  {
    id: "photo-hero",
    name: "📸 写真・ヒーロー",
    description: "上半分が大きな写真。SNS・YouTuberにも最適",
    category: "creative",
    swatch: { bg: "#ffffff", fg: "#0a0a0a", accent: "#0a0a0a" },
    Component: PhotoHero,
    hasOwnLogo: true,
  },
  {
    id: "vertical-photo-top",
    name: "👤 縦型・写真トップ",
    description: "縦型・上半分が写真、下半分に情報",
    category: "creative",
    orientation: "vertical",
    swatch: { bg: "#ffffff", fg: "#171717", accent: "#171717" },
    Component: VerticalPhotoTop,
    hasOwnLogo: true,
  },
  {
    id: "vertical-photo-circle",
    name: "📷 縦型・写真サークル",
    description: "縦型・中央に丸い写真。プロフィール風",
    category: "creative",
    orientation: "vertical",
    swatch: { bg: "#ffffff", fg: "#171717", accent: "#171717" },
    Component: VerticalPhotoCircle,
    hasOwnLogo: true,
  },
  {
    id: "vertical-photo-full",
    name: "🎬 縦型・写真フル",
    description: "縦型・全面写真＋下にテキスト。インパクト重視",
    category: "creative",
    orientation: "vertical",
    swatch: { bg: "#0a0a0a", fg: "#fafafa", accent: "#fde68a" },
    Component: VerticalPhotoFull,
    hasOwnLogo: true,
  },
];

export function getTemplate(id: string): ExtendedTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

/** Occupation-oriented category labels for the design picker. */
export const CATEGORY_LABELS: Record<string, string> = {
  formal: "🏛 フォーマル / 士業・経営",
  tech: "💻 テック / IT・スタートアップ",
  creative: "🎨 クリエイティブ / アーティスト",
  luxury: "👑 ラグジュアリー / VIP",
  traditional: "🎌 和風 / 伝統業種",
  lifestyle: "🌿 ライフスタイル / 接客・サロン",
};

/** One-line description per category, shown under the section heading. */
export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  formal:
    "信頼感・誠実さ重視。士業（弁護士・会計士）、銀行、コンサル、経営層、フリーランス全般",
  tech:
    "モダンで先進的な印象。IT・エンジニア・スタートアップ・SaaS・ゲーム・AI業界",
  creative:
    "個性とセンスを表現。デザイナー・カメラマン・アーティスト・カウンセラー・スタイリスト",
  luxury:
    "上質と格式。役員・投資家・宝飾店・高級ホテル・ハイブランド・経営者層",
  traditional:
    "和の落ち着きと格。和食店・伝統工芸・茶華道・着物・神職・士業（和テイスト）",
  lifestyle:
    "親しみやすく接客的。サロン・カフェ・小売・個人事業主・セラピスト",
};

export const CATEGORY_ORDER: string[] = [
  "formal",
  "tech",
  "creative",
  "luxury",
  "traditional",
  "lifestyle",
];
