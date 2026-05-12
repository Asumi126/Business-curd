import { CardData } from "./types";

/**
 * Returns a CardData with back-hidden fields cleared, so that back templates
 * automatically respect the user's "what to show on back" choices.
 */
export function applyBackVisibility(data: CardData): CardData {
  const back = data.customization.fineAdjust.backHidden;
  return {
    ...data,
    nameJa: back.nameJa ? "" : data.nameJa,
    nameEn: back.nameJa ? "" : data.nameEn,
    company: back.company ? "" : data.company,
    title: back.title ? "" : data.title,
    department: back.title ? "" : data.department,
    phone: back.contact ? "" : data.phone,
    email: back.contact ? "" : data.email,
    postalCode: back.contact ? "" : data.postalCode,
    address: back.contact ? "" : data.address,
    website: back.contact ? "" : data.website,
    sns: back.contact ? {} : data.sns,
    backMessage: back.backMessage ? "" : data.backMessage,
  };
}
