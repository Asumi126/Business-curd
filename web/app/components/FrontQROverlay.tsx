"use client";

import { useEffect, useState } from "react";
import { CardData, FrontQR, FrontQRPosition } from "../lib/types";
import { buildVCard, generateQRDataUrl, hasContactData } from "../lib/qr";

const POSITION_STYLES: Record<FrontQRPosition, React.CSSProperties> = {
  "top-left": { top: "3mm", left: "3mm" },
  "top-center": { top: "3mm", left: "50%", transform: "translateX(-50%)" },
  "top-right": { top: "3mm", right: "3mm" },
  "middle-left": { top: "50%", left: "3mm", transform: "translateY(-50%)" },
  "middle-center": {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  "middle-right": { top: "50%", right: "3mm", transform: "translateY(-50%)" },
  "bottom-left": { bottom: "3mm", left: "3mm" },
  "bottom-center": { bottom: "3mm", left: "50%", transform: "translateX(-50%)" },
  "bottom-right": { bottom: "3mm", right: "3mm" },
};

/**
 * Build the QR payload for a front-side QR.
 *  - URL mode + URL filled → URL
 *  - text mode + text filled → text
 *  - everything else → vCard (auto-generated from contact info)
 * Returns "" when there is no contact data at all, so we don't render a
 * QR that scans to a blank vCard.
 */
function buildPayload(qr: FrontQR, data: CardData): string {
  if (qr.source === "url") {
    const u = qr.url?.trim();
    if (u) return /^https?:\/\//i.test(u) ? u : `https://${u}`;
    if (!hasContactData(data)) return "";
    return buildVCard(data);
  }
  if (qr.source === "text") {
    const t = qr.text?.trim();
    if (t) return t;
    if (!hasContactData(data)) return "";
    return buildVCard(data);
  }
  if (!hasContactData(data)) return "";
  return buildVCard(data);
}

function FrontQRItem({ qr, data }: { qr: FrontQR; data: CardData }) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    const payload = buildPayload(qr, data);
    if (!payload) {
      setDataUrl("");
      return;
    }
    generateQRDataUrl(payload, 600)
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [qr, data]);

  if (!dataUrl) return null;

  // Everything that belongs to the QR block — the white background panel,
  // the inner padding, the caption text — scales proportionally with the
  // chosen QR size. Reference size is 15mm so the original look is preserved
  // when sizeMm = 15.
  const REF_SIZE_MM = 15;
  const scale = qr.sizeMm / REF_SIZE_MM;
  const paddingMm = qr.withBackground ? 1 * scale : 0;
  const borderRadiusMm = qr.withBackground ? 0.5 * scale : 0;
  const captionFontSizePt = 5 * scale;
  const captionMarginMm = 0.4 * scale;
  const captionLetterSpacing = 0.05; // em — relative to font-size, so already scales

  const baseStyle = POSITION_STYLES[qr.position];
  const dx = qr.offsetXmm ?? 0;
  const dy = qr.offsetYmm ?? 0;
  const presetTransform = (baseStyle.transform as string | undefined) ?? "";
  const composedTransform =
    dx === 0 && dy === 0
      ? presetTransform || undefined
      : `${presetTransform} translate(${dx}mm, ${dy}mm)`.trim();

  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    ...baseStyle,
    transform: composedTransform,
    backgroundColor: qr.withBackground ? "#ffffff" : "transparent",
    padding: `${paddingMm}mm`,
    borderRadius: `${borderRadiusMm}mm`,
    zIndex: 20,
  };

  return (
    <div style={wrapperStyle}>
      <img
        src={dataUrl}
        alt={qr.caption ?? "QR"}
        style={{
          width: `${qr.sizeMm}mm`,
          height: `${qr.sizeMm}mm`,
          display: "block",
        }}
      />
      {qr.caption && (
        <div
          style={{
            fontSize: `${captionFontSizePt.toFixed(2)}pt`,
            textAlign: "center",
            marginTop: `${captionMarginMm.toFixed(2)}mm`,
            color: qr.withBackground ? "#000" : "currentColor",
            fontWeight: 600,
            letterSpacing: `${captionLetterSpacing}em`,
            lineHeight: 1.1,
          }}
        >
          {qr.caption}
        </div>
      )}
    </div>
  );
}

export function FrontQROverlay({ data }: { data: CardData }) {
  const qrs = data.customization.frontQRs ?? [];
  if (qrs.length === 0) return null;
  // Cap at 2 for layout safety.
  const visible = qrs.slice(0, 2);
  return (
    <>
      {visible.map((qr) => (
        <FrontQRItem key={qr.id} qr={qr} data={data} />
      ))}
    </>
  );
}
