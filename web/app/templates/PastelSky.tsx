import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function PastelSky({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[7mm]"
      style={{
        background: "linear-gradient(180deg, #dbeafe 0%, #fce7f3 100%)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 121" preserveAspectRatio="none">
        <ellipse cx="170" cy="18" rx="20" ry="6" fill="#ffffff" opacity="0.8" />
        <ellipse cx="155" cy="22" rx="14" ry="5" fill="#ffffff" opacity="0.6" />
        <ellipse cx="30" cy="100" rx="22" ry="6" fill="#ffffff" opacity="0.7" />
      </svg>
      <div className="absolute right-[5mm] top-[6mm] z-10">
        <Monogram data={d} size="10mm" bgColor="#7c3aed" fgColor="#ffffff" />
      </div>
      <div className="relative flex-1 flex flex-col justify-center text-[#1e3a8a] mt-[6mm] pr-[14mm] min-w-0">
        <div data-role="company" className="text-[7pt] tracking-[0.25em] text-[#7c3aed] uppercase font-semibold min-w-0">
          {d.company}
        </div>
        <div data-role="name" className="text-[19pt] font-semibold leading-tight tracking-[-0.01em] mt-[1mm] min-w-0">
          {nameDisplay(d)}
        </div>
        <div data-role="nameEn" className="text-[7.5pt] tracking-[0.16em] text-[#6366f1] mt-[0.5mm] min-w-0">
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[7.5pt] mt-[1mm] text-[#0ea5e9] min-w-0">{d.title}</div>
      </div>
      <div data-role="contact" className="relative text-[7pt] text-[#1e3a8a]/85 leading-relaxed grid grid-cols-2 gap-x-[3mm] gap-y-[0.4mm] min-w-0">
        {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.5mm" className="shrink-0" />{d.phone}</span>}
        {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.5mm" className="shrink-0" />{d.email}</span>}
        {d.website && <span data-role="website" className="col-span-2 flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.5mm" className="shrink-0" />{d.website}</span>}
        {d.addressLine && <span data-role="address" className="col-span-2 flex items-start gap-[1mm] min-w-0"><Icon kind="pin" size="2.5mm" className="shrink-0 mt-[0.4mm]" />{d.addressLine}</span>}
      </div>
    </div>
  );
}
