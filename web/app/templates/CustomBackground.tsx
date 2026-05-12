import { CardData } from "../lib/types";
import { fallback, nameDisplay } from "./utils";

/** hex + alpha → rgba */
function hexA(hex: string, alpha: number): string {
  const m = hex.replace("#", "").trim();
  const norm = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (norm.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(norm.slice(0, 2), 16);
  const g = parseInt(norm.slice(2, 4), 16);
  const b = parseInt(norm.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function CustomBackground({ data }: { data: CardData }) {
  const d = fallback(data);
  const hasBg = !!data.customBackground;
  const opacity = data.customBackgroundOpacity ?? 1;
  const align = data.customization.customBgTextAlign ?? "bottom-left";
  const dx = data.customization.customBgTextOffsetXmm ?? 0;
  const dy = data.customization.customBgTextOffsetYmm ?? 0;

  // Map the 9-point anchor to flex positioning + text alignment
  const [vert, horiz] = align.split("-") as [
    "top" | "middle" | "bottom",
    "left" | "center" | "right",
  ];
  const justify =
    vert === "top" ? "flex-start" : vert === "middle" ? "center" : "flex-end";
  const items =
    horiz === "left" ? "flex-start" : horiz === "center" ? "center" : "flex-end";
  const textAlign: "left" | "center" | "right" =
    horiz === "left" ? "left" : horiz === "center" ? "center" : "right";

  return (
    <div
      className="absolute inset-0 flex flex-col p-[7mm]"
      style={{
        backgroundColor: hasBg ? "transparent" : "var(--c-bg, #ffffff)",
        color: "var(--c-fg, #171717)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
        justifyContent: justify,
        alignItems: items,
      }}
    >
      {hasBg && (
        <img
          src={data.customBackground}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity }}
        />
      )}
      {hasBg && data.customization.overlayEnabled && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: hexA(
              data.customization.overlayColor ?? "#000000",
              data.customization.overlayOpacity ?? 0.4,
            ),
          }}
        />
      )}
      {!hasBg && (
        <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
          <div className="text-[8pt] text-neutral-400 leading-relaxed">
            ここに背景画像を<br />アップロードしてください
          </div>
        </div>
      )}
      {/* Content block. Width is bounded so contact info wraps cleanly within
          the chosen alignment, and a strong textShadow keeps everything
          readable against any background image. Content list is identical
          across alignments — only justification changes. */}
      <div
        className="relative flex flex-col gap-[1.2mm]"
        style={{
          padding: hasBg ? "3mm" : "0",
          background: undefined,
          borderRadius: "1.5mm",
          textAlign,
          alignItems: items,
          transform: dx === 0 && dy === 0 ? undefined : `translate(${dx}mm, ${dy}mm)`,
          maxWidth: "100%",
          width: "100%",
        }}
      >
        {d.company && (
          <div
            data-role="company"
            className="text-[7pt] tracking-[0.3em] uppercase font-bold"
            style={{
              color: hasBg ? "#ffffff" : "var(--c-accent, #171717)",
              textShadow: hasBg ? "0 1px 3px rgba(0,0,0,0.7)" : undefined,
            }}
          >
            {d.company}
          </div>
        )}
        {d.nameJa && (
          <div
            data-role="name"
            className="text-[18pt] font-bold leading-[1.05] tracking-[-0.02em]"
            style={{
              color: hasBg ? "#ffffff" : "var(--c-fg, #171717)",
              textShadow: hasBg ? "0 1px 3px rgba(0,0,0,0.7)" : undefined,
            }}
          >
            {nameDisplay(d)}
          </div>
        )}
        {d.nameEn && (
          <div
            data-role="nameEn"
            className="text-[6.5pt] tracking-[0.18em] uppercase"
            style={{
              color: hasBg ? "rgba(255,255,255,0.85)" : "var(--c-muted, #737373)",
              textShadow: hasBg ? "0 1px 2px rgba(0,0,0,0.6)" : undefined,
            }}
          >
            {d.nameEn}
          </div>
        )}
        {d.title && (
          <div
            data-role="title"
            className="text-[7.5pt] leading-snug"
            style={{
              color: hasBg ? "#ffffff" : "var(--c-fg, #171717)",
              opacity: hasBg ? 1 : 0.92,
              textShadow: hasBg ? "0 1px 2px rgba(0,0,0,0.6)" : undefined,
            }}
          >
            {d.title}
          </div>
        )}

        {/*
          連絡先リスト — カスタム背景は装飾を一切付けず、文字のみ。
          ユーザー要望: 「文字以外のデザインは不要。線・アイコンも削除」
          アクセント線とアイコンを完全に廃止し、テキストだけ縦並びにする。
        */}
        <div
          data-role="contact"
          className="text-[6.5pt] leading-[1.45] flex flex-col gap-y-[0.4mm]"
          style={{
            color: hasBg ? "rgba(255,255,255,0.95)" : "var(--c-muted, #737373)",
            textShadow: hasBg ? "0 1px 2px rgba(0,0,0,0.6)" : undefined,
            alignItems: items,
            width: "100%",
            marginTop: "1mm",
          }}
        >
          {d.phone && <div className="min-w-0" style={{ textAlign }}>{d.phone}</div>}
          {d.email && <div className="min-w-0" style={{ textAlign }}>{d.email}</div>}
          {d.website && <div className="min-w-0" style={{ textAlign }}>{d.website}</div>}
          {d.addressLine && (
            <div className="min-w-0 max-w-full" style={{ textAlign }}>
              {d.addressLine}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
