import { CardData } from "../lib/types";
import { fallback, nameDisplay } from "./utils";

export function TechMono({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[6mm]"
      style={{
        backgroundColor: "var(--c-bg, #0a0e1a)",
        color: "var(--c-fg, #a3e635)",
        fontFamily: "'SF Mono', 'Menlo', monospace",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.15,
          backgroundImage:
            "linear-gradient(color-mix(in srgb, var(--c-fg, #a3e635) 50%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--c-fg, #a3e635) 50%, transparent) 1px, transparent 1px)",
          backgroundSize: "8mm 8mm",
        }}
      />
      {/* Decorative accent line at the top — pure visual, no text */}
      <div
        className="absolute top-[3.5mm] left-[6mm] right-[6mm] h-px"
        style={{ backgroundColor: "color-mix(in srgb, var(--c-accent, #86efac) 60%, transparent)" }}
      />
      <div className="relative min-w-0">
        <div
          data-role="name"
          className="text-[16pt] font-bold leading-tight min-w-0"
          style={{ color: "color-mix(in srgb, var(--c-fg, #a3e635) 20%, #ffffff)" }}
        >
          {nameDisplay(d)}
        </div>
        {d.nameEn && (
          <div
            data-role="nameEn"
            className="text-[8pt] mt-[0.5mm] tracking-[0.15em] min-w-0"
            style={{ color: "var(--c-accent, #86efac)" }}
          >
            {d.nameEn}
          </div>
        )}
      </div>
      <div className="relative flex-1 flex flex-col justify-end gap-[0.5mm] text-[7pt] min-w-0">
        {d.title && (
          <div data-role="title" className="min-w-0" style={{ color: "color-mix(in srgb, var(--c-fg, #a3e635) 20%, #ffffff)" }}>
            {d.title}
          </div>
        )}
        {d.company && (
          <div data-role="company" className="min-w-0" style={{ color: "color-mix(in srgb, var(--c-fg, #a3e635) 20%, #ffffff)" }}>
            {d.company}
          </div>
        )}
        {(d.phone || d.email || d.website || d.addressLine) && (
          <div
            className="my-[0.6mm] h-px w-[12mm]"
            style={{ backgroundColor: "color-mix(in srgb, var(--c-accent, #86efac) 50%, transparent)" }}
          />
        )}
        <div data-role="contact" className="flex flex-col gap-[0.5mm] min-w-0">
          {d.phone && (
            <div className="min-w-0" style={{ color: "color-mix(in srgb, var(--c-fg, #a3e635) 20%, #ffffff)" }}>{d.phone}</div>
          )}
          {d.email && (
            <div className="min-w-0" style={{ color: "color-mix(in srgb, var(--c-fg, #a3e635) 20%, #ffffff)" }}>{d.email}</div>
          )}
          {d.website && (
            <div className="min-w-0" style={{ color: "color-mix(in srgb, var(--c-fg, #a3e635) 20%, #ffffff)" }}>{d.website}</div>
          )}
          {d.addressLine && (
            <div className="min-w-0" style={{ color: "color-mix(in srgb, var(--c-fg, #a3e635) 20%, #ffffff)" }}>{d.addressLine}</div>
          )}
          {d.sns.github && (
            <div className="min-w-0" style={{ color: "color-mix(in srgb, var(--c-fg, #a3e635) 20%, #ffffff)" }}>{d.sns.github}</div>
          )}
        </div>
      </div>
    </div>
  );
}
