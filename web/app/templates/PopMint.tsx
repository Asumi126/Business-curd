import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function PopMint({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div className="absolute inset-0 bg-[#ccfbf1] text-neutral-900 flex flex-col p-[6mm] overflow-hidden" style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 121" preserveAspectRatio="none">
        <path d="M0 95 Q50 75 100 95 T200 95 L200 121 L0 121 Z" fill="#fbcfe8" />
        <circle cx="170" cy="20" r="14" fill="#a7f3d0" />
        <circle cx="160" cy="22" r="10" fill="#fbcfe8" opacity="0.7" />
      </svg>
      <div className="absolute left-[3mm] top-[3mm] z-10">
        <Monogram data={d} size="11mm" bgColor="#fbcfe8" fgColor="#831843" />
      </div>
      <div className="relative flex-1 flex flex-col justify-center mt-[8mm] pl-[12mm] min-w-0">
        <div data-role="company" className="text-[7.5pt] tracking-[0.25em] text-[#0f766e] font-bold uppercase min-w-0">
          {d.company}
        </div>
        <div data-role="name" className="text-[20pt] font-bold leading-tight mt-[1mm] tracking-[-0.02em] min-w-0" style={{ color: "#134e4a" }}>
          {nameDisplay(d)}
        </div>
        <div data-role="nameEn" className="text-[7pt] tracking-[0.2em] text-[#14b8a6] font-medium mt-[0.5mm] uppercase min-w-0">
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[7.5pt] mt-[1mm] text-[#831843] font-semibold min-w-0">{d.title}</div>
      </div>
      <div data-role="contact" className="relative text-[7pt] leading-relaxed text-[#134e4a] grid grid-cols-2 gap-x-[3mm] gap-y-[0.4mm] min-w-0">
        {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.5mm" className="shrink-0" />{d.phone}</span>}
        {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.5mm" className="shrink-0" />{d.email}</span>}
        {d.website && <span data-role="website" className="col-span-2 flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.5mm" className="shrink-0" />{d.website}</span>}
        {d.addressLine && <span data-role="address" className="col-span-2 flex items-start gap-[1mm] min-w-0"><Icon kind="pin" size="2.5mm" className="shrink-0 mt-[0.4mm]" />{d.addressLine}</span>}
      </div>
    </div>
  );
}
