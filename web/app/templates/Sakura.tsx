import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function Sakura({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[7mm] text-neutral-900"
      style={{
        background: "linear-gradient(150deg, #fef2f5 0%, #fce7f3 60%, #fbcfe8 100%)",
        fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
      }}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 121" preserveAspectRatio="none">
        <g fill="#f472b6" opacity="0.55">
          {[
            [10, 14, 4],
            [180, 26, 5],
            [170, 75, 3],
            [25, 90, 3.5],
            [60, 22, 3],
            [125, 102, 4],
          ].map(([cx, cy, r], i) => (
            <g key={i} transform={`translate(${cx} ${cy}) rotate(${i * 36})`}>
              {[0, 72, 144, 216, 288].map((rot) => (
                <ellipse
                  key={rot}
                  rx={r}
                  ry={r * 0.55}
                  cx={r * 0.6}
                  cy={0}
                  fill="#fda4af"
                  transform={`rotate(${rot})`}
                />
              ))}
            </g>
          ))}
        </g>
      </svg>
      <div className="absolute right-[5mm] top-[5mm] z-10">
        <Monogram data={d} size="11mm" bgColor="#831843" fgColor="#fef2f5" forceStyle="stamp" />
      </div>
      <div className="relative flex-1 flex flex-col justify-center mt-[6mm] pr-[14mm] min-w-0">
        <div data-role="company" className="text-[7pt] tracking-[0.3em] text-[#831843] min-w-0">{d.company}</div>
        <div data-role="name" className="text-[20pt] tracking-[0.12em] leading-tight mt-[1.5mm] min-w-0">{nameDisplay(d)}</div>
        <div data-role="nameEn" className="text-[7pt] tracking-[0.2em] text-neutral-500 mt-[0.5mm] min-w-0">{d.nameEn}</div>
        <div data-role="title" className="text-[7.5pt] tracking-wider text-[#9d174d] mt-[1mm] min-w-0">{d.title}</div>
      </div>
      <div data-role="contact" className="relative text-[7pt] tracking-wider leading-relaxed grid grid-cols-2 gap-x-[3mm] gap-y-[0.4mm] text-[#831843]/85 min-w-0" style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}>
        {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.5mm" className="shrink-0" />{d.phone}</span>}
        {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.5mm" className="shrink-0" />{d.email}</span>}
        {d.website && <span data-role="website" className="col-span-2 flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.5mm" className="shrink-0" />{d.website}</span>}
        {d.addressLine && <span data-role="address" className="col-span-2 flex items-start gap-[1mm] min-w-0"><Icon kind="pin" size="2.5mm" className="shrink-0 mt-[0.4mm]" />{d.addressLine}</span>}
      </div>
    </div>
  );
}
