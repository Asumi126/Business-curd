import { CSSProperties } from "react";
import { CardData, FontFamilyKey, FontRole } from "./types";

export type Palette = {
  id: string;
  name: string;
  bg: string;
  fg: string;
  accent: string;
  muted: string;
  category: "mono" | "color" | "dark" | "warm" | "cool" | "japan";
};

export const PALETTES: Palette[] = [
  { id: "auto", name: "テンプレ標準", bg: "", fg: "", accent: "", muted: "", category: "mono" },
  { id: "mono-classic", name: "白×黒", bg: "#ffffff", fg: "#0a0a0a", accent: "#0a0a0a", muted: "#737373", category: "mono" },
  { id: "mono-inverse", name: "黒×白", bg: "#0a0a0a", fg: "#fafafa", accent: "#fafafa", muted: "#737373", category: "dark" },
  { id: "navy-gold", name: "ネイビー × ゴールド", bg: "#0a1628", fg: "#f5e6c8", accent: "#d4af37", muted: "#94a3b8", category: "dark" },
  { id: "navy-cream", name: "ネイビー × クリーム", bg: "#fefae0", fg: "#0a1628", accent: "#1e3a5f", muted: "#64748b", category: "cool" },
  { id: "ocean", name: "オーシャンブルー", bg: "#ffffff", fg: "#0c2461", accent: "#1976d2", muted: "#64748b", category: "cool" },
  { id: "sky", name: "スカイブルー", bg: "#f0f9ff", fg: "#0c4a6e", accent: "#0ea5e9", muted: "#64748b", category: "cool" },
  { id: "forest", name: "フォレスト", bg: "#f5f3ee", fg: "#1a3322", accent: "#5a7a44", muted: "#737373", category: "cool" },
  { id: "moss", name: "モス", bg: "#fafaf5", fg: "#3a3a1a", accent: "#8a9a5b", muted: "#a3a380", category: "cool" },
  { id: "sunset", name: "サンセット", bg: "#fef9f5", fg: "#7c2d12", accent: "#ea580c", muted: "#a3a3a3", category: "warm" },
  { id: "rose", name: "ローズ", bg: "#fdf2f8", fg: "#831843", accent: "#ec4899", muted: "#9d174d", category: "warm" },
  { id: "blush", name: "ブラッシュ", bg: "#fff1f2", fg: "#9f1239", accent: "#fb7185", muted: "#a3a3a3", category: "warm" },
  { id: "lavender", name: "ラベンダー", bg: "#faf5ff", fg: "#581c87", accent: "#9333ea", muted: "#a3a3a3", category: "color" },
  { id: "mint", name: "ミント", bg: "#f0fdf4", fg: "#14532d", accent: "#10b981", muted: "#737373", category: "color" },
  { id: "lemon", name: "レモン", bg: "#fffbe8", fg: "#713f12", accent: "#f59e0b", muted: "#a3a3a3", category: "warm" },
  { id: "coral", name: "コーラル", bg: "#fff5f5", fg: "#7a2828", accent: "#ff6b6b", muted: "#a3a3a3", category: "warm" },
  { id: "graphite", name: "グラファイト", bg: "#1a1a1a", fg: "#e5e5e5", accent: "#fbbf24", muted: "#737373", category: "dark" },
  { id: "cyber", name: "サイバー", bg: "#0a0a0a", fg: "#22d3ee", accent: "#a855f7", muted: "#737373", category: "dark" },
  { id: "neon-pink", name: "ネオンピンク", bg: "#0a0a0a", fg: "#fafafa", accent: "#ec4899", muted: "#737373", category: "dark" },
  { id: "earth", name: "アース", bg: "#f5e6d3", fg: "#3e2723", accent: "#a0522d", muted: "#8b7355", category: "warm" },
  { id: "terracotta", name: "テラコッタ", bg: "#fef4ec", fg: "#7c2d12", accent: "#c87264", muted: "#a3a3a3", category: "warm" },
  { id: "sakura", name: "桜", bg: "#fef2f5", fg: "#831843", accent: "#fbcfe8", muted: "#9d174d", category: "japan" },
  { id: "sumi", name: "墨", bg: "#f5f1e8", fg: "#1c1917", accent: "#7c2d12", muted: "#737373", category: "japan" },
  { id: "shu", name: "朱", bg: "#fefae8", fg: "#1a1a1a", accent: "#9a1f2c", muted: "#737373", category: "japan" },
  // — Bright / pastel palettes —
  { id: "ivory", name: "アイボリー", bg: "#fffcf2", fg: "#3d3520", accent: "#c9a96e", muted: "#a89b76", category: "warm" },
  { id: "pearl", name: "パール", bg: "#fafafa", fg: "#2d2d2d", accent: "#e0c3a0", muted: "#9b9b9b", category: "mono" },
  { id: "soft-cream", name: "ソフトクリーム", bg: "#fff9ec", fg: "#5b4636", accent: "#d4a373", muted: "#a98b7b", category: "warm" },
  { id: "fresh-mint", name: "フレッシュミント", bg: "#ecfdf5", fg: "#064e3b", accent: "#34d399", muted: "#6ee7b7", category: "color" },
  { id: "baby-blue", name: "ベビーブルー", bg: "#eff6ff", fg: "#1e3a8a", accent: "#60a5fa", muted: "#93c5fd", category: "cool" },
  { id: "peach", name: "ピーチ", bg: "#fff5eb", fg: "#7c2d12", accent: "#fb923c", muted: "#fdba74", category: "warm" },
  { id: "lilac", name: "ライラック", bg: "#faf5ff", fg: "#4c1d95", accent: "#c084fc", muted: "#d8b4fe", category: "color" },
  { id: "powder", name: "パウダー", bg: "#fdf4ff", fg: "#86198f", accent: "#e879f9", muted: "#f0abfc", category: "color" },
  { id: "sand", name: "サンド", bg: "#fefce8", fg: "#713f12", accent: "#eab308", muted: "#facc15", category: "warm" },
  { id: "spring-green", name: "スプリンググリーン", bg: "#f7fee7", fg: "#365314", accent: "#84cc16", muted: "#a3e635", category: "color" },
  { id: "ice-mint", name: "アイスミント", bg: "#f0fdfa", fg: "#134e4a", accent: "#5eead4", muted: "#7dd3fc", category: "cool" },
  { id: "champagne", name: "シャンパン", bg: "#fef9f0", fg: "#78350f", accent: "#f59e0b", muted: "#d97706", category: "warm" },
];

