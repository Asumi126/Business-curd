import { CardData } from "../lib/types";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function Brutalist({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 bg-[#fafaf5] text-neutral-900 grid grid-cols-[1fr_30mm]"
      style={{ fontFamily: "'JetBrains Mono', 'SF Mono', 'Menlo', monospace" }}
    >
      <div className="flex flex-col p-[6mm] border-r-[2mm] border-neutral-900 min-w-0">
        <div data-role="company" className="text-[7pt] tracking-[0.2em] uppercase border-b border-neutral-900 pb-[1mm]">
          {!d.customization.fineAdjust.hideTemplateExtras && "["}{d.company}{!d.customization.fineAdjust.hideTemplateExtras && "]"}
        </div>
        <div className="flex-1 flex flex-col justify-center mt-[3mm] min-w-0">
          <div data-role={d.nameEn ? "nameEn" : "name"} className="text-[22pt] font-black leading-[0.88] tracking-[-0.05em] uppercase min-w-0">
            {d.nameEn || d.nameJa}
          </div>
          <div data-role="name" className="text-[13pt] font-medium leading-tight mt-[1.5mm] min-w-0">
            {nameDisplay(d)}
          </div>
          <div data-role="title" className="text-[7pt] tracking-[0.18em] uppercase mt-[1.5mm] text-neutral-700 min-w-0">
            {!d.customization.fineAdjust.hideTemplateExtras && <span>▎ </span>}{d.title}
          </div>
        </div>
        <div data-role="contact" className="text-[6.5pt] leading-relaxed text-neutral-700 grid grid-cols-2 gap-x-[3mm] gap-y-[0.2mm] border-t border-neutral-900 pt-[1.5mm] min-w-0">
          {d.phone && <div className="min-w-0">{!d.customization.fineAdjust.hideTemplateExtras && <span>tel: </span>}{d.phone}</div>}
          {d.email && <div className="min-w-0">{!d.customization.fineAdjust.hideTemplateExtras && <span>email: </span>}{d.email}</div>}
          {d.website && <div className="col-span-2 min-w-0">{!d.customization.fineAdjust.hideTemplateExtras && <span>web: </span>}{d.website}</div>}
          {d.addressLine && <div className="col-span-2 min-w-0">{!d.customization.fineAdjust.hideTemplateExtras && <span>addr: </span>}{d.addressLine}</div>}
        </div>
      </div>
      <div className="bg-neutral-900 text-[#fafaf5] flex flex-col items-center justify-between py-[5mm] px-[3mm]">
        <Monogram data={d} size="14mm" bgColor="#fafaf5" fgColor="#0a0a0a" forceStyle="square" />
        {!d.customization.fineAdjust.hideTemplateExtras && (
          <div
            className="text-[6pt] tracking-[0.4em] uppercase text-center"
            style={{ writingMode: "vertical-rl" }}
          >
            BUSINESS CARD / {new Date().getFullYear()}
          </div>
        )}
        {!d.customization.fineAdjust.hideTemplateExtras && <div className="text-[20pt] font-black leading-none">→</div>}
      </div>
    </div>
  );
}
