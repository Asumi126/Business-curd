import { CardData } from "../lib/types";
import { fallback, nameDisplay } from "./utils";

export function BoldRed({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div className="absolute inset-0 bg-[#dc2626] text-white flex flex-col p-[6mm] overflow-hidden">
      {!d.customization.fineAdjust.hideTemplateExtras && (
        <>
          <div className="absolute -top-[5mm] -left-[5mm] w-[20mm] h-[20mm] bg-black rotate-12" />
          <div className="absolute -bottom-[5mm] -right-[5mm] w-[30mm] h-[8mm] bg-black -rotate-6" />
        </>
      )}
      <div className="relative flex-1 flex flex-col justify-end min-w-0">
        <div data-role="company" className="text-[9pt] font-black tracking-[0.2em] uppercase min-w-0">{d.company}</div>
        <div data-role="name" className="text-[22pt] font-black leading-none tracking-tight mt-[1mm] min-w-0">
          {nameDisplay(d)}
        </div>
        <div data-role="nameEn" className="text-[8pt] font-bold tracking-[0.12em] mt-[0.5mm] text-red-100 min-w-0">
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[8.5pt] font-bold mt-[1.5mm] text-yellow-300 min-w-0">{d.title}</div>
      </div>
      <div data-role="contact" className="relative text-[7pt] font-medium leading-relaxed space-y-[0.3mm] mt-[2mm] text-red-50 min-w-0">
        {d.phone && <div className="min-w-0">{!d.customization.fineAdjust.hideTemplateExtras && <span>TEL — </span>}{d.phone}</div>}
        {d.email && <div className="min-w-0">{!d.customization.fineAdjust.hideTemplateExtras && <span>MAIL — </span>}{d.email}</div>}
        {d.website && <div className="min-w-0">{!d.customization.fineAdjust.hideTemplateExtras && <span>WEB — </span>}{d.website}</div>}
        {d.addressLine && <div className="min-w-0">{!d.customization.fineAdjust.hideTemplateExtras && <span>ADDR — </span>}{d.addressLine}</div>}
      </div>
    </div>
  );
}
