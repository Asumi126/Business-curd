import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function Risograph({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div className="absolute inset-0 bg-[#fff9e6] text-neutral-900 flex flex-col p-[7mm] overflow-hidden" style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 121" preserveAspectRatio="none">
        <circle cx="40" cy="100" r="55" fill="#ff5252" opacity="0.55" style={{ mixBlendMode: "multiply" }} />
        <circle cx="170" cy="20" r="50" fill="#0080ff" opacity="0.45" style={{ mixBlendMode: "multiply" }} />
        <circle cx="42" cy="98" r="55" fill="#ff5252" opacity="0.45" style={{ mixBlendMode: "multiply" }} />
      </svg>
      <div className="absolute right-[4mm] top-[4mm] z-10">
        <Monogram data={d} size="12mm" bgColor="#ff5252" fgColor="#fff9e6" forceStyle="square" />
      </div>
      <div className="relative flex-1 flex flex-col justify-center mt-[6mm] pr-[14mm] min-w-0">
        <div data-role="company" className="text-[7pt] tracking-[0.25em] uppercase font-extrabold min-w-0">{d.company}</div>
        <div
          data-role="name"
          className="text-[22pt] font-black leading-[0.92] tracking-[-0.03em] mt-[1mm] min-w-0"
          style={{ color: "#0080ff", textShadow: "1px 1px 0 #ff5252" }}
        >
          {nameDisplay(d)}
        </div>
        <div data-role="nameEn" className="text-[7pt] tracking-[0.2em] uppercase text-[#ff5252] mt-[0.5mm] font-bold min-w-0">
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[7.5pt] mt-[1mm] font-bold min-w-0">{d.title}</div>
      </div>
      <div data-role="contact" className="relative text-[7pt] font-medium leading-relaxed grid grid-cols-2 gap-x-[3mm] gap-y-[0.4mm] min-w-0">
        {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.5mm" className="shrink-0" />{d.phone}</span>}
        {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.5mm" className="shrink-0" />{d.email}</span>}
        {d.website && <span data-role="website" className="col-span-2 flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.5mm" className="shrink-0" />{d.website}</span>}
        {d.addressLine && <span data-role="address" className="col-span-2 flex items-start gap-[1mm] min-w-0"><Icon kind="pin" size="2.5mm" className="shrink-0 mt-[0.4mm]" />{d.addressLine}</span>}
      </div>
    </div>
  );
}
