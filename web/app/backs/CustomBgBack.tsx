import { CardData, CardTemplate } from "../lib/types";
import { resolveBackPalette } from "../lib/customization";

/** Convert hex+alpha → rgba(...) */
function hexA(hex: string, alpha: number): string {
  const m = hex.replace("#", "").trim();
  const norm = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (norm.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(norm.slice(0, 2), 16);
  const g = parseInt(norm.slice(2, 4), 16);
  const b = parseInt(norm.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Custom background back. Lets the user place any uploaded image as the
 * back-side background, with optional overlay tint and centered text
 * (slogan / message).
 */
export function CustomBgBack({
  data,
  template,
}: {
  data: CardData;
  template: CardTemplate;
}) {
  const swatch = resolveBackPalette(data, template.swatch);
  const bg = data.backCustomBackground;
  const opacity = data.backCustomBackgroundOpacity ?? 1;
  const c = data.customization;
  const ovEnabled = c.overlayEnabled !== false;
  const ovColor = c.overlayColor ?? "#000000";
  const ovAlpha = c.overlayOpacity ?? 0.4;

  return (
    <div
      className="absolute inset-0 flex flex-col p-[6mm]"
      style={{
        backgroundColor: bg ? "transparent" : swatch.bg,
        color: swatch.fg,
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      {bg ? (
        <img
          src={bg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
          <div className="text-[8pt] text-neutral-400 leading-relaxed">
            ここに背景画像を
            <br />
            アップロードしてください
          </div>
        </div>
      )}
      {bg && ovEnabled && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: hexA(ovColor, ovAlpha) }}
        />
      )}

      {/*
        オーバーレイ文字は既定では非表示。
        data.backCustomBgShowText が明示的に true のときのみ
        tagline / backText / backMessage を中央に重ねて描画する。
        これにより、カスタム背景を選んだ直後に「ああああ」等の
        既存テキストが混入しないクリーンな初期表示になる。
      */}
      <div className="relative flex-1 flex flex-col justify-center items-center text-center">
        {data.backCustomBgShowText &&
          (data.tagline || data.backText || data.backMessage) && (
          <div className="space-y-[2mm] max-w-full">
            {data.tagline && (
              <div
                data-role="tagline"
                className="text-[12pt] font-bold leading-tight"
                style={{
                  color: bg ? "#ffffff" : swatch.fg,
                  textShadow: bg ? "0 1px 3px rgba(0,0,0,0.6)" : undefined,
                }}
              >
                {data.tagline}
              </div>
            )}
            {data.backText && (
              <div
                className="text-[7pt] tracking-[0.3em] uppercase font-semibold"
                style={{
                  color: bg ? "#ffffff" : swatch.accent,
                  textShadow: bg ? "0 1px 2px rgba(0,0,0,0.5)" : undefined,
                }}
              >
                {data.backText}
              </div>
            )}
            {data.backMessage && (
              <div
                className="text-[7.5pt] italic leading-relaxed"
                style={{
                  color: bg ? "#ffffff" : swatch.muted,
                  textShadow: bg ? "0 1px 2px rgba(0,0,0,0.5)" : undefined,
                  opacity: 0.95,
                }}
              >
                {data.backMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
