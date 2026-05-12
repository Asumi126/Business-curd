import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, nameDisplay } from "./utils";

export function PhotoFresh({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[6mm] overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, var(--c-bg, #f0f9ff) 0%, color-mix(in srgb, var(--c-bg, #f0f9ff) 60%, var(--c-accent, #06b6d4) 40%) 100%)",
        color: "var(--c-fg, #0c4a6e)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ backgroundColor: "color-mix(in srgb, var(--c-accent, #06b6d4) 25%, transparent)" }}
      />
      <div
        className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full pointer-events-none"
        style={{ backgroundColor: "color-mix(in srgb, var(--c-accent, #06b6d4) 18%, transparent)" }}
      />

      <div className="relative flex items-start gap-[4mm]">
        <div
          className="rounded-full overflow-hidden shrink-0 border-[1.5mm] shadow-lg"
          style={{ width: "24mm", height: "24mm", borderColor: "rgba(255,255,255,0.85)" }}
        >
          {data.profilePhoto ? (
            <img src={data.profilePhoto} alt="" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-[6pt] text-neutral-500"
              style={{ backgroundImage: "repeating-linear-gradient(45deg, #d4d4d4 0 6px, #e5e5e5 6px 12px)" }}
            >
              画像
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {d.company && (
            <div
              data-role="company"
              className="text-[7pt] tracking-[0.3em] uppercase font-bold min-w-0"
              style={{ color: "var(--c-accent, #0891b2)" }}
            >
              {d.company}
            </div>
          )}
          {d.nameJa && <div data-role="name" className="text-[16pt] font-bold leading-tight tracking-[-0.02em] mt-[0.5mm] min-w-0">{nameDisplay(d)}</div>}
          {d.nameEn && (
            <div
              data-role="nameEn"
              className="text-[7pt] tracking-[0.2em] uppercase mt-[0.5mm] min-w-0"
              style={{ color: "var(--c-muted, #64748b)" }}
            >
              {d.nameEn}
            </div>
          )}
          {d.title && <div data-role="title" className="text-[7.5pt] mt-[1mm] min-w-0" style={{ opacity: 0.85 }}>{d.title}</div>}
        </div>
      </div>

      <div
        data-role="contact"
        className="relative mt-auto pt-[2mm] text-[6.5pt] leading-[1.5] grid grid-cols-2 gap-x-[3mm] gap-y-[0.3mm] min-w-0"
        style={{
          color: "var(--c-fg, #0c4a6e)",
          opacity: 0.9,
          borderTop: "1px solid color-mix(in srgb, var(--c-fg, #0c4a6e) 15%, transparent)",
        }}
      >
        {d.phone && (
          <div data-role="phone" className="flex items-center gap-[1mm] min-w-0">
            <Icon kind="phone" size="2.2mm" className="shrink-0" />
            {d.phone}
          </div>
        )}
        {d.email && (
          <div data-role="email" className="flex items-center gap-[1mm] min-w-0">
            <Icon kind="mail" size="2.2mm" className="shrink-0" />
            {d.email}
          </div>
        )}
        {d.website && (
          <div data-role="website" className="flex items-center gap-[1mm] min-w-0">
            <Icon kind="web" size="2.2mm" className="shrink-0" />
            {d.website}
          </div>
        )}
        {d.addressLine && (
          <div data-role="address" className="flex items-start gap-[1mm] col-span-2 min-w-0">
            <Icon kind="pin" size="2.2mm" className="mt-[0.3mm] shrink-0" />
            {d.addressLine}
          </div>
        )}
      </div>
    </div>
  );
}
