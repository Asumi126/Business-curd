import type { NextConfig } from "next";

/**
 * Security headers — applied to every response.
 *
 * Strategy:
 *  - HTTPS強制 (Strict-Transport-Security)
 *  - クリックジャッキング対策 (X-Frame-Options + frame-ancestors)
 *  - MIMEスニッフィング対策 (X-Content-Type-Options)
 *  - リファラ情報の制限 (Referrer-Policy)
 *  - 不要な機能の無効化 (Permissions-Policy)
 *  - XSS対策 (Content-Security-Policy)
 *
 * 当アプリの特性：
 *  - 完全クライアントサイド（サーバ側の API/DB なし）
 *  - 名簿データは IndexedDB / localStorage に保存（端末ローカル）
 *  - Google Sheets 同期は docs.google.com への fetch のみ
 *  - QRコード生成・PDF生成は全てクライアント側
 */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",
      "payment=()",
      "usb=()",
      "bluetooth=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", "),
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js Hydration 用に unsafe-inline / unsafe-eval が必要
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // インラインstyle（テンプレで多用）のため unsafe-inline 必須
      "style-src 'self' 'unsafe-inline'",
      // 画像: data: (QR・アップロード) / blob: / 自身
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      // Google Sheets CSV エクスポート対応
      "connect-src 'self' https://docs.google.com https://*.googleusercontent.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // X-Powered-By ヘッダー除去（情報漏洩防止）
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