export const PALETTE_CATEGORIES: { id: Palette["category"]; label: string }[] = [
  { id: "mono", label: "モノクロ" },
  { id: "color", label: "カラフル" },
  { id: "warm", label: "暖色系" },
  { id: "cool", label: "寒色系" },
  { id: "dark", label: "ダーク" },
  { id: "japan", label: "和" },
];

export type FontDefinition = {
  id: FontFamilyKey;
  name: string;
  description: string;
  cssFamily: string;
  weight?: number;
  letterSpacing?: string;
};

const SYSTEM_SANS =
  "-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', Meiryo, 'Helvetica Neue', Arial, sans-serif";
const SYSTEM_SERIF = "'Hiragino Mincho ProN', 'Yu Mincho', 'Times New Roman', Georgia, serif";
const SYSTEM_MONO = "'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace";
const SCRIPT_CURSIVE = "'Snell Roundhand', 'Apple Chancery', 'Brush Script MT', cursive";
const SCRIPT_HANDWRITING = "'Marker Felt', 'Comic Sans MS', cursive";
const ELEGANT_SERIF = "'Didot', 'Bodoni 72', 'Times New Roman', serif";
const ENGLISH_DISPLAY = "Impact, 'Helvetica Neue', system-ui, sans-serif";
const ENGLISH_CONDENSED = "'Helvetica Neue Condensed', 'Arial Narrow', sans-serif";
const JAPAN_MARU = "'Hiragino Maru Gothic ProN', 'Hiragino Maru Gothic Pro', sans-serif";
const JAPAN_KAISHO = "'YuKyokasho', 'HG教科書体', '游教科書体', 'Hiragino Mincho ProN', serif";

