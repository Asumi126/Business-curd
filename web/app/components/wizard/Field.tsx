"use client";

import { ReactNode } from "react";

type FieldProps = {
  label: string;
  hint?: ReactNode;
  example?: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
};

export function Field({ label, hint, example, optional, error, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-800">
          {label}
          {optional && (
            <span className="ml-2 text-xs font-normal text-neutral-400">（任意）</span>
          )}
        </span>
      </div>
      {children}
      {(hint || example) && (
        <div className="text-xs text-neutral-500 leading-relaxed space-y-1">
          {hint && <div>💡 {hint}</div>}
          {example && (
            <div className="font-mono text-neutral-400">例: {example}</div>
          )}
        </div>
      )}
      {error && <div className="text-xs text-red-600">{error}</div>}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="px-4 py-3 rounded-lg border border-neutral-300 bg-white text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition w-full"
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="px-4 py-3 rounded-lg border border-neutral-300 bg-white text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition w-full resize-none"
    />
  );
}
