import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";

const SIZE = { width: 1200, height: 630 };

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0f172a",
          color: "white",
          padding: "60px 72px",
          backgroundImage:
            "linear-gradient(135deg, #064e3b 0%, #0f172a 55%, #1e293b 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                backgroundColor: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              E
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 30,
                fontWeight: 700,
                color: "#a7f3d0",
                letterSpacing: -0.5,
              }}
            >
              EIC Data
            </div>
          </div>
          <div
            style={{
              display: "flex",
              padding: "8px 18px",
              borderRadius: 999,
              border: "2px solid #34d399",
              fontSize: 18,
              color: "#a7f3d0",
              letterSpacing: 1.5,
              fontWeight: 600,
            }}
          >
            PRESS RELEASE ／ 2026-05-25 GA
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 62,
              fontWeight: 700,
              color: "white",
              lineHeight: 1.18,
              letterSpacing: -1.2,
            }}
          >
            日本のエネルギーと金融の
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 62,
              fontWeight: 700,
              color: "#34d399",
              lineHeight: 1.18,
              letterSpacing: -1.2,
            }}
          >
            引用インフラ、5/25 一般公開。
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 32,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#34d399" }}>
                41
              </div>
              <div style={{ display: "flex", fontSize: 16, color: "#cbd5e1" }}>
                独自 Insight
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#34d399" }}>
                105
              </div>
              <div style={{ display: "flex", fontSize: 16, color: "#cbd5e1" }}>
                catalog 系列
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#34d399" }}>
                9
              </div>
              <div style={{ display: "flex", fontSize: 16, color: "#cbd5e1" }}>
                ドメイン横断
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#34d399" }}>
                CC BY 4.0
              </div>
              <div style={{ display: "flex", fontSize: 16, color: "#cbd5e1" }}>
                全データ・全記事
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 4,
              fontSize: 18,
              color: "#94a3b8",
            }}
          >
            <div style={{ display: "flex" }}>data.eic-jp.org</div>
            <div style={{ display: "flex" }}>
              © 2026 EIC ／ 一般社団法人エネルギー情報センター
            </div>
          </div>
        </div>
      </div>
    ),
    { ...SIZE },
  );
}
