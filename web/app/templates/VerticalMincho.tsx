import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, nameDisplay } from "./utils";

export function VerticalMincho({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[6mm]"
      style={{
        backgroundColor: "var(--c-bg, #f5f1e8)",
        color: "var(--c-fg, #171717)",
        fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
        backgroundImage:
          "radial-gradient(ellipse at top, color-mix(in srgb, var(--c-accent, #7c2d12) 6%, transparent), transparent 60%), radial-gradient(ellipse at bottom, color-mix(in srgb, var(--c-fg, #171717) 4%, transparent), transparent 70%)",
      }}
    >
      <div data-role="company" className="text-[6.5pt] tracking-[0.3em] mb-[3mm] min-w-0" style={{ color: "var(--c-accent, #7c2d12)" }}>
        {d.company}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden" style={{ writingMode: "vertical-rl" as const }}>
        <div data-role="name" className="text-[18pt] tracking-[0.15em] leading-tight max-h-full">{nameDisplay(d)}</div>
        <div data-role="title" className="text-[6.8pt] tracking-[0.25em] mt-[3mm] max-h-full" style={{ color: "var(--c-muted, #737373)" }}>
          {d.title}
        </div>
      </div>
      <div data-role="contact" className="text-[6.5pt] tracking-wider leading-[1.6] flex flex-col gap-[0.3mm] mt-[3mm] pt-[1.5mm] min-w-0" style={{ borderTop: "1px solid color-mix(in srgb, var(--c-accent, #7c2d12) 25%, transparent)", fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}>
        {d.phone && <div data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.3mm" className="shrink-0" style={{ color: "var(--c-accent, #7c2d12)" }} />{d.phone}</div>}
        {d.email && <div data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.3mm" className="shrink-0" style={{ color: "var(--c-accent, #7c2d12)" }} />{d.email}</div>}
        {d.addressLine && <div data-role="address" className="flex items-start gap-[1mm] min-w-0"><Icon kind="pin" size="2.3mm" className="shrink-0 mt-[0.3mm]" style={{ color: "var(--c-accent, #7c2d12)" }} />{d.addressLine}</div>}
        {d.website && <div data-role="website" className="flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.3mm" className="shrink-0" style={{ color: "var(--c-accent, #7c2d12)" }} />{d.website}</div>}
      </div>
    </div>
  );
}
