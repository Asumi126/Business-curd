import QRCode from "qrcode";
import { CardData } from "./types";

/**
 * Build the QR payload. Returns empty string when there is nothing meaningful
 * to encode — that suppresses the QR rendering entirely so users don't see a
 * "scan returns blank vCard" QR. As soon as any contact data is entered the
 * QR appears.
 *
 *  - "url" mode  : prefer qrUrl, then website. Falls back to vCard if any
 *    contact data exists.
 *  - "vcard" mode (default) : auto-generated from nameJa/phone/email/etc.
 *    Returns "" when literally no contact data has been entered.
 */
export function buildQRPayload(data: CardData): string {
  if (data.qrMode === "url") {
    const url = data.qrUrl?.trim();
    if (url) {
      return /^https?:\/\//i.test(url) ? url : `https://${url}`;
    }
    if (data.website?.trim()) {
      const w = data.website.trim();
      return /^https?:\/\//i.test(w) ? w : `https://${w}`;
    }
    if (!hasContactData(data)) return "";
    return buildVCard(data);
  }
  if (!hasContactData(data)) return "";
  return buildVCard(data);
}

/**
 * Build the second QR payload for dual-QR back styles.
 * Returns "" when there's no contact data, suppressing the empty-vCard QR.
 */
export function buildSecondQRPayload(data: CardData): string {
  const q2 = data.qr2;
  if (!q2 || !q2.enabled) return "";
  if (q2.mode === "url") {
    const u = q2.url?.trim();
    if (u) return /^https?:\/\//i.test(u) ? u : `https://${u}`;
    if (!hasContactData(data)) return "";
    return buildVCard(data);
  }
  if (!hasContactData(data)) return "";
  return buildVCard(data);
}

/** True if a vCard-type QR will have any meaningful payload. */
export function hasContactData(data: CardData): boolean {
  return !!(
    data.nameJa?.trim() ||
    data.nameEn?.trim() ||
    data.phone?.trim() ||
    data.email?.trim() ||
    data.website?.trim() ||
    data.company?.trim()
  );
}

export function buildVCard(data: CardData): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${data.nameJa}`,
    `FN:${data.nameJa || data.nameEn}`,
  ];
  if (data.nameEn) lines.push(`X-PHONETIC-NAME:${data.nameEn}`);
  if (data.company || data.department) {
    lines.push(`ORG:${data.company}${data.department ? `;${data.department}` : ""}`);
  }
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.phone) lines.push(`TEL;TYPE=WORK,VOICE:${data.phone}`);
  if (data.email) lines.push(`EMAIL;TYPE=PREF,INTERNET:${data.email}`);
  if (data.address) lines.push(`ADR;TYPE=WORK:;;${data.address};;;;`);
  if (data.website) lines.push(`URL:${data.website}`);
  if (data.sns.x) lines.push(`X-SOCIALPROFILE;TYPE=twitter:${normalizeHandle(data.sns.x, "x.com")}`);
  if (data.sns.instagram)
    lines.push(`X-SOCIALPROFILE;TYPE=instagram:${normalizeHandle(data.sns.instagram, "instagram.com")}`);
  if (data.sns.linkedin)
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${normalizeHandle(data.sns.linkedin, "linkedin.com/in")}`);
  if (data.sns.github)
    lines.push(`X-SOCIALPROFILE;TYPE=github:${normalizeHandle(data.sns.github, "github.com")}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

function normalizeHandle(value: string, host: string): string {
  if (/^https?:\/\//.test(value)) return value;
  const handle = value.startsWith("@") ? value.slice(1) : value;
  return `https://${host}/${handle}`;
}

export async function generateQRDataUrl(text: string, size = 256): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });
}
