import { CardData, CardTemplate } from "../lib/types";
import { QuoteIcon } from "../lib/icons";
import { resolveBackPalette } from "../lib/customization";

export function SloganBig({ data, template }: { data: CardData; template: CardTemplate }) {
  const swatch = resolveBackPalette(data, template.swatch);
  const slogan = data.tagline?.trim() || data.memo?.trim() || "";
  const back = data.customization.fineAdjust.backHidden;
  return (
    <div
      className="absolute inset-0 flex flex-col justify-between p-[8mm]"
      style={{ backgroundColor: swatch.bg, color: swatch.fg, fontFamily: "'Hiragino Mincho ProN', 'Times New Roman', serif" }}
    >
      <div className="flex items-center justify-between">
        <div data-role="company" className="text-[6.5pt] tracking-[0.4em] uppercase" style={{ color: swatch.accent }}>
          {data.company}
        </div>
        {!back.ornaments && (
          <QuoteIcon size="6mm" style={{ color: swatch.accent, opacity: 0.65 }} />
        )}
      </div>
      <div data-role="tagline" className="text-[16pt] font-light leading-[1.25] tracking-[-0.01em] italic">
        {slogan || (
          <span className="opacity-30 text-[10pt] not-italic">
            ここにスローガンを入力してください
          </span>
        )}
      </div>
      {data.nameJa && (
        <div data-role="name" className="text-[6.5pt] tracking-[0.3em] uppercase opacity-70 text-right">
          — {data.nameJa}
        </div>
      )}
    </div>
  );
}
