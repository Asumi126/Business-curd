import { BackStyle } from "../lib/types";
import { MemoLined } from "./MemoLined";
import { MemoGrid } from "./MemoGrid";
import { BigQR } from "./BigQR";
import { QRSplit } from "./QRSplit";
import { SloganBig } from "./SloganBig";
import { MonoLogo } from "./MonoLogo";
import { PatternMatch } from "./PatternMatch";
import { ContactList } from "./ContactList";
import { Minimal } from "./Minimal";
import { QRMemo } from "./QRMemo";
import { QRMemoSplit } from "./QRMemoSplit";
import { QRSlogan } from "./QRSlogan";
import { QRWithBigText } from "./QRWithBigText";
import { CompanyCard } from "./CompanyCard";
import { ServiceList } from "./ServiceList";
import { PRPoster } from "./PRPoster";
import { DualQRSideBySide } from "./DualQRSideBySide";
import { DualQRStacked } from "./DualQRStacked";
import { DualQRWithMemo } from "./DualQRWithMemo";
import { CustomText } from "./CustomText";
import { CustomBgBack } from "./CustomBgBack";

export const BACK_STYLES: BackStyle[] = [
  {
    id: "qr-split",
    name: "QR + 連絡先",
    description: "QRと連絡先がバランスよく並んだ実用派",
    category: "qr",
    Component: QRSplit,
  },
  {
    id: "big-qr",
    name: "ビッグQR",
    description: "中央に大きなQR、読み取りやすさ重視",
    category: "qr",
    Component: BigQR,
  },
  {
    id: "qr-memo",
    name: "QR + メモ（上下）",
    description: "上部にQR＋名前、下部にメモ罫線。実用派のハイブリッド",
    category: "qr",
    Component: QRMemo,
  },
  {
    id: "qr-memo-split",
    name: "QR + メモ（左右）",
    description: "左半分にQR、右半分にメモ欄。QR+連絡先と同じレイアウトのメモ版",
    category: "qr",
    Component: QRMemoSplit,
  },
  {
    id: "qr-slogan",
    name: "QR + スローガン",
    description: "QRと一緒にあなたのモットーを大きく",
    category: "qr",
    Component: QRSlogan,
  },
  {
    id: "qr-big-text",
    name: "QR + 大きな見出し",
    description: "「LINEで繋がろう」など大きな見出しと中央QR",
    category: "qr",
    Component: QRWithBigText,
  },
  {
    id: "dual-qr-side",
    name: "✨ QR×2 横並び",
    description: "vCardとURLなど、2つのQRコードを横に配置（用途別に使い分け）",
    category: "qr",
    Component: DualQRSideBySide,
  },
  {
    id: "dual-qr-stacked",
    name: "✨ QR×2 上下＋ラベル付き",
    description: "2つのQRに「スマホで読み取り」「サイトを開く」などのガイド付き",
    category: "qr",
    Component: DualQRStacked,
  },
  {
    id: "dual-qr-memo",
    name: "✨ QR×2 + メモ欄",
    description: "左に2つのQR（vCard・URL）、右に書き込み可能な白メモ欄",
    category: "qr",
    Component: DualQRWithMemo,
  },
  {
    id: "memo-lined",
    name: "メモ罫線",
    description: "横線が入った手書きメモ用裏面",
    category: "memo",
    Component: MemoLined,
  },
  {
    id: "memo-grid",
    name: "メモ ドット方眼",
    description: "ドット方眼のメモ・スケッチ用",
    category: "memo",
    Component: MemoGrid,
  },
  {
    id: "slogan-big",
    name: "スローガン",
    description: "タグラインを大胆に見せる",
    category: "branded",
    Component: SloganBig,
  },
  {
    id: "mono-logo",
    name: "ロゴ・マーク",
    description: "モノグラム/ロゴを中央に配置",
    category: "branded",
    Component: MonoLogo,
  },
  {
    id: "pattern-match",
    name: "パターン",
    description: "ドットパターンの装飾的な裏面",
    category: "branded",
    Component: PatternMatch,
  },
  {
    id: "contact-list",
    name: "コンタクト詳細",
    description: "連絡先・SNSを完全リスト化",
    category: "info",
    Component: ContactList,
  },
  // 「ミニマル」テンプレ (id: "minimal") は実用性に欠けるためユーザー要望により削除。
  // Minimal.tsx 自体は型互換のため残置されているが、一覧には載せない。
  {
    id: "custom-text",
    name: "✏️ カスタムテキスト",
    description: "自由に行を追加して、文字・サイズ・フォントを完全カスタム",
    category: "minimal",
    Component: CustomText,
  },
  {
    id: "custom-bg-back",
    name: "📷 カスタム背景（裏面）",
    description: "アップロードした画像を裏面の背景に使う。スローガン+オーバーレイ対応",
    category: "branded",
    Component: CustomBgBack,
  },
  {
    id: "company-card",
    name: "🏢 企業紹介カード",
    description: "社名＋紹介文＋連絡先。表面と完全に違う「企業PRの面」",
    category: "company",
    Component: CompanyCard,
  },
  {
    id: "service-list",
    name: "📋 サービス一覧",
    description: "提供サービスを箇条書き＋URL。営業向け",
    category: "company",
    Component: ServiceList,
  },
  {
    id: "pr-poster",
    name: "📣 PRポスター",
    description: "大胆な見出し＋URL＋QR。インパクト最大",
    category: "company",
    Component: PRPoster,
  },
];

export function getBackStyle(id: string): BackStyle {
  return BACK_STYLES.find((b) => b.id === id) ?? BACK_STYLES[0];
}

export const BACK_CATEGORY_LABELS: Record<string, string> = {
  qr: "QRコード",
  memo: "メモ・手書き用",
  branded: "ブランディング",
  info: "情報",
  company: "企業PR・紹介",
  minimal: "ミニマル",
};