export const FONTS: FontDefinition[] = [
  { id: "auto", name: "テンプレ標準", description: "テンプレートに合わせて自動", cssFamily: "inherit" },

  // Sans-serif
  { id: "modern-sans", name: "モダン・サンセリフ", description: "シンプルで読みやすい万能型", cssFamily: SYSTEM_SANS, letterSpacing: "-0.01em" },
  { id: "display-bold", name: "ディスプレイ・ボールド", description: "見出しや名前を強調する太め", cssFamily: SYSTEM_SANS, weight: 900, letterSpacing: "-0.04em" },
  { id: "english-display", name: "Impact ディスプレイ", description: "迫力ある英語太字。海外向け", cssFamily: ENGLISH_DISPLAY, weight: 900, letterSpacing: "-0.02em" },
  { id: "english-condensed", name: "コンデンス・サンセリフ", description: "縦長で英語を引き締めて", cssFamily: ENGLISH_CONDENSED, letterSpacing: "0" },

  // Serif
  { id: "classic-serif", name: "クラシック・セリフ", description: "格式高くエレガント", cssFamily: SYSTEM_SERIF, letterSpacing: "0.02em" },
  { id: "elegant-serif", name: "エレガント・セリフ", description: "Didot風の高級ファッション系", cssFamily: ELEGANT_SERIF, letterSpacing: "0.04em" },

  // Japanese
  { id: "japan-mincho", name: "和文・明朝", description: "和の上品さ", cssFamily: SYSTEM_SERIF, letterSpacing: "0.1em" },
  { id: "japan-maru", name: "和文・丸ゴシック", description: "親しみやすい丸み", cssFamily: JAPAN_MARU, letterSpacing: "0.05em" },
  { id: "japan-kaisho", name: "和文・楷書", description: "教科書体の落ち着き。士業・伝統業種", cssFamily: JAPAN_KAISHO, letterSpacing: "0.08em" },

  // Script (cursive, handwriting)
  { id: "script-cursive", name: "筆記体（英語）", description: "Snell Roundhand風の優雅な筆記体", cssFamily: SCRIPT_CURSIVE, letterSpacing: "0.02em" },
  { id: "script-handwriting", name: "手書き風", description: "カジュアルな手書きフォント", cssFamily: SCRIPT_HANDWRITING },

  // Mono
  { id: "tech-mono", name: "テック・モノスペース", description: "エンジニア・テック系", cssFamily: SYSTEM_MONO, letterSpacing: "-0.02em" },

  // Rounded (legacy alias)
  { id: "rounded", name: "ラウンド・ソフト", description: "丸みのある柔らかな印象", cssFamily: JAPAN_MARU },
];

export function getFont(id: FontFamilyKey): FontDefinition {
  return FONTS.find((f) => f.id === id) ?? FONTS[0];
}

export type Pattern = {
  id: string;
  name: string;
  description: string;
  apply: (color: string) => CSSProperties;
};

export const PATTERNS: Pattern[] = [
  {
    id: "none",
    name: "なし",
    description: "シンプル",
    apply: () => ({}),
  },
  {
    id: "dots",
    name: "ドット",
    description: "細かいドット",
    apply: (color) => ({
      backgroundImage: `radial-gradient(${color} 0.6px, transparent 0.6px)`,
      backgroundSize: "8px 8px",
    }),
  },
  {
    id: "grid",
    name: "グリッド",
    description: "細い格子",
    apply: (color) => ({
      backgroundImage: `linear-gradient(${color} 0.5px, transparent 0.5px), linear-gradient(90deg, ${color} 0.5px, transparent 0.5px)`,
      backgroundSize: "12px 12px",
    }),
  },
  {
    id: "diagonal",
    name: "斜め線",
    description: "ダンディなストライプ",
    apply: (color) => ({
      backgroundImage: `repeating-linear-gradient(45deg, transparent 0 8px, ${color} 8px 9px)`,
    }),
  },
  {
    id: "waves",
    name: "波",
    description: "やわらかい曲線",
    apply: (color) => ({
      backgroundImage: `radial-gradient(circle at 50% 0%, ${color} 1px, transparent 1.5px), radial-gradient(circle at 50% 100%, ${color} 1px, transparent 1.5px)`,
      backgroundSize: "20px 20px",
    }),
  },
  {
    id: "noise",
    name: "ノイズ",
    description: "テクスチャ感",
    apply: (color) => ({
      backgroundImage: `radial-gradient(${color} 0.5px, transparent 0.5px), radial-gradient(${color} 0.4px, transparent 0.4px)`,
      backgroundSize: "5px 5px, 7px 7px",
      backgroundPosition: "0 0, 2px 3px",
    }),
  },
];

export function getPattern(id: string): Pattern {
  return PATTERNS.find((p) => p.id === id) ?? PATTERNS[0];
}

export function resolvePalette(data: CardData, fallback: { bg: string; fg: string; accent: string }) {
  const c = data.customization;
  const preset = PALETTES.find((p) => p.id === c.paletteId);
  const usePreset = preset && preset.id !== "auto";

  return {
    bg: c.customColors.bg ?? (usePreset ? preset!.bg : fallback.bg),
    fg: c.customColors.fg ?? (usePreset ? preset!.fg : fallback.fg),
    accent: c.customColors.accent ?? (usePreset ? preset!.accent : fallback.accent),
    muted: c.customColors.muted ?? (usePreset ? preset!.muted : "#737373"),
    isCustom: c.paletteId !== "auto" || Object.keys(c.customColors).length > 0,
  };
}

