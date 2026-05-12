import { CardData } from "./types";

import { scopedKey } from "./auth";
const BASE_DRAFTS_KEY = "mycardmaker:v1:drafts";
const DRAFTS_KEY = "" as never; // legacy placeholder, replaced by accessor below
const DRAFTS_KEY_FN = () => scopedKey(BASE_DRAFTS_KEY);
void DRAFTS_KEY;
export const DRAFT_LIMIT = 5;

export type Draft = {
  id: string;
  data: CardData;
  templateId: string;
  backStyleId: string;
  createdAt: number;
  updatedAt: number;
};

function genId(): string {
  return `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function readRaw(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return window.localStorage.getItem(DRAFTS_KEY_FN()) ?? "[]";
  } catch {
    return "[]";
  }
}

export function listDrafts(): Draft[] {
  try {
    const arr = JSON.parse(readRaw()) as Draft[];
    if (!Array.isArray(arr)) return [];
    // Sort by updatedAt desc
    return arr.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

/**
 * Save current work as a draft. If existingId is given, updates that draft.
 * Otherwise creates new and pushes oldest out if limit exceeded.
 */
export function saveDraft(input: {
  data: CardData;
  templateId: string;
  backStyleId: string;
  existingId?: string;
}): Draft | null {
  if (typeof window === "undefined") return null;
  const now = Date.now();
  const drafts = listDrafts();

  if (input.existingId) {
    const idx = drafts.findIndex((d) => d.id === input.existingId);
    if (idx !== -1) {
      const updated: Draft = {
        ...drafts[idx],
        data: input.data,
        templateId: input.templateId,
        backStyleId: input.backStyleId,
        updatedAt: now,
      };
      drafts[idx] = updated;
      try {
        window.localStorage.setItem(DRAFTS_KEY_FN(), JSON.stringify(drafts));
        return updated;
      } catch {
        return null;
      }
    }
  }

  const newDraft: Draft = {
    id: genId(),
    data: input.data,
    templateId: input.templateId,
    backStyleId: input.backStyleId,
    createdAt: now,
    updatedAt: now,
  };

  // Drop oldest if at capacity
  const next = [newDraft, ...drafts].slice(0, DRAFT_LIMIT);

  try {
    window.localStorage.setItem(DRAFTS_KEY_FN(), JSON.stringify(next));
    return newDraft;
  } catch {
    // If size error, try removing oldest and retry
    const trimmed = [newDraft, ...drafts].slice(0, Math.max(1, drafts.length));
    try {
      window.localStorage.setItem(DRAFTS_KEY_FN(), JSON.stringify(trimmed));
      return newDraft;
    } catch {
      return null;
    }
  }
}

export function deleteDraft(id: string): boolean {
  if (typeof window === "undefined") return false;
  const drafts = listDrafts();
  const next = drafts.filter((d) => d.id !== id);
  if (next.length === drafts.length) return false;
  try {
    window.localStorage.setItem(DRAFTS_KEY_FN(), JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function getDraft(id: string): Draft | undefined {
  return listDrafts().find((d) => d.id === id);
}

export function describeDraft(d: Draft): string {
  const parts: string[] = [];
  if (d.data.company) parts.push(d.data.company);
  if (d.data.nameJa) parts.push(d.data.nameJa);
  return parts.length === 0 ? "無題の下書き" : parts.join(" / ");
}
