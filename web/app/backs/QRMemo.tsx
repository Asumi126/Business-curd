import { CardData, CardTemplate } from "../lib/types";
import { resolveBackPalette } from "../lib/customization";

/**
 * QRMemo — 上部に「QR + 氏名」、下部にメモ罫線という構成。
 *
 * 旧版は QR 横（右側）のテキスト列に「見出し → 氏名 → 肩書き」と縦に
 * 並んでおり、見出しが氏名の上に来て主従が逆転していた。
 * 修正後は:
 *   - 左列: QR の真下に「見出し」を配置（QR と見出しがひとかたまり）
 *   - 右列: 「氏名」「肩書き」の主情報を独立して大きめに表示
 *   - 見出しは qrCaption / backText を統合（旧 UI 統合に合わせ片方に揃える）
 */
export function QRMemo({
  data,
  template,
  qrDataUrl,
}: {
  data: CardData;
  template: CardTemplate;
  qrDataUrl: string;
}) {
  const swatch = resolveBackPalette(data, template.swatch);
  const caption = (data.backText || data.qrCaption || "").trim();
  return (
    <div
      className="absolute inset-0 flex flex-col p-[5mm]"
      style={{
        backgroundColor: swatch.bg,
        color: swatch.fg,
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      {/* TOP: 左=QR+見出し / 右=氏名+肩書き */}
      <div
        className="flex items-start gap-[3mm] pb-[2mm]"
        style={{ borderBottom: `1px solid ${swatch.fg}22` }}
      >
        {/* 左列: QR + 見出し（見出しは QR の真下） */}
        <div className="flex flex-col items-center gap-[0.8mm] shrink-0">
          <div
            className="w-[20mm] h-[20mm] rounded-[1mm] p-[0.8mm] flex items-center justify-center"
            style={{ backgroundColor: "#fff", border: `1px solid ${swatch.accent}` }}
          >
            {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-full h-full" />}
          </div>
          {caption && (
            <div
              className="text-[5.5pt] tracking-[0.2em] uppercase font-semibold text-center max-w-[22mm] truncate"
              style={{ color: swatch.accent }}
            >
              {caption}
            </div>
          )}
        </div>

        {/* 右列: 氏名 + 肩書き（主情報） */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-[0.5mm] py-[0.5mm]">
          {data.nameJa && (
            <div
              data-role="name"
              className="text-[11pt] font-bold leading-tight tracking-[-0.01em] truncate"
            >
              {data.nameJa}
            </div>
          )}
          {data.title && (
            <div
              data-role="title"
              className="text-[7pt] leading-tight opacity-80 line-clamp-2"
            >
              {data.title}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM: Memo lines */}
      <div className="flex-1 flex flex-col justify-center gap-[3mm] mt-[2mm]">
        {data.memo ? (
          <div className="text-[8pt] leading-[2.0]" style={{ whiteSpace: "pre-line" }}>
            {data.memo}
          </div>
        ) : (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="h-px w-full" style={{ backgroundColor: `${swatch.fg}25` }} />
          ))
        )}
      </div>
    </div>
  );
}
