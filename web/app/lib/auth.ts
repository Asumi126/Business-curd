/**
 * Lightweight account separation within a single browser.
 *
 * IMPORTANT: This is *not* server-side authentication. It only partitions
 * localStorage so that several people using the same PC see only their
 * own data. The password is hashed with a simple salt+SHA-1 — enough to
 * stop casual peeking, but not real security. For real cross-device
 * accounts, a backend (Supabase / Firebase) is required.
 */

const ACCOUNTS_KEY = "mycardmaker:v1:accounts";
const CURRENT_USER_KEY = "mycardmaker:v1:currentUser";

export type Account = {
  username: string;
  /** Hex string of SHA-1(salt+password). */
  passwordHash: string;
  createdAt: number;
};

function readAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(list: Account[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

const SALT = "mycardmaker:v1:salt";

async function hash(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const enc = new TextEncoder().encode(SALT + text);
    const buf = await crypto.subtle.digest("SHA-1", enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback: btoa (not cryptographic but better than plaintext)
  return typeof btoa !== "undefined" ? btoa(SALT + text) : SALT + text;
}

export async function createAccount(
  username: string,
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const u = username.trim();
  if (!u) return { ok: false, message: "ユーザー名を入力してください" };
  if (u.length > 30) return { ok: false, message: "ユーザー名は30文字以内に" };
  if (!password) return { ok: false, message: "パスワードを入力してください" };
  if (password.length < 4) return { ok: false, message: "パスワードは4文字以上" };

  const list = readAccounts();
  if (list.some((a) => a.username === u)) {
    return { ok: false, message: "そのユーザー名はすでに使われています" };
  }
  if (list.length >= 20) {
    return { ok: false, message: "このブラウザの最大アカウント数（20）に達しました" };
  }

  const passwordHash = await hash(password);
  const next: Account = {
    username: u,
    passwordHash,
    createdAt: Date.now(),
  };
  writeAccounts([...list, next]);
  return { ok: true };
}

export async function login(
  username: string,
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const u = username.trim();
  const list = readAccounts();
  const acc = list.find((a) => a.username === u);
  if (!acc) return { ok: false, message: "ユーザー名が見つかりません" };
  const passwordHash = await hash(password);
  if (acc.passwordHash !== passwordHash) {
    return { ok: false, message: "パスワードが違います" };
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CURRENT_USER_KEY, u);
  }
  return { ok: true };
}

export function logout(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CURRENT_USER_KEY);
}

export function getCurrentUser(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CURRENT_USER_KEY);
}

export function listAccountUsernames(): string[] {
  return readAccounts().map((a) => a.username);
}

export function deleteAccount(username: string, password: string): Promise<boolean> {
  return hash(password).then((h) => {
    const list = readAccounts();
    const acc = list.find((a) => a.username === username);
    if (!acc || acc.passwordHash !== h) return false;
    writeAccounts(list.filter((a) => a.username !== username));
    if (getCurrentUser() === username) logout();
    return true;
  });
}

/**
 * Build a user-scoped storage key. All app storage keys (profiles, drafts,
 * imageLibrary) are wrapped with this so each account sees its own data.
 * When no user is logged in, falls back to a "guest" namespace.
 */
export function scopedKey(baseKey: string): string {
  const u = getCurrentUser() ?? "_guest";
  return `${baseKey}::user=${u}`;
}
