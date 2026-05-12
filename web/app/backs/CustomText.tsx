import { CardData, CardTemplate } from "../lib/types";
import { getFont, resolveBackPalette } from "../lib/customization";

/**
 * Fully customizable text-based back. The user provides any number of lines,
 * each with its own font / size / alignment / bold / italic / color. Useful
 * for messages, slogans, custom company info, multi-language tagline, etc.
 */
export function CustomText({
  data,
  template,
}: {
  data: CardData;
  template: CardTemplate;
}) {
  const swatch = resolveBackPalette(data, template.swatch);
  const lines = data.backCustomLines ?? [];

  return (
    <div
      className="absolute inset-0 flex flex-col justify-center p-[6mm]"
      style={{
        backgroundColor: swatch.bg,
        color: swatch.fg,
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      {lines.length === 0 ? (
        <div
          className="flex-1 flex items-center justify-center text-center text-[8pt] leading-relaxed"
          style={{ color: swatch.muted, opacity: 0.7 }}
        >
          ここに自由なテキストが入ります。
          <br />
          ステップ8（裏面選択）の編集欄から
          <br />
          行を追加・編集してください。
        </div>
      ) : (
        <div className="flex flex-col gap-[1mm]">
          {lines.map((line) => {
            const font = line.fontKey === "auto" ? null : getFont(line.fontKey);
            return (
              <div
                key={line.id}
                style={{
                  fontFamily: font?.cssFamily,
                  fontWeight: line.bold ? 700 : font?.weight ?? 400,
                  fontStyle: line.italic ? "italic" : "normal",
                  fontSize: `${line.sizePt}pt`,
                  textAlign: line.align,
                  letterSpacing: font?.letterSpacing,
                  color: line.color ?? swatch.fg,
                  lineHeight: 1.3,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {line.text || "（空行）"}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
