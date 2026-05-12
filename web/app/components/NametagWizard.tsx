"use client";

/**
 * Nametag Maker (BETA) — 名札作成ページ
 *
 * 想定用途: オフ会・展示会・店員名札を最大100名分まとめて印刷したい人。
 *
 * UX設計の根拠:
 *  - 名札サイズは 88×55mm（A4で8面付けが市販ラベル用紙の標準: エーワン互換）。
 *  - 1画面構成（名簿 / テンプレ / 共通設定 / プレビュー）。ステップ分割は不要 ──
 *    名札は項目が少なく、すべて見渡せた方が修正が早い。
 *  - 名簿はテーブル形式（Excel感覚）。CSV/タブ区切りペーストにも対応。
 *  - 共通設定（イベント名・カラー・ロゴ）は全員に同じ値が当たる。実運用ではこれが
 *    ほぼ常に正しい。個別調整したい場合は名簿テーブルに直接書き込む。
 *  - 名札の主役は「氏名」。可読性最優先で大きく表示する。
 */

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { generateQRDataUrl } from "../lib/qr";
import { useUndoRedo, UNDO_REDO_BTN_CLASS } from "../lib/useUndoRedo";
import { ColorPickerWithHistory } from "./ColorPickerWithHistory";
import {
  addManyRoster,
  addRosterPerson,
  clearRoster,
  deleteRosterPerson,
  deleteSnapshot,
  exportRosterCsv,
  listRoster,
  listSnapshots,
  ROSTER_LIMIT,
  saveSnapshot,
  SNAPSHOT_LIMIT,
  updateRosterPerson,
  type NametagSnapshot,
  type RosterPerson,
} from "../lib/nametagDb";
import { fetchSheetRows as fetchSheetRowsShared } from "../lib/integrations";

const STORAGE_KEY = "nametag-wizard:v1";

// 名札サイズ（mm）— A4(210×297) に 2列×4行=8面付け
const TAG_W_MM = 88;
const TAG_H_MM = 55;
const A4_W_MM = 210;
const A4_H_MM = 297;
const A4_MARGIN_MM = 8.5; // (210-88*2)/2/2 ≒ 8.5mm
const A4_TOP_MARGIN_MM = 13.5; // (297-55*4)/2/2 ≒ 13.5mm

type Person = {
  id: string;
  name: string;       // 氏名（漢字）
  kana: string;       // ふりがな or 英字
  affiliation: string; // 所属・会社名
  title: string;      // 役職・肩書き
  url?: string;       // 個人別QRコードのリンク先（任意）
  color?: string;     // 個人別アクセントカラー（任意・空欄なら共通カラー）
  freeText?: string;  // 個人別の自由テキスト（任意・名札に追加表示）
  imageDataUrl?: string; // 個人別画像（任意・写真やロゴ。アップロードで Data URL）
  /** 手動グループ振り分け時のグループキー（A〜F）。自動モードでは無視 */
  group?: GroupKey;
};

/** グループ分け関連 */
type GroupKey = "A" | "B" | "C" | "D" | "E" | "F";
const GROUP_KEYS: GroupKey[] = ["A", "B", "C", "D", "E", "F"];
const NAMETAG_GROUP_COLORS: Record<GroupKey, string> = {
  A: "#3b82f6", // blue
  B: "#10b981", // emerald
  C: "#f59e0b", // amber
  D: "#ec4899", // pink
  E: "#a855f7", // purple
  F: "#14b8a6", // teal
};
type GroupMode = "off" | "auto" | "manual";

type TemplateId =
  | "minimal" | "color-band" | "event" | "photo-card"
  | "double-band" | "side-dark" | "gradient" | "neon-dark"
  | "earth" | "frame-classic" | "modern-sans" | "handwrite"
  | "card-bordered" | "dot-accent" | "polaroid" | "striped"
  | "big-number" | "minimal-bold" | "pastel" | "tech-mono"
  | "free-layout" | "custom-bg-only";

/** 自由レイアウト用の要素キー */
type FreeLayoutItemKey = "name" | "kana" | "affiliation" | "title" | "freeText" | "qr" | "logo" | "eventName" | "customText";

/** 自由レイアウト要素の位置・サイズ（mm）。座標は左上原点。 */
type FreeLayoutItem = {
  enabled: boolean;
  x: number;     // mm from left
  y: number;     // mm from top
  scale: number; // 1.0 = default, 0.5–2.0
  /** 揃え方向（任意・未指定はleft）。center=中央寄せ、right=右寄せ */
  align?: "left" | "center" | "right";
};

type FreeLayoutMap = Partial<Record<FreeLayoutItemKey, FreeLayoutItem>>;

type VisibleFields = {
  kana: boolean;
  affiliation: boolean;
  title: boolean;
  freeText: boolean;
  qr: boolean;
  eventName: boolean;
  eventDate: boolean;
  logo: boolean;
};

/** 用途別プリセット — フィールドのラベルとデフォルト表示項目をまとめて切替 */
type UseCase = string; // built-in: "business"|"shop"|"community"|"custom" + user-defined IDs

const CUSTOM_PRESETS_KEY = "nametag-wizard:v1:customPresets";
const CUSTOM_PRESET_LIMIT = 6;

type FieldLabels = {
  name: string;       // 主表示テキスト
  kana: string;       // ふりがな相当（補助テキスト）
  affiliation: string; // 所属相当
  title: string;      // 役職相当
  freeText: string;   // 自由テキスト相当（「ひとこと」など）
};

type PresetConfig = {
  label: string;
  description: string;
  emoji: string;
  visible: VisibleFields;
  labels: FieldLabels;
  color: string;
};

type CustomPreset = PresetConfig & {
  id: string;
  createdAt: number;
  updatedAt: number;
};

type BackLayout =
  | "none" | "qr-large" | "url-text" | "logo-center" | "free-text" | "custom-bg"
  // メモ用デザイン（線あり×2 + フリーメモ×2）
  | "memo-lined" | "memo-grid" | "memo-blank" | "memo-titled";

/** 裏面カスタム背景の上にどの要素を重ねるか（任意・複数選択可） */
type BackOverlay = {
  qr: boolean;
  freeText: boolean;
  logo: boolean;
  name: boolean;
  customText: string; // 共通の追加テキスト（任意）
};

type NametagData = {
  people: Person[];
  templateId: TemplateId;
  eventName: string;
  eventDate: string;
  mainColor: string;
  /** 裏面のメインカラー（任意・空欄なら mainColor を共有） */
  backMainColor?: string;
  logoDataUrl: string;
  visibleFields: VisibleFields;
  useCase: UseCase;
  fieldLabels: FieldLabels;
  // カスタム背景
  customBgDataUrl: string;     // 表面用カスタム背景
  customBgOpacity: number;     // 0-1
  /** 自由レイアウト時の要素配置（free-layout・custom-bg-only テンプレ、
   *  または freeLayoutEnabled=true の時に適用される） */
  freeLayout: FreeLayoutMap;
  /** 自由レイアウト全要素の一括サイズ倍率（個別 scale に乗算される） */
  freeLayoutGlobalScale?: number;
  /** どのテンプレを選んでも自由レイアウトの位置調整を有効化するスイッチ */
  freeLayoutEnabled?: boolean;
  /** テンプレ使用時の項目別オフセット調整（テンプレデフォルト位置からの
   *  mm単位ずらし量＋サイズ倍率）。x=0,y=0,scale=1 ならテンプレ通り。 */
  templateLayoutOffsets?: Partial<Record<FreeLayoutItemKey, { x: number; y: number; scale: number }>>;
  // 裏面
  backLayout: BackLayout;
  backText: string;            // 裏面の自由テキスト（共通）
  backCustomBgDataUrl: string; // 裏面のカスタム背景
  backOverlay: BackOverlay;    // カスタム背景上に重ねる要素
  /** メモ系裏面（memo-lined / memo-grid / memo-blank / memo-titled）の設定 */
  backMemoTitle?: string;      // タイトル文字（空ならデフォルト/名前を使用）
  backMemoShowName?: boolean;  // 名前を表示するか（デフォルト true）
  /** 項目別の文字色（任意・空欄ならテンプレ既定色 or メインカラー）。
   *  全テンプレ・自由レイアウトで反映される。 */
  textColors?: Partial<Record<FreeLayoutItemKey, string>>;
  /** イベント名の色決定モード：
   *  - "main":   メインカラー（data.mainColor）と連動
   *  - "group":  グループカラーと連動（グループ機能ONの時のみ意味あり）
   *  - "custom": textColors.eventName のカスタム色を使用 */
  eventNameColorMode?: "main" | "group" | "custom";
  /** グループ分け設定 */
  groupMode?: GroupMode;
  groupLabels?: Record<GroupKey, string>;
  groupColors?: Record<GroupKey, string>;
  autoGroupColors?: Record<string, string>; // 所属(affiliation)別カラー
  /** 表面のQRコード設定（一括適用）。 enabled=true ならテンプレ既存のQRを
   *  非表示にして、指定の位置・サイズで全員共通の表面QRを描画する。 */
  frontQrOverride?: {
    enabled: boolean;
    x: number;       // mm（左上原点）
    y: number;       // mm
    size: number;    // mm（正方形）
    /** URL の取得元: "person-url" は個人別 URL、"custom-url" は固定 URL */
    source: "person-url" | "custom-url";
    customUrl: string;
  };
};

const USECASE_PRESETS: Record<
  "business" | "shop" | "community" | "custom",
  PresetConfig
> = {
  business: {
    label: "会社・ビジネス",
    description: "氏名+所属+役職を強調。社内外の会議や展示会向け",
    emoji: "🏢",
    visible: { kana: false, affiliation: true, title: true, freeText: false, qr: true, eventName: true, eventDate: false, logo: true },
    labels: { name: "氏名", kana: "ふりがな", affiliation: "部署・所属", title: "役職", freeText: "ひとこと" },
    color: "#1e3a8a",
  },
  shop: {
    // 名前/ふりがな/役職/好きなメニュー/QRコード/ひとこと
    label: "カフェスタッフ",
    description: "名前+ふりがな+役職+好きなメニュー+QR+ひとこと",
    emoji: "☕",
    visible: { kana: true, affiliation: true, title: true, freeText: true, qr: true, eventName: false, eventDate: false, logo: false },
    labels: { name: "名前", kana: "ふりがな", affiliation: "好きなメニュー", title: "役職", freeText: "ひとこと" },
    color: "#ea580c",
  },
  community: {
    // 名前/ふりがな/所属/参加回数/QRコード/ひとこと
    label: "オフ会イベント",
    description: "名前+ふりがな+所属+参加回数+QR+ひとこと",
    emoji: "🎉",
    visible: { kana: true, affiliation: true, title: true, freeText: true, qr: true, eventName: true, eventDate: true, logo: false },
    labels: { name: "名前", kana: "ふりがな", affiliation: "所属", title: "参加回数", freeText: "ひとこと" },
    color: "#a855f7",
  },
  custom: {
    label: "カスタム",
    description: "項目ラベルを自由に変更",
    emoji: "✨",
    visible: { kana: true, affiliation: true, title: true, freeText: true, qr: true, eventName: true, eventDate: true, logo: true },
    labels: { name: "氏名", kana: "ふりがな", affiliation: "所属", title: "役職", freeText: "ひとこと" },
    color: "#10b981",
  },
};

const DEFAULT_VISIBLE: VisibleFields = {
  kana: true,
  affiliation: true,
  title: true,
  freeText: true,
  qr: true,
  eventName: true,
  eventDate: true,
  logo: true,
};

const DEFAULT_FREE_LAYOUT_BASE: FreeLayoutMap = {
  name: { enabled: true, x: 5, y: 18, scale: 1 },
  kana: { enabled: true, x: 5, y: 12, scale: 0.7 },
  affiliation: { enabled: true, x: 5, y: 38, scale: 0.7 },
  title: { enabled: true, x: 5, y: 45, scale: 0.7 },
  freeText: { enabled: false, x: 5, y: 50, scale: 0.7 },
  qr: { enabled: true, x: 70, y: 38, scale: 1 },
  logo: { enabled: true, x: 70, y: 3, scale: 1 },
  eventName: { enabled: true, x: 5, y: 4, scale: 0.6 },
  customText: { enabled: false, x: 5, y: 50, scale: 0.7 },
};

const DEFAULT_DATA: NametagData = {
  people: [],
  templateId: "minimal",
  eventName: "",
  eventDate: "",
  mainColor: "#10b981",
  logoDataUrl: "",
  visibleFields: DEFAULT_VISIBLE,
  useCase: "custom",
  fieldLabels: USECASE_PRESETS.custom.labels,
  customBgDataUrl: "",
  customBgOpacity: 0.4,
  freeLayout: DEFAULT_FREE_LAYOUT_BASE,
  backLayout: "none",
  backText: "",
  backCustomBgDataUrl: "",
  backOverlay: { qr: false, freeText: false, logo: false, name: false, customText: "" },
  backMemoTitle: "",
  backMemoShowName: true,
  textColors: {},
  eventNameColorMode: "group",
  groupMode: "off",
  groupLabels: { A: "グループA", B: "グループB", C: "グループC", D: "グループD", E: "グループE", F: "グループF" },
  groupColors: { ...NAMETAG_GROUP_COLORS },
  autoGroupColors: {},
  frontQrOverride: {
    enabled: false,
    x: 73, // 右寄り
    y: 38, // 下寄り
    size: 12,
    source: "person-url",
    customUrl: "",
  },
};

const COLOR_PRESETS: { id: string; color: string; label: string }[] = [
  { id: "emerald", color: "#10b981", label: "エメラルド" },
  { id: "blue", color: "#3b82f6", label: "ブルー" },
  { id: "indigo", color: "#6366f1", label: "インディゴ" },
  { id: "purple", color: "#a855f7", label: "パープル" },
  { id: "pink", color: "#ec4899", label: "ピンク" },
  { id: "rose", color: "#f43f5e", label: "ローズ" },
  { id: "orange", color: "#f97316", label: "オレンジ" },
  { id: "amber", color: "#f59e0b", label: "アンバー" },
  { id: "lime", color: "#84cc16", label: "ライム" },
  { id: "teal", color: "#14b8a6", label: "ティール" },
  { id: "navy", color: "#1e3a8a", label: "ネイビー" },
  { id: "black", color: "#171717", label: "ブラック" },
];

const TEMPLATES: { id: TemplateId; label: string; description: string }[] = [
  { id: "minimal", label: "ミニマル", description: "白地・大きい氏名。読みやすさ最優先" },
  { id: "color-band", label: "カラーバンド", description: "上部にカラー帯。部署別色分けに" },
  { id: "event", label: "イベント", description: "イベント名と日付を強調。オフ会・展示会向け" },
  { id: "photo-card", label: "プロフェッショナル", description: "左側にカラーアクセント、右側に情報" },
  { id: "double-band", label: "ダブルバンド", description: "上下バンドでフォーマル感" },
  { id: "side-dark", label: "サイドダーク", description: "左にダーク帯。クールな印象" },
  { id: "gradient", label: "グラデーション", description: "色のグラデで華やかに" },
  { id: "neon-dark", label: "ネオン・ダーク", description: "黒地に蛍光色。テック・夜系イベント" },
  { id: "earth", label: "アース", description: "ベージュ系の落ち着き。クラシック" },
  { id: "frame-classic", label: "クラシック額装", description: "枠線で囲む伝統的スタイル" },
  { id: "modern-sans", label: "モダンサンセリフ", description: "極シンプル。レター調" },
  { id: "handwrite", label: "ハンドライト", description: "手書き風で親しみやすく" },
  { id: "card-bordered", label: "カードボーダー", description: "繊細な枠で上品に" },
  { id: "dot-accent", label: "ドットアクセント", description: "角に大きなドット" },
  { id: "polaroid", label: "ポラロイド風", description: "写真風の余白枠" },
  { id: "striped", label: "ストライプ", description: "斜めストライプ背景" },
  { id: "big-number", label: "番号バッジ", description: "大きな番号バッジ付き" },
  { id: "minimal-bold", label: "ボールド", description: "極太ゴシック。インパクト重視" },
  { id: "pastel", label: "パステル", description: "やわらかいパステル背景" },
  { id: "tech-mono", label: "テック", description: "等幅フォント。ターミナル風" },
  { id: "custom-bg-only", label: "🖼 カスタム背景", description: "余計な装飾なし。背景画像の上に文字だけシンプル配置" },
  { id: "free-layout", label: "🎨 自由レイアウト", description: "各要素を自由に配置・サイズ調整" },
];

// 既存の参照を保つためのエイリアス（前方宣言済みの DEFAULT_FREE_LAYOUT_BASE と同一）
const DEFAULT_FREE_LAYOUT: FreeLayoutMap = DEFAULT_FREE_LAYOUT_BASE;

// === Custom Preset Storage =================================================

