import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GlobalColorHistoryListener } from "./components/GlobalColorHistoryListener";

export const metadata: Metadata = {
  title: "My Card Maker — 質問に答えるだけで名刺が完成",
  description:
    "デザインの知識がなくても、質問に答えるだけで印刷発注できる名刺が作れる無料ツール。24種以上のテンプレートから選んで、PDF/PNG/QRコードで書き出せます。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full bg-white text-neutral-900">
        <GlobalColorHistoryListener />
        {children}
      </body>
    </html>
  );
}
