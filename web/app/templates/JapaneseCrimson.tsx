import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, nameDisplay } from "./utils";

export function JapaneseCrimson({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex"
      style={{
        backgroundColor: "#fefae8",
        fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
      }}
    >
      <div
        className="w-[18mm] shrink-0 flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #9a1f2c 0%, #c1272d 100%)",
        }}
      >
        <div className="w-[12mm] h-[12mm] rounded-full bg-[#fefae8] flex items-center justify-center text-[#9a1f2c] text-[12pt] font-bold overflow-hidden shrink-0">
          {d.logoDataUrl ? (
            <img src={d.logoDataUrl} alt="logo" className="max-w-[10mm] max-h-[10mm] object-contain" />
          ) : (
            "和"
          )}
        </div>
        <div className="text-[5.5pt] tracking-[0.2em] text-[#fefae8]/90 mt-[2mm] [writing-mode:vertical-rl] uppercase max-h-full overflow-hidden">
          {d.company}
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between p-[5mm] text-neutral-900 min-w-0">
        <div data-role="company" className="text-[7pt] tracking-[0.2em] text-[#9a1f2c] min-w-0">{d.company}</div>
        <div className="min-w-0">
          <div data-role="name" className="text-[18pt] tracking-[0.08em] leading-tight min-w-0">{nameDisplay(d)}</div>
          <div data-role="nameEn" className="text-[7pt] tracking-[0.2em] text-neutral-500 mt-[0.5mm] min-w-0">{d.nameEn}</div>
          <div data-role="title" className="text-[7.5pt] tracking-wider text-[#9a1f2c] mt-[1mm] font-semibold min-w-0">
            {d.title}
          </div>
        </div>
        <div data-role="contact" className="text-[6.5pt] tracking-wider text-neutral-700 leading-relaxed space-y-[0.5mm] border-t border-[#9a1f2c]/30 pt-[1.5mm] min-w-0" style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}>
          {d.phone && <div data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.3mm" className="text-[#9a1f2c] shrink-0" />{d.phone}</div>}
          {d.email && <div data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.3mm" className="text-[#9a1f2c] shrink-0" />{d.email}</div>}
          {d.addressLine && <div data-role="address" className="flex items-start gap-[1mm] min-w-0"><Icon kind="pin" size="2.3mm" className="text-[#9a1f2c] mt-[0.3mm] shrink-0" />{d.addressLine}</div>}
          {d.website && <div data-role="website" className="flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.3mm" className="text-[#9a1f2c] shrink-0" />{d.website}</div>}
        </div>
      </div>
    </div>
  );
}
