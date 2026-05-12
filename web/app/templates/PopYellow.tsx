import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function PopYellow({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div className="absolute inset-0 bg-[#fde047] text-neutral-900 flex flex-col p-[6mm] overflow-hidden" style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 121" preserveAspectRatio="none">
        <circle cx="195" cy="-5" r="40" fill="#000" />
        <circle cx="180" cy="115" r="14" fill="#000" />
        <rect x="0" y="100" width="50" height="6" fill="#000" />
        <path d="M35 8 Q40 18 35 28" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M28 8 Q33 18 28 28" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <div className="absolute right-[2mm] top-[2mm] z-10">
        <Monogram data={d} size="13mm" bgColor="#fde047" fgColor="#0a0a0a" forceStyle={d.logoDataUrl ? "circle" : "square"} />
      </div>
      <div className="relative flex-1 flex flex-col justify-end mt-[14mm] pr-[16mm] min-w-0">
        <div data-role="company" className="text-[8pt] tracking-[0.25em] uppercase font-bold min-w-0">{d.company}</div>
        <div data-role="name" className="text-[24pt] font-black leading-[0.9] tracking-[-0.04em] mt-[1mm] min-w-0">
          {nameDisplay(d)}
        </div>
        <div className="mt-[1.5mm] flex items-center gap-[2mm] min-w-0">
          <span data-role="title" className="bg-black text-[#fde047] px-[2.5mm] py-[0.8mm] rounded-full text-[7pt] font-bold tracking-wide max-w-full inline-block">
            {d.title}
          </span>
        </div>
      </div>
      <div data-role="contact" className="relative text-[7pt] font-semibold leading-relaxed mt-[2.5mm] grid grid-cols-2 gap-x-[3mm] gap-y-[0.5mm] min-w-0">
        {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.6mm" className="shrink-0" />{d.phone}</span>}
        {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.6mm" className="shrink-0" />{d.email}</span>}
        {d.website && <span data-role="website" className="col-span-2 flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.6mm" className="shrink-0" />{d.website}</span>}
        {d.addressLine && <span data-role="address" className="col-span-2 flex items-start gap-[1mm] min-w-0"><Icon kind="pin" size="2.6mm" className="shrink-0 mt-[0.4mm]" />{d.addressLine}</span>}
      </div>
    </div>
  );
}