/**
 * Back palette resolution. Falls back through:
 * 1. Explicit back override (data.customization.backColors)
 * 2. Front palette resolution (whatever is on the front)
 */
/**
 * Pick a readable text color (black or white) for a given background.
 * Uses YIQ luminance — a lightweight heuristic that's good enough for UI/print.
 */
function contrastColor(hex: string): string {
  const m = hex.replace("#", "").trim();
  const norm = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (norm.length !== 6) return "#000000";
  const r = parseInt(norm.slice(0, 2), 16);
  const g = parseInt(norm.slice(2, 4), 16);
  const b = parseInt(norm.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? "#1a1a1a" : "#ffffff";
}

export function resolveBackPalette(data: CardData, fallback: { bg: string; fg: string; accent: string }) {
  const front = resolvePalette(data, fallback);
  const back = data.customization.backColors;
  const bg = back.bg ?? front.bg;
  const fg = back.fg ?? front.fg;
  const bgRight = back.bgRight;
  const fgRight = back.fgRight ?? (bgRight ? contrastColor(bgRight) : undefined);
  return {
    bg,
    fg,
    accent: back.accent ?? front.accent,
    muted: back.muted ?? front.muted,
    bgRight,
    fgRight,
    isCustom: Object.keys(back).length > 0,
    hasSplit: !!bgRight,
  };
}

export function fontStyle(fontKey: FontFamilyKey): CSSProperties {
  const font = getFont(fontKey);
  if (font.id === "auto") return {};
  return {
    fontFamily: font.cssFamily,
    fontWeight: font.weight,
    letterSpacing: font.letterSpacing,
  };
}

/**
 * 表面テンプレ ID から「そのテンプレが想定する本文フォント」を推定して返す。
 * これは裏面の CardBack が、ユーザーが特に fontGlobal を設定していなくても
 * 表面のテンプレフォントに連動して見た目を揃えるための補助関数。
 *
 * カテゴリ・ID パターンで大まかに割り振り、明確な対応がないテンプレは
 * モダンサンセリフを既定値として返す。
 */
export function getTemplateDefaultFont(templateId: string): string {
  // 和風テンプレ — 明朝・楷書
  if (/sumi|wabi|japan|kaisho|crimson|warabi|kanji|kintsugi/i.test(templateId)) {
    return "'Hiragino Mincho ProN', 'Yu Mincho', 'Times New Roman', serif";
  }
  // エレガント / ラグジュアリー — Didot / Bodoni 系
  if (/elegant|boutique|gold|cinema|noir|wallstreet|embossed/i.test(templateId)) {
    return "'Didot', 'Bodoni 72', 'Times New Roman', serif";
  }
  // ハンドライティング系
  if (/handdrawn|brush|script|cursive/i.test(templateId)) {
    return "'Marker Felt', 'Comic Sans MS', cursive";
  }
  // モノ系
  if (/mono|terminal|code|brutalist/i.test(templateId)) {
    return "'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace";
  }
  // 既定: モダンサンセリフ
  return "-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', Meiryo, 'Helvetica Neue', Arial, sans-serif";
}

export function roleFontStyle(data: CardData, role: FontRole): CSSProperties {
  const c = data.customization;
  const perRole = c.fontPerRole[role];
  const key = perRole && perRole !== "auto" ? perRole : c.fontGlobal;
  return fontStyle(key);
}

/**
 * Generates a scoped CSS override that forces the user-selected fonts
 * onto the card, overriding template-hardcoded fontFamily.
 *
 * `scopeAttr` is a unique attribute selector like `data-card-scope="abc"`.
 *
 * Per-role overrides require template elements to be marked with
 * `data-role="name"|"company"|"title"|"contact"|"tagline"`.
 *
 * Roles fall back to fontGlobal when not explicitly overridden.
 */
/** Text effect catalog. Each effect returns the CSS rules (without the
 *  selector). Effects are designed to render correctly in html-to-image
 *  output so the printed PDF matches the screen preview. */
export const FONT_EFFECTS: {
  id: import("./types").FontEffectKey;
  label: string;
  emoji: string;
  description: string;
  rules: string;
}[] = [
  {
    id: "none",
    label: "なし",
    emoji: "—",
    description: "標準（エフェクトなし）",
    rules: "",
  },
  {
    id: "shadow-soft",
    label: "ソフト影",
    emoji: "🌫",
    description: "やわらかい影で立体感",
    rules: "text-shadow: 0 1px 3px rgba(0,0,0,0.25) !important;",
  },
  {
    id: "shadow-hard",
    label: "ハード影",
    emoji: "🟦",
    description: "ポップな2pxシャドウ",
    rules:
      "text-shadow: 2px 2px 0 var(--c-accent, currentColor) !important;",
  },
  {
    id: "outline",
    label: "アウトライン",
    emoji: "⭕",
    description: "輪郭を強調（白背景に映える）",
    rules:
      "text-shadow: -1px 0 var(--c-accent, currentColor), 1px 0 var(--c-accent, currentColor), 0 -1px var(--c-accent, currentColor), 0 1px var(--c-accent, currentColor) !important;",
  },
  {
    id: "neon",
    label: "ネオン",
    emoji: "💡",
    description: "アクセントカラーで光らせる",
    rules:
      "text-shadow: 0 0 4px var(--c-accent, currentColor), 0 0 10px var(--c-accent, currentColor), 0 0 18px var(--c-accent, currentColor) !important;",
  },
  {
    id: "glow",
    label: "グロー",
    emoji: "✨",
    description: "やわらかな光の滲み",
    rules:
      "text-shadow: 0 0 6px currentColor, 0 0 12px color-mix(in srgb, currentColor 60%, transparent) !important;",
  },
  {
    id: "emboss",
    label: "エンボス（凸）",
    emoji: "🔲",
    description: "浮き上がる凸表現",
    rules:
      "text-shadow: 1px 1px 0 rgba(255,255,255,0.55), -1px -1px 0 rgba(0,0,0,0.35) !important;",
  },
  {
    id: "letterpress",
    label: "レターパス（凹）",
    emoji: "🔳",
    description: "押し込まれた凹表現",
    rules:
      "text-shadow: 0 1px 0 rgba(255,255,255,0.6), 0 -1px 0 rgba(0,0,0,0.35) !important;",
  },
  {
    id: "gradient",
    label: "グラデーション",
    emoji: "🌈",
    description: "文字色とアクセントの2色グラデ",
    rules:
      "background: linear-gradient(135deg, currentColor, var(--c-accent, currentColor)) !important; -webkit-background-clip: text !important; background-clip: text !important; color: transparent !important;",
  },
  {
    id: "highlight",
    label: "ハイライト",
    emoji: "🖍",
    description: "アクセント色のマーカー風",
    rules:
      "background: color-mix(in srgb, var(--c-accent, #fef08a) 70%, transparent) !important; box-shadow: 0.15em 0 0 color-mix(in srgb, var(--c-accent, #fef08a) 70%, transparent), -0.15em 0 0 color-mix(in srgb, var(--c-accent, #fef08a) 70%, transparent) !important;",
  },
  {
    id: "underline",
    label: "下線",
    emoji: "▁",
    description: "アクセント色の下線",
    rules:
      "text-decoration: underline 0.1em var(--c-accent, currentColor) !important; text-underline-offset: 0.18em !important;",
  },
];

export function getFontEffect(id: import("./types").FontEffectKey | undefined) {
  return FONT_EFFECTS.find((e) => e.id === id) ?? FONT_EFFECTS[0];
}

/**
 * Sanitize a CSS color value to prevent CSS injection in
 * dangerouslySetInnerHTML <style> blocks.
 *
 * Allowed forms:
 *  - hex colors (#RGB, #RRGGBB, #RRGGBBAA)
 *  - CSS keywords (red, blue, currentColor, transparent, etc.)
 *  - safe var() references like var(--c-accent, currentColor)
 * Anything else → fallback "currentColor".
 */
function sanitizeCssColor(input: string): string {
  const s = String(input).trim();
  if (!s) return "currentColor";
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s;
  if (/^[a-zA-Z][a-zA-Z]*$/.test(s)) return s;
  if (/^var\(--[a-zA-Z0-9_-]+(?:,\s*[a-zA-Z0-9#_\s-]+)?\)$/.test(s)) return s;
  return "currentColor";
}

/**
 * Build effect CSS rules with custom color and width.
 * Used for the global text effect — lets users pick the shadow color and
 * scale the spread/offset (1.0 = default, 0.5 = subtle, 2.0 = bold).
 */
export function buildEffectRules(
  id: import("./types").FontEffectKey,
  opts: { color?: string; widthScale?: number } = {},
): string {
  // 入力サニタイゼーション — opts.color は user input なので CSS injection を防ぐ
  const rawColor = opts.color || "var(--c-accent, currentColor)";
  const color = sanitizeCssColor(rawColor);
  // widthScale も user input — NaN/Infinity/負値などをガード
  const rawW = opts.widthScale ?? 1;
  const w = Number.isFinite(rawW) ? Math.max(0.1, Math.min(10, rawW)) : 1;
  switch (id) {
    case "none":
      return "";
    case "shadow-soft":
      return `text-shadow: 0 ${(1 * w).toFixed(2)}px ${(3 * w).toFixed(2)}px color-mix(in srgb, ${color} 50%, transparent) !important;`;
    case "shadow-hard":
      return `text-shadow: ${(2 * w).toFixed(2)}px ${(2 * w).toFixed(2)}px 0 ${color} !important;`;
    case "outline": {
      const o = (1 * w).toFixed(2);
      return `text-shadow: -${o}px 0 ${color}, ${o}px 0 ${color}, 0 -${o}px ${color}, 0 ${o}px ${color} !important;`;
    }
    case "neon":
      return `text-shadow: 0 0 ${(4 * w).toFixed(2)}px ${color}, 0 0 ${(10 * w).toFixed(2)}px ${color}, 0 0 ${(18 * w).toFixed(2)}px ${color} !important;`;
    case "glow":
      return `text-shadow: 0 0 ${(6 * w).toFixed(2)}px ${color}, 0 0 ${(12 * w).toFixed(2)}px color-mix(in srgb, ${color} 60%, transparent) !important;`;
    case "emboss":
      return `text-shadow: ${(1 * w).toFixed(2)}px ${(1 * w).toFixed(2)}px 0 rgba(255,255,255,0.55), -${(1 * w).toFixed(2)}px -${(1 * w).toFixed(2)}px 0 rgba(0,0,0,0.35) !important;`;
    case "letterpress":
      return `text-shadow: 0 ${(1 * w).toFixed(2)}px 0 rgba(255,255,255,0.6), 0 -${(1 * w).toFixed(2)}px 0 rgba(0,0,0,0.35) !important;`;
    case "gradient":
      return `background: linear-gradient(135deg, currentColor, ${color}) !important; -webkit-background-clip: text !important; background-clip: text !important; color: transparent !important;`;
    case "highlight":
      return `background: color-mix(in srgb, ${color} 70%, transparent) !important; box-shadow: 0.15em 0 0 color-mix(in srgb, ${color} 70%, transparent), -0.15em 0 0 color-mix(in srgb, ${color} 70%, transparent) !important;`;
    case "underline":
      return `text-decoration: underline ${(0.1 * w).toFixed(3)}em ${color} !important; text-underline-offset: 0.18em !important;`;
    default:
      return "";
  }
}

/**
 * 連絡先の見せ方（contactPrefix）に応じた CSS を生成。
 *
 * - "icon": デフォルト（アイコン表示）
 * - "text": アイコンを非表示にしてラベル "T:" "E:" などを前置（テキスト化）
 * - "minimal": アイコンも前置も非表示（最小表示）
 *
 * .card-icon は <Icon> ラッパーで自動付与されたクラス。
 */
function generateContactPrefixCss(data: CardData, scopeAttr: string): string {
  const mode = data.customization.contactPrefix ?? "icon";
  const lines: string[] = [];
  // モード切替CSS：
  //   icon    : SVGアイコン表示・テキストラベル非表示（デフォルト）
  //   text    : SVGアイコン非表示・"T." "E." 等のテキストラベル表示
  //   minimal : SVGアイコンもテキストラベルも非表示
  if (mode === "text" || mode === "minimal") {
    lines.push(`[${scopeAttr}] .card-icon { display: none !important; }`);
  }
  if (mode === "text") {
    // Icon コンポーネントが描画する .card-icon-text-label を表示
    lines.push(
      `[${scopeAttr}] .card-icon-text-label { display: inline-block !important; }`,
    );
  }
  return lines.join("\n");
}

export function generateFontOverrideCss(data: CardData, scopeAttr: string): string {
  const c = data.customization;
  const lines: string[] = [];

  const globalFont = c.fontGlobal !== "auto" ? getFont(c.fontGlobal) : null;
  if (globalFont) {
    const props = [`font-family: ${globalFont.cssFamily} !important`];
    if (globalFont.weight) props.push(`font-weight: ${globalFont.weight} !important`);
    if (globalFont.letterSpacing) props.push(`letter-spacing: ${globalFont.letterSpacing} !important`);
    lines.push(`[${scopeAttr}], [${scopeAttr}] * { ${props.join("; ")}; }`);
  }

  // Global font scale + layer offset.
  // Strategy:
  //  - For SCALING text we use `transform: scale` with `transform-origin: 0 0`.
  //    旧来は `zoom` を使っていたが、`zoom` は要素のレイアウト box ごと拡縮するため、
  //    背景や周囲のレイアウトが「動いて」見えるという指摘があった。
  //    `transform: scale` ならレイアウトは固定のまま、視覚的なサイズだけ変化する。
  //  - For OFFSETTING text (X/Y) we keep `transform: translate`. 同じ要素に
  //    両方が必要な場合は scale と translate を1つの transform にまとめる。
  const gs = c.fontGlobalScale ?? 1;
  const fa = c.fineAdjust;
  const dx = fa.offsetX ?? 0;
  const dy = fa.offsetY ?? 0;
  if (gs !== 1 || dx !== 0 || dy !== 0) {
    const parts: string[] = [];
    if (dx !== 0 || dy !== 0) parts.push(`translate(${dx}mm, ${dy}mm)`);
    if (gs !== 1) parts.push(`scale(${gs})`);
    lines.push(
      `[${scopeAttr}] [data-role] { transform: ${parts.join(" ")} !important; transform-origin: 0 0 !important; }`,
    );
  }

  // Global text effect — applies to every [data-role] element except those
  // the user excluded via the checkbox UI (fontEffectExcludedRoles).
  // The color and width can be customized via fontEffectGlobalConfig.
  const globalEffectId = c.fontEffectGlobal ?? "none";
  if (globalEffectId !== "none") {
    const cfg = c.fontEffectGlobalConfig ?? {};
    const rules = buildEffectRules(globalEffectId, cfg);
    if (rules) {
      const excluded = c.fontEffectExcludedRoles ?? [];
      const exclusion = excluded
        .map((r) => `:not([data-role="${r}"])`)
        .join("");
      lines.push(
        `[${scopeAttr}] [data-role]${exclusion} { ${rules} }`,
      );
    }
  }

  // 主要ロール: テンプレが直接 [data-role="..."] を付与している要素を対象。
  const mainRoles: FontRole[] = ["name", "nameEn", "company", "title", "contact", "tagline", "description"];
  // 連絡先サブロール: テンプレ側に data-role が無くても、Icon が出力する
  // data-card-icon="phone|mail|web|pin" を頼りに :has() で親 div を特定して
  // 個別に X/Y 移動・サイズ変更を可能にする。
  const contactSubRoles: { role: FontRole; iconKind: string }[] = [
    { role: "phone", iconKind: "phone" },
    { role: "email", iconKind: "mail" },
    { role: "website", iconKind: "web" },
    { role: "address", iconKind: "pin" },
  ];

  /**
   * role に対応する CSS セレクタを返す。
   * 連絡先サブロール (phone/email/website/address) は両方の方式で当てる:
   *   a) テンプレに明示 data-role="phone" 等が付いていれば、それを最優先
   *   b) 付いていなくても、Icon SVG の data-card-icon マーカで :has() 検出
   * 両方をカンマで OR 結合することで、テンプレ更新が間に合っていない箇所でも
   * できる限り反応するようにフォールバックを用意する。
   */
  const selectorFor = (role: FontRole): string => {
    const sub = contactSubRoles.find((s) => s.role === role);
    if (sub) {
      return [
        `[${scopeAttr}] [data-role="${role}"]`,
        `[${scopeAttr}] [data-role="contact"] [data-role="${role}"]`,
        `[${scopeAttr}] [data-role="contact"] > *:has([data-card-icon="${sub.iconKind}"])`,
      ].join(", ");
    }
    return `[${scopeAttr}] [data-role="${role}"]`;
  };

  const allRoles: FontRole[] = [...mainRoles, ...contactSubRoles.map((s) => s.role)];
  for (const role of allRoles) {
    const props: string[] = [];
    const sel = selectorFor(role);
    const perRole = c.fontPerRole[role];
    if (perRole && perRole !== "auto") {
      const f = getFont(perRole);
      props.push(`font-family: ${f.cssFamily} !important`);
      if (f.weight) props.push(`font-weight: ${f.weight} !important`);
      if (f.letterSpacing) props.push(`letter-spacing: ${f.letterSpacing} !important`);
    }
    // Per-role font size — uses CSS `zoom` so it stacks naturally on top
    // of the global zoom and works against template-fixed pt sizes.
    const sizeScale = c.fontSizePerRole?.[role];
    if (sizeScale && sizeScale !== 1) {
      props.push(`zoom: ${sizeScale}`);
    }
    const lineH = c.lineHeightPerRole?.[role];
    if (lineH && lineH !== 1) {
      props.push(`line-height: ${(1.2 * lineH).toFixed(2)} !important`);
    }
    if (props.length > 0) {
      lines.push(`${sel} { ${props.join("; ")}; }`);
    }
    // Per-role position offset (X/Y in mm).
    const offset = c.layoutOffsetPerRole?.[role];
    if (offset && (offset.x !== 0 || offset.y !== 0)) {
      const totalX = (dx ?? 0) + offset.x;
      const totalY = (dy ?? 0) + offset.y;
      lines.push(
        `${sel} { transform: translate(${totalX}mm, ${totalY}mm) !important; }`,
      );
    }
    // Effect rules
    const effectId = c.fontEffectPerRole?.[role];
    const effect = getFontEffect(effectId);
    if (effect.id !== "none" && effect.rules) {
      lines.push(`${sel} { ${effect.rules} }`);
    }
  }

  // Layer offset is now combined into the unified [data-role] transform
  // above. data-content-shift wrappers (used by some templates) still get
  // the offset for backward compatibility.
  if (dx !== 0 || dy !== 0) {
    lines.push(
      `[${scopeAttr}] [data-content-shift] { transform: translate(${dx}mm, ${dy}mm) !important; }`,
    );
  }

  // 一括整列モード（bulkTextAlign）
  // テンプレは grid/flex/inline-flex の混在で構成されているため、
  // text-align だけ・width:100% だけでは「動かない項目」が出る。
  // ここでは複数の戦略を組み合わせて、ほぼ全項目をきちんと整列させる:
  //   1. text-align: テキスト要素そのものの並び
  //   2. justify-content / justify-items: flex/grid 子の並び
  //   3. justify-self: grid セル内での自分自身の位置
  //   4. margin-{left|right}: auto: flex/block 子のコンテナ内位置
  //   5. flex 親（name+nameEn を内包）の justify-content も合わせる
  if (c.bulkTextAlign) {
    const align = c.bulkTextAlign; // "left" | "center" | "right"
    const flexPos =
      align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
    const gridPos =
      align === "center" ? "center" : align === "right" ? "end" : "start";
    // 全体: テキスト整列 + grid/flex セル内整列
    lines.push(
      `[${scopeAttr}] [data-role] { text-align: ${align} !important; justify-self: ${gridPos} !important; justify-items: ${gridPos} !important; }`,
    );
    // 連絡先コンテナ自身も整列方向を反映（grid/flex 共通）
    lines.push(
      `[${scopeAttr}] [data-role="contact"] { justify-content: ${flexPos} !important; justify-items: ${gridPos} !important; }`,
    );
    // 連絡先の各行（phone/email/website/address/sns）は flex で構成されているので、
    // 行内の icon+text を整列方向に寄せる
    lines.push(
      `[${scopeAttr}] [data-role="contact"] > * { justify-content: ${flexPos} !important; }`,
    );
    // 氏名+ローマ字を flex で並べているテンプレ用 — 親 flex の整列方向を合わせる
    lines.push(
      `[${scopeAttr}] :has(> [data-role="name"]) { justify-content: ${flexPos} !important; }`,
    );
    // ブロック要素を片寄せするための margin auto（中央/右/左）
    if (align === "right") {
      lines.push(
        `[${scopeAttr}] [data-role] { margin-left: auto !important; margin-right: 0 !important; }`,
      );
    } else if (align === "center") {
      lines.push(
        `[${scopeAttr}] [data-role] { margin-left: auto !important; margin-right: auto !important; }`,
      );
    } else {
      lines.push(
        `[${scopeAttr}] [data-role] { margin-right: auto !important; margin-left: 0 !important; }`,
      );
    }
  }

  // 連絡先の見せ方を追記（icon/text/minimal 切替）
  const cpCss = generateContactPrefixCss(data, scopeAttr);
  if (cpCss) lines.push(cpCss);

  return lines.join("\n");
}
