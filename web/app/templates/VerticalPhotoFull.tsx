import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, nameDisplay } from "./utils";

export function VerticalPhotoFull({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--c-bg, #0a0a0a)",
        color: "var(--c-fg, #fafafa)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div className="absolute inset-0">
        {data.profilePhoto ? (
          <img
            src={data.profilePhoto}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.85)" }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[7pt] text-neutral-400"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #1f1f1f 0 6px, #2a2a2a 6px 12px)" }}
          >
            画像
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.95) 100%)",
          }}
        />
      </div>

      <div className="relative flex-1 flex flex-col justify-end p-[5mm] min-w-0">
        {d.company && (
          <div data-role="company" className="text-[6.5pt] tracking-[0.4em] uppercase font-bold mb-[0.5mm] min-w-0" style={{ color: "var(--c-accent, #fde68a)" }}>
            {d.company}
          </div>
        )}
        {d.nameJa && (
          <div
            data-role="name"
            className="text-[18pt] font-bold leading-[0.95] tracking-[-0.02em] min-w-0"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
          >
            {nameDisplay(d)}
          </div>
        )}
        {d.nameEn && (
          <div data-role="nameEn" className="text-[6.5pt] tracking-[0.3em] uppercase mt-[0.3mm] min-w-0" style={{ color: "var(--c-muted, #d4d4d4)" }}>
            {d.nameEn}
          </div>
        )}
        {d.title && <div data-role="title" className="text-[7pt] mt-[0.5mm] italic min-w-0" style={{ opacity: 0.9 }}>{d.title}</div>}
        <div data-role="contact" className="mt-[1.5mm] text-[6pt] leading-[1.5] flex flex-col gap-y-[0.2mm] min-w-0" style={{ opacity: 0.85 }}>
          {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.1mm" className="shrink-0" />{d.phone}</span>}
          {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.1mm" className="shrink-0" />{d.email}</span>}
          {d.website && <span data-role="website" className="flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.1mm" className="shrink-0" />{d.website}</span>}
          {d.addressLine && <span data-role="address" className="flex items-center gap-[1mm] min-w-0"><Icon kind="pin" size="2.1mm" className="shrink-0" />{d.addressLine}</span>}
        </div>
      </div>
    </div>
  );
}
