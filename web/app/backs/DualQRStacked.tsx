import { CardData, CardTemplate } from "../lib/types";
import { resolveBackPalette } from "../lib/customization";

/**
 * Dual QR — vertical stack with aligned label column.
 * Both QRs sit on the same vertical line (left rail), and their labels
 * occupy a unified right column so they line up horizontally regardless
 * of caption length. A subtle divider with a centered dot separates them.
 */
export function DualQRStacked({
  data,
  template,
  qrDataUrl,
  qrDataUrl2,
}: {
  data: CardData;
  template: CardTemplate;
  qrDataUrl: string;
  qrDataUrl2?: string;
}) {
  const swatch = resolveBackPalette(data, template.swatch);
  const cap1 = data.qrCaption || "Contact";
  const cap2 = data.qr2?.caption || "Web";
  const accent = swatch.accent;

  const QrTile = ({
    src,
    cap,
    sub,
    badge,
  }: {
    src: string;
    cap: string;
    sub: string;
    badge: string;
  }) => (
    <div className="grid grid-cols-[22mm_1fr] gap-[4mm] items-center w-full">
      <div
        className="w-[22mm] h-[22mm] rounded-[1mm] p-[1mm] flex items-center justify-center shrink-0"
        style={{ backgroundColor: "#fff", border: `0.3mm solid ${accent}` }}
      >
        {src && <img src={src} alt="" className="w-full h-full" />}
      </div>
      <div className="flex flex-col min-w-0">
        <div
          className="inline-flex items-center gap-[1.5mm] text-[5.5pt] font-bold tracking-[0.18em] uppercase mb-[0.5mm]"
          style={{ color: accent }}
        >
          <span
            className="inline-block w-[3mm] h-[3mm] rounded-full text-[5pt] text-white font-bold flex items-center justify-center leading-none"
            style={{ backgroundColor: accent, lineHeight: "3mm" }}
          >
            {badge}
          </span>
          <span className="truncate">{cap}</span>
        </div>
        <div
          data-role={data.nameJa ? "name" : "company"}
          className="text-[7.5pt] font-semibold leading-tight mb-[0.3mm] truncate"
          style={{ color: swatch.fg }}
        >
          {data.nameJa || data.company}
        </div>
        <div className="text-[5.5pt] leading-tight" style={{ color: swatch.muted, opacity: 0.85 }}>
          {sub}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="absolute inset-0 flex flex-col justify-center px-[5mm] py-[4mm]"
      style={{
        backgroundColor: swatch.bg,
        color: swatch.fg,
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <QrTile src={qrDataUrl} cap={cap1} sub="スマホで読み取り → 連絡先を保存" badge="1" />

      {/* divider with centered dot */}
      <div className="relative my-[2mm] flex items-center w-full">
        <div className="flex-1 h-px" style={{ backgroundColor: `${swatch.fg}20` }} />
        <span
          className="mx-[2mm] w-[1.2mm] h-[1.2mm] rounded-full"
          style={{ backgroundColor: accent }}
        />
        <div className="flex-1 h-px" style={{ backgroundColor: `${swatch.fg}20` }} />
      </div>

      <QrTile src={qrDataUrl2 ?? ""} cap={cap2} sub="サイト・SNSをチェック" badge="2" />
    </div>
  );
}
