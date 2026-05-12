import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, nameDisplay } from "./utils";

export function PhotoFrame({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex p-[5mm]"
      style={{
        backgroundColor: "var(--c-bg, #f5f1e8)",
        color: "var(--c-fg, #1c1917)",
        fontFamily: "'Hiragino Mincho ProN', Georgia, serif",
      }}
    >
      <div
        className="rounded-md overflow-hidden shrink-0 border shadow-sm"
        style={{
          width: "26mm",
          height: "100%",
          borderColor: "var(--c-accent, #7c2d12)",
          borderWidth: "0.4mm",
        }}
      >
        {data.profilePhoto ? (
          <img src={data.profilePhoto} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[7pt] text-neutral-500"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #d4d4d4 0 6px, #e5e5e5 6px 12px)" }}
          >
            画像
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between pl-[5mm] py-[1mm]">
        <div>
          {d.company && (
            <div
              data-role="company"
              className="text-[6.5pt] tracking-[0.4em] uppercase"
              style={{ color: "var(--c-accent, #7c2d12)" }}
            >
              {d.company}
            </div>
          )}
        </div>

        <div>
          {d.nameJa && (
            <div data-role="name" className="text-[18pt] tracking-[0.05em] leading-tight">{nameDisplay(d)}</div>
          )}
          {d.nameEn && (
            <div
              data-role="nameEn"
              className="text-[7pt] tracking-[0.3em] mt-[0.5mm] italic"
              style={{ color: "var(--c-muted, #737373)" }}
            >
              {d.nameEn}
            </div>
          )}
          {d.title && (
            <div data-role="title" className="text-[7.5pt] mt-[1mm]" style={{ opacity: 0.85 }}>
              {d.title}
            </div>
          )}
        </div>

        <div
          data-role="contact"
          className="text-[6.5pt] tracking-wide leading-[1.5] grid gap-y-[0.3mm] pt-[1.5mm]"
          style={{
            borderTop: "1px solid color-mix(in srgb, var(--c-accent, #7c2d12) 25%, transparent)",
            color: "var(--c-fg, #1c1917)",
            opacity: 0.85,
            fontFamily: "'Helvetica Neue', system-ui, sans-serif",
          }}
        >
          {d.phone && (
            <div data-role="phone" className="flex items-center gap-[1mm]">
              <Icon kind="phone" size="2.2mm" style={{ color: "var(--c-accent, #7c2d12)" }} />
              {d.phone}
            </div>
          )}
          {d.email && (
            <div data-role="email" className="flex items-center gap-[1mm]">
              <Icon kind="mail" size="2.2mm" style={{ color: "var(--c-accent, #7c2d12)" }} />
              {d.email}
            </div>
          )}
          {d.website && (
            <div data-role="website" className="flex items-center gap-[1mm]">
              <Icon kind="web" size="2.2mm" style={{ color: "var(--c-accent, #7c2d12)" }} />
              {d.website}
            </div>
          )}
          {d.addressLine && (
            <div data-role="address" className="flex items-center gap-[1mm]">
              <Icon kind="pin" size="2.2mm" style={{ color: "var(--c-accent, #7c2d12)" }} />
              {d.addressLine}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
