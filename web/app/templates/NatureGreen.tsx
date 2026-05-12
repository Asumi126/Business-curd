import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function NatureGreen({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div className="absolute inset-0 flex" style={{ backgroundColor: "#f7f4ec", fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', Georgia, serif" }}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 200 121"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="nature-grad" x1="100%" y1="100%" x2="50%" y2="40%">
            <stop offset="0%" stopColor="#14532d" />
            <stop offset="60%" stopColor="#166534" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path d="M200 121 L200 40 Q140 60 110 121 Z" fill="url(#nature-grad)" />
        <g transform="translate(155 78)" stroke="#86efac" strokeWidth="0.6" fill="none">
          <path d="M0 0 C-8 -10 -8 -22 0 -32 C8 -22 8 -10 0 0 Z" fill="#86efac" fillOpacity="0.35" />
          <line x1="0" y1="-30" x2="0" y2="0" />
          <path d="M0 -22 L-7 -16" />
          <path d="M0 -22 L7 -16" />
          <path d="M0 -12 L-5 -7" />
          <path d="M0 -12 L5 -7" />
        </g>
      </svg>
      <div className="absolute left-[5mm] top-[5mm] z-10">
        <Monogram data={d} size="11mm" bgColor="#15803d" fgColor="#f7f4ec" />
      </div>
      <div className="relative flex-1 flex flex-col justify-center pl-[5mm] pr-[30mm] py-[6mm] mt-[12mm] min-w-0">
        <div data-role="company" className="text-[7pt] tracking-[0.25em] text-[#15803d] font-semibold uppercase min-w-0">
          {d.company}
        </div>
        <div data-role="name" className="text-[18pt] font-medium tracking-[-0.01em] leading-tight mt-[1mm] text-[#14532d] min-w-0">
          {nameDisplay(d)}
        </div>
        <div data-role="nameEn" className="text-[7pt] tracking-[0.18em] text-[#65a30d] mt-[0.5mm] italic min-w-0">
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[7.5pt] text-neutral-700 mt-[1.5mm] min-w-0">{d.title}</div>
        <div data-role="contact" className="mt-[2mm] text-[6.5pt] text-neutral-700 leading-relaxed grid gap-y-[0.3mm] min-w-0">
          {d.phone && <div data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.4mm" className="text-[#15803d] shrink-0" />{d.phone}</div>}
          {d.email && <div data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.4mm" className="text-[#15803d] shrink-0" />{d.email}</div>}
          {d.website && <div data-role="website" className="flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.4mm" className="text-[#15803d] shrink-0" />{d.website}</div>}
          {d.addressLine && <div data-role="address" className="flex items-start gap-[1mm] min-w-0"><Icon kind="pin" size="2.4mm" className="text-[#15803d] shrink-0 mt-[0.4mm]" />{d.addressLine}</div>}
        </div>
      </div>
    </div>
  );
}