function listCustomPresets(): CustomPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as CustomPreset[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveCustomPresets(list: CustomPreset[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

function genPresetId(): string {
  return `cp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const SAMPLE_PEOPLE: Person[] = [
  { id: "1", name: "山田 太郎", kana: "やまだ たろう", affiliation: "デザイン課", title: "リーダー" },
  { id: "2", name: "鈴木 花子", kana: "すずき はなこ", affiliation: "営業部", title: "" },
  { id: "3", name: "佐藤 次郎", kana: "さとう じろう", affiliation: "開発チーム", title: "" },
];

function newPerson(): Person {
  return {
    id: Math.random().toString(36).slice(2, 10),
    name: "",
    kana: "",
    affiliation: "",
    title: "",
    url: "",
    freeText: "",
  };
}

type NametagWizardProps = { onBackToSelector?: () => void };

export function NametagWizard({ onBackToSelector }: NametagWizardProps = {}) {
  const [data, setData] = useState<NametagData>(DEFAULT_DATA);
  // Undo / Redo: ⌘+Z / Ctrl+Z で1つ戻る、⌘+Shift+Z / Ctrl+Y で1つ進める
  const undoRedo = useUndoRedo(data, setData);
  const [hydrated, setHydrated] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // ホバー中の一時プレビュー用テンプレID（カスタムドロップダウン用）。
  // クリック時は data.templateId に固定保存し、ホバー値はクリアして固定値に戻す。
  const [hoverTemplateId, setHoverTemplateId] = useState<TemplateId | null>(null);
  // （旧）カスタムドロップダウンの開閉状態 — プルダウンは廃止しサムネ一覧のみ
  // hoverTemplateId だけは将来再導入用に残す
  // 名簿セクションの表示/非表示。
  // デフォルト動作：名簿が空なら自動展開、1名以上いれば折りたたみで開始
  // ユーザーがトグルした後はその状態を維持
  const [rosterExpanded, setRosterExpanded] = useState<boolean | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [rosterOpen, setRosterOpen] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [presetManagerOpen, setPresetManagerOpen] = useState(false);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);

  useEffect(() => {
    setCustomPresets(listCustomPresets());
  }, [presetManagerOpen]);
  const captureRef = useRef<HTMLDivElement>(null);
  const captureBackRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<NametagData>;
        setData({
          ...DEFAULT_DATA,
          ...parsed,
          visibleFields: { ...DEFAULT_VISIBLE, ...(parsed.visibleFields ?? {}) },
          fieldLabels: { ...USECASE_PRESETS.custom.labels, ...(parsed.fieldLabels ?? {}) },
          freeLayout: { ...DEFAULT_FREE_LAYOUT, ...(parsed.freeLayout ?? {}) },
        });
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // quota exceeded, ignore
    }
  }, [data, hydrated]);

  const update = (patch: Partial<NametagData>) => setData((d) => ({ ...d, ...patch }));

  const addPerson = () => {
    if (data.people.length >= 50) {
      alert("最大100名までです");
      return;
    }
    update({ people: [...data.people, newPerson()] });
  };

  const removePerson = (id: string) => {
    update({ people: data.people.filter((p) => p.id !== id) });
  };

  const updatePerson = (id: string, patch: Partial<Person>) => {
    update({
      people: data.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  };

  const loadSample = () => {
    update({ people: SAMPLE_PEOPLE.map((p) => ({ ...p, id: Math.random().toString(36).slice(2, 10) })) });
  };

  const clearAll = () => {
    if (confirm("名簿をすべて削除しますか？")) {
      update({ people: [] });
    }
  };

  // CSV/TSV import. Accepts:
  //   - tab-separated (Excel / Google Sheets default copy-paste)
  //   - comma-separated (downloaded .csv from Excel/Sheets)
  //   - column order: 氏名, ふりがな, 所属, 役職
  // Header row is auto-skipped if the first row clearly looks like a header
  // (any column literally named "氏名" / "name" / "Name").
  const importCsv = () => {
    // BOM除去（UTF-8 .csv のスプレッドシート出力対策）
    const cleaned = csvText.replace(/^﻿/, "").trim();
    const lines = cleaned
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      alert("貼り付けるテキストが空です");
      return;
    }
    // 区切り判定: タブが含まれていればTSV、なければカンマCSVとみなす
    const sep = lines[0].includes("\t") ? "\t" : ",";
    // ヘッダー行検出
    const looksLikeHeader = (() => {
      const cols = lines[0].split(sep).map((c) => c.trim().toLowerCase());
      return cols.some((c) =>
        ["氏名", "名前", "name", "なまえ"].includes(c),
      );
    })();
    const dataLines = looksLikeHeader ? lines.slice(1) : lines;
    if (dataLines.length === 0) {
      alert("ヘッダー行のみ検出されました。データ行も含めてください");
      return;
    }
    const parsed: Person[] = dataLines.map((line) => {
      // 簡易CSV: ダブルクォートで囲まれたフィールド内のセパレーター/改行は対応していない。
      // スプレッドシート/Excel の標準出力では問題なし（フィールドにカンマや改行を含めない場合）。
      const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
      return {
        id: Math.random().toString(36).slice(2, 10),
        name: cols[0] || "",
        kana: cols[1] || "",
        affiliation: cols[2] || "",
        title: cols[3] || "",
        url: cols[4] || "",
        freeText: cols[5] || "", // 6列目を「自由テキスト」として扱う
      };
    });
    if (data.people.length + parsed.length > 50) {
      alert(`最大100名までです（現在${data.people.length}名 + 追加${parsed.length}名 = ${data.people.length + parsed.length}名）`);
      return;
    }
    update({ people: [...data.people, ...parsed] });
    setCsvText("");
    setCsvOpen(false);
  };

  const handleLogo = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選んでください");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        update({ logoDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  // === PDF出力 (プロ仕様) ===
  // 表裏ずれゼロ: 各カードのX/Y座標は表裏で完全に同じmm位置に配置
  // 裏面は両面印刷の長辺綴じに対応するため列を逆順（ミラー）にする
  const downloadPdf = async () => {
    if (data.people.length === 0) {
      alert("名簿に1名以上追加してください");
      return;
    }
    setDownloading(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [A4_W_MM, A4_H_MM],
        compress: true,
        putOnlyUsedFonts: true,
      });
      pdf.setProperties({
        title: `Nametag - A4 8-up Print Sheet (${data.people.length} people)`,
        subject: `A4 (210x297mm) - ${data.people.length} nametags, professional bleed-aligned output`,
        creator: "My Card Maker - Nametag",
        keywords: "nametag, A4, 88x55mm, 8-up, duplex-aligned",
      });

      const tagsPerPage = 8;
      const totalPages = Math.ceil(data.people.length / tagsPerPage);
      const hasBack = data.backLayout !== "none";
      const PIXEL_RATIO = 6; // 高DPI (約 600dpi 相当)

      // PDF出力モードを有効化 → 全員分の hidden ノードがレンダリングされる
      // （事前に全DOMがあるので state 切替・flushSync 不要で確実）
      flushSync(() => setPdfRenderActive(true));
      // ノード生成と画像読み込み完了を待つ
      await waitForRender();
      await new Promise((r) => setTimeout(r, 200));
      // 全 hidden ノードを取得
      const frontNodes = Array.from(
        document.querySelectorAll<HTMLElement>('[data-pdf-front]'),
      );
      const backNodes = Array.from(
        document.querySelectorAll<HTMLElement>('[data-pdf-back]'),
      );
      // 各ノード内の画像をすべて読み込み完了まで待つ
      await Promise.all([
        ...frontNodes.map((n) => waitForImagesLoaded(n)),
        ...backNodes.map((n) => waitForImagesLoaded(n)),
      ]);

      try {
        // 表面ページ
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage([A4_W_MM, A4_H_MM], "portrait");
          for (let idx = 0; idx < tagsPerPage; idx++) {
            const globalIdx = page * tagsPerPage + idx;
            if (globalIdx >= data.people.length) break;
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const x = A4_MARGIN_MM + col * TAG_W_MM;
            const y = A4_TOP_MARGIN_MM + row * TAG_H_MM;
            const node = frontNodes[globalIdx];
            if (!node) continue;
            const png = await toPng(node, {
              cacheBust: true,
              pixelRatio: PIXEL_RATIO,
              backgroundColor: "#ffffff",
            });
            pdf.addImage(png, "PNG", x, y, TAG_W_MM, TAG_H_MM, undefined, "FAST");
            pdf.setDrawColor(220);
            pdf.setLineWidth(0.1);
            pdf.rect(x, y, TAG_W_MM, TAG_H_MM);
          }
        }

        // 裏面ページ — 両面印刷時に表裏が重なるよう列をミラー反転
        if (hasBack) {
          for (let page = 0; page < totalPages; page++) {
            pdf.addPage([A4_W_MM, A4_H_MM], "portrait");
            for (let idx = 0; idx < tagsPerPage; idx++) {
              const globalIdx = page * tagsPerPage + idx;
              if (globalIdx >= data.people.length) break;
              const col = 1 - (idx % 2);
              const row = Math.floor(idx / 2);
              const x = A4_MARGIN_MM + col * TAG_W_MM;
              const y = A4_TOP_MARGIN_MM + row * TAG_H_MM;
              const node = backNodes[globalIdx];
              if (!node) continue;
              const png = await toPng(node, {
                cacheBust: true,
                pixelRatio: PIXEL_RATIO,
                backgroundColor: "#ffffff",
              });
              pdf.addImage(png, "PNG", x, y, TAG_W_MM, TAG_H_MM, undefined, "FAST");
              pdf.setDrawColor(220);
              pdf.setLineWidth(0.1);
              pdf.rect(x, y, TAG_W_MM, TAG_H_MM);
            }
          }
        }
      } finally {
        // PDF出力モード解除
        flushSync(() => setPdfRenderActive(false));
      }

      const filename = hasBack
        ? `nametag-${data.people.length}名_両面.pdf`
        : `nametag-${data.people.length}名.pdf`;
      pdf.save(filename);
    } finally {
      setDownloading(false);
    }
  };

  /**
   * 印刷ボタン: PDFを生成して新しいタブで開き、印刷ダイアログを表示。
   * ダウンロードと違いブラウザ上で⌘+Pでそのまま印刷できる。
   */
  const printPdf = async () => {
    if (data.people.length === 0) {
      alert("名簿に1名以上追加してください");
      return;
    }
    setDownloading(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [A4_W_MM, A4_H_MM],
        compress: true,
        putOnlyUsedFonts: true,
      });
      pdf.setProperties({
        title: `Nametag Print - ${data.people.length} people`,
        creator: "My Card Maker - Nametag",
      });
      const tagsPerPage = 8;
      const totalPages = Math.ceil(data.people.length / tagsPerPage);
      const hasBack = data.backLayout !== "none";
      const PIXEL_RATIO = 6;

      flushSync(() => setPdfRenderActive(true));
      await waitForRender();
      await new Promise((r) => setTimeout(r, 200));
      const frontNodes = Array.from(
        document.querySelectorAll<HTMLElement>('[data-pdf-front]'),
      );
      const backNodes = Array.from(
        document.querySelectorAll<HTMLElement>('[data-pdf-back]'),
      );
      await Promise.all([
        ...frontNodes.map((n) => waitForImagesLoaded(n)),
        ...backNodes.map((n) => waitForImagesLoaded(n)),
      ]);

      try {
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage([A4_W_MM, A4_H_MM], "portrait");
          for (let idx = 0; idx < tagsPerPage; idx++) {
            const globalIdx = page * tagsPerPage + idx;
            if (globalIdx >= data.people.length) break;
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const x = A4_MARGIN_MM + col * TAG_W_MM;
            const y = A4_TOP_MARGIN_MM + row * TAG_H_MM;
            const node = frontNodes[globalIdx];
            if (!node) continue;
            const png = await toPng(node, {
              cacheBust: true,
              pixelRatio: PIXEL_RATIO,
              backgroundColor: "#ffffff",
            });
            pdf.addImage(png, "PNG", x, y, TAG_W_MM, TAG_H_MM, undefined, "FAST");
            pdf.setDrawColor(220);
            pdf.setLineWidth(0.1);
            pdf.rect(x, y, TAG_W_MM, TAG_H_MM);
          }
        }
        if (hasBack) {
          for (let page = 0; page < totalPages; page++) {
            pdf.addPage([A4_W_MM, A4_H_MM], "portrait");
            for (let idx = 0; idx < tagsPerPage; idx++) {
              const globalIdx = page * tagsPerPage + idx;
              if (globalIdx >= data.people.length) break;
              const col = 1 - (idx % 2);
              const row = Math.floor(idx / 2);
              const x = A4_MARGIN_MM + col * TAG_W_MM;
              const y = A4_TOP_MARGIN_MM + row * TAG_H_MM;
              const node = backNodes[globalIdx];
              if (!node) continue;
              const png = await toPng(node, {
                cacheBust: true,
                pixelRatio: PIXEL_RATIO,
                backgroundColor: "#ffffff",
              });
              pdf.addImage(png, "PNG", x, y, TAG_W_MM, TAG_H_MM, undefined, "FAST");
              pdf.setDrawColor(220);
              pdf.setLineWidth(0.1);
              pdf.rect(x, y, TAG_W_MM, TAG_H_MM);
            }
          }
        }
      } finally {
        flushSync(() => setPdfRenderActive(false));
      }

      // PDFをblobとして取得 → 新しいタブで開く
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (!win) {
        // ポップアップブロックされた場合はダウンロードにフォールバック
        const a = document.createElement("a");
        a.href = url;
        a.download = `nametag-${data.people.length}名.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } finally {
      setDownloading(false);
    }
  };

  /**
   * 2フレーム + アイドル待機。 React の state 更新後、レイアウト→ペイント
   * を確実に完了させてから次の処理に進ませるユーティリティ。
   * 画面外要素でも描画は走るが、画像（QR/ロゴ）の onload は別途待つ。
   */
  const waitForRender = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // requestIdleCallback があればさらに待つ
          if (typeof (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback === "function") {
            (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => resolve());
          } else {
            setTimeout(resolve, 50);
          }
        });
      });
    });

  /**
   * 要素内の全ての <img> が読み込み完了するまで待つ。
   * これがないと QR や ロゴ画像が描画される前に toPng が走り、
   * 白紙や画像欠落のPDFになる。
   */
  const waitForImagesLoaded = async (root: HTMLElement) => {
    const imgs = Array.from(root.querySelectorAll("img"));
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>((resolve) => {
          const done = () => {
            img.removeEventListener("load", done);
            img.removeEventListener("error", done);
            resolve();
          };
          img.addEventListener("load", done);
          img.addEventListener("error", done);
          // タイムアウト保険（2秒）
          setTimeout(done, 2000);
        });
      }),
    );
  };

  // 裏面キャプチャ用 — 表面と同じ仕組みで person を切り替えて toPng
  const captureSingleBackPerson = async (person: Person, pixelRatio = 6): Promise<string> => {
    if (!captureBackRef.current) throw new Error("capture-back node missing");
    // flushSync で React 更新を強制的に同期
    flushSync(() => setCaptureTarget(person));
    await waitForRender();
    await waitForImagesLoaded(captureBackRef.current);
    return await toPng(captureBackRef.current, {
      cacheBust: true,
      pixelRatio,
      backgroundColor: "#ffffff",
    });
  };

  // 表面キャプチャ — 上記と同じ手順で確実に描画完了を待ってからキャプチャ
  const captureSinglePerson = async (person: Person, pixelRatio = 6): Promise<string> => {
    if (!captureRef.current) throw new Error("capture node missing");
    const node = captureRef.current;
    flushSync(() => setCaptureTarget(person));
    await waitForRender();
    await waitForImagesLoaded(node);
    return await toPng(node, { cacheBust: true, pixelRatio, backgroundColor: "#ffffff" });
  };

  const [captureTarget, setCaptureTarget] = useState<Person | null>(null);
  /** PDF出力中フラグ — true の間、全人物分の hidden DOM が画面外に配置される */
  const [pdfRenderActive, setPdfRenderActive] = useState(false);

  // Per-person QR cache: url -> data URL. Each unique URL only generated once.
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const personUrls = data.people
      .map((p) => p.url?.trim())
      .filter((u): u is string => !!u && u.length > 0);
    // 表面QRのカスタムURLも生成対象に含める
    const customQrUrl =
      data.frontQrOverride?.enabled &&
      data.frontQrOverride.source === "custom-url" &&
      data.frontQrOverride.customUrl?.trim()
        ? [data.frontQrOverride.customUrl.trim()]
        : [];
    const urls = Array.from(new Set([...personUrls, ...customQrUrl]));
    const missing = urls.filter((u) => !qrMap[u]);
    if (missing.length === 0) return;
    (async () => {
      const additions: Record<string, string> = {};
      for (const u of missing) {
        try {
          additions[u] = await generateQRDataUrl(u, 280);
        } catch {
          // ignore single QR failure — UI will simply not render that QR
        }
      }
      if (!cancelled && Object.keys(additions).length > 0) {
        setQrMap((m) => ({ ...m, ...additions }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data.people, qrMap]);

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center text-sm text-neutral-500">
        読み込み中…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
                名札メーカー
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                  BETA
                </span>
              </div>
              {/* カード種類選択へ — タイトルの真横に配置 (家マーク+オレンジ) */}
              {onBackToSelector && (
                <button
                  type="button"
                  onClick={onBackToSelector}
                  className="flex items-center gap-1 text-[11px] font-bold text-white bg-orange-500 hover:bg-orange-600 px-2.5 py-1 rounded-full transition shadow-sm shrink-0"
                  title="カードの種類選択画面に戻る"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                    aria-hidden
                  >
                    <path d="M12 3.172l8.485 8.485-1.06 1.06L18 11.293V21h-5v-6h-2v6H6v-9.707l-1.425 1.424-1.06-1.06L12 3.172z" />
                  </svg>
                  <span className="hidden sm:inline">カード種類選択</span>
                </button>
              )}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 truncate">
              オフ会・店員名札を最大100名分まとめてA4印刷（8面付け／88×55mm）
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={undoRedo.undo}
              disabled={!undoRedo.canUndo}
              className={UNDO_REDO_BTN_CLASS}
              title="一つ戻る（⌘+Z / Ctrl+Z）"
            >
              ↶ 戻る
            </button>
            <button
              type="button"
              onClick={undoRedo.redo}
              disabled={!undoRedo.canRedo}
              className={UNDO_REDO_BTN_CLASS}
              title="一つ進む（⌘+Shift+Z / Ctrl+Y）"
            >
              ↷ 進む
            </button>
            <button
              type="button"
              onClick={() => setSnapshotOpen(true)}
              className="text-[11px] px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white hover:border-emerald-400 hover:text-emerald-700 font-semibold whitespace-nowrap"
              title="過去の作成データを開く・現在の作成を保存"
            >
              📂 保存・履歴
            </button>
            <button
              type="button"
              onClick={printPdf}
              disabled={downloading || data.people.length === 0}
              className="px-3 py-2 rounded-lg border border-emerald-600 text-emerald-700 font-bold text-sm hover:bg-emerald-50 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
              title="新しいタブでPDFを開いて印刷する"
            >
              🖨 印刷
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={downloading || data.people.length === 0}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 active:scale-95 transition disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              {downloading
                ? "生成中…"
                : `💾 PDF（${data.people.length}名）`}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_320px] gap-6">
        {/* LEFT: Roster + Live preview */}
        <div className="space-y-6">
          {/* Roster — 名簿セクション。デザインに集中したい時は折りたためる */}
          {(() => {
            // 名簿が0件なら自動展開、それ以外は閉じる（ユーザートグル後はその状態を維持）
            const autoOpen = rosterExpanded === null
              ? data.people.length === 0
              : rosterExpanded;
            return (
              <section className="bg-white rounded-2xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setRosterExpanded(!autoOpen)}
                    className="flex items-center gap-2 flex-1 text-left hover:opacity-80"
                  >
                    <span className={`text-emerald-600 transition-transform inline-block ${autoOpen ? "rotate-90" : ""}`}>▸</span>
                    <div>
                      <div className="text-sm font-bold text-neutral-900">
                        1️⃣ 名簿（{data.people.length} / 100名）
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {autoOpen
                          ? "名前を入力するだけで名札ができます。クリックで折りたたみ"
                          : "クリックで開いて編集"}
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRosterExpanded(!autoOpen)}
                    className="text-[11px] px-2.5 py-1 rounded-md border border-neutral-300 bg-white hover:border-emerald-400 hover:text-emerald-700 shrink-0"
                  >
                    {autoOpen ? "▲ 折りたたむ" : "▼ 名簿を編集"}
                  </button>
                </div>

                {autoOpen && (
                  <>
                    <div className="flex gap-1.5 flex-wrap mt-3 mb-3">
                      {data.people.length === 0 && (
                        <button
                          type="button"
                          onClick={loadSample}
                          className="text-[11px] px-2.5 py-1 rounded-md border border-neutral-300 bg-white hover:border-emerald-400 hover:text-emerald-700"
                        >
                          📋 サンプル
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setRosterOpen(true)}
                        className="text-[11px] px-2.5 py-1 rounded-md border border-emerald-400 bg-emerald-50/40 text-emerald-700 hover:bg-emerald-100 font-semibold"
                      >
                        📇 保存名簿から選ぶ
                      </button>
                      <button
                        type="button"
                        onClick={() => setCsvOpen((v) => !v)}
                        className="text-[11px] px-2.5 py-1 rounded-md border border-neutral-300 bg-white hover:border-emerald-400 hover:text-emerald-700"
                      >
                        📥 Excel・スプレッドシートから取込
                      </button>
                      <button
                        type="button"
                        onClick={addPerson}
                        disabled={data.people.length >= 100}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-neutral-300"
                      >
                        + 1名追加
                      </button>
                      {data.people.length > 0 && (
                        <button
                          type="button"
                          onClick={clearAll}
                          className="text-[11px] px-2 py-1 rounded-md border border-neutral-200 bg-white text-neutral-500 hover:border-red-300 hover:text-red-600"
                        >
                          全削除
                        </button>
                      )}
                    </div>

            {csvOpen && (
              <div className="rounded-lg bg-emerald-50/50 border border-emerald-200 p-3 mb-3 space-y-2">
                <div className="text-[11px] text-neutral-700 leading-relaxed">
                  <strong>列の順番</strong>: 氏名 / ふりがな / 所属 / 役職<br />
                  Excel・<strong>Googleスプレッドシート</strong>からコピペ（タブ区切り）／ダウンロードした<strong>.csv ファイル</strong>のアップロードに対応。
                </div>

                {/* File upload (.csv / .tsv / .txt) — Google Spreadsheet「ファイル→ダウンロード→CSV」がそのまま使える */}
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-[11px] px-2.5 py-1.5 rounded-md border border-emerald-400 bg-white text-emerald-700 hover:bg-emerald-50 cursor-pointer font-semibold">
                    📂 CSVファイルを選ぶ
                    <input
                      type="file"
                      accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          const text = await f.text();
                          // BOM除去（Excel/SpreadsheetのUTF-8 CSVに付くことがある）
                          const clean = text.replace(/^﻿/, "");
                          setCsvText(clean);
                        } catch {
                          alert("ファイルの読み込みに失敗しました");
                        } finally {
                          // 同じファイルを再選択できるようリセット
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    または下欄に直接コピペ
                  </span>
                </div>

                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={5}
                  placeholder={"山田 太郎\tやまだ たろう\tデザイン課\tリーダー\n鈴木 花子\tすずき はなこ\t営業部\t"}
                  className="w-full p-2 rounded-md border border-emerald-300 text-xs font-mono"
                />

                <details className="text-[10px] text-neutral-600">
                  <summary className="cursor-pointer hover:text-emerald-700">
                    💡 Googleスプレッドシートから取り込む方法
                  </summary>
                  <div className="pt-1.5 pl-3 leading-relaxed space-y-0.5">
                    <div>① <strong>コピペで取り込む</strong>: スプレッドシートで範囲選択 → ⌘C → 上の欄に貼付</div>
                    <div>② <strong>CSVファイルで取り込む</strong>: ファイル → ダウンロード → カンマ区切り形式(.csv) → 上の「CSVファイルを選ぶ」</div>
                  </div>
                </details>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCsvOpen(false);
                      setCsvText("");
                    }}
                    className="text-[11px] px-3 py-1.5 rounded-md border border-neutral-300 bg-white"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={importCsv}
                    disabled={!csvText.trim()}
                    className="text-[11px] px-3 py-1.5 rounded-md bg-emerald-600 text-white disabled:bg-neutral-300"
                  >
                    取り込む
                  </button>
                </div>
              </div>
            )}

            {data.people.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-neutral-200 p-8 text-center">
                <div className="text-sm text-neutral-500 mb-3">
                  まだ名簿が空です
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={addPerson}
                    className="text-[11px] px-3 py-1.5 rounded-md bg-emerald-600 text-white"
                  >
                    + 1名追加
                  </button>
                  <button
                    type="button"
                    onClick={loadSample}
                    className="text-[11px] px-3 py-1.5 rounded-md border border-neutral-300 bg-white"
                  >
                    📋 サンプルを入れる
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] text-neutral-500 border-b border-neutral-200">
                      <th className="text-left py-1.5 px-1 w-7">#</th>
                      {/* 用途プリセット切替で項目名も動的に変わる */}
                      <th className="text-left py-1.5 px-1">
                        {data.fieldLabels?.name || "氏名"}<span className="text-red-500">*</span>
                      </th>
                      <th className="text-left py-1.5 px-1">
                        {data.fieldLabels?.kana || "ふりがな"}
                      </th>
                      <th className="text-left py-1.5 px-1">
                        {data.fieldLabels?.affiliation || "所属"}
                      </th>
                      <th className="text-left py-1.5 px-1">
                        {data.fieldLabels?.title || "役職"}
                      </th>
                      <th className="text-left py-1.5 px-1">QR用URL</th>
                      <th className="text-left py-1.5 px-1">
                        {data.fieldLabels?.freeText || "自由テキスト"}
                      </th>
                      <th className="text-left py-1.5 px-1 w-14" title="個人別画像（写真・ロゴ）">画像</th>
                      {data.groupMode === "manual" && (
                        <th className="text-left py-1.5 px-1 w-14" title="A〜Fの手動グループ">GP</th>
                      )}
                      {data.groupMode === "auto" && (
                        <th className="text-left py-1.5 px-1 w-16" title="所属で自動グループ化">自動GP</th>
                      )}
                      <th className="text-left py-1.5 px-1 w-12" title="空欄なら共通カラー">色</th>
                      <th className="w-7" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.people.map((p, idx) => (
                      <tr key={p.id} className="border-b border-neutral-100 last:border-b-0">
                        <td className="py-1 px-1 text-[10px] text-neutral-400 font-mono">{idx + 1}</td>
                        <td className="py-1 px-1">
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => updatePerson(p.id, { name: e.target.value })}
                            placeholder={data.fieldLabels?.name || "山田 太郎"}
                            className="w-full px-2 py-1 rounded border border-neutral-200 text-xs focus:border-emerald-400 focus:outline-none"
                          />
                        </td>
                        <td className="py-1 px-1">
                          <input
                            type="text"
                            value={p.kana}
                            onChange={(e) => updatePerson(p.id, { kana: e.target.value })}
                            placeholder={data.fieldLabels?.kana || "やまだ たろう"}
                            className="w-full px-2 py-1 rounded border border-neutral-200 text-xs focus:border-emerald-400 focus:outline-none"
                          />
                        </td>
                        <td className="py-1 px-1">
                          <input
                            type="text"
                            value={p.affiliation}
                            onChange={(e) => updatePerson(p.id, { affiliation: e.target.value })}
                            placeholder={data.fieldLabels?.affiliation || "部署名"}
                            className="w-full px-2 py-1 rounded border border-neutral-200 text-xs focus:border-emerald-400 focus:outline-none"
                          />
                        </td>
                        <td className="py-1 px-1">
                          <input
                            type="text"
                            value={p.title}
                            onChange={(e) => updatePerson(p.id, { title: e.target.value })}
                            placeholder={data.fieldLabels?.title || "任意"}
                            className="w-full px-2 py-1 rounded border border-neutral-200 text-xs focus:border-emerald-400 focus:outline-none"
                          />
                        </td>
                        <td className="py-1 px-1">
                          <input
                            type="url"
                            value={p.url ?? ""}
                            onChange={(e) => updatePerson(p.id, { url: e.target.value })}
                            placeholder="https://..."
                            className="w-full px-2 py-1 rounded border border-neutral-200 text-xs focus:border-emerald-400 focus:outline-none"
                            title="入力するとこの人専用のQRコードが名札に表示されます"
                          />
                        </td>
                        <td className="py-1 px-1">
                          <input
                            type="text"
                            value={p.freeText ?? ""}
                            onChange={(e) => updatePerson(p.id, { freeText: e.target.value })}
                            placeholder={data.fieldLabels?.freeText || "任意"}
                            className="w-full px-2 py-1 rounded border border-neutral-200 text-xs focus:border-emerald-400 focus:outline-none"
                            title="名札に追加表示される自由テキスト"
                          />
                        </td>
                        <td className="py-1 px-1">
                          {p.imageDataUrl ? (
                            <div className="flex items-center gap-1">
                              <img
                                src={p.imageDataUrl}
                                alt="img"
                                className="w-7 h-7 rounded object-cover border border-neutral-200"
                              />
                              <button
                                type="button"
                                onClick={() => updatePerson(p.id, { imageDataUrl: "" })}
                                className="text-[10px] text-neutral-400 hover:text-red-600"
                                title="画像を削除"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer text-[10px] px-1.5 py-1 rounded border border-neutral-200 bg-white hover:border-emerald-400 inline-flex items-center">
                              📁
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  if (f.size > 5 * 1024 * 1024) {
                                    alert("画像は5MB以下にしてください");
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (typeof reader.result === "string") {
                                      updatePerson(p.id, { imageDataUrl: reader.result });
                                    }
                                  };
                                  reader.readAsDataURL(f);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          )}
                        </td>
                        {data.groupMode === "manual" && (
                          <td className="py-1 px-1">
                            <select
                              value={p.group ?? ""}
                              onChange={(e) =>
                                updatePerson(p.id, {
                                  group: (e.target.value || undefined) as GroupKey | undefined,
                                })
                              }
                              className="w-full px-1 py-0.5 rounded border border-neutral-200 text-[11px]"
                              style={p.group ? {
                                borderColor: data.groupColors?.[p.group] ?? NAMETAG_GROUP_COLORS[p.group],
                                color: data.groupColors?.[p.group] ?? NAMETAG_GROUP_COLORS[p.group],
                                fontWeight: 600,
                              } : undefined}
                            >
                              <option value="">—</option>
                              {GROUP_KEYS.map((g) => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </td>
                        )}
                        {data.groupMode === "auto" && (
                          <td className="py-1 px-1">
                            <span
                              className="text-[10px] truncate inline-block px-1 py-0.5 rounded"
                              style={{
                                backgroundColor: `${resolveGroupColor(data, p) ?? "#e5e5e5"}30`,
                                color: resolveGroupColor(data, p) ?? "#737373",
                                fontWeight: 600,
                                maxWidth: "60px",
                              }}
                              title={p.affiliation || "（未分類）"}
                            >
                              {p.affiliation || "（未分類）"}
                            </span>
                          </td>
                        )}
                        <td className="py-1 px-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={p.color || data.mainColor}
                              onChange={(e) => updatePerson(p.id, { color: e.target.value })}
                              disabled={data.groupMode !== "off"}
                              className="w-6 h-6 rounded cursor-pointer border border-neutral-200 disabled:opacity-30"
                              title={
                                data.groupMode !== "off"
                                  ? "グループ機能ON中は個人別カラーは無効"
                                  : p.color
                                    ? "個人別カラー"
                                    : "クリックで個人別カラーに変更（空欄=共通カラー）"
                              }
                            />
                            {p.color && data.groupMode === "off" && (
                              <button
                                type="button"
                                onClick={() => updatePerson(p.id, { color: "" })}
                                className="text-[9px] text-neutral-400 hover:text-neutral-700"
                                title="共通カラーに戻す"
                              >
                                ↺
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-1 px-1">
                          <button
                            type="button"
                            onClick={() => removePerson(p.id)}
                            className="text-neutral-400 hover:text-red-600 text-base leading-none"
                            title="削除"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
                  </>
                )}
              </section>
            );
          })()}

          {/* Live preview */}
          <section className="bg-white rounded-2xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-neutral-900">プレビュー</div>
                <div className="text-[10px] text-neutral-500">
                  名簿全員のプレビュー。実際のPDFも同じレイアウトで生成されます。
                </div>
              </div>
              <div className="text-[10px] text-neutral-500">
                88 × 55mm
              </div>
            </div>
            {data.people.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-neutral-200 p-12 text-center text-sm text-neutral-400">
                名簿に名前を入れるとプレビューが表示されます
              </div>
            ) : (() => {
              // 共通: 1人分のプレビューを描画する小コンポーネント
              const renderOnePerson = (p: Person) => {
                const fqo = data.frontQrOverride;
                const frontQrUrl = fqo?.enabled
                  ? fqo.source === "custom-url"
                    ? fqo.customUrl?.trim()
                    : p.url?.trim()
                  : undefined;
                const frontQrOverlay = frontQrUrl && qrMap[frontQrUrl] && fqo?.enabled
                  ? { dataUrl: qrMap[frontQrUrl], x: fqo.x, y: fqo.y, size: fqo.size }
                  : undefined;
                return (
                  <div key={p.id} className="space-y-1">
                    <div className="text-[10px] text-neutral-500 font-mono">表面</div>
                    <NametagPreview
                      person={p}
                      data={hoverTemplateId ? { ...data, templateId: hoverTemplateId } : data}
                      qrDataUrl={p.url ? qrMap[p.url.trim()] : undefined}
                      frontQrOverlay={frontQrOverlay}
                    />
                    {data.backLayout !== "none" && (
                      <>
                        <div className="text-[10px] text-neutral-500 font-mono mt-1.5">裏面</div>
                        <NametagBackPreview
                          person={p}
                          data={data}
                          qrDataUrl={p.url ? qrMap[p.url.trim()] : undefined}
                        />
                      </>
                    )}
                  </div>
                );
              };

              // グループ機能ON時はグループごとに見出し付きで表示
              if (data.groupMode === "manual" || data.groupMode === "auto") {
                // グループキーを決定
                const groupKeyOf = (p: Person): string =>
                  data.groupMode === "manual"
                    ? p.group ?? "_未振分け"
                    : (p.affiliation || "（未分類）");
                // グループの順序を取得（出現順）
                const groups = Array.from(new Set(data.people.map(groupKeyOf)));
                return (
                  <div className="space-y-4">
                    {groups.map((g) => {
                      const members = data.people.filter((p) => groupKeyOf(p) === g);
                      const label =
                        data.groupMode === "manual"
                          ? g === "_未振分け"
                            ? "未振分け"
                            : (data.groupLabels?.[g as GroupKey] ?? `グループ${g}`)
                          : g;
                      const color =
                        data.groupMode === "manual" && g !== "_未振分け"
                          ? (data.groupColors?.[g as GroupKey] ?? NAMETAG_GROUP_COLORS[g as GroupKey])
                          : data.groupMode === "auto"
                            ? resolveGroupColor(data, members[0]!)
                            : "#737373";
                      return (
                        <div key={g}>
                          <div
                            className="flex items-center gap-2 mb-2 pb-1"
                            style={{ borderBottom: `0.5mm solid ${color ?? "#a3a3a3"}` }}
                          >
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                              style={{ backgroundColor: color ?? "#737373" }}
                            >
                              {label}
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              {members.length}名
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {members.map(renderOnePerson)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }
              // グループ機能OFFは従来通り
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.people.map(renderOnePerson)}
                </div>
              );
            })()}
          </section>
        </div>

        {/* RIGHT: Template + Common settings */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <section className="bg-white rounded-2xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-neutral-900">
                2️⃣ デザイン
                <span className="ml-1.5 text-[10px] font-normal text-neutral-500">
                  ({TEMPLATES.findIndex((t) => t.id === data.templateId) + 1}/{TEMPLATES.length})
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const cur = TEMPLATES.findIndex((t) => t.id === data.templateId);
                    const prev = TEMPLATES[(cur - 1 + TEMPLATES.length) % TEMPLATES.length];
                    update({ templateId: prev.id });
                  }}
                  className="w-6 h-6 rounded border border-neutral-300 bg-white hover:border-emerald-400 text-xs"
                  title="前のデザイン (↑)"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cur = TEMPLATES.findIndex((t) => t.id === data.templateId);
                    const next = TEMPLATES[(cur + 1) % TEMPLATES.length];
                    update({ templateId: next.id });
                  }}
                  className="w-6 h-6 rounded border border-neutral-300 bg-white hover:border-emerald-400 text-xs"
                  title="次のデザイン (↓)"
                >
                  →
                </button>
              </div>
            </div>
            {/* サムネ一覧（プルダウン廃止）— 常時表示 */}
            <div className="text-[10px] text-neutral-600 mb-2">
              選択中: <strong>{TEMPLATES.find((t) => t.id === data.templateId)?.label}</strong>
              <span className="text-neutral-500"> — {TEMPLATES.find((t) => t.id === data.templateId)?.description}</span>
            </div>

            {/* カスタム背景テンプレ選択 + 背景未アップロード時の案内バナー */}
            {data.templateId === "custom-bg-only" && !data.customBgDataUrl && (
              <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-3 mb-2 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">⚠️</span>
                  <div className="flex-1">
                    <div className="text-[11px] font-bold text-blue-900">
                      カスタム背景画像をアップロードしてください
                    </div>
                    <div className="text-[10px] text-blue-800 leading-snug mt-0.5">
                      「🖼 カスタム背景」テンプレでは、アップロードした画像が名札の背景になります。
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("custom-bg-uploader");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "center" });
                      // 視覚的にハイライト（一時的にリングを強調・赤色）
                      el.style.transition = "box-shadow 0.3s ease";
                      el.style.boxShadow = "0 0 0 4px rgba(220,38,38,0.45)";
                      setTimeout(() => {
                        el.style.boxShadow = "";
                      }, 1600);
                    }
                  }}
                  className="inline-block text-[10px] px-2.5 py-1 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-95 transition"
                >
                  📁 アップロード欄へ
                </button>
              </div>
            )}
            {/* カスタム背景 / 自由レイアウト — デザインテンプレとは独立した特殊モード。
                小さめの2ブロック横並びで「これはテンプレではない」ことが分かるよう
                バッジ付き＋色を変えて表示。 */}
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {([
                {
                  id: "custom-bg-only" as TemplateId,
                  label: "🖼 カスタム背景",
                  hint: "背景画像を全面に",
                  color: "amber",
                },
                {
                  id: "free-layout" as TemplateId,
                  label: "🎨 自由レイアウト",
                  hint: "要素を自由配置",
                  color: "indigo",
                },
              ]).map((m) => {
                const selected = data.templateId === m.id;
                const ringClass =
                  m.color === "amber"
                    ? selected
                      ? "border-amber-500 bg-amber-50 ring-2 ring-amber-300"
                      : "border-amber-200 bg-amber-50/40 hover:border-amber-400"
                    : selected
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300"
                      : "border-indigo-200 bg-indigo-50/40 hover:border-indigo-400";
                const textClass =
                  m.color === "amber"
                    ? selected
                      ? "text-amber-800"
                      : "text-amber-700"
                    : selected
                      ? "text-indigo-800"
                      : "text-indigo-700";
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => update({ templateId: m.id })}
                    className={`flex flex-col items-start gap-0.5 p-1.5 rounded-md border-2 text-left transition ${ringClass}`}
                    title={`${m.label} — デザインテンプレとは別の特殊モード`}
                  >
                    <div className={`text-[10px] font-bold ${textClass}`}>
                      {m.label}
                      {selected && <span className="ml-1 text-[9px]">✓</span>}
                    </div>
                    <div className="text-[9px] text-neutral-500 leading-tight">{m.hint}</div>
                  </button>
                );
              })}
            </div>
            <div className="text-[9px] text-neutral-500 mb-1 pl-0.5">
              ↓ 以下はデザインテンプレ（{TEMPLATES.filter(t => t.id !== "custom-bg-only" && t.id !== "free-layout").length}種類・スクロール無しで全表示）
            </div>
            {/* デザインテンプレ一覧 — スクロール廃止し全件常時表示 */}
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {TEMPLATES.filter((t) => t.id !== "custom-bg-only" && t.id !== "free-layout").map((t) => {
                const selected = data.templateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => update({ templateId: t.id })}
                    className={`flex items-start gap-1 p-1.5 rounded border text-left transition ${
                      selected
                        ? "border-emerald-500 bg-emerald-50/40 shadow-sm"
                        : "border-neutral-200 bg-white hover:border-emerald-300"
                    }`}
                    title="クリックで決定"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                        selected ? "bg-emerald-500" : "bg-neutral-200"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] font-semibold ${selected ? "text-emerald-700" : "text-neutral-900"}`}>
                        {t.label}
                        {selected && <span className="ml-1 text-[9px] text-emerald-600">✓</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {/* 自由レイアウトモード切替トグル — 全テンプレで表示 */}
            <div className="rounded-lg bg-emerald-50/20 border border-emerald-200 p-2 mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    data.templateId === "free-layout" ||
                    data.templateId === "custom-bg-only" ||
                    data.freeLayoutEnabled === true
                  }
                  disabled={data.templateId === "free-layout" || data.templateId === "custom-bg-only"}
                  onChange={(e) => update({ freeLayoutEnabled: e.target.checked })}
                  className="accent-emerald-600"
                />
                <div className="flex-1">
                  <div className="text-[11px] font-bold text-neutral-900">
                    🎨 自由レイアウトで微調整する
                    {(data.templateId === "free-layout" || data.templateId === "custom-bg-only") && (
                      <span className="ml-1 text-[9px] text-emerald-600">（このテンプレは常に有効）</span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-600 leading-snug">
                    各要素の位置・サイズを自由に変更したい時はONに（テンプレ装飾は無効になります）
                  </div>
                </div>
              </label>
            </div>

            {/* テンプレモード時の全体サイズスライダー — テンプレ装飾を維持しつつ全体拡縮 */}
            {data.templateId !== "free-layout" &&
              data.templateId !== "custom-bg-only" &&
              data.freeLayoutEnabled !== true && (
              <div className="rounded-lg bg-amber-50/30 border border-amber-200 p-2 mb-2 space-y-1.5">
                <div>
                  <div className="text-[11px] font-bold text-neutral-900">📏 全体サイズ調整（テンプレ用）</div>
                  <div className="text-[9px] text-neutral-600 leading-snug">
                    テンプレ装飾を維持したまま全文字・要素を一括拡縮できます。<br />
                    位置・項目別調整は上の「🎨 自由レイアウト」をONに
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-neutral-400">小</span>
                  <input
                    type="range"
                    min={0.7}
                    max={1.5}
                    step={0.05}
                    value={data.freeLayoutGlobalScale ?? 1}
                    onChange={(e) => update({ freeLayoutGlobalScale: parseFloat(e.target.value) })}
                    className="flex-1 accent-amber-600"
                  />
                  <span className="text-[9px] text-neutral-400">大</span>
                  <span className="text-[10px] font-mono text-neutral-700 w-10 text-right">
                    {Math.round((data.freeLayoutGlobalScale ?? 1) * 100)}%
                  </span>
                  {(data.freeLayoutGlobalScale ?? 1) !== 1 && (
                    <button
                      type="button"
                      onClick={() => update({ freeLayoutGlobalScale: 1 })}
                      className="text-[9px] text-neutral-500 hover:text-neutral-900 px-1"
                      title="標準サイズに戻す"
                    >
                      ↺
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 自由レイアウト適用中のみエディタを表示 */}
            {(data.templateId === "free-layout" ||
              data.templateId === "custom-bg-only" ||
              data.freeLayoutEnabled === true) && (
              <div className="rounded-lg bg-emerald-50/30 border border-emerald-300 p-3 space-y-2 mb-2">
                <div className="text-[11px] font-bold text-neutral-900">🎨 自由レイアウト・エディタ</div>
                <div className="text-[10px] text-neutral-600 leading-relaxed">
                  各要素のON/OFF・位置（X/Y mm）・サイズを調整できます。88×55mmカードに対し、左上が原点。
                </div>

                {/* ⚡ 一括操作（NEW） — ワンクリックで整列＋スライドでサイズ一括変更 */}
                <div className="rounded-md bg-white border border-emerald-300 p-2 space-y-2">
                  <div className="text-[10px] font-bold text-neutral-700">⚡ 一括操作</div>

                  {/* 整列ボタン3つ */}
                  <div>
                    <div className="text-[9px] text-neutral-500 mb-1">整列（全要素のX位置を一括変更）</div>
                    <div className="grid grid-cols-3 gap-1">
                      {(
                        [
                          // 各ボタンの x: 配置基準点。align: 要素自身の整列方向（textAlign + transform）
                          //
                          // 「右揃え」は要素の中の文字は左揃えのまま、
                          //  配置位置（要素の左端 x座標）をカード右側に寄せる仕様。
                          //  → 全要素の左端が x=50mm に揃うので読みやすい。
                          { id: "left" as const, label: "左揃え", emoji: "◧", x: 5 },
                          { id: "center" as const, label: "中央", emoji: "◫", x: 44 },
                          { id: "right" as const, label: "右寄せ", emoji: "◨", x: 50 },
                        ]
                      ).map(({ id, label, emoji, x }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            // 一括整列は「全要素に対する操作」なので、enabled=false の項目も
                            // 含めて全部処理する。さらに、無効化されていた要素は自動で有効化する
                            // （ユーザーが意図的に消した項目を勝手に復活させない判断もあるが、
                            //  一括操作の予測可能性を優先して全有効化）。
                            // また scale=0 などの異常値は 1 に矯正してプレビューが消えないように。
                            const fl = data.freeLayout ?? DEFAULT_FREE_LAYOUT;
                            const nextFl: FreeLayoutMap = {};
                            const align: "left" | "center" | "right" =
                              id === "right" ? "left" : id;
                            // DEFAULT_FREE_LAYOUT の全キーを正規化（古いストレージで欠けても対応）
                            const allKeys = Array.from(
                              new Set([
                                ...(Object.keys(DEFAULT_FREE_LAYOUT) as FreeLayoutItemKey[]),
                                ...(Object.keys(fl) as FreeLayoutItemKey[]),
                              ]),
                            );
                            allKeys.forEach((k) => {
                              const defaultItem = DEFAULT_FREE_LAYOUT[k];
                              const cur = fl[k] ?? defaultItem;
                              if (!cur) return;
                              const scale = Number.isFinite(cur.scale) && cur.scale > 0 ? cur.scale : 1;
                              nextFl[k] = {
                                enabled: true, // 一括操作 → 強制有効化
                                x,
                                y: cur.y,
                                scale,
                                align,
                              };
                            });
                            update({ freeLayout: nextFl });
                          }}
                          className="text-[10px] px-1.5 py-1 rounded border border-neutral-300 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 active:scale-95 transition flex items-center justify-center gap-1"
                          title={`全要素を${label}に（${label === "右寄せ" ? "文字は左揃えのまま、要素位置だけ右へ" : ""}）。無効化されていた項目も有効化されます`}
                        >
                          <span className="text-sm">{emoji}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 一括フォントサイズ */}
                  <div>
                    <div className="text-[9px] text-neutral-500 mb-1">
                      全体サイズ（全要素のサイズを一括拡縮）
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-neutral-400">小</span>
                      <input
                        type="range"
                        min={0.5}
                        max={2}
                        step={0.05}
                        value={data.freeLayoutGlobalScale ?? 1}
                        onChange={(e) => update({ freeLayoutGlobalScale: parseFloat(e.target.value) })}
                        className="flex-1 accent-emerald-600"
                      />
                      <span className="text-[9px] text-neutral-400">大</span>
                      <span className="text-[10px] font-mono text-neutral-700 w-10 text-right">
                        {Math.round((data.freeLayoutGlobalScale ?? 1) * 100)}%
                      </span>
                      {(data.freeLayoutGlobalScale ?? 1) !== 1 && (
                        <button
                          type="button"
                          onClick={() => update({ freeLayoutGlobalScale: 1 })}
                          className="text-[9px] text-neutral-500 hover:text-neutral-900"
                          title="標準サイズに戻す"
                        >
                          ↺
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {(
                  [
                    { key: "name", label: "氏名" },
                    { key: "kana", label: "ふりがな" },
                    { key: "affiliation", label: "所属" },
                    { key: "title", label: "役職" },
                    { key: "freeText", label: "自由テキスト" },
                    { key: "qr", label: "QRコード" },
                    { key: "logo", label: "ロゴ" },
                    { key: "eventName", label: "イベント名" },
                  ] as { key: FreeLayoutItemKey; label: string }[]
                ).map(({ key, label }) => {
                  const fl = data.freeLayout ?? DEFAULT_FREE_LAYOUT;
                  const item = fl[key] ?? { enabled: false, x: 5, y: 25, scale: 1 };
                  const setItem = (patch: Partial<FreeLayoutItem>) =>
                    update({
                      freeLayout: { ...fl, [key]: { ...item, ...patch } },
                    });
                  return (
                    <div key={key} className="rounded-md bg-white border border-neutral-200 p-2 space-y-1">
                      <label className="flex items-center gap-1.5 text-[11px]">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(e) => setItem({ enabled: e.target.checked })}
                          className="accent-emerald-600"
                        />
                        <strong>{label}</strong>
                      </label>
                      {item.enabled && (
                        <div className="grid grid-cols-3 gap-1 pl-5">
                          <label className="flex items-center gap-1 text-[10px]">
                            X
                            <input
                              type="number"
                              value={item.x.toFixed(1)}
                              onChange={(e) => setItem({ x: parseFloat(e.target.value) || 0 })}
                              step={0.5}
                              min={0}
                              max={88}
                              className="w-12 px-1 py-0.5 rounded border border-neutral-200 text-[10px]"
                            />
                          </label>
                          <label className="flex items-center gap-1 text-[10px]">
                            Y
                            <input
                              type="number"
                              value={item.y.toFixed(1)}
                              onChange={(e) => setItem({ y: parseFloat(e.target.value) || 0 })}
                              step={0.5}
                              min={0}
                              max={55}
                              className="w-12 px-1 py-0.5 rounded border border-neutral-200 text-[10px]"
                            />
                          </label>
                          <label className="flex items-center gap-1 text-[10px]">
                            倍
                            <input
                              type="number"
                              value={item.scale.toFixed(1)}
                              onChange={(e) => setItem({ scale: parseFloat(e.target.value) || 1 })}
                              step={0.1}
                              min={0.3}
                              max={3}
                              className="w-12 px-1 py-0.5 rounded border border-neutral-200 text-[10px]"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => update({ freeLayout: DEFAULT_FREE_LAYOUT })}
                  className="text-[10px] text-emerald-700 hover:text-emerald-900 underline"
                >
                  ↺ デフォルト配置に戻す
                </button>
              </div>
            )}

          </section>

          <section className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
            <div className="text-sm font-bold text-neutral-900">3️⃣ 共通設定</div>

            {/* 用途プリセット */}
            <div className="rounded-lg bg-emerald-50/50 border border-emerald-200 p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold text-neutral-900">🎯 用途プリセット</div>
                  <div className="text-[10px] text-neutral-600 mt-0.5">
                    使う場面に合わせて項目ラベル＆表示項目を一発切替
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPresetManagerOpen(true)}
                  className="text-[10px] px-2 py-1 rounded-md border border-emerald-400 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shrink-0"
                  title="プリセットを追加・編集"
                >
                  ⚙️ 管理
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {/* デフォルト4種 */}
                {(Object.entries(USECASE_PRESETS) as [UseCase, PresetConfig][]).map(([id, preset]) => {
                  const selected = data.useCase === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        update({
                          useCase: id,
                          fieldLabels: preset.labels,
                          visibleFields: preset.visible,
                          mainColor: preset.color,
                        })
                      }
                      className={`flex items-start gap-1.5 p-2 rounded-md border text-left transition ${
                        selected
                          ? "border-emerald-500 bg-white shadow-sm"
                          : "border-neutral-200 bg-white hover:border-emerald-300"
                      }`}
                    >
                      <span className="text-base shrink-0">{preset.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[11px] font-bold ${selected ? "text-emerald-700" : "text-neutral-900"}`}>
                          {preset.label}
                        </div>
                        <div className="text-[9px] text-neutral-500 leading-snug">
                          {preset.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {/* ユーザー追加プリセット */}
                {customPresets.map((preset) => {
                  const selected = data.useCase === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        update({
                          useCase: preset.id,
                          fieldLabels: preset.labels,
                          visibleFields: preset.visible,
                          mainColor: preset.color,
                        })
                      }
                      className={`flex items-start gap-1.5 p-2 rounded-md border text-left transition relative ${
                        selected
                          ? "border-amber-500 bg-amber-50/30 shadow-sm"
                          : "border-amber-200 bg-amber-50/10 hover:border-amber-400"
                      }`}
                    >
                      <span className="text-base shrink-0">{preset.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[11px] font-bold flex items-center gap-1 ${selected ? "text-amber-700" : "text-neutral-900"}`}>
                          {preset.label}
                          <span className="text-[8px] text-amber-600 font-normal">カスタム</span>
                        </div>
                        <div className="text-[9px] text-neutral-500 leading-snug">
                          {preset.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {customPresets.length < CUSTOM_PRESET_LIMIT && (
                <button
                  type="button"
                  onClick={() => setPresetManagerOpen(true)}
                  className="w-full text-[10px] py-1.5 rounded-md border-2 border-dashed border-amber-300 bg-white text-amber-700 hover:bg-amber-50/50 font-semibold"
                >
                  + 新しい用途を追加（あと{CUSTOM_PRESET_LIMIT - customPresets.length}個）
                </button>
              )}
            </div>

            {/* 表示項目フィルター */}
            <div className="rounded-lg bg-amber-50/50 border border-amber-200 p-3 space-y-2">
              <div>
                <div className="text-[11px] font-bold text-neutral-900">
                  📋 名札に表示する項目
                </div>
                <div className="text-[10px] text-neutral-600 mt-0.5 leading-relaxed">
                  読み込んだ名簿から、名札に出す項目だけチェック。プライバシー上隠したい情報を非表示にできます。
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {(
                  // ラベルは用途プリセットの fieldLabels と連動して動的に取得
                  [
                    { key: "kana", label: data.fieldLabels?.kana || "ふりがな" },
                    { key: "affiliation", label: data.fieldLabels?.affiliation || "所属" },
                    { key: "title", label: data.fieldLabels?.title || "役職" },
                    { key: "freeText", label: data.fieldLabels?.freeText || "ひとこと" },
                    { key: "qr", label: "QRコード" },
                    { key: "eventName", label: "イベント名" },
                    { key: "eventDate", label: "日付" },
                    { key: "logo", label: "ロゴ" },
                  ] as { key: keyof VisibleFields; label: string }[]
                ).map(({ key, label }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-[11px] ${
                      data.visibleFields?.[key] ? "bg-white text-neutral-900" : "bg-amber-100/40 text-neutral-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={data.visibleFields?.[key] ?? true}
                      onChange={(e) =>
                        update({
                          visibleFields: {
                            ...(data.visibleFields ?? DEFAULT_VISIBLE),
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="accent-amber-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-neutral-700 mb-1">
                イベント名・店舗名（任意・改行OK）
              </label>
              <textarea
                value={data.eventName}
                onChange={(e) => update({ eventName: e.target.value })}
                placeholder="例: 第3回オフ会&#10;2026 SPRING"
                rows={2}
                className="w-full px-2 py-1.5 rounded border border-neutral-200 text-xs focus:border-emerald-400 focus:outline-none resize-y leading-tight"
              />
              <div className="text-[9px] text-neutral-500 mt-0.5">
                Enterキーで改行できます（2行以上もOK）
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-neutral-700 mb-1">
                日付（任意）
              </label>
              <input
                type="text"
                value={data.eventDate}
                onChange={(e) => update({ eventDate: e.target.value })}
                placeholder="例: 2026.05.10"
                className="w-full px-2 py-1.5 rounded border border-neutral-200 text-xs focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-neutral-700 mb-1.5">
                表面のメインカラー
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => update({ mainColor: c.color })}
                    title={c.label}
                    className={`aspect-square rounded-md border-2 transition ${
                      data.mainColor === c.color
                        ? "border-neutral-900 scale-105"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>
              <div className="mt-2">
                <ColorPickerWithHistory
                  value={data.mainColor}
                  onChange={(hex) => update({ mainColor: hex })}
                />
              </div>
            </div>

            {/* 裏面用メインカラー（裏面レイアウトを使う時のみ表示） */}
            {data.backLayout !== "none" && (
              <div>
                <label className="block text-[10px] font-semibold text-neutral-700 mb-1.5">
                  裏面のメインカラー
                  <span className="text-[9px] text-neutral-500 ml-1 font-normal">
                    （空欄なら表面と同じ）
                  </span>
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => update({ backMainColor: c.color })}
                      title={c.label}
                      className={`aspect-square rounded-md border-2 transition ${
                        data.backMainColor === c.color
                          ? "border-neutral-900 scale-105"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={data.backMainColor || data.mainColor}
                    onChange={(e) => update({ backMainColor: e.target.value })}
                    className="flex-1 h-7 rounded border border-neutral-200 cursor-pointer"
                  />
                  {data.backMainColor && (
                    <button
                      type="button"
                      onClick={() => update({ backMainColor: "" })}
                      className="text-[10px] text-neutral-500 hover:text-neutral-900 px-2 py-1 rounded border border-neutral-200"
                      title="表面と同じカラーに戻す"
                    >
                      ↺ 表面と同じ
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 裏面レイアウト */}
            <div className="rounded-lg bg-pink-50/30 border border-pink-200 p-3 space-y-2">
              <div>
                <div className="text-[11px] font-bold text-neutral-900">🔄 裏面のデザイン</div>
                <div className="text-[10px] text-neutral-600 mt-0.5">
                  なし／QR大／URLテキスト／ロゴ／自由テキスト／カスタム背景 から選択。両面印刷したい時に使います。
                </div>
              </div>
              <select
                value={data.backLayout}
                onChange={(e) => update({ backLayout: e.target.value as BackLayout })}
                className="w-full px-2 py-1.5 rounded border border-pink-300 text-xs focus:border-pink-500 focus:outline-none bg-white"
              >
                <option value="none">裏面なし（表のみ印刷）</option>
                <option value="qr-large">QRコード大（画面いっぱい）</option>
                <option value="url-text">URL/テキスト中央表示</option>
                <option value="logo-center">ロゴ中央配置</option>
                <option value="free-text">自由テキスト全面</option>
                <option value="custom-bg">カスタム背景画像</option>
                <optgroup label="📝 メモできるデザイン">
                  <option value="memo-lined">罫線メモ（横線あり）</option>
                  <option value="memo-grid">方眼メモ（5mmグリッド）</option>
                  <option value="memo-blank">フリーメモ（無地）</option>
                  <option value="memo-titled">タイトル付きメモ（罫線+ヘッダー）</option>
                </optgroup>
              </select>
              {(data.backLayout === "free-text" || data.backLayout === "url-text") && (
                <textarea
                  value={data.backText}
                  onChange={(e) => update({ backText: e.target.value })}
                  placeholder="裏面に表示する自由なメッセージ（共通）"
                  rows={2}
                  className="w-full p-1.5 rounded border border-pink-300 text-xs resize-y"
                />
              )}

              {/* メモ系裏面の追加設定（名前ON/OFF + カスタムタイトル） */}
              {(data.backLayout === "memo-lined" ||
                data.backLayout === "memo-grid" ||
                data.backLayout === "memo-blank" ||
                data.backLayout === "memo-titled") && (
                <div className="rounded-md bg-white border border-pink-200 p-2 space-y-2">
                  <div className="text-[10px] font-bold text-neutral-700">📝 メモのヘッダー設定</div>
                  <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.backMemoShowName !== false}
                      onChange={(e) => update({ backMemoShowName: e.target.checked })}
                      className="accent-pink-600"
                    />
                    <span>名前をメモのタイトルに表示する</span>
                  </label>
                  <div>
                    <label className="text-[10px] text-neutral-600 block mb-0.5">
                      カスタムタイトル（任意・優先される）
                    </label>
                    <input
                      type="text"
                      value={data.backMemoTitle ?? ""}
                      onChange={(e) => update({ backMemoTitle: e.target.value })}
                      placeholder="例: 商談メモ / 連絡先メモ"
                      className="w-full px-2 py-1 rounded border border-pink-300 text-xs"
                    />
                    <div className="text-[9px] text-neutral-500 mt-0.5">
                      入力すると名前より優先されます。空欄なら名前（OFFなら「MEMO」）が表示されます
                    </div>
                  </div>
                </div>
              )}
              {data.backLayout === "custom-bg" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-md border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden shrink-0">
                      {data.backCustomBgDataUrl ? (
                        <img src={data.backCustomBgDataUrl} alt="back-bg" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[8px] text-neutral-400">未設定</span>
                      )}
                    </div>
                    <label className="text-[10px] px-2 py-1 rounded border border-pink-300 bg-white hover:border-pink-500 cursor-pointer">
                      📁 裏面画像を選ぶ
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          if (f.size > 5 * 1024 * 1024) {
                            alert("画像は5MB以下にしてください");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") {
                              update({ backCustomBgDataUrl: reader.result });
                            }
                          };
                          reader.readAsDataURL(f);
                        }}
                      />
                    </label>
                    {data.backCustomBgDataUrl && (
                      <button
                        type="button"
                        onClick={() => update({ backCustomBgDataUrl: "" })}
                        className="text-[10px] text-neutral-500 hover:text-red-600"
                      >
                        削除
                      </button>
                    )}
                  </div>

                  {/* レイヤー要素選択 — カスタム背景の上に重ねる */}
                  <div className="rounded-md bg-white border border-pink-200 p-2 space-y-1.5">
                    <div className="text-[10px] font-bold text-neutral-700">
                      🎯 背景の上に重ねる要素
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {(
                        [
                          { key: "name", label: "氏名" },
                          { key: "freeText", label: "自由テキスト" },
                          { key: "qr", label: "QRコード" },
                          { key: "logo", label: "ロゴ" },
                        ] as { key: keyof Omit<BackOverlay, "customText">; label: string }[]
                      ).map(({ key, label }) => {
                        const ov = data.backOverlay ?? { qr: false, freeText: false, logo: false, name: false, customText: "" };
                        return (
                          <label key={key} className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={ov[key]}
                              onChange={(e) =>
                                update({ backOverlay: { ...ov, [key]: e.target.checked } })
                              }
                              className="accent-pink-600"
                            />
                            {label}
                          </label>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      value={data.backOverlay?.customText ?? ""}
                      onChange={(e) =>
                        update({
                          backOverlay: {
                            ...(data.backOverlay ?? { qr: false, freeText: false, logo: false, name: false, customText: "" }),
                            customText: e.target.value,
                          },
                        })
                      }
                      placeholder="共通追加テキスト（自由テキストON時に表示）"
                      className="w-full px-2 py-1 rounded border border-pink-200 text-[11px] focus:border-pink-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 項目別の文字色 */}
            <div className="rounded-lg bg-purple-50/30 border border-purple-200 p-3 space-y-2">
              <div>
                <div className="text-[11px] font-bold text-neutral-900">🎨 項目別の文字色</div>
                <div className="text-[10px] text-neutral-600 mt-0.5">
                  各項目の文字色を個別に変更。<strong>イベント名</strong>はメインカラーから独立（グループあれば自動連動）
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { key: "name", label: "氏名", defColor: "#171717" },
                    { key: "kana", label: data.fieldLabels?.kana || "ふりがな", defColor: "#737373" },
                    { key: "affiliation", label: data.fieldLabels?.affiliation || "所属", defColor: "#525252" },
                    { key: "title", label: data.fieldLabels?.title || "役職", defColor: data.mainColor },
                    { key: "freeText", label: data.fieldLabels?.freeText || "ひとこと", defColor: data.mainColor },
                  ] as { key: FreeLayoutItemKey; label: string; defColor: string }[]
                ).map(({ key, label, defColor }) => {
                  const cur = data.textColors?.[key];
                  return (
                    <div key={key} className="flex items-center gap-1.5 bg-white rounded px-2 py-1 border border-neutral-200">
                      <input
                        type="color"
                        value={cur || defColor}
                        onChange={(e) =>
                          update({
                            textColors: {
                              ...(data.textColors ?? {}),
                              [key]: e.target.value,
                            },
                          })
                        }
                        className="w-5 h-5 rounded cursor-pointer border border-neutral-200 shrink-0"
                        title={cur ? "クリックで変更" : "クリックでカスタム色"}
                      />
                      <span className="text-[10px] flex-1 truncate" title={label}>
                        {label}
                      </span>
                      {cur && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = { ...(data.textColors ?? {}) };
                            delete next[key];
                            update({ textColors: next });
                          }}
                          className="text-[9px] text-neutral-400 hover:text-neutral-900"
                          title="デフォルトに戻す"
                        >
                          ↺
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* イベント名は専用UI（3択モード） */}
              <div className="rounded-md bg-white border border-purple-200 p-2 space-y-1.5">
                <div className="text-[10px] font-bold text-neutral-900">📍 イベント名の文字色モード</div>
                <div className="grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: "main" as const, label: "メイン連動", desc: "メインカラーと同じ" },
                      { id: "group" as const, label: "グループ連動", desc: "グループ色を使う" },
                      { id: "custom" as const, label: "カスタム", desc: "自由に色指定" },
                    ]
                  ).map(({ id, label, desc }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => update({ eventNameColorMode: id })}
                      className={`text-[9.5px] py-1 rounded border transition ${
                        (data.eventNameColorMode ?? "group") === id
                          ? "border-purple-500 bg-purple-50 text-purple-700 font-bold"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-purple-300"
                      }`}
                      title={desc}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {(data.eventNameColorMode ?? "group") === "custom" && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={data.textColors?.eventName || data.mainColor}
                      onChange={(e) =>
                        update({
                          textColors: {
                            ...(data.textColors ?? {}),
                            eventName: e.target.value,
                          },
                        })
                      }
                      className="w-6 h-6 rounded cursor-pointer border border-neutral-200"
                    />
                    <span className="text-[10px] font-mono text-neutral-600">
                      {data.textColors?.eventName || data.mainColor}
                    </span>
                    {data.textColors?.eventName && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = { ...(data.textColors ?? {}) };
                          delete next.eventName;
                          update({ textColors: next });
                        }}
                        className="text-[10px] text-neutral-500 hover:text-neutral-900 ml-auto"
                      >
                        ↺ クリア
                      </button>
                    )}
                  </div>
                )}
                {(data.eventNameColorMode ?? "group") === "group" && data.groupMode === "off" && (
                  <div className="text-[9px] text-amber-700">
                    ⚠ グループ機能がOFFのため、デフォルトのグレーが適用されます
                  </div>
                )}
              </div>
            </div>

            {/* グループ分け設定 */}
            <div className="rounded-lg bg-indigo-50/30 border border-indigo-200 p-3 space-y-2">
              <div>
                <div className="text-[11px] font-bold text-neutral-900">🗂 グループ分け</div>
                <div className="text-[10px] text-neutral-600 mt-0.5">
                  所属で自動 or A〜Fに手動でグループ化。グループ機能ON時は個人別カラーは無効化
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: "off" as const, label: "なし", desc: "全員1色" },
                    { id: "auto" as const, label: "自動", desc: "所属ごと" },
                    { id: "manual" as const, label: "手動", desc: "A〜F" },
                  ]
                ).map(({ id, label, desc }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => update({ groupMode: id })}
                    className={`text-[10px] py-1 rounded border transition ${
                      (data.groupMode ?? "off") === id
                        ? "border-indigo-500 bg-white shadow-sm font-bold text-indigo-700"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-indigo-300"
                    }`}
                  >
                    {label}
                    <div className="text-[8px] font-normal text-neutral-500">{desc}</div>
                  </button>
                ))}
              </div>

              {data.groupMode === "manual" && (
                <div className="rounded-md bg-white border border-neutral-200 p-2 space-y-1">
                  <div className="text-[10px] font-bold text-neutral-700">A〜F カラー</div>
                  {GROUP_KEYS.map((g) => {
                    const memberCount = data.people.filter((p) => p.group === g).length;
                    return (
                      <div key={g} className="flex items-center gap-1.5 text-[10px]">
                        <span
                          className="font-bold w-5 text-center rounded text-white"
                          style={{ backgroundColor: data.groupColors?.[g] ?? NAMETAG_GROUP_COLORS[g] }}
                        >
                          {g}
                        </span>
                        <input
                          type="text"
                          value={data.groupLabels?.[g] ?? `グループ${g}`}
                          onChange={(e) =>
                            update({
                              groupLabels: {
                                ...(data.groupLabels ?? { A: "", B: "", C: "", D: "", E: "", F: "" }),
                                [g]: e.target.value,
                              },
                            })
                          }
                          placeholder={`グループ${g}`}
                          className="flex-1 px-1 py-0.5 rounded border border-neutral-200 text-[10px]"
                        />
                        <input
                          type="color"
                          value={data.groupColors?.[g] ?? NAMETAG_GROUP_COLORS[g]}
                          onChange={(e) =>
                            update({
                              groupColors: {
                                ...(data.groupColors ?? NAMETAG_GROUP_COLORS),
                                [g]: e.target.value,
                              },
                            })
                          }
                          className="w-6 h-5 rounded cursor-pointer border border-neutral-200"
                        />
                        <span className="text-[9px] text-neutral-500 w-7 text-right">{memberCount}名</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {data.groupMode === "auto" && (() => {
                const affs = Array.from(
                  new Set(data.people.map((p) => p.affiliation || "（未分類）")),
                ).slice(0, 12);
                return (
                  <div className="rounded-md bg-white border border-neutral-200 p-2 space-y-1">
                    <div className="text-[10px] font-bold text-neutral-700">
                      所属別カラー（{affs.length}グループ）
                    </div>
                    {affs.length === 0 ? (
                      <div className="text-[10px] text-neutral-400">名簿に「所属」を入力するとグループ化されます</div>
                    ) : (
                      affs.map((aff, i) => {
                        const fallback = Object.values(NAMETAG_GROUP_COLORS)[i % 6];
                        const color = data.autoGroupColors?.[aff] ?? fallback;
                        const memberCount = data.people.filter((p) => (p.affiliation || "（未分類）") === aff).length;
                        return (
                          <div key={aff} className="flex items-center gap-1.5 text-[10px]">
                            <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: color }} />
                            <span className="flex-1 truncate" title={aff}>{aff}</span>
                            <input
                              type="color"
                              value={color}
                              onChange={(e) =>
                                update({
                                  autoGroupColors: {
                                    ...(data.autoGroupColors ?? {}),
                                    [aff]: e.target.value,
                                  },
                                })
                              }
                              className="w-6 h-5 rounded cursor-pointer border border-neutral-200"
                            />
                            <span className="text-[9px] text-neutral-500 w-7 text-right">{memberCount}名</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 表面QRコード設定（一括位置・サイズ） */}
            <div className="rounded-lg bg-cyan-50/30 border border-cyan-200 p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.frontQrOverride?.enabled ?? false}
                  onChange={(e) =>
                    update({
                      frontQrOverride: {
                        ...(data.frontQrOverride ?? { enabled: false, x: 73, y: 38, size: 12, source: "person-url", customUrl: "" }),
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="accent-cyan-600"
                />
                <div className="flex-1">
                  <div className="text-[11px] font-bold text-neutral-900">📱 表面のQRコード（一括）</div>
                  <div className="text-[10px] text-neutral-600 leading-snug">
                    全員の表面に同じ位置・サイズでQRコードを配置。テンプレ既存のQRは非表示になります
                  </div>
                </div>
              </label>
              {data.frontQrOverride?.enabled && (
                <div className="rounded-md bg-white border border-cyan-200 p-2 space-y-2">
                  <div>
                    <div className="text-[10px] font-bold text-neutral-700 mb-1">URLソース</div>
                    <div className="flex gap-2 text-[10px]">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          checked={data.frontQrOverride.source === "person-url"}
                          onChange={() =>
                            update({
                              frontQrOverride: { ...data.frontQrOverride!, source: "person-url" },
                            })
                          }
                          className="accent-cyan-600"
                        />
                        個人別URL（名簿の各人のURL）
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          checked={data.frontQrOverride.source === "custom-url"}
                          onChange={() =>
                            update({
                              frontQrOverride: { ...data.frontQrOverride!, source: "custom-url" },
                            })
                          }
                          className="accent-cyan-600"
                        />
                        共通URL
                      </label>
                    </div>
                  </div>
                  {data.frontQrOverride.source === "custom-url" && (
                    <input
                      type="url"
                      value={data.frontQrOverride.customUrl}
                      onChange={(e) =>
                        update({
                          frontQrOverride: { ...data.frontQrOverride!, customUrl: e.target.value },
                        })
                      }
                      placeholder="https://..."
                      className="w-full px-2 py-1 rounded border border-cyan-300 text-xs"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-600 w-12">X位置</span>
                    <input
                      type="range"
                      min={0}
                      max={88 - (data.frontQrOverride.size ?? 12)}
                      step={0.5}
                      value={data.frontQrOverride.x}
                      onChange={(e) =>
                        update({
                          frontQrOverride: { ...data.frontQrOverride!, x: parseFloat(e.target.value) },
                        })
                      }
                      className="flex-1 accent-cyan-600"
                    />
                    <span className="text-[10px] font-mono w-10 text-right">{data.frontQrOverride.x.toFixed(1)}mm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-600 w-12">Y位置</span>
                    <input
                      type="range"
                      min={0}
                      max={55 - (data.frontQrOverride.size ?? 12)}
                      step={0.5}
                      value={data.frontQrOverride.y}
                      onChange={(e) =>
                        update({
                          frontQrOverride: { ...data.frontQrOverride!, y: parseFloat(e.target.value) },
                        })
                      }
                      className="flex-1 accent-cyan-600"
                    />
                    <span className="text-[10px] font-mono w-10 text-right">{data.frontQrOverride.y.toFixed(1)}mm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-600 w-12">サイズ</span>
                    <input
                      type="range"
                      min={6}
                      max={30}
                      step={0.5}
                      value={data.frontQrOverride.size}
                      onChange={(e) =>
                        update({
                          frontQrOverride: { ...data.frontQrOverride!, size: parseFloat(e.target.value) },
                        })
                      }
                      className="flex-1 accent-cyan-600"
                    />
                    <span className="text-[10px] font-mono w-10 text-right">{data.frontQrOverride.size.toFixed(1)}mm</span>
                  </div>
                </div>
              )}
            </div>

            {/* カスタム背景 */}
            <div id="custom-bg-uploader" className="rounded-lg bg-blue-50/30 border border-blue-200 p-3 space-y-2 scroll-mt-20">
              <div className="text-[11px] font-bold text-neutral-900">🖼 カスタム背景（任意）</div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-md border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden shrink-0">
                  {data.customBgDataUrl ? (
                    <img src={data.customBgDataUrl} alt="bg" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[8px] text-neutral-400 text-center px-1">未設定</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] px-2 py-1 rounded border border-blue-300 bg-white hover:border-blue-500 cursor-pointer text-center">
                    📁 画像を選ぶ
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 5 * 1024 * 1024) {
                          alert("背景画像は5MB以下にしてください");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string") {
                            update({ customBgDataUrl: reader.result });
                          }
                        };
                        reader.readAsDataURL(f);
                      }}
                    />
                  </label>
                  {data.customBgDataUrl && (
                    <button
                      type="button"
                      onClick={() => update({ customBgDataUrl: "" })}
                      className="text-[10px] px-2 py-1 rounded border border-neutral-200 text-neutral-500 hover:border-red-300 hover:text-red-600"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
              {data.customBgDataUrl && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-600 w-12">不透明度</span>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={data.customBgOpacity}
                    onChange={(e) => update({ customBgOpacity: parseFloat(e.target.value) })}
                    className="flex-1 accent-blue-600"
                  />
                  <span className="text-[10px] font-mono w-10 text-right">{Math.round(data.customBgOpacity * 100)}%</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-neutral-700 mb-1.5">
                ロゴ（任意）
              </label>
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-md border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden shrink-0">
                  {data.logoDataUrl ? (
                    <img src={data.logoDataUrl} alt="logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-[8px] text-neutral-400 text-center px-1">未設定</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] px-2 py-1 rounded border border-neutral-300 bg-white hover:border-emerald-400 cursor-pointer text-center">
                    📁 画像を選ぶ
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleLogo(f);
                      }}
                    />
                  </label>
                  {data.logoDataUrl && (
                    <button
                      type="button"
                      onClick={() => update({ logoDataUrl: "" })}
                      className="text-[10px] px-2 py-1 rounded border border-neutral-200 text-neutral-500 hover:border-red-300 hover:text-red-600"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="text-[10px] text-neutral-500 leading-relaxed px-1">
            💡 PDFはA4縦に2列×4行=8面付け。市販のラベル用紙（88×55mm 8面）で印刷できます。
          </div>
        </aside>
      </div>

      {/* === Preset Manager Modal === */}
      {presetManagerOpen && (
        <PresetManagerModal
          onClose={() => {
            setPresetManagerOpen(false);
            setCustomPresets(listCustomPresets());
          }}
          onApply={(preset) => {
            update({
              useCase: preset.id,
              fieldLabels: preset.labels,
              visibleFields: preset.visible,
              mainColor: preset.color,
            });
            setPresetManagerOpen(false);
            setCustomPresets(listCustomPresets());
          }}
        />
      )}

      {/* === Snapshot modal === */}
      {snapshotOpen && (
        <SnapshotModal
          onClose={() => setSnapshotOpen(false)}
          currentLabel={data.eventName || "名札"}
          onSave={async (label) => {
            try {
              await saveSnapshot({
                label,
                payload: JSON.stringify(data),
                peopleCount: data.people.length,
                templateId: data.templateId,
              });
              alert("✅ 保存しました");
            } catch (e) {
              alert(`保存に失敗: ${e instanceof Error ? e.message : "不明なエラー"}`);
            }
          }}
          onLoad={(snap) => {
            try {
              const parsed = JSON.parse(snap.payload) as NametagData;
              setData({
                ...DEFAULT_DATA,
                ...parsed,
                visibleFields: { ...DEFAULT_VISIBLE, ...(parsed.visibleFields ?? {}) },
                fieldLabels: { ...USECASE_PRESETS.custom.labels, ...(parsed.fieldLabels ?? {}) },
              });
              setSnapshotOpen(false);
            } catch {
              alert("データを開けませんでした");
            }
          }}
        />
      )}

      {/* === Roster (saved address book) modal === */}
      {rosterOpen && (
        <RosterModal
          onClose={() => setRosterOpen(false)}
          onPick={(picked) => {
            const remaining = 50 - data.people.length;
            if (remaining <= 0) {
              alert("名札の名簿は最大100名です。先に削除してから取り込んでください");
              return;
            }
            const take = picked.slice(0, remaining);
            const newPeople: Person[] = take.map((p) => ({
              id: Math.random().toString(36).slice(2, 10),
              name: p.name,
              kana: p.kana,
              affiliation: p.affiliation,
              title: p.title,
              url: p.url ?? "",
            }));
            update({ people: [...data.people, ...newPeople] });
            if (picked.length > take.length) {
              alert(
                `${take.length}名取り込みました（${picked.length - take.length}名は名札の上限100名を超えるため除外）`,
              );
            }
            setRosterOpen(false);
          }}
          currentPeople={data.people.map((p) => ({
            name: p.name,
            kana: p.kana,
            affiliation: p.affiliation,
            title: p.title,
            url: p.url,
          }))}
        />
      )}

      {/*
        表面キャプチャノード — PDF出力用。
        ブラウザの最適化により viewport 完全外要素は描画/画像読み込みが
        遅延・スキップされることがあるため、 viewport 左上に配置しつつ
        transform で画面外に飛ばす。これで確実にレイアウト＆ペイントが走る。
      */}
      <div
        ref={captureRef}
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: `${TAG_W_MM}mm`,
          height: `${TAG_H_MM}mm`,
          backgroundColor: "#ffffff",
          overflow: "hidden",
          transform: "translate(-9999px, 0)",
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        {captureTarget && (() => {
          // 表面QRオーバーレイ用のデータを構築（プレビューと同じロジック）
          const fqo = data.frontQrOverride;
          const frontQrUrl = fqo?.enabled
            ? fqo.source === "custom-url"
              ? fqo.customUrl?.trim()
              : captureTarget.url?.trim()
            : undefined;
          const frontQrOverlay = frontQrUrl && qrMap[frontQrUrl] && fqo?.enabled
            ? { dataUrl: qrMap[frontQrUrl], x: fqo.x, y: fqo.y, size: fqo.size }
            : undefined;
          return (
            <NametagBody
              person={captureTarget}
              data={data}
              sizeMm={{ w: TAG_W_MM, h: TAG_H_MM }}
              qrDataUrl={captureTarget.url ? qrMap[captureTarget.url.trim()] : undefined}
              frontQrOverlay={frontQrOverlay}
            />
          );
        })()}
      </div>
      {/*
        PDF生成専用: 全員分の表/裏ノードを一括レンダリング。
        pdfRenderActive=true の時のみ DOM に存在。
        toPng は data-pdf-front / data-pdf-back 属性で取得する。
      */}
      {pdfRenderActive && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            transform: "translate(-9999px, 0)",
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          {data.people.map((p) => {
            const fqo = data.frontQrOverride;
            const frontQrUrl = fqo?.enabled
              ? fqo.source === "custom-url"
                ? fqo.customUrl?.trim()
                : p.url?.trim()
              : undefined;
            const frontQrOverlay = frontQrUrl && qrMap[frontQrUrl] && fqo?.enabled
              ? { dataUrl: qrMap[frontQrUrl], x: fqo.x, y: fqo.y, size: fqo.size }
              : undefined;
            return (
              <div key={`pdf-${p.id}`}>
                <div
                  data-pdf-front={p.id}
                  style={{
                    position: "relative",
                    width: `${TAG_W_MM}mm`,
                    height: `${TAG_H_MM}mm`,
                    backgroundColor: "#ffffff",
                    overflow: "hidden",
                  }}
                >
                  <NametagBody
                    person={p}
                    data={data}
                    sizeMm={{ w: TAG_W_MM, h: TAG_H_MM }}
                    qrDataUrl={p.url ? qrMap[p.url.trim()] : undefined}
                    frontQrOverlay={frontQrOverlay}
                  />
                </div>
                {data.backLayout !== "none" && (
                  <div
                    data-pdf-back={p.id}
                    style={{
                      position: "relative",
                      width: `${TAG_W_MM}mm`,
                      height: `${TAG_H_MM}mm`,
                      backgroundColor: "#ffffff",
                      overflow: "hidden",
                    }}
                  >
                    <NametagBack
                      person={p}
                      data={data}
                      qrDataUrl={p.url ? qrMap[p.url.trim()] : undefined}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 裏面キャプチャノード — 両面印刷PDF用 */}
      <div
        ref={captureBackRef}
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: `${TAG_W_MM}mm`,
          height: `${TAG_H_MM}mm`,
          backgroundColor: "#ffffff",
          overflow: "hidden",
          transform: "translate(-9999px, 0)",
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        {captureTarget && data.backLayout !== "none" && (
          <NametagBack
            person={captureTarget}
            data={data}
            qrDataUrl={captureTarget.url ? qrMap[captureTarget.url.trim()] : undefined}
          />
        )}
      </div>
    </main>
  );
}

// === Preview tile ============================================================

function NametagPreview({
  person,
  data,
  qrDataUrl,
  frontQrOverlay,
}: {
  person: Person;
  data: NametagData;
  qrDataUrl?: string;
  frontQrOverlay?: { dataUrl: string; x: number; y: number; size: number };
}) {
  return (
    <div
      className="overflow-hidden border border-neutral-200 shadow-sm bg-white"
      style={{
        width: `${TAG_W_MM}mm`,
        height: `${TAG_H_MM}mm`,
        position: "relative",
      }}
    >
      <NametagBody
        person={person}
        data={data}
        sizeMm={{ w: TAG_W_MM, h: TAG_H_MM }}
        qrDataUrl={qrDataUrl}
        frontQrOverlay={frontQrOverlay}
      />
    </div>
  );
}

// === Preset Manager Modal ===================================================

const DEFAULT_NEW_PRESET: PresetConfig = {
  label: "新しい用途",
  description: "",
  emoji: "✨",
  color: "#10b981",
  visible: { kana: true, affiliation: true, title: true, freeText: true, qr: true, eventName: true, eventDate: true, logo: true },
  labels: { name: "氏名", kana: "ふりがな", affiliation: "所属", title: "役職", freeText: "ひとこと" },
};

function PresetManagerModal({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (preset: CustomPreset) => void;
}) {
  const [list, setList] = useState<CustomPreset[]>([]);
  const [editing, setEditing] = useState<CustomPreset | null>(null);

  const refresh = () => setList(listCustomPresets());

  useEffect(() => {
    refresh();
  }, []);

  const handleAddNew = () => {
    if (list.length >= CUSTOM_PRESET_LIMIT) {
      alert(`カスタムプリセットは最大${CUSTOM_PRESET_LIMIT}個までです`);
      return;
    }
    const now = Date.now();
    setEditing({
      ...DEFAULT_NEW_PRESET,
      id: "", // empty = new
      createdAt: now,
      updatedAt: now,
    });
  };

  const handleSave = () => {
    if (!editing) return;
    if (!editing.label.trim()) {
      alert("プリセット名は必須です");
      return;
    }
    const now = Date.now();
    const next = [...list];
    if (editing.id) {
      // 既存編集
      const idx = next.findIndex((p) => p.id === editing.id);
      if (idx >= 0) {
        next[idx] = { ...editing, updatedAt: now };
      }
    } else {
      // 新規追加
      if (next.length >= CUSTOM_PRESET_LIMIT) {
        alert(`最大${CUSTOM_PRESET_LIMIT}個までです`);
        return;
      }
      next.unshift({ ...editing, id: genPresetId(), createdAt: now, updatedAt: now });
    }
    saveCustomPresets(next);
    refresh();
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("このプリセットを削除しますか？")) return;
    saveCustomPresets(list.filter((p) => p.id !== id));
    refresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div>
            <div className="text-base font-bold text-neutral-900">⚙️ 用途プリセット管理</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              イベント・店舗・部署ごとに項目名を自由にカスタマイズ。最大{CUSTOM_PRESET_LIMIT}個追加できます（現在 {list.length}個）
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 text-xl leading-none w-8 h-8 rounded hover:bg-neutral-100"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {editing ? (
            <PresetEditor
              value={editing}
              onChange={setEditing}
              onCancel={() => setEditing(null)}
              onSave={handleSave}
              isNew={!editing.id}
            />
          ) : (
            <>
              {/* デフォルトプリセット説明 */}
              <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                <div className="text-[11px] font-bold text-neutral-700 mb-1.5">
                  📌 デフォルトプリセット（編集不可）
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.entries(USECASE_PRESETS) as ["business" | "shop" | "community" | "custom", PresetConfig][]).map(([id, p]) => (
                    <div key={id} className="flex items-start gap-1.5 p-1.5 rounded bg-white border border-neutral-200">
                      <span className="text-sm">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-neutral-800">{p.label}</div>
                        <div className="text-[9px] text-neutral-500 truncate">{p.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-neutral-500 mt-1.5">
                  ↑デフォルトは固定。下のカスタムで自由な項目名を作れます
                </div>
              </div>

              {/* カスタムプリセット一覧 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-neutral-700">
                    ✨ カスタムプリセット（{list.length}/{CUSTOM_PRESET_LIMIT}）
                  </div>
                  <button
                    type="button"
                    onClick={handleAddNew}
                    disabled={list.length >= CUSTOM_PRESET_LIMIT}
                    className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white font-semibold disabled:bg-neutral-300"
                  >
                    + 新規追加
                  </button>
                </div>

                {list.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500">
                    まだカスタムプリセットがありません。<br />
                    <span className="text-[11px]">「+ 新規追加」から作成できます</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {list.map((p) => (
                      <div key={p.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                        <div className="flex items-start gap-2">
                          <div
                            className="w-10 h-10 rounded-md flex items-center justify-center text-lg shrink-0"
                            style={{ backgroundColor: `${p.color}20`, color: p.color }}
                          >
                            {p.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-neutral-900">{p.label}</div>
                            {p.description && (
                              <div className="text-[10px] text-neutral-500">{p.description}</div>
                            )}
                            <div className="mt-1.5 flex flex-wrap gap-1 text-[9px]">
                              <span className="px-1.5 py-0.5 rounded bg-neutral-100">主: {p.labels.name}</span>
                              <span className="px-1.5 py-0.5 rounded bg-neutral-100">補助: {p.labels.kana}</span>
                              <span className="px-1.5 py-0.5 rounded bg-neutral-100">所属: {p.labels.affiliation}</span>
                              <span className="px-1.5 py-0.5 rounded bg-neutral-100">役職: {p.labels.title}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => onApply(p)}
                            className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-600 text-white font-semibold"
                          >
                            ✓ このプリセットを使う
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(p)}
                            className="text-[11px] px-2.5 py-1 rounded-md border border-neutral-300 bg-white"
                          >
                            ✏️ 編集
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="text-[11px] px-2.5 py-1 rounded-md border border-neutral-200 text-red-600 bg-white hover:bg-red-50"
                          >
                            🗑 削除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-3 border-t border-neutral-200 bg-neutral-50 text-[10px] text-neutral-500">
          🔒 プリセットはあなたのブラウザのみに保存されます（外部送信なし）
        </div>
      </div>
    </div>
  );
}

function PresetEditor({
  value,
  onChange,
  onCancel,
  onSave,
  isNew,
}: {
  value: CustomPreset;
  onChange: (v: CustomPreset) => void;
  onCancel: () => void;
  onSave: () => void;
  isNew: boolean;
}) {
  const set = (patch: Partial<CustomPreset>) => onChange({ ...value, ...patch });
  const setLabel = (patch: Partial<FieldLabels>) => onChange({ ...value, labels: { ...value.labels, ...patch } });
  const setVisible = (patch: Partial<VisibleFields>) => onChange({ ...value, visible: { ...value.visible, ...patch } });

  return (
    <div className="space-y-3">
      <div className="text-sm font-bold text-neutral-900">
        {isNew ? "➕ 新規プリセット作成" : "✏️ プリセット編集"}
      </div>

      {/* 基本情報 */}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[10px] font-bold text-neutral-700">プリセット名 *</span>
          <input
            type="text"
            value={value.label}
            onChange={(e) => set({ label: e.target.value })}
            placeholder="例: 春のオフ会2026"
            className="w-full mt-0.5 px-2 py-1.5 rounded border border-neutral-300 text-xs"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold text-neutral-700">絵文字</span>
          <input
            type="text"
            value={value.emoji}
            onChange={(e) => set({ emoji: e.target.value })}
            placeholder="例: 🎉"
            maxLength={4}
            className="w-full mt-0.5 px-2 py-1.5 rounded border border-neutral-300 text-xs"
          />
        </label>
        <label className="block col-span-2">
          <span className="text-[10px] font-bold text-neutral-700">説明（任意）</span>
          <input
            type="text"
            value={value.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="どんな時に使うプリセットか"
            className="w-full mt-0.5 px-2 py-1.5 rounded border border-neutral-300 text-xs"
          />
        </label>
        <label className="block col-span-2">
          <span className="text-[10px] font-bold text-neutral-700">メインカラー</span>
          <div className="flex items-center gap-2 mt-0.5">
            <input
              type="color"
              value={value.color}
              onChange={(e) => set({ color: e.target.value })}
              className="w-10 h-8 rounded border border-neutral-300 cursor-pointer"
            />
            <span className="text-[10px] font-mono text-neutral-600">{value.color}</span>
          </div>
        </label>
      </div>

      {/* 項目ラベル */}
      <div className="rounded-lg bg-emerald-50/40 border border-emerald-200 p-3 space-y-2">
        <div className="text-[11px] font-bold text-neutral-900">📝 項目名（このプリセットで使う呼び方）</div>
        <div className="text-[10px] text-neutral-600">
          例: オフ会なら「氏名」→「ハンドルネーム」、店舗なら「所属」→「店舗名」など
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[10px] text-neutral-700">主表示（大きく表示する名前）</span>
            <input
              type="text"
              value={value.labels.name}
              onChange={(e) => setLabel({ name: e.target.value })}
              placeholder="氏名"
              className="w-full mt-0.5 px-2 py-1 rounded border border-neutral-300 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[10px] text-neutral-700">補助テキスト</span>
            <input
              type="text"
              value={value.labels.kana}
              onChange={(e) => setLabel({ kana: e.target.value })}
              placeholder="ふりがな・ハンドルネーム"
              className="w-full mt-0.5 px-2 py-1 rounded border border-neutral-300 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[10px] text-neutral-700">所属（左下）</span>
            <input
              type="text"
              value={value.labels.affiliation}
              onChange={(e) => setLabel({ affiliation: e.target.value })}
              placeholder="部署・店舗・趣味分野"
              className="w-full mt-0.5 px-2 py-1 rounded border border-neutral-300 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[10px] text-neutral-700">役職（右下バッジ）</span>
            <input
              type="text"
              value={value.labels.title}
              onChange={(e) => setLabel({ title: e.target.value })}
              placeholder="役職・担当・分野"
              className="w-full mt-0.5 px-2 py-1 rounded border border-neutral-300 text-xs"
            />
          </label>
        </div>
      </div>

      {/* 表示項目 */}
      <div className="rounded-lg bg-amber-50/40 border border-amber-200 p-3 space-y-2">
        <div className="text-[11px] font-bold text-neutral-900">👁 表示する項目（デフォルト）</div>
        <div className="grid grid-cols-2 gap-1">
          {(
            [
              { key: "kana", label: "補助テキスト" },
              { key: "affiliation", label: "所属" },
              { key: "title", label: "役職" },
              { key: "qr", label: "QRコード" },
              { key: "eventName", label: "イベント名" },
              { key: "eventDate", label: "日付" },
              { key: "logo", label: "ロゴ" },
            ] as { key: keyof VisibleFields; label: string }[]
          ).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-1.5 text-[11px] cursor-pointer">
              <input
                type="checkbox"
                checked={value.visible[key]}
                onChange={(e) => setVisible({ [key]: e.target.checked } as Partial<VisibleFields>)}
                className="accent-amber-600"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-md border border-neutral-300 bg-white"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={onSave}
          className="text-sm px-4 py-1.5 rounded-md bg-emerald-600 text-white font-semibold"
        >
          {isNew ? "✓ 作成" : "✓ 保存"}
        </button>
      </div>
    </div>
  );
}

// === Snapshot Modal =========================================================

function SnapshotModal({
  onClose,
  onSave,
  onLoad,
  currentLabel,
}: {
  onClose: () => void;
  onSave: (label: string) => Promise<void>;
  onLoad: (snap: NametagSnapshot) => void;
  currentLabel: string;
}) {
  const [list, setList] = useState<NametagSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState(currentLabel);

  const refresh = async () => {
    setLoading(true);
    try {
      setList(await listSnapshots());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSave = async () => {
    const trimmed = label.trim();
    if (!trimmed) {
      alert("保存名を入力してください");
      return;
    }
    await onSave(trimmed);
    await refresh();
  };

  const handleDelete = async (id: string, lbl: string) => {
    if (!confirm(`「${lbl}」を削除しますか？`)) return;
    await deleteSnapshot(id);
    await refresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div>
            <div className="text-base font-bold text-neutral-900">📂 名札の保存・履歴</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              過去の作成データを呼び出し再編集。最大{SNAPSHOT_LIMIT}件まで保存（古いものから自動削除）
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 text-xl leading-none w-8 h-8 rounded hover:bg-neutral-100"
          >
            ×
          </button>
        </div>

        <div className="p-4 border-b border-neutral-100 bg-emerald-50/30">
          <div className="text-[11px] font-bold text-neutral-900 mb-1.5">💾 現在の作成を保存</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例: 第3回オフ会用"
              className="flex-1 px-3 py-1.5 rounded-md border border-emerald-300 text-xs"
            />
            <button
              type="button"
              onClick={handleSave}
              className="text-xs px-4 py-1.5 rounded-md bg-emerald-600 text-white font-semibold"
            >
              保存
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="text-[11px] font-bold text-neutral-900 mb-2">
            📋 保存済みデータ（{list.length}件）
          </div>
          {loading ? (
            <div className="text-center text-sm text-neutral-500 py-4">読み込み中…</div>
          ) : list.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
              保存履歴がまだありません
            </div>
          ) : (
            <div className="space-y-1.5">
              {list.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 p-2.5 rounded-md border border-neutral-200 hover:border-emerald-400 transition bg-white"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-neutral-900 truncate">{s.label}</div>
                    <div className="text-[10px] text-neutral-500">
                      {s.peopleCount}名 · {s.templateId} ·{" "}
                      {new Date(s.updatedAt).toLocaleString("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onLoad(s)}
                    className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                  >
                    開く
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id, s.label)}
                    className="text-neutral-400 hover:text-red-600 text-base"
                    title="削除"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// === Back side preview ======================================================

function NametagBackPreview({
  person,
  data,
  qrDataUrl,
}: {
  person: Person;
  data: NametagData;
  qrDataUrl?: string;
}) {
  return (
    <div
      className="overflow-hidden border border-neutral-200 shadow-sm bg-white"
      style={{
        width: `${TAG_W_MM}mm`,
        height: `${TAG_H_MM}mm`,
        position: "relative",
      }}
    >
      <NametagBack person={person} data={data} qrDataUrl={qrDataUrl} />
    </div>
  );
}

/**
 * グループカラー解決
 * groupMode === "off": undefined（個人別 or メイン優先）
 * groupMode === "manual": person.group → groupColors[group]
 * groupMode === "auto":   person.affiliation → autoGroupColors[aff] or インデックスで自動割当
 */
function resolveGroupColor(data: NametagData, person: Person): string | undefined {
  if (!data.groupMode || data.groupMode === "off") return undefined;
  if (data.groupMode === "manual" && person.group) {
    return data.groupColors?.[person.group] ?? NAMETAG_GROUP_COLORS[person.group];
  }
  if (data.groupMode === "auto") {
    const key = person.affiliation || "（未分類）";
    const explicit = data.autoGroupColors?.[key];
    if (explicit) return explicit;
    const affs = Array.from(new Set(data.people.map((p) => p.affiliation || "（未分類）")));
    const idx = affs.indexOf(key);
    if (idx >= 0) return Object.values(NAMETAG_GROUP_COLORS)[idx % 6];
  }
  return undefined;
}

function NametagBack({
  person,
  data,
  qrDataUrl,
}: {
  person: Person;
  data: NametagData;
  qrDataUrl?: string;
}) {
  // 優先順位: グループ機能ON時はグループカラー > 裏面メインカラー > 表面メインカラー
  //          グループ機能OFF時は: 個人別カラー > 裏面メインカラー > 表面メインカラー
  const groupColor = resolveGroupColor(data, person);
  const backMain = data.backMainColor && data.backMainColor.trim() ? data.backMainColor : data.mainColor;
  const c = groupColor
    ? groupColor
    : (person.color && person.color.trim()) ? person.color : backMain;
  const layout = data.backLayout;

  if (layout === "qr-large") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="QR" style={{ width: "40mm", height: "40mm" }} />
        ) : (
          <div className="text-[9pt] text-neutral-400 text-center px-4">
            QR用URLを入力すると<br />ここに大きく表示されます
          </div>
        )}
      </div>
    );
  }

  if (layout === "url-text") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-[6mm] text-center bg-white">
        {data.backText && (
          <div className="text-[10pt] mb-[3mm]" style={{ color: c, fontWeight: 600 }}>
            {data.backText}
          </div>
        )}
        <div className="text-[8pt] tracking-[0.1em] break-all" style={{ color: "#404040" }}>
          {person.url || "（URL未入力）"}
        </div>
        {qrDataUrl && (
          <img src={qrDataUrl} alt="QR" className="mt-[3mm]" style={{ width: "18mm", height: "18mm" }} />
        )}
      </div>
    );
  }

  if (layout === "logo-center") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white">
        {data.logoDataUrl ? (
          <img src={data.logoDataUrl} alt="logo" style={{ maxWidth: "60mm", maxHeight: "35mm", objectFit: "contain" }} />
        ) : (
          <div className="text-[9pt] text-neutral-400">ロゴ未設定</div>
        )}
      </div>
    );
  }

  if (layout === "free-text") {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-[6mm] text-center" style={{ backgroundColor: c, color: "#fff" }}>
        <div
          className="leading-[1.4]"
          style={{
            fontSize: data.backText.length < 20 ? "16pt" : data.backText.length < 50 ? "11pt" : "9pt",
            fontWeight: 600,
            whiteSpace: "pre-wrap",
          }}
        >
          {data.backText || "（裏面テキスト未入力）"}
        </div>
      </div>
    );
  }

  // === メモ用デザイン 4種 ============================================
  // メモのタイトルテキストを決定（優先順位: 作成者が入力したカスタムタイトル > 名前 > "MEMO"）
  // 名前を表示するかどうかは backMemoShowName で制御（デフォルト true）
  const memoShowName = data.backMemoShowName !== false;
  const memoCustomTitle = (data.backMemoTitle ?? "").trim();
  const memoTitle = memoCustomTitle || (memoShowName ? person.name : "") || "MEMO";
  const memoHasName = memoShowName || !!memoCustomTitle;

  if (layout === "memo-lined") {
    // 罫線メモ（横線あり）
    return (
      <div className="absolute inset-0 bg-white p-[3mm]">
        {memoHasName && (
          <div className="text-[7pt] font-bold pb-[1mm] mb-[1.5mm]" style={{ color: c, borderBottom: `0.3mm solid ${c}` }}>
            {memoTitle}
          </div>
        )}
        <div
          style={{
            backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 4.5mm, ${c}40 4.5mm, ${c}40 4.7mm)`,
            height: memoHasName ? "calc(100% - 7mm)" : "100%",
          }}
        />
      </div>
    );
  }

  if (layout === "memo-grid") {
    // 方眼メモ（5mmグリッド）
    return (
      <div className="absolute inset-0 bg-white p-[2mm]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `repeating-linear-gradient(to right, ${c}30, ${c}30 0.15mm, transparent 0.15mm, transparent 5mm), repeating-linear-gradient(to bottom, ${c}30, ${c}30 0.15mm, transparent 0.15mm, transparent 5mm)`,
            border: `0.2mm solid ${c}60`,
          }}
        />
        {memoHasName && (
          <div
            className="absolute top-[2.5mm] left-[3mm] text-[6.5pt] font-bold tracking-[0.1em] uppercase px-[1mm]"
            style={{ color: c, backgroundColor: "#ffffff" }}
          >
            {memoTitle}
          </div>
        )}
      </div>
    );
  }

  if (layout === "memo-blank") {
    // フリーメモ（無地・コーナーアクセント）
    return (
      <div className="absolute inset-0 bg-white">
        <div className="absolute" style={{ top: "2mm", left: "2mm", width: "3mm", height: "0.4mm", backgroundColor: c }} />
        <div className="absolute" style={{ top: "2mm", left: "2mm", width: "0.4mm", height: "3mm", backgroundColor: c }} />
        <div className="absolute" style={{ top: "2mm", right: "2mm", width: "3mm", height: "0.4mm", backgroundColor: c }} />
        <div className="absolute" style={{ top: "2mm", right: "2mm", width: "0.4mm", height: "3mm", backgroundColor: c }} />
        <div className="absolute" style={{ bottom: "2mm", left: "2mm", width: "3mm", height: "0.4mm", backgroundColor: c }} />
        <div className="absolute" style={{ bottom: "2mm", left: "2mm", width: "0.4mm", height: "3mm", backgroundColor: c }} />
        <div className="absolute" style={{ bottom: "2mm", right: "2mm", width: "3mm", height: "0.4mm", backgroundColor: c }} />
        <div className="absolute" style={{ bottom: "2mm", right: "2mm", width: "0.4mm", height: "3mm", backgroundColor: c }} />
        {memoHasName && (
          <div className="absolute top-[3.5mm] left-[7mm] text-[6.5pt] tracking-[0.2em] uppercase" style={{ color: "#a3a3a3" }}>
            {memoTitle}
          </div>
        )}
        <div className="absolute left-[7mm] right-[7mm] bottom-[3.5mm] text-[6.5pt] text-center tracking-[0.3em] uppercase" style={{ color: "#a3a3a3" }}>
          MEMO
        </div>
      </div>
    );
  }

  if (layout === "memo-titled") {
    // タイトル付きメモ（カラーヘッダー + 罫線）
    return (
      <div className="absolute inset-0 bg-white flex flex-col">
        <div className="px-[3mm] py-[1.5mm] flex items-center justify-between" style={{ backgroundColor: c, color: "#ffffff" }}>
          <div className="text-[7.5pt] font-bold tracking-[0.1em]">{memoTitle}</div>
          {data.eventDate && <div className="text-[6pt] opacity-90">{data.eventDate}</div>}
        </div>
        <div className="flex-1 px-[2mm] py-[1mm]">
          <div
            style={{
              backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 4mm, ${c}30 4mm, ${c}30 4.2mm)`,
              height: "100%",
            }}
          />
        </div>
      </div>
    );
  }

  if (layout === "custom-bg") {
    const ov = data.backOverlay ?? { qr: false, freeText: false, logo: false, name: false, customText: "" };
    return (
      <div className="absolute inset-0 bg-white">
        {data.backCustomBgDataUrl ? (
          <img src={data.backCustomBgDataUrl} alt="back-bg" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[9pt] text-neutral-400">
            裏面画像未設定
          </div>
        )}
        {/* レイヤー要素 — カスタム背景の上に重ねる */}
        {ov.name && (
          <div
            className="absolute font-bold leading-[1.05] text-center"
            style={{
              left: "50%",
              top: "30%",
              transform: "translate(-50%, -50%)",
              fontSize: "20pt",
              color: "#fff",
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}
          >
            {person.name || "(氏名)"}
          </div>
        )}
        {ov.freeText && (person.freeText || ov.customText || data.backText) && (
          <div
            className="absolute text-center"
            style={{
              left: "50%",
              top: "55%",
              transform: "translate(-50%, -50%)",
              fontSize: "10pt",
              color: "#fff",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              backgroundColor: "rgba(0,0,0,0.35)",
              padding: "1.5mm 3mm",
              borderRadius: "1.5mm",
              maxWidth: "70%",
            }}
          >
            {person.freeText || ov.customText || data.backText}
          </div>
        )}
        {ov.logo && data.logoDataUrl && (
          <img
            src={data.logoDataUrl}
            alt="logo"
            style={{
              position: "absolute",
              left: "3mm",
              top: "3mm",
              maxWidth: "20mm",
              maxHeight: "10mm",
              objectFit: "contain",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
            }}
          />
        )}
        {ov.qr && qrDataUrl && (
          <img
            src={qrDataUrl}
            alt="QR"
            style={{
              position: "absolute",
              right: "3mm",
              bottom: "3mm",
              width: "16mm",
              height: "16mm",
              backgroundColor: "#fff",
              padding: "0.5mm",
              borderRadius: "1mm",
            }}
          />
        )}
      </div>
    );
  }

  return null;
}

// === Roster (Address Book) Modal ============================================

const SHEET_URL_KEY = "nametag-wizard:v1:sheetUrl";
const SHEET_AUTOSYNC_KEY = "nametag-wizard:v1:sheetAutoSync";
const SHEET_LASTSYNC_KEY = "nametag-wizard:v1:sheetLastSync";

/**
 * Convert a Google Sheets edit/share URL into a direct CSV export URL.
 *
 * Accepts:
 *  - https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=GID
 *  - https://docs.google.com/spreadsheets/d/SHEET_ID/edit?gid=GID
 *  - https://docs.google.com/spreadsheets/d/SHEET_ID/...
 *  - already-export URLs are returned as-is
 *
 * Returns null if the URL doesn't look like a Google Sheets URL.
 */
function googleSheetCsvUrl(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (s.includes("export?format=csv") || s.includes("output=csv")) return s;
  const m = s.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) return null;
  const sheetId = m[1];
  const gidMatch = s.match(/[#?&]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

type RosterPickInput = {
  name: string;
  kana: string;
  affiliation: string;
  title: string;
  url?: string;
};

function RosterModal({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (picked: RosterPickInput[]) => void;
  currentPeople: RosterPickInput[];
}) {
  const [list, setList] = useState<RosterPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<RosterPerson | null>(null);
  const [tab, setTab] = useState<"list" | "sheet">("list");
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetSyncing, setSheetSyncing] = useState(false);
  const [sheetMessage, setSheetMessage] = useState<string>("");
  const [autoSync, setAutoSync] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const all = await listRoster();
      setList(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(SHEET_URL_KEY);
      if (saved) setSheetUrl(saved);
      const auto = window.localStorage.getItem(SHEET_AUTOSYNC_KEY);
      if (auto === "1") setAutoSync(true);
      const last = window.localStorage.getItem(SHEET_LASTSYNC_KEY);
      if (last) setLastSync(parseInt(last, 10));
    }
  }, []);

  const filtered = list.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.kana.toLowerCase().includes(q) ||
      p.affiliation.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      (p.group ?? "").toLowerCase().includes(q)
    );
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const handlePick = () => {
    const picked = list.filter((p) => selected.has(p.id));
    if (picked.length === 0) {
      alert("取り込む人を選んでください");
      return;
    }
    onPick(
      picked.map((p) => ({
        name: p.name,
        kana: p.kana,
        affiliation: p.affiliation,
        title: p.title,
        url: p.url,
      })),
    );
  };

  const handleAddNew = () => {
    setEditing({
      id: "",
      name: "",
      kana: "",
      affiliation: "",
      title: "",
      url: "",
      group: "",
      note: "",
      createdAt: 0,
      updatedAt: 0,
    });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      alert("氏名は必須です");
      return;
    }
    try {
      if (editing.id) {
        await updateRosterPerson(editing.id, {
          name: editing.name,
          kana: editing.kana,
          affiliation: editing.affiliation,
          title: editing.title,
          url: editing.url,
          group: editing.group,
          note: editing.note,
        });
      } else {
        await addRosterPerson({
          name: editing.name,
          kana: editing.kana,
          affiliation: editing.affiliation,
          title: editing.title,
          url: editing.url,
          group: editing.group,
          note: editing.note,
        });
      }
      setEditing(null);
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "保存に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この人を保存名簿から削除しますか？")) return;
    await deleteRosterPerson(id);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    await refresh();
  };

  const handleClearAll = async () => {
    if (!confirm(`保存名簿の全${list.length}名をすべて削除しますか？この操作は取り消せません`)) return;
    await clearRoster();
    setSelected(new Set());
    await refresh();
  };

  const handleExportCsv = async () => {
    const csv = await exportRosterCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roster-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const syncFromSheet = async (silent = false) => {
    if (!silent) setSheetMessage("");
    if (!sheetUrl.trim()) {
      if (!silent) setSheetMessage("⚠ Googleスプレッドシートのリンクを貼ってください");
      return;
    }
    setSheetSyncing(true);
    try {
      // 共通の fetchSheetRows を使い、複数 URL 形式へのフォールバックと
      // 詳細エラーメッセージの恩恵を受ける。
      const result = await fetchSheetRowsShared(sheetUrl);
      if (!result.ok || !result.rows) {
        throw new Error(result.error || "シート取得に失敗しました");
      }
      const records = result.rows.map((cols) => {
        return {
          name: cols[0] || "",
          kana: cols[1] || "",
          affiliation: cols[2] || "",
          title: cols[3] || "",
          url: cols[4] || "",
          group: cols[5] || "Sheet同期",
          note: cols[6] || "",
        };
      }).filter((r) => r.name);
      if (records.length === 0) {
        throw new Error("有効な行がありません（1列目=氏名は必須）");
      }
      // 重複検出（氏名+所属の組み合わせで既存をチェック）
      const existing = await listRoster();
      const existingKeys = new Set(
        existing.map((p) => `${p.name}|${p.affiliation}`),
      );
      const fresh = records.filter(
        (r) => !existingKeys.has(`${r.name}|${r.affiliation}`),
      );
      if (fresh.length === 0) {
        const now = Date.now();
        window.localStorage.setItem(SHEET_LASTSYNC_KEY, String(now));
        setLastSync(now);
        setSheetMessage(
          `✅ シートと同期しました（新規${0}名・既存${records.length}名）`,
        );
        return;
      }
      const addResult = await addManyRoster(fresh);
      window.localStorage.setItem(SHEET_URL_KEY, sheetUrl);
      const now = Date.now();
      window.localStorage.setItem(SHEET_LASTSYNC_KEY, String(now));
      setLastSync(now);
      setSheetMessage(
        addResult.skipped > 0
          ? `✅ ${addResult.added}名追加（${addResult.skipped}名は上限${ROSTER_LIMIT}名のため除外、既存${records.length - fresh.length}名はスキップ）`
          : `✅ 新規${addResult.added}名追加（既存${records.length - fresh.length}名はスキップ）`,
      );
      await refresh();
    } catch (e) {
      if (!silent) setSheetMessage(`❌ ${e instanceof Error ? e.message : "同期失敗"}`);
    } finally {
      setSheetSyncing(false);
    }
  };

  // 自動同期：モーダル開いた時 + 定期（5分間隔）+ ウィンドウフォーカス時
  useEffect(() => {
    if (!autoSync || !sheetUrl) return;
    // 開いた直後に1回同期
    syncFromSheet(true);
    // 5分間隔で同期
    const intervalId = setInterval(() => {
      syncFromSheet(true);
    }, 5 * 60 * 1000);
    // ウィンドウがフォーカス戻ったタイミングでも同期
    const onFocus = () => syncFromSheet(true);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync, sheetUrl]);

  const toggleAutoSync = () => {
    const next = !autoSync;
    if (next && !sheetUrl.trim()) {
      alert("先にシートのURLを貼り付けて、一度同期してください");
      return;
    }
    setAutoSync(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SHEET_AUTOSYNC_KEY, next ? "1" : "0");
    }
  };

  const formatLastSync = (ts: number | null): string => {
    if (!ts) return "未同期";
    const diff = Date.now() - ts;
    if (diff < 60_000) return "たった今";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}分前`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}時間前`;
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div>
            <div className="text-base font-bold text-neutral-900">📇 保存名簿</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              この端末のブラウザに保存。最大{ROSTER_LIMIT}名（現在 {list.length}名）。完全無料・ネット不要。
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 text-xl leading-none w-8 h-8 rounded hover:bg-neutral-100"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-neutral-200 bg-neutral-50">
          <button
            type="button"
            onClick={() => setTab("list")}
            className={`text-xs px-3 py-1.5 rounded-md font-semibold ${
              tab === "list" ? "bg-white shadow-sm text-emerald-700" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            👥 名簿一覧（{list.length}）
          </button>
          <button
            type="button"
            onClick={() => setTab("sheet")}
            className={`text-xs px-3 py-1.5 rounded-md font-semibold ${
              tab === "sheet" ? "bg-white shadow-sm text-emerald-700" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            🔗 Googleスプレッドシート連携
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4">
          {tab === "list" && (
            <>
              {editing ? (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-neutral-900">
                    {editing.id ? "✏️ 編集" : "➕ 新規追加"}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      label="氏名 *"
                      value={editing.name}
                      onChange={(v) => setEditing({ ...editing, name: v })}
                      placeholder="山田 太郎"
                    />
                    <FormField
                      label="ふりがな"
                      value={editing.kana}
                      onChange={(v) => setEditing({ ...editing, kana: v })}
                      placeholder="やまだ たろう"
                    />
                    <FormField
                      label="所属"
                      value={editing.affiliation}
                      onChange={(v) => setEditing({ ...editing, affiliation: v })}
                      placeholder="営業部"
                    />
                    <FormField
                      label="役職"
                      value={editing.title}
                      onChange={(v) => setEditing({ ...editing, title: v })}
                      placeholder="リーダー"
                    />
                    <FormField
                      label="QR用URL"
                      value={editing.url ?? ""}
                      onChange={(v) => setEditing({ ...editing, url: v })}
                      placeholder="https://..."
                    />
                    <FormField
                      label="グループ"
                      value={editing.group ?? ""}
                      onChange={(v) => setEditing({ ...editing, group: v })}
                      placeholder="例: 営業 / 店員"
                    />
                  </div>
                  <FormField
                    label="メモ"
                    value={editing.note ?? ""}
                    onChange={(v) => setEditing({ ...editing, note: v })}
                    placeholder="任意"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="text-xs px-3 py-1.5 rounded-md border border-neutral-300 bg-white"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white font-semibold"
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Tools */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="🔍 氏名・所属で検索"
                      className="flex-1 min-w-[150px] px-3 py-1.5 rounded-md border border-neutral-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddNew}
                      disabled={list.length >= ROSTER_LIMIT}
                      className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white font-semibold disabled:bg-neutral-300"
                    >
                      ➕ 新規追加
                    </button>
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      disabled={list.length === 0}
                      className="text-xs px-3 py-1.5 rounded-md border border-neutral-300 bg-white disabled:opacity-50"
                      title="バックアップ用CSVをダウンロード"
                    >
                      📥 CSVバックアップ
                    </button>
                    {list.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-xs px-2 py-1.5 rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50"
                      >
                        全削除
                      </button>
                    )}
                  </div>

                  {/* List */}
                  {loading ? (
                    <div className="text-center text-sm text-neutral-500 py-8">読み込み中…</div>
                  ) : filtered.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-neutral-200 p-8 text-center">
                      <div className="text-sm text-neutral-500 mb-2">
                        {list.length === 0 ? "保存名簿はまだ空です" : "検索結果なし"}
                      </div>
                      {list.length === 0 && (
                        <div className="text-[11px] text-neutral-500">
                          「➕ 新規追加」または「🔗 Googleスプレッドシート連携」から登録できます
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-2 py-1 text-[10px] text-neutral-500 border-b border-neutral-200">
                        <input
                          type="checkbox"
                          checked={selected.size === filtered.length && filtered.length > 0}
                          onChange={toggleAll}
                          className="accent-emerald-600"
                        />
                        <span>全選択 ({selected.size} / {filtered.length})</span>
                      </div>
                      {filtered.map((p) => {
                        const isSel = selected.has(p.id);
                        return (
                          <div
                            key={p.id}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md border ${
                              isSel ? "border-emerald-400 bg-emerald-50/50" : "border-transparent hover:bg-neutral-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSel}
                              onChange={() => toggle(p.id)}
                              className="accent-emerald-600 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-neutral-900 truncate">
                                {p.name}
                                {p.kana && (
                                  <span className="ml-2 text-[10px] text-neutral-500 font-normal">
                                    {p.kana}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-neutral-500 truncate">
                                {p.affiliation}
                                {p.affiliation && p.title ? " / " : ""}
                                {p.title}
                                {p.group && (
                                  <span className="ml-2 px-1 py-0.5 rounded bg-neutral-100 text-neutral-600 text-[9px]">
                                    {p.group}
                                  </span>
                                )}
                                {p.url && (
                                  <span className="ml-1 text-emerald-600 text-[9px]">QR✓</span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditing(p)}
                              className="text-[10px] text-neutral-500 hover:text-emerald-700 px-1"
                              title="編集"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id)}
                              className="text-[10px] text-neutral-400 hover:text-red-600 px-1"
                              title="削除"
                            >
                              🗑
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {tab === "sheet" && (
            <div className="space-y-3">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-900 leading-relaxed">
                <strong>⚠️ 注意</strong>: シートを「リンクを知っている全員が閲覧可能」に設定する必要があります。社員名簿などプライベートデータには使わないでください。Excel/プライベート派は「📂 CSVファイル」を使ってください（Mac/Windows両対応）。
              </div>

              <div className="rounded-lg bg-white border border-emerald-200 p-3 space-y-2">
                <div className="text-xs font-bold text-neutral-900">📝 設定手順</div>
                <ol className="text-[11px] text-neutral-700 leading-relaxed space-y-1 list-decimal list-inside">
                  <li>Googleスプレッドシートを開く（列順: 氏名 / ふりがな / 所属 / 役職 / URL / グループ / メモ）</li>
                  <li>右上「共有」→ 「リンクを知っている全員が閲覧可能」に変更</li>
                  <li>シートのURLをコピーして下の欄に貼り付け</li>
                  <li>「🔄 シートから同期」をクリック</li>
                </ol>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  シートのURL
                </label>
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 text-xs font-mono"
                />
                <div className="text-[10px] text-neutral-500 mt-1">
                  💡 URLは次回も使えるようブラウザに保存されます（ローカル）
                </div>
              </div>

              <div className="flex gap-2 items-center flex-wrap">
                <button
                  type="button"
                  onClick={() => syncFromSheet(false)}
                  disabled={sheetSyncing || !sheetUrl.trim()}
                  className="text-sm px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold disabled:bg-neutral-300"
                >
                  {sheetSyncing ? "同期中…" : "🔄 今すぐ同期"}
                </button>
                {sheetUrl && (
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-neutral-600 hover:text-emerald-700 underline"
                  >
                    シートを開く ↗
                  </a>
                )}
              </div>

              {/* Auto-sync toggle */}
              <div className="rounded-lg bg-emerald-50/40 border border-emerald-200 p-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={toggleAutoSync}
                    className="accent-emerald-600 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-neutral-900">
                      🤖 自動同期する（おすすめ）
                    </div>
                    <div className="text-[10px] text-neutral-600 leading-relaxed mt-0.5">
                      モーダルを開いた時・ウィンドウフォーカスした時・5分ごとに自動でシートから取込。重複する人は自動でスキップ。
                    </div>
                  </div>
                </label>
                {autoSync && (
                  <div className="mt-2 pl-6 text-[10px] text-emerald-700">
                    ✓ 自動同期：オン　／　最終同期: <strong>{formatLastSync(lastSync)}</strong>
                  </div>
                )}
              </div>

              {sheetMessage && (
                <div
                  className={`text-xs p-2 rounded-md border ${
                    sheetMessage.startsWith("✅")
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : sheetMessage.startsWith("❌")
                        ? "bg-red-50 border-red-200 text-red-900"
                        : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  {sheetMessage}
                </div>
              )}

              <details className="text-[11px] text-neutral-600">
                <summary className="cursor-pointer hover:text-emerald-700 font-semibold">
                  📊 Excel・OneDriveから取り込む方法
                </summary>
                <div className="pt-2 pl-4 leading-relaxed space-y-1">
                  <div>① Excelで「ファイル → 名前を付けて保存 → CSV (UTF-8) (.csv)」</div>
                  <div>② 名簿一覧タブに戻り → 名札画面の「📥 Excel・スプレッドシートから取込」</div>
                  <div>③ 「📂 CSVファイルを選ぶ」で読み込み</div>
                  <div className="text-neutral-500">Windows / Mac どちらでも同じ手順で動作します</div>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === "list" && !editing && (
          <div className="flex items-center justify-between gap-2 p-4 border-t border-neutral-200 bg-neutral-50">
            <div className="text-[11px] text-neutral-600">
              {selected.size > 0 ? `${selected.size}名選択中` : "取り込みたい人にチェック"}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs px-3 py-1.5 rounded-md border border-neutral-300 bg-white"
              >
                閉じる
              </button>
              <button
                type="button"
                onClick={handlePick}
                disabled={selected.size === 0}
                className="text-sm px-4 py-1.5 rounded-md bg-emerald-600 text-white font-semibold disabled:bg-neutral-300"
              >
                ✓ {selected.size}名を名札に取り込む
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold text-neutral-700 block mb-0.5">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 rounded border border-neutral-300 text-xs focus:border-emerald-400 focus:outline-none"
      />
    </label>
  );
}

// === Templates ==============================================================

function NametagBody({
  person,
  data,
  qrDataUrl,
  frontQrOverlay,
}: {
  person: Person;
  data: NametagData;
  sizeMm: { w: number; h: number };
  qrDataUrl?: string;
  /** 表面QRオーバーレイ — frontQrOverride.enabled の時のみ渡される */
  frontQrOverlay?: { dataUrl: string; x: number; y: number; size: number };
}) {
  // カスタム背景レイヤー（表面）
  const bgLayer = data.customBgDataUrl ? (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${data.customBgDataUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 1,
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#ffffff",
          opacity: 1 - (data.customBgOpacity ?? 0.4),
          zIndex: 0,
        }}
      />
    </>
  ) : null;
  // テンプレモード時は freeLayoutGlobalScale を全体 zoom として当てる
  // （自由レイアウト時は内部レンダラー側で globalScale を反映するので二重適用しない）
  const useFreeLayoutMode =
    data.templateId === "free-layout" ||
    data.templateId === "custom-bg-only" ||
    data.freeLayoutEnabled === true;
  const globalScale = !useFreeLayoutMode ? (data.freeLayoutGlobalScale ?? 1) : 1;
  // テンプレ内の主要テキスト要素を「枠ギリギリまで改行しない」ようにする
  // CSSルール — 自由レイアウトレンダラーには既に whiteSpace: nowrap が適用されている
  // テンプレ内のイベント名要素の色を上書きするためのCSS rule
  // 各テンプレで eventName の親要素に color: c が当たっているため、強制上書きする
  const tc = data.textColors ?? {};
  const groupColorForTpl = resolveGroupColor(data, person);
  const evModeTpl = data.eventNameColorMode ?? "group";
  const eventNameColor =
    evModeTpl === "main"
      ? data.mainColor
      : evModeTpl === "custom"
        ? (tc.eventName || data.mainColor)
        : (groupColorForTpl || tc.eventName || "");
  const eventNameColorCss = eventNameColor && !useFreeLayoutMode
    ? `[data-nametag-text-overrides] [data-tag-eventname], [data-nametag-text-overrides] [data-tag-eventname] * { color: ${eventNameColor} !important; }`
    : "";
  const noWrapCss = !useFreeLayoutMode
    ? `
      [data-nametag-nowrap] > div > div > div { white-space: nowrap !important; }
      [data-nametag-nowrap] [class*="leading-tight"],
      [data-nametag-nowrap] [class*="leading-[1.0"],
      [data-nametag-nowrap] [class*="leading-[1.05"] { white-space: nowrap !important; overflow: visible !important; }
    `
    : "";
  return (
    <>
      {bgLayer}
      {noWrapCss && <style dangerouslySetInnerHTML={{ __html: noWrapCss }} />}
      {eventNameColorCss && <style dangerouslySetInnerHTML={{ __html: eventNameColorCss }} />}
      <div
        data-nametag-nowrap={!useFreeLayoutMode ? "" : undefined}
        data-nametag-text-overrides={!useFreeLayoutMode ? "" : undefined}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          // テンプレ時のみ全体 zoom を当てる（フォントサイズ・要素サイズ一括拡縮）
          ...(globalScale !== 1 ? { zoom: globalScale } : {}),
        }}
      >
        <NametagBodyInner person={person} data={data} qrDataUrl={qrDataUrl} hideTemplateQr={!!frontQrOverlay} />
      </div>
      {/* 表面QRオーバーレイ（一括位置・サイズ指定） */}
      {frontQrOverlay && (
        <img
          src={frontQrOverlay.dataUrl}
          alt="QR"
          style={{
            position: "absolute",
            left: `${frontQrOverlay.x}mm`,
            top: `${frontQrOverlay.y}mm`,
            width: `${frontQrOverlay.size}mm`,
            height: `${frontQrOverlay.size}mm`,
            backgroundColor: "#fff",
            padding: "0.3mm",
            borderRadius: "0.5mm",
            zIndex: 5,
          }}
        />
      )}
    </>
  );
}

