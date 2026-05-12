import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function SoftRose({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[7mm]"
      style={{ backgroundColor: "#fdf2f8", fontFamily: "'Hiragino Mincho ProN', Georgia, serif" }}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 121" preserveAspectRatio="none">
        <circle cx="195" cy="0" r="50" fill="#fbcfe8" opacity="0.55" />
        <circle cx="170" cy="14" r="22" fill="#f9a8d4" opacity="0.45" />
        <circle cx="10" cy="120" r="20" fill="#fbcfe8" opacity="0.6" />
      </svg>
      <div className="absolute right-[6mm] top-[6mm] z-10">
        <Monogram data={d} size="10mm" bgColor="#831843" fgColor="#fdf2f8" />
      </div>
      <div className="relative flex-1 flex flex-col justify-center mt-[5mm] pr-[13mm] min-w-0">
        <div data-role="company" className="text-[7.5pt] tracking-[0.25em] text-[#9d174d] uppercase font-medium min-w-0">
          {d.company}
        </div>
        <div data-role="name" className="text-[19pt] font-semibold leading-tight tracking-[0.01em] mt-[1mm] text-[#831843] min-w-0">
          {nameDisplay(d)}
        </div>
        <div data-role="nameEn" className="text-[7.5pt] tracking-[0.18em] text-[#be185d] italic mt-[0.5mm] min-w-0">
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[7.5pt] mt-[1mm] text-[#9f1239] min-w-0">{d.title}</div>
      </div>
      <div data-role="contact" className="relative text-[7pt] text-[#831843]/85 leading-relaxed grid grid-cols-2 gap-x-[3mm] gap-y-[0.4mm] min-w-0" style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}>
        {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.5mm" className="shrink-0" />{d.phone}</span>}
        {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.5mm" className="shrink-0" />{d.email}</span>}
        {d.website && <span data-role="website" className="col-span-2 flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.5mm" className="shrink-0" />{d.website}</span>}
        {d.addressLine && <span data-role="address" className="col-span-2 flex items-start gap-[1mm] min-w-0"><Icon kind="pin" size="2.5mm" className="shrink-0 mt-[0.4mm]" />{d.addressLine}</span>}
      </div>
    </div>
  );
}
