"use client";

import { useState, useEffect } from "react";
import {
  createAccount,
  getCurrentUser,
  listAccountUsernames,
  login,
  logout,
} from "../lib/auth";

/**
 * Lightweight account-switcher button + modal. Sits in the header. When the
 * user logs in/out we reload the page so all data stores re-resolve to the
 * new user's namespace.
 */
export function AuthMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "create">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);

  useEffect(() => {
    setUser(getCurrentUser());
    setAccounts(listAccountUsernames());
  }, [open]);

  const close = () => {
    setOpen(false);
    setError(null);
    setInfo(null);
    setUsername("");
    setPassword("");
  };

  const handleLogin = async () => {
    setError(null);
    setInfo(null);
    const r = await login(username, password);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    window.location.reload();
  };

  const handleCreate = async () => {
    setError(null);
    setInfo(null);
    const r = await createAccount(username, password);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    // auto-login after creation
    await login(username, password);
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <>
      {user ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-xs text-neutral-700 hover:text-purple-600 px-2.5 py-1.5 rounded-full border border-neutral-300 hover:border-purple-400 transition"
          title={`ログイン中: ${user}`}
        >
          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-[10px] font-bold flex items-center justify-center">
            {user.charAt(0).toUpperCase()}
          </span>
          <span className="hidden sm:inline truncate max-w-[80px]">{user}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-300 px-3 py-1.5 rounded-full transition"
          title="ログインして自分のデータを保存"
        >
          ログイン
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={close}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-neutral-200 px-5 py-3 flex items-center justify-between">
              <h2 className="text-base font-bold">
                {user ? "アカウント" : mode === "login" ? "ログイン" : "アカウント作成"}
              </h2>
              <button
                type="button"
                onClick={close}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 flex items-center justify-center text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              {user ? (
                <>
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm">
                    現在 <strong className="text-blue-700">{user}</strong> でログイン中
                  </div>
                  <div className="text-[11px] text-neutral-600 leading-relaxed">
                    ログアウトすると、別のアカウントに切り替えるか、ゲストとして利用できます。
                    あなたが保存した名刺データはアカウント別に保管されているので、
                    再ログインすればまた見えます。
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex-1 px-4 py-2 rounded-md bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700"
                    >
                      ログアウト
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setUser(null);
                        setMode("login");
                      }}
                      className="px-4 py-2 rounded-md border border-purple-300 text-purple-700 text-sm hover:bg-purple-50"
                    >
                      別アカウントへ
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-1 border-b border-neutral-200">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError(null);
                      }}
                      className={`flex-1 px-3 py-2 text-sm font-semibold border-b-2 -mb-[2px] ${
                        mode === "login"
                          ? "text-purple-700 border-purple-600"
                          : "text-neutral-500 border-transparent"
                      }`}
                    >
                      ログイン
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("create");
                        setError(null);
                      }}
                      className={`flex-1 px-3 py-2 text-sm font-semibold border-b-2 -mb-[2px] ${
                        mode === "create"
                          ? "text-purple-700 border-purple-600"
                          : "text-neutral-500 border-transparent"
                      }`}
                    >
                      新規作成
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                      ユーザー名
                    </label>
                    {mode === "login" && accounts.length > 0 ? (
                      <select
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:border-purple-500"
                      >
                        <option value="">選んでください</option>
                        {accounts.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="お好きな名前"
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:border-purple-500"
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                      パスワード（4文字以上）
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          mode === "login" ? handleLogin() : handleCreate();
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {error && <div className="text-xs text-red-600">{error}</div>}
                  {info && <div className="text-xs text-emerald-600">{info}</div>}

                  <button
                    type="button"
                    onClick={mode === "login" ? handleLogin : handleCreate}
                    className="w-full px-4 py-2 rounded-md bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700"
                  >
                    {mode === "login" ? "ログイン" : "アカウントを作成"}
                  </button>

                  <div className="text-[10px] text-neutral-500 leading-relaxed border-t pt-3">
                    💡 これは<strong>同じブラウザ内のアカウント分離</strong>機能です。
                    パスワードはこのブラウザ内に保存され、外部送信はしません。
                    別のPC・スマホからは見えませんのでご注意ください。
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
