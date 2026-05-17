import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const withMDX = createMDX({});

const nextConfig: NextConfig = {
  reactCompiler: true,

  pageExtensions: ["ts", "tsx", "md", "mdx"],

  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 86400,
    },
  },

  async headers() {
    return [
      {
        // N8 (2026-05-17): /embed/* は外部サイトからの iframe 取り込みを許可するため
        // X-Frame-Options を抜き、CSP frame-ancestors で広く許可する。
        // 順序が先に来る方が優先されるので /embed/* ルールを先に書く必要がある。
        source: "/embed/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default withMDX(nextConfig);
