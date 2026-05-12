import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function Boutique({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[7mm] text-[#fef3c7]"
      style={{
        backgroundColor: "#1a1a1a",
        fontFamily: "'Hiragino Mincho ProN', 'Times New Roman', serif",
      }}
    >
      {!d.customization.fineAdjust.hideTemplateExtras && (
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 200 121" preserveAspectRatio="none">
          <path d="M0 20 Q 50 10 100 20 T 200 20" fill="none" stroke="#fbbf24" strokeWidth="0.4" />
          <path d="M0 30 Q 50 22 100 30 T 200 30" fill="none" stroke="#fbbf24" strokeWidth="0.3" />
          <path d="M0 90 Q 50 82 100 90 T 200 90" fill="none" stroke="#fbbf24" strokeWidth="0.3" />
          <path d="M0 100 Q 50 92 100 100 T 200 100" fill="none" stroke="#fbbf24" strokeWidth="0.4" />
        </svg>
      )}
      <div className="relative flex-1 flex flex-col items-center justify-center text-center min-w-0">
        <Monogram data={d} size="13mm" bgColor="#fbbf24" fgColor="#1a1a1a" forceStyle="serif-cap" />
        <div data-role="company" className="text-[6pt] tracking-[0.5em] uppercase mt-[1.5mm] text-[#fbbf24]">
          {!d.customization.fineAdjust.hideTemplateExtras && "— "}{d.company}{!d.customization.fineAdjust.hideTemplateExtras && " —"}
        </div>
        <div data-role={d.nameEn ? "nameEn" : "name"} className="text-[24pt] italic font-light leading-[0.98] mt-[1.5mm] text-[#fef3c7] min-w-0 max-w-full" style={{ fontFamily: "'Snell Roundhand', 'Apple Chancery', cursive" }}>
          {d.nameEn || d.nameJa}
        </div>
        <div data-role="name" className="text-[10pt] mt-[0.5mm] text-[#fef3c7]/85 min-w-0 max-w-full">{nameDisplay(d)}</div>
        <div data-role="title" className="text-[7pt] italic mt-[1mm] text-[#fef3c7]/70 min-w-0 max-w-full">{d.title}</div>
      </div>
      <div data-role="contact" className="relative text-[6.5pt] tracking-wider leading-relaxed text-center text-[#fef3c7]/80 flex flex-wrap justify-center gap-x-[3mm] gap-y-[0.4mm] min-w-0" style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}>
        {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.3mm" className="shrink-0" />{d.phone}</span>}
        {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.3mm" className="shrink-0" />{d.email}</span>}
        {d.website && <span data-role="website" className="flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.3mm" className="shrink-0" />{d.website}</span>}
        {d.addressLine && <span data-role="address" className="flex items-start gap-[1mm] min-w-0 basis-full justify-center"><Icon kind="pin" size="2.3mm" className="shrink-0 mt-[0.3mm]" />{d.addressLine}</span>}
      </div>
    </div>
  );
}
