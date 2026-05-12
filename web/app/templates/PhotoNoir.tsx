import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, nameDisplay } from "./utils";

export function PhotoNoir({ data }: { data: CardData }) {
  const d = fallback(data);
  // Allow user to override the dark gradient overlay (color + opacity) via
  // customization. When `overlayEnabled === false` we drop the overlay.
  // Default = the original cinematic black gradient.
  const c = d.customization;
  const ovColor = c.overlayColor ?? "#000000";
  const ovAlpha = c.overlayOpacity ?? 0.95;
  const ovEnabled = c.overlayEnabled !== false; // default true
  const overlayBg = ovEnabled
    ? `linear-gradient(180deg, ${hexA(ovColor, ovAlpha * 0.2)} 0%, ${hexA(ovColor, ovAlpha * 0.6)} 60%, ${hexA(ovColor, ovAlpha)} 100%)`
    : undefined;
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--c-bg, #0a0a0a)",
        color: "var(--c-fg, #fafafa)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        {data.profilePhoto ? (
          <img
            src={data.profilePhoto}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: "grayscale(0.6) contrast(1.1) brightness(0.85)" }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[7pt] text-neutral-400"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #1f1f1f 0 6px, #2a2a2a 6px 12px)" }}
          >
            画像
          </div>
        )}
        {overlayBg && (
          <div className="absolute inset-0" style={{ background: overlayBg }} />
        )}
      </div>

      <div className="relative flex-1 flex flex-col justify-end p-[6mm]">
        {d.company && (
          <div
            data-role="company"
            className="text-[7pt] tracking-[0.4em] uppercase font-bold mb-[0.5mm]"
            style={{ color: "var(--c-accent, #fde68a)" }}
          >
            {d.company}
          </div>
        )}
        {d.nameJa && (
          <div
            data-role="name"
            className="text-[22pt] font-bold leading-[0.95] tracking-[-0.03em]"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
          >
            {nameDisplay(d)}
          </div>
        )}
        {d.nameEn && (
          <div
            data-role="nameEn"
            className="text-[7pt] tracking-[0.3em] uppercase mt-[0.5mm]"
            style={{ color: "var(--c-muted, #a3a3a3)" }}
          >
            {d.nameEn}
          </div>
        )}
        {d.title && (
          <div data-role="title" className="text-[7.5pt] mt-[1mm] italic" style={{ opacity: 0.9 }}>
            {d.title}
          </div>
        )}
        <div
          data-role="contact"
          className="mt-[2mm] text-[6.5pt] leading-[1.5] flex flex-wrap gap-x-[3mm] gap-y-[0.3mm]"
          style={{ opacity: 0.85 }}
        >
          {d.phone && (
            <span data-role="phone" className="flex items-center gap-[1mm]">
              <Icon kind="phone" size="2.2mm" />
              {d.phone}
            </span>
          )}
          {d.email && (
            <span data-role="email" className="flex items-center gap-[1mm]">
              <Icon kind="mail" size="2.2mm" />
              {d.email}
            </span>
          )}
          {d.website && (
            <span data-role="website" className="flex items-center gap-[1mm]">
              <Icon kind="web" size="2.2mm" />
              {d.website}
            </span>
          )}
          {d.addressLine && (
            <span data-role="address" className="flex items-center gap-[1mm]">
              <Icon kind="pin" size="2.2mm" />
              {d.addressLine}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Convert hex+alpha into rgba(...) string for inline CSS. */
function hexA(hex: string, alpha: number): string {
  const m = hex.replace("#", "").trim();
  const norm = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (norm.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(norm.slice(0, 2), 16);
  const g = parseInt(norm.slice(2, 4), 16);
  const b = parseInt(norm.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