function NametagBodyInner({
  person,
  data,
  qrDataUrl,
  hideTemplateQr,
}: {
  person: Person;
  data: NametagData;
  qrDataUrl?: string;
  /** 表面QRオーバーレイ使用時にテンプレ内のデフォルトQRを抑制 */
  hideTemplateQr?: boolean;
}) {
  const t = data.templateId;
  // 個人別カラーがあれば優先、なければ全体カラー
  // グループ機能ON時は個人別カラーを無視してグループカラーを使用
  const groupColor = resolveGroupColor(data, person);
  const c = groupColor
    ? groupColor
    : (person.color && person.color.trim()) ? person.color : data.mainColor;
  const v = data.visibleFields ?? {
    kana: true, affiliation: true, title: true, freeText: true, qr: true,
    eventName: true, eventDate: true, logo: true,
  };
  const name = person.name || "(氏名)";
  const kana = v.kana ? person.kana : "";
  const aff = v.affiliation ? person.affiliation : "";
  const title = v.title ? person.title : "";
  // イベント名はテンプレ設計に常に含めるため、可視性プリセットに関係なく
  // data.eventName を採用。未設定時は "NAMETAG" プレースホルダで slot を確保し、
  // 各テンプレでデザインの一部として常にイベント名表示エリアが見える状態にする。
  // (color-band / modern-sans の既存仕様に他テンプレを揃える。)
  const eventName = data.eventName || "NAMETAG";
  // イベント名の色 — モード3択（メイン / グループ / カスタム）。
  // 親要素の color を上書きするため、 span に inline color で指定する
  const tcForEvent = data.textColors ?? {};
  const groupColorForEvent = resolveGroupColor(data, person);
  const evMode = data.eventNameColorMode ?? "group";
  const eventNameColor =
    evMode === "main"
      ? data.mainColor // メインカラーと連動
      : evMode === "custom"
        ? (tcForEvent.eventName || data.mainColor) // カスタム指定（空ならメインフォールバック）
        : (groupColorForEvent || tcForEvent.eventName || "#737373"); // group: グループ→カスタム→グレー
  // イベント名は改行を反映してレンダリングする。CSSの white-space は
  // text-transform: uppercase と組み合わせると一部ブラウザで効きにくいので、
  // 明示的に <br /> で改行する。
  //
  // ラッパー span に inline color を指定して、親要素の color (テンプレ内の
  // メインカラー指定) を上書き。これによりメインカラー変更とは独立して
  // イベント名色を制御できる。
  const renderEventName = (text: string): React.ReactNode => {
    if (!text) return null;
    const lines = text.split(/\r?\n/);
    return (
      <span style={{ color: eventNameColor }} data-tag-eventname>
        {lines.map((line, i) => (
          <span key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </span>
    );
  };
  const eventDate = v.eventDate ? data.eventDate : "";
  // 個人別画像があれば優先、なければ共通ロゴ
  const logo = (person.imageDataUrl && person.imageDataUrl.length > 0)
    ? person.imageDataUrl
    : (v.logo ? data.logoDataUrl : "");
  // 表面QRオーバーレイ使用時はテンプレ内QRを非表示にする
  const showQr = !hideTemplateQr && v.qr ? qrDataUrl : undefined;

  // 項目別の文字色（ユーザー指定があれば優先、なければデフォルト）
  // イベント名はメインカラーとは独立（要件: 連動しない）
  //   - カスタム指定 > グループカラー（あれば）> 標準グレー
  const tc = data.textColors ?? {};
  const colorName = tc.name || "#171717";
  const colorKana = tc.kana || "#737373";
  const colorAffiliation = tc.affiliation || "#525252";
  const colorTitle = tc.title || c;
  const colorFreeText = tc.freeText || c;
  // colorEventName は上の renderEventName と同じ判定を保つ
  const evModeForVar = data.eventNameColorMode ?? "group";
  const colorEventName =
    evModeForVar === "main"
      ? data.mainColor
      : evModeForVar === "custom"
        ? (tc.eventName || data.mainColor)
        : (groupColor || tc.eventName || "#737373");

  if (t === "minimal") {
    return (
      <div
        className="absolute inset-0 flex flex-col"
        style={{ backgroundColor: "#ffffff", padding: "5mm" }}
      >
        {(eventName || logo) && (
          <div className="flex items-center justify-between" style={{ height: "8mm" }}>
            {eventName ? (
              <div className="text-[7pt] tracking-[0.2em] uppercase font-semibold" style={{ color: c }}>
                {renderEventName(eventName)}
              </div>
            ) : (
              <span />
            )}
            {logo && (
              <img src={logo} alt="logo" style={{ maxHeight: "7mm", maxWidth: "20mm", objectFit: "contain" }} />
            )}
          </div>
        )}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          {kana && (
            <div className="text-[8pt] tracking-[0.15em]" style={{ color: "#737373" }}>
              {kana}
            </div>
          )}
          <div
            className="font-bold leading-[1.05] tracking-[-0.01em]"
            style={{ fontSize: "26pt", color: "#171717" }}
          >
            {name}
          </div>
        </div>
        {(aff || title) && (
          <div className="flex items-center gap-[2mm] text-[9pt] pt-[1mm]" style={{ borderTop: `1px solid ${c}30`, color: "#404040" }}>
            {aff && <span>{aff}</span>}
            {title && (
              <span className="px-[1.5mm] py-[0.3mm] rounded text-[8pt]" style={{ backgroundColor: c, color: "#ffffff" }}>
                {title}
              </span>
            )}
          </div>
        )}
        {showQr && (
          <img
            src={showQr}
            alt="QR"
            style={{
              position: "absolute",
              right: "3mm",
              bottom: "3mm",
              width: "11mm",
              height: "11mm",
            }}
          />
        )}
        {eventDate && !showQr && (
          <div className="absolute right-[3mm] bottom-[2mm] text-[7pt]" style={{ color: "#a3a3a3" }}>
            {eventDate}
          </div>
        )}
      </div>
    );
  }

  if (t === "color-band") {
    return (
      <div className="absolute inset-0 flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <div
          className="flex items-center justify-between px-[4mm]"
          style={{ height: "10mm", backgroundColor: c, color: "#ffffff" }}
        >
          <div className="text-[8pt] tracking-[0.2em] font-bold uppercase truncate">
            {eventName ? renderEventName(eventName) : "NAMETAG"}
          </div>
          {logo && (
            <img src={logo} alt="logo" style={{ maxHeight: "7mm", maxWidth: "20mm", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center px-[5mm]">
          {kana && (
            <div className="text-[8pt]" style={{ color: "#737373" }}>
              {kana}
            </div>
          )}
          <div
            className="font-bold leading-[1.05]"
            style={{ fontSize: "24pt", color: "#171717" }}
          >
            {name}
          </div>
          {(aff || title) && (
            <div className="text-[9pt] mt-[1mm]" style={{ color: "#525252" }}>
              {aff}
              {aff && title ? " ／ " : ""}
              {title}
            </div>
          )}
        </div>
        {showQr && (
          <img
            src={showQr}
            alt="QR"
            style={{
              position: "absolute",
              right: "3mm",
              bottom: "3mm",
              width: "11mm",
              height: "11mm",
            }}
          />
        )}
        {eventDate && !showQr && (
          <div className="absolute right-[3mm] bottom-[1.5mm] text-[7pt]" style={{ color: "#a3a3a3" }}>
            {eventDate}
          </div>
        )}
      </div>
    );
  }

  if (t === "event") {
    return (
      <div className="absolute inset-0" style={{ backgroundColor: "#fafafa" }}>
        <div className="absolute inset-0 flex flex-col p-[5mm] text-center items-center">
          <div className="flex items-center justify-center gap-[2mm]" style={{ height: "9mm" }}>
            {logo && (
              <img src={logo} alt="logo" style={{ maxHeight: "8mm", maxWidth: "16mm", objectFit: "contain" }} />
            )}
            {eventName && (
              <div className="text-[8pt] tracking-[0.25em] font-bold uppercase" style={{ color: c }}>
                {renderEventName(eventName)}
              </div>
            )}
          </div>
          <div className="h-px w-[18mm] my-[1.5mm]" style={{ backgroundColor: c }} />
          <div className="flex-1 flex flex-col justify-center items-center">
            {kana && (
              <div className="text-[8pt] tracking-[0.15em]" style={{ color: "#737373" }}>
                {kana}
              </div>
            )}
            <div
              className="font-bold leading-[1.05]"
              style={{ fontSize: "22pt", color: "#171717" }}
            >
              {name}
            </div>
            {(aff || title) && (
              <div className="text-[8.5pt] mt-[0.5mm]" style={{ color: "#525252" }}>
                {aff}
                {aff && title ? " ／ " : ""}
                {title}
              </div>
            )}
          </div>
          {eventDate && (
            <div className="text-[7pt] tracking-[0.15em]" style={{ color: c }}>
              {eventDate}
            </div>
          )}
        </div>
        {showQr && (
          <img
            src={showQr}
            alt="QR"
            style={{
              position: "absolute",
              right: "2mm",
              top: "2mm",
              width: "10mm",
              height: "10mm",
            }}
          />
        )}
      </div>
    );
  }

  // === Additional 16 templates ===========================================

  if (t === "double-band") {
    return (
      <div className="absolute inset-0 flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <div style={{ height: "5mm", backgroundColor: c }} />
        <div className="flex-1 flex flex-col justify-center px-[5mm] py-[3mm] min-w-0">
          {eventName && <div className="text-[7pt] tracking-[0.3em] uppercase" style={{ color: c }}>{renderEventName(eventName)}</div>}
          {kana && <div className="text-[8pt] mt-[1mm]" style={{ color: "#737373" }}>{kana}</div>}
          <div className="font-bold leading-[1.05]" style={{ fontSize: "24pt", color: "#171717" }}>{name}</div>
          {(aff || title) && <div className="text-[9pt] mt-[0.5mm]" style={{ color: "#525252" }}>{aff}{aff && title ? " ／ " : ""}{title}</div>}
          {person.freeText && <div className="text-[8pt] mt-[1mm] italic" style={{ color: c }}>{person.freeText}</div>}
        </div>
        <div style={{ height: "3mm", backgroundColor: c }} />
        {showQr && <img src={showQr} alt="QR" style={{ position: "absolute", right: "3mm", bottom: "5mm", width: "10mm", height: "10mm" }} />}
        {logo && <img src={logo} alt="logo" style={{ position: "absolute", right: "3mm", top: "1mm", maxHeight: "3mm", filter: "brightness(0) invert(1)" }} />}
      </div>
    );
  }

  if (t === "side-dark") {
    // ダーク帯 + 情報。自動生成ロゴ・固定文字なし。
    return (
      <div className="absolute inset-0 flex" style={{ backgroundColor: "#ffffff" }}>
        <div
          className="flex flex-col items-center justify-center p-[3mm] relative"
          style={{ width: "16mm", backgroundColor: "#171717" }}
        >
          {logo && (
            <img
              src={logo}
              alt="logo"
              style={{
                maxWidth: "12mm",
                maxHeight: "12mm",
                objectFit: "contain",
                filter: "brightness(0) invert(1)",
              }}
            />
          )}
          {/* アクセントライン（自動ではなく装飾） */}
          <div
            className="absolute right-0 top-[10mm] bottom-[10mm]"
            style={{ width: "0.6mm", backgroundColor: c, opacity: 0.85 }}
          />
        </div>
        <div className="flex-1 flex flex-col justify-center px-[5mm]">
          {kana && <div className="text-[8pt]" style={{ color: "#737373" }}>{kana}</div>}
          <div className="font-bold leading-[1.05]" style={{ fontSize: "22pt", color: "#171717" }}>{name}</div>
          {aff && <div className="text-[9pt] mt-[0.5mm]" style={{ color: "#525252" }}>{aff}</div>}
          {title && <div className="text-[8pt] mt-[1mm]" style={{ color: c, fontWeight: 600 }}>{title}</div>}
          {person.freeText && <div className="text-[7.5pt] mt-[1mm]" style={{ color: "#737373", fontStyle: "italic" }}>{person.freeText}</div>}
          {eventName && (
            <div className="text-[6.5pt] tracking-[0.25em] uppercase mt-[1.5mm]" style={{ color: "#a3a3a3" }}>
              {renderEventName(eventName)}
            </div>
          )}
        </div>
        {showQr && <img src={showQr} alt="QR" style={{ position: "absolute", right: "2mm", bottom: "2mm", width: "10mm", height: "10mm" }} />}
      </div>
    );
  }

  if (t === "gradient") {
    return (
      <div className="absolute inset-0 flex flex-col p-[5mm]" style={{ background: `linear-gradient(135deg, ${c}10 0%, ${c}40 100%)` }}>
        <div className="flex items-start justify-between" style={{ height: "8mm" }}>
          {eventName && <div className="text-[7pt] tracking-[0.25em] uppercase font-bold" style={{ color: c }}>{renderEventName(eventName)}</div>}
          {logo && <img src={logo} alt="logo" style={{ maxHeight: "7mm", maxWidth: "20mm", objectFit: "contain" }} />}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          {kana && <div className="text-[8pt]" style={{ color: "#525252" }}>{kana}</div>}
          <div className="font-bold leading-[1.05] tracking-[-0.01em]" style={{ fontSize: "26pt", color: "#171717" }}>{name}</div>
          {(aff || title) && <div className="text-[9pt] mt-[1mm]" style={{ color: "#404040" }}>{aff}{aff && title ? " ／ " : ""}{title}</div>}
          {person.freeText && <div className="text-[8pt] mt-[1mm] italic" style={{ color: c }}>{person.freeText}</div>}
        </div>
        {showQr && <img src={showQr} alt="QR" style={{ position: "absolute", right: "3mm", bottom: "3mm", width: "11mm", height: "11mm" }} />}
        {eventDate && !showQr && <div className="absolute right-[3mm] bottom-[2mm] text-[7pt]" style={{ color: "#737373" }}>{eventDate}</div>}
      </div>
    );
  }

  if (t === "neon-dark") {
    return (
      <div className="absolute inset-0 flex flex-col p-[5mm]" style={{ backgroundColor: "#0a0a0a", color: "#fafafa" }}>
        {eventName && <div className="text-[7pt] tracking-[0.3em] uppercase" style={{ color: c, textShadow: `0 0 8px ${c}` }}>{renderEventName(eventName)}</div>}
        <div className="flex-1 flex flex-col justify-center">
          {kana && <div className="text-[8pt] tracking-[0.15em]" style={{ color: "#a3a3a3" }}>{kana}</div>}
          <div className="font-bold leading-[1.05] tracking-[-0.01em]" style={{ fontSize: "26pt", color: c, textShadow: `0 0 12px ${c}` }}>{name}</div>
          {(aff || title) && <div className="text-[9pt] mt-[1mm]" style={{ color: "#d4d4d4" }}>{aff}{aff && title ? " ／ " : ""}{title}</div>}
          {person.freeText && <div className="text-[8pt] mt-[1mm] italic" style={{ color: "#fafafa", opacity: 0.8 }}>{person.freeText}</div>}
        </div>
        {logo && <img src={logo} alt="logo" style={{ position: "absolute", right: "3mm", top: "3mm", maxHeight: "7mm", filter: "brightness(0) invert(1)" }} />}
        {showQr && <img src={showQr} alt="QR" style={{ position: "absolute", right: "3mm", bottom: "3mm", width: "11mm", height: "11mm", borderRadius: "1mm", padding: "0.5mm", backgroundColor: "#fff" }} />}
      </div>
    );
  }

  if (t === "earth") {
    return (
      <div className="absolute inset-0 flex flex-col p-[5mm]" style={{ backgroundColor: "#f5f1e8", color: "#3e2723", fontFamily: "Georgia, serif" }}>
        {eventName && <div className="text-[7pt] tracking-[0.3em] uppercase" style={{ color: "#8b7355" }}>{renderEventName(eventName)}</div>}
        <div className="flex-1 flex flex-col justify-center">
          {kana && <div className="text-[8pt] italic" style={{ color: "#8b7355" }}>{kana}</div>}
          <div className="font-bold leading-[1.05]" style={{ fontSize: "24pt" }}>{name}</div>
          <div style={{ width: "12mm", height: "1px", backgroundColor: c, margin: "1mm 0" }} />
          {(aff || title) && <div className="text-[9pt]" style={{ color: "#5a4a3a" }}>{aff}{aff && title ? " ／ " : ""}{title}</div>}
          {person.freeText && <div className="text-[8pt] mt-[1mm] italic" style={{ color: "#8b7355" }}>{person.freeText}</div>}
        </div>
        {logo && <img src={logo} alt="logo" style={{ position: "absolute", right: "3mm", top: "3mm", maxHeight: "7mm" }} />}
        {showQr && <img src={showQr} alt="QR" style={{ position: "absolute", right: "3mm", bottom: "3mm", width: "11mm", height: "11mm" }} />}
      </div>
    );
  }

  if (t === "frame-classic") {
    return (
      <div className="absolute inset-0" style={{ backgroundColor: "#ffffff", padding: "3mm" }}>
        <div className="absolute inset-[3mm] flex flex-col p-[4mm] text-center items-center" style={{ border: `0.6mm solid ${c}`, borderRadius: "1mm" }}>
          {eventName && <div className="text-[7pt] tracking-[0.3em] uppercase" style={{ color: c }}>{renderEventName(eventName)}</div>}
          <div className="flex-1 flex flex-col justify-center items-center">
            {kana && <div className="text-[8pt] italic" style={{ color: "#737373" }}>{kana}</div>}
            <div className="font-bold leading-[1.05] tracking-[0.02em]" style={{ fontSize: "22pt", color: "#171717", fontFamily: "Georgia, serif" }}>{name}</div>
            <div style={{ width: "8mm", height: "1px", backgroundColor: c, margin: "1mm 0" }} />
            {(aff || title) && <div className="text-[9pt]" style={{ color: "#404040" }}>{aff}{aff && title ? " ／ " : ""}{title}</div>}
            {person.freeText && <div className="text-[8pt] mt-[0.5mm] italic" style={{ color: c }}>{person.freeText}</div>}
          </div>
          {eventDate && <div className="text-[7pt]" style={{ color: c }}>{eventDate}</div>}
        </div>
        {showQr && <img src={showQr} alt="QR" style={{ position: "absolute", right: "5mm", bottom: "5mm", width: "10mm", height: "10mm" }} />}
      </div>
    );
  }

  if (t === "modern-sans") {
    return (
      <div className="absolute inset-0 flex flex-col p-[5mm]" style={{ backgroundColor: "#ffffff", fontFamily: "system-ui, sans-serif" }}>
        <div className="text-[7pt] tracking-[0.4em] uppercase font-light" style={{ color: "#171717" }}>{eventName ? renderEventName(eventName) : "NAMETAG"}</div>
        <div className="flex-1 flex flex-col justify-center">
          {kana && <div className="text-[8pt] tracking-[0.15em]" style={{ color: "#a3a3a3" }}>{kana}</div>}
          <div className="font-light leading-[1.0] tracking-[-0.03em]" style={{ fontSize: "30pt", color: "#171717" }}>{name}</div>
          {(aff || title) && <div className="text-[9pt] mt-[1mm] font-light" style={{ color: "#525252" }}>{aff}{aff && title ? " · " : ""}{title}</div>}
          {person.freeText && <div className="text-[8pt] mt-[1mm] font-light italic" style={{ color: "#737373" }}>{person.freeText}</div>}
        </div>
        <div className="text-[6pt] tracking-[0.3em] uppercase" style={{ color: c }}>{eventDate}</div>
        {showQr && <img src={showQr} alt="QR" style={{ position: "absolute", right: "3mm", bottom: "3mm", width: "11mm", height: "11mm" }} />}
        {logo && <img src={logo} alt="logo" style={{ position: "absolute", right: "3mm", top: "3mm", maxHeight: "6mm" }} />}
      </div>
    );
  }

  if (t === "handwrite") {
    // 手書き風（固定文字なし）— 波線アンダーラインで親しみやすさ
    return (
      <div
        className="absolute inset-0 flex flex-col p-[5mm] text-center items-center"
        style={{ backgroundColor: "#fffdf5", fontFamily: "'Marker Felt', 'Comic Sans MS', cursive" }}
      >
        {eventName && (
          <div className="text-[8pt]" style={{ color: c, transform: "rotate(-2deg)" }}>
            {renderEventName(eventName)}
          </div>
        )}
        <div className="flex-1 flex flex-col justify-center items-center">
          {kana && (
            <div className="text-[9pt]" style={{ color: "#737373", transform: "rotate(-1deg)" }}>
              {kana}
            </div>
          )}
          <div
            className="leading-[1.0]"
            style={{
              fontSize: "26pt",
              color: c,
              fontWeight: "bold",
              textDecoration: "underline wavy",
              textDecorationColor: `${c}80`,
              textDecorationThickness: "0.6mm",
              textUnderlineOffset: "0.15em",
            }}
          >
            {name}
          </div>
          {(aff || title) && (
            <div className="text-[9pt] mt-[1.5mm]" style={{ color: "#404040" }}>
              {aff}
              {aff && title ? " / " : ""}
              {title}
            </div>
          )}
          {person.freeText && (
            <div className="text-[9pt] mt-[1mm]" style={{ color: c, transform: "rotate(1deg)" }}>
              ✎ {person.freeText}
            </div>
          )}
        </div>
        {logo && (
          <img
            src={logo}
            alt="logo"
            style={{
              position: "absolute",
              left: "3mm",
              top: "3mm",
              maxHeight: "6mm",
              maxWidth: "16mm",
              objectFit: "contain",
            }}
          />
        )}
        {showQr && (
          <img
            src={showQr}
            alt="QR"
            style={{ position: "absolute", right: "3mm", bottom: "3mm", width: "10mm", height: "10mm" }}
          />
        )}
      </div>
    );
  }

  if (t === "card-bordered") {
    return (
      <div className="absolute inset-0" style={{ backgroundColor: "#ffffff", padding: "2.5mm" }}>
        <div className="absolute inset-[2.5mm] flex flex-col p-[3.5mm]" style={{ border: `0.3mm solid ${c}50` }}>
          <div className="flex items-center justify-between" style={{ height: "5mm" }}>
            {eventName && <div className="text-[6.5pt] tracking-[0.25em] uppercase font-semibold" style={{ color: c }}>{renderEventName(eventName)}</div>}
            {logo && <img src={logo} alt="logo" style={{ maxHeight: "5mm", maxWidth: "16mm", objectFit: "contain" }} />}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {kana && <div className="text-[8pt]" style={{ color: "#737373" }}>{kana}</div>}
            <div className="font-bold leading-[1.05]" style={{ fontSize: "23pt", color: "#171717" }}>{name}</div>
            {(aff || title) && (
              <div className="flex items-center gap-[2mm] text-[9pt] pt-[1mm] mt-[1mm]" style={{ borderTop: `0.2mm solid ${c}30` }}>
                {aff && <span style={{ color: "#525252" }}>{aff}</span>}
                {title && <span className="px-[1.5mm] py-[0.3mm] rounded text-[8pt]" style={{ backgroundColor: c, color: "#fff" }}>{title}</span>}
              </div>
            )}
            {person.freeText && <div className="text-[8pt] mt-[0.5mm] italic" style={{ color: "#737373" }}>{person.freeText}</div>}
          </div>
        </div>
        {showQr && <img src={showQr} alt="QR" style={{ position: "absolute", right: "5mm", bottom: "4mm", width: "10mm", height: "10mm" }} />}
      </div>
    );
  }

  if (t === "dot-accent") {
    return (
      <div className="absolute inset-0 flex flex-col p-[5mm]" style={{ backgroundColor: "#ffffff" }}>
        <div className="absolute" style={{ left: "-3mm", top: "-3mm", width: "12mm", height: "12mm", backgroundColor: c, borderRadius: "50%" }} />
        <div className="absolute" style={{ right: "-2mm", bottom: "-2mm", width: "8mm", height: "8mm", backgroundColor: `${c}40`, borderRadius: "50%" }} />
        <div className="relative flex-1 flex flex-col justify-center pl-[6mm]">
          {kana && <div className="text-[8pt]" style={{ color: "#737373" }}>{kana}</div>}
          <div className="font-bold leading-[1.05]" style={{ fontSize: "24pt", color: "#171717" }}>{name}</div>
          {(aff || title) && <div className="text-[9pt] mt-[0.5mm]" style={{ color: "#525252" }}>{aff}{aff && title ? " ／ " : ""}{title}</div>}
          {eventName && <div className="text-[7pt] tracking-[0.2em] uppercase mt-[1mm]" style={{ color: c }}>{renderEventName(eventName)}</div>}
          {person.freeText && <div className="text-[8pt] mt-[1mm] italic" style={{ color: c }}>{person.freeText}</div>}
        </div>
        {showQr && <img src={showQr} alt="QR" style={{ position: "absolute", right: "3mm", bottom: "3mm", width: "10mm", height: "10mm" }} />}
      </div>
    );
  }

  if (t === "polaroid") {
    return (
      <div className="absolute inset-0" style={{ backgroundColor: "#fafafa", padding: "3mm" }}>
        <div className="absolute inset-[3mm] bg-white flex flex-col" style={{ boxShadow: "0 0.5mm 2mm rgba(0,0,0,0.08)" }}>
          <div className="flex-1 flex flex-col items-center justify-center px-[4mm] pt-[3mm]">
            {eventName && <div className="text-[6.5pt] tracking-[0.3em] uppercase font-bold" style={{ color: c }}>{renderEventName(eventName)}</div>}
            <div className="flex-1 flex flex-col justify-center items-center mt-[1mm]">
              {kana && <div className="text-[8pt]" style={{ color: "#737373" }}>{kana}</div>}
              <div className="font-bold leading-[1.0]" style={{ fontSize: "22pt", color: "#171717" }}>{name}</div>
              {(aff || title) && <div className="text-[9pt] mt-[0.5mm]" style={{ color: "#525252" }}>{aff}{aff && title ? " ／ " : ""}{title}</div>}
              {person.freeText && <div className="text-[8pt] mt-[1mm] italic" style={{ color: c }}>{person.freeText}</div>}
            </div>
          </div>
          {eventDate && (
            <div className="px-[4mm] py-[1.5mm] text-center text-[7pt]" style={{ color: "#737373", borderTop: "0.2mm solid #eee" }}>
              {eventDate}
            </div>
          )}
        </div>
        {showQr && <img src={showQr} alt="QR" style={{ position: "absolute", right: "5mm", top: "5mm", width: "10mm", height: "10mm" }} />}
      </div>
    );
  }

  if (t === "striped") {
    return (
      <div className="absolute inset-0 flex flex-col p-[5mm]" style={{ backgroundImage: `repeating-linear-gradient(135deg, ${c}10 0 4mm, transparent 4mm 8mm)`, backgroundColor: "#ffffff" }}>
        {eventName && <div className="text-[7pt] tracking-[0.3em] uppercase font-bold" style={{ color: c }}>{renderEventName(eventName)}</div>}
        <div className="flex-1 flex flex-col justify-center">
          {kana && <div className="text-[8pt]" style={{ color: "#737373" }}>{kana}</div>}
          <div className="font-bold leading-[1.05]" style={{ fontSize: "24pt", color: "#171717" }}>{name}</div>
          {(aff || title) && <div className="text-[9pt] mt-[0.5mm]" style={{ color: "#525252" }}>{aff}{aff && title ? " ／ " : ""}{title}</div>}
          {person.freeText && <div className="text-[8pt] mt-[1mm] italic" style={{ color: c }}>{person.freeText}</div>}
        </div>
        {logo && <img src={logo} alt="logo" style={{ position: "absolute", right: "3mm", top: "3mm", maxHeight: "7mm" }} />}
        {showQr && <img src={showQr} alt="QR" style={{ position: "absolute", right: "3mm", bottom: "3mm", width: "11mm", height: "11mm", padding: "0.5mm", backgroundColor: "#fff" }} />}
      </div>
    );
  }

  if (t === "big-number") {
    const num = (data.people.findIndex((p) => p.id === person.id) + 1).toString();
    return (
      <div className="absolute inset-0 flex" style={{ backgroundColor: "#ffffff" }}>
        <div className="flex flex-col items-center justify-center" style={{ width: "20mm", backgroundColor: c, color: "#fff" }}>
          <div className="text-[6pt] tracking-[0.25em] uppercase" style={{ opacity: 0.85 }}>NO.</div>
          <div className="font-bold leading-[1.0]" style={{ fontSize: "26pt" }}>{num}</div>
        </div>
        <div className="flex-1 flex flex-col justify-center px-[5mm]">
          {eventName && <div className="text-[6.5pt] tracking-[0.25em] uppercase font-bold" style={{ color: c }}>{renderEventName(eventName)}</div>}
          {kana && <div className="text-[8pt] mt-[0.5mm]" style={{ color: "#737373" }}>{kana}</div>}
          <div className="font-bold leading-[1.05]" style={{ fontSize: "20pt", color: "#171717" }}>{name}</div>
          {(aff || title) && <div className="text-[9pt] mt-[0.5mm]" style={{ color: "#525252" }}>{aff}{aff && title ? " ／ " : ""}{title}</div>}
          {person.freeText && <div className="text-[8pt] mt-[1mm] italic" style={{ color: c }}>{person.freeText}</div>}
        </div>
        {showQr && <img src={showQr} alt="QR" style={{ position: "absolute", right: "2mm", bottom: "2mm", width: "10mm", height: "10mm" }} />}
      </div>
    );
  }

  if (t === "minimal-bold") {
    return (
      <div className="absolute inset-0 flex flex-col p-[5mm]" style={{ backgroundColor: "#ffffff" }}>
        <div className="flex items-center justify-between">
          {eventName && <div className="text-[7pt] tracking-[0.3em] uppercase font-black" style={{ color: c }}>{renderEventName(eventName)}</div>}
          {logo && <img src={logo} alt="logo" style={{ maxHeight: "6mm", maxWidth: "20mm", objectFit: "contain" }} />}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="font-black leading-[0.95] tracking-[-0.03em]" style={{ fontSize: "32pt", color: "#171717" }}>{name}</div>
          {kana && <div className="text-[8pt] tracking-[0.15em] mt-[0.5mm] font-bold" style={{ color: c }}>{kana}</div>}
          {(aff || title) && <div className="text-[9pt] mt-[1mm] font-bold" style={{ color: "#171717" }}>{aff}{aff && title ? " | " : ""}{title}</div>}
          {person.freeText && <div className="text-[8pt] mt-[1mm] italic" style={{ color: "#737373" }}>{person.freeText}</div>}
        </div>
        {showQr && <img src={showQr} alt="QR" style={{ position: "absolute", right: "3mm", bottom: "3mm", width: "11mm", height: "11mm" }} />}
      </div>
    );
  }

  if (t === "pastel") {
    return (
      <div className="absolute inset-0 flex flex-col p-[5mm]" style={{ background: `linear-gradient(180deg, ${c}25 0%, ${c}05 100%)` }}>
        {eventName && <div className="text-[7pt] tracking-[0.3em] uppercase" style={{ color: "#525252" }}>{renderEventName(eventName)}</div>}
        <div className="flex-1 flex flex-col justify-center">
          {kana && <div className="text-[8pt] italic" style={{ color: "#737373" }}>{kana}</div>}
          <div className="font-light leading-[1.05]" style={{ fontSize: "26pt", color: "#171717" }}>{name}</div>
          {(aff || title) && <div className="text-[9pt] mt-[1mm]" style={{ color: "#525252" }}>{aff}{aff && title ? " ／ " : ""}{title}</div>}
          {person.freeText && <div className="text-[8pt] mt-[1mm] italic" style={{ color: c }}>{person.freeText}</div>}
        </div>
        {logo && <img src={logo} alt="logo" style={{ position: "absolute", right: "3mm", top: "3mm", maxHeight: "7mm" }} />}
        {showQr && <img src={showQr} alt="QR" style={{ position: "absolute", right: "3mm", bottom: "3mm", width: "11mm", height: "11mm", borderRadius: "0.5mm", padding: "0.3mm", backgroundColor: "#fff" }} />}
      </div>
    );
  }

  // 自由レイアウトで描画する条件：
  //  - 自由レイアウトテンプレ
  //  - カスタム背景テンプレ（背景は customBgDataUrl で表示、要素は自由配置）
  //  - 「自由レイアウトで微調整」スイッチ ON（どのテンプレでも）
  const useFreeLayout = t === "free-layout" || t === "custom-bg-only" || data.freeLayoutEnabled === true;
  if (useFreeLayout) {
    const fl = data.freeLayout ?? DEFAULT_FREE_LAYOUT;
    const globalScale = data.freeLayoutGlobalScale ?? 1;
    // カスタム背景テンプレでは customBgDataUrl が背景になる（cover）
    // free-layout / その他テンプレ + freeLayoutEnabled は白背景
    const bgStyle: React.CSSProperties =
      t === "custom-bg-only" && data.backCustomBgDataUrl
        ? {
            backgroundImage: `url(${data.backCustomBgDataUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }
        : t === "custom-bg-only" && data.customBgDataUrl
          ? {
              backgroundImage: `url(${data.customBgDataUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : { backgroundColor: "#ffffff" };
    /** 整列方向に応じた CSS transform を返す（translateX のみ） */
    const alignTransform = (align?: "left" | "center" | "right"): string | undefined => {
      if (align === "center") return "translateX(-50%)";
      if (align === "right") return "translateX(-100%)";
      return undefined;
    };
    const alignTextAlign = (align?: "left" | "center" | "right"): "left" | "center" | "right" => {
      return align ?? "left";
    };
    const items: { key: FreeLayoutItemKey; render: (it: FreeLayoutItem) => React.ReactNode }[] = [
      {
        key: "eventName",
        render: (it) => eventName ? (
          <div style={{ position: "absolute", left: `${it.x}mm`, top: `${it.y}mm`, fontSize: `${7 * it.scale * globalScale}pt`, color: colorEventName, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, transform: alignTransform(it.align), textAlign: alignTextAlign(it.align), whiteSpace: "nowrap" }}>
            {renderEventName(eventName)}
          </div>
        ) : null,
      },
      {
        key: "name",
        render: (it) => (
          <div style={{ position: "absolute", left: `${it.x}mm`, top: `${it.y}mm`, fontSize: `${22 * it.scale * globalScale}pt`, fontWeight: 700, lineHeight: 1.05, color: colorName, transform: alignTransform(it.align), textAlign: alignTextAlign(it.align), whiteSpace: "nowrap" }}>
            {name}
          </div>
        ),
      },
      {
        key: "kana",
        render: (it) => kana ? (
          <div style={{ position: "absolute", left: `${it.x}mm`, top: `${it.y}mm`, fontSize: `${8 * it.scale * globalScale}pt`, color: colorKana, transform: alignTransform(it.align), textAlign: alignTextAlign(it.align), whiteSpace: "nowrap" }}>
            {kana}
          </div>
        ) : null,
      },
      {
        key: "affiliation",
        render: (it) => aff ? (
          <div style={{ position: "absolute", left: `${it.x}mm`, top: `${it.y}mm`, fontSize: `${9 * it.scale * globalScale}pt`, color: colorAffiliation, transform: alignTransform(it.align), textAlign: alignTextAlign(it.align), whiteSpace: "nowrap" }}>
            {aff}
          </div>
        ) : null,
      },
      {
        key: "title",
        render: (it) => title ? (
          <div style={{ position: "absolute", left: `${it.x}mm`, top: `${it.y}mm`, fontSize: `${8 * it.scale * globalScale}pt`, color: colorTitle, fontWeight: 600, transform: alignTransform(it.align), textAlign: alignTextAlign(it.align), whiteSpace: "nowrap" }}>
            {title}
          </div>
        ) : null,
      },
      {
        key: "freeText",
        render: (it) => person.freeText ? (
          <div style={{ position: "absolute", left: `${it.x}mm`, top: `${it.y}mm`, fontSize: `${8 * it.scale * globalScale}pt`, color: colorFreeText, fontStyle: "italic", transform: alignTransform(it.align), textAlign: alignTextAlign(it.align), whiteSpace: "nowrap" }}>
            {person.freeText}
          </div>
        ) : null,
      },
      {
        key: "qr",
        render: (it) => showQr ? (
          <img src={showQr} alt="QR" style={{ position: "absolute", left: `${it.x}mm`, top: `${it.y}mm`, width: `${12 * it.scale * globalScale}mm`, height: `${12 * it.scale * globalScale}mm`, transform: alignTransform(it.align) }} />
        ) : null,
      },
      {
        key: "logo",
        render: (it) => logo ? (
          <img src={logo} alt="logo" style={{ position: "absolute", left: `${it.x}mm`, top: `${it.y}mm`, maxWidth: `${15 * it.scale * globalScale}mm`, maxHeight: `${10 * it.scale * globalScale}mm`, objectFit: "contain", transform: alignTransform(it.align) }} />
        ) : null,
      },
    ];
    return (
      <div className="absolute inset-0" style={bgStyle}>
        {items.map(({ key, render }) => {
          const it = fl[key];
          if (!it || !it.enabled) return null;
          return <div key={key}>{render(it)}</div>;
        })}
      </div>
    );
  }

  if (t === "tech-mono") {
    // 等幅フォントのモダンデザイン。固定コマンド文字なし。
    return (
      <div
        className="absolute inset-0 flex flex-col p-[5mm]"
        style={{
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "'SF Mono', 'Menlo', 'Consolas', monospace",
        }}
      >
        {/* 上部のアクセントドット（装飾） */}
        <div className="flex items-center gap-[1mm]" style={{ height: "4mm" }}>
          <div style={{ width: "1mm", height: "1mm", borderRadius: "50%", backgroundColor: c }} />
          <div style={{ width: "1mm", height: "1mm", borderRadius: "50%", backgroundColor: `${c}80` }} />
          <div style={{ width: "1mm", height: "1mm", borderRadius: "50%", backgroundColor: `${c}40` }} />
        </div>
        <div className="flex-1 flex flex-col justify-center">
          {kana && <div className="text-[7pt] tracking-[0.1em]" style={{ color: c }}>{kana}</div>}
          <div className="font-bold leading-[1.05] tracking-[-0.02em]" style={{ fontSize: "22pt", color: "#fafafa" }}>
            {name}
          </div>
          {(aff || title) && (
            <div className="text-[8pt] mt-[1mm] tracking-[0.05em]" style={{ color: "#a3a3a3" }}>
              {aff}
              {aff && title ? " · " : ""}
              {title}
            </div>
          )}
          {person.freeText && (
            <div className="text-[7.5pt] mt-[1mm] tracking-[0.05em]" style={{ color: c }}>
              {person.freeText}
            </div>
          )}
        </div>
        {eventName && (
          <div className="text-[6pt] tracking-[0.3em] uppercase" style={{ color: "#525252" }}>
            {renderEventName(eventName)}
          </div>
        )}
        {logo && (
          <img
            src={logo}
            alt="logo"
            style={{
              position: "absolute",
              right: "3mm",
              top: "3mm",
              maxHeight: "5mm",
              maxWidth: "16mm",
              filter: "brightness(0) invert(1)",
            }}
          />
        )}
        {showQr && (
          <img
            src={showQr}
            alt="QR"
            style={{
              position: "absolute",
              right: "3mm",
              bottom: "3mm",
              width: "10mm",
              height: "10mm",
              padding: "0.3mm",
              backgroundColor: "#fff",
            }}
          />
        )}
      </div>
    );
  }

  // photo-card (プロフェッショナル): エレガントなカラーアクセント + 情報
  // 自動生成ロゴ・固定文字を一切含まないオシャレデザイン
  return (
    <div className="absolute inset-0 flex" style={{ backgroundColor: "#ffffff" }}>
      {/* 左側カラーアクセント — グラデーション帯 */}
      <div
        className="relative shrink-0"
        style={{
          width: "8mm",
          background: `linear-gradient(180deg, ${c} 0%, color-mix(in srgb, ${c} 60%, #000) 100%)`,
        }}
      >
        {/* 装飾的なハイライト */}
        <div
          className="absolute"
          style={{
            top: "4mm",
            left: "1mm",
            width: "1mm",
            height: "12mm",
            backgroundColor: "rgba(255,255,255,0.3)",
            borderRadius: "1mm",
          }}
        />
      </div>

      {/* 右側情報エリア */}
      <div className="flex-1 flex flex-col justify-center px-[5mm] py-[4mm] relative min-w-0">
        {eventName && (
          <div className="text-[6.5pt] tracking-[0.3em] uppercase font-semibold mb-[1mm]" style={{ color: c }}>
            {renderEventName(eventName)}
          </div>
        )}
        {kana && (
          <div className="text-[8pt] tracking-[0.1em]" style={{ color: "#737373" }}>
            {kana}
          </div>
        )}
        <div className="font-bold leading-[1.05] tracking-[-0.01em]" style={{ fontSize: "24pt", color: "#171717" }}>
          {name}
        </div>
        {(aff || title) && (
          <div className="mt-[1.5mm] flex items-center gap-[2mm] text-[9pt] flex-wrap" style={{ color: "#404040" }}>
            {aff && <span>{aff}</span>}
            {title && (
              <span
                className="px-[1.5mm] py-[0.3mm] rounded text-[8pt] font-semibold"
                style={{ backgroundColor: c, color: "#ffffff" }}
              >
                {title}
              </span>
            )}
          </div>
        )}
        {person.freeText && (
          <div className="text-[8pt] mt-[1mm] italic" style={{ color: c }}>
            {person.freeText}
          </div>
        )}
        {/* ロゴ・QR・日付 — 指定された場合のみ表示（自動挿入なし） */}
        {logo && (
          <img
            src={logo}
            alt="logo"
            style={{
              position: "absolute",
              right: "3mm",
              top: "3mm",
              maxWidth: "16mm",
              maxHeight: "7mm",
              objectFit: "contain",
            }}
          />
        )}
        {showQr && (
          <img
            src={showQr}
            alt="QR"
            style={{ position: "absolute", right: "2mm", bottom: "2mm", width: "11mm", height: "11mm" }}
          />
        )}
        {eventDate && !showQr && (
          <div className="absolute right-[3mm] bottom-[2mm] text-[7pt]" style={{ color: "#a3a3a3" }}>
            {eventDate}
          </div>
        )}
      </div>
    </div>
  );
}
