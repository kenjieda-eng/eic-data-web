import { ImageResponse } from "next/og";

export const alt =
  "EIC Data — 日本のエネルギーと金融の引用インフラ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#f8fafc",
          padding: "72px 88px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "#047857",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            E
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 36,
              fontWeight: 700,
              color: "#047857",
              letterSpacing: -0.5,
            }}
          >
            EIC Data
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              color: "#1e293b",
              lineHeight: 1.2,
              letterSpacing: -1,
            }}
          >
            日本のエネルギーと金融の引用インフラ
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#475569",
              lineHeight: 1.5,
            }}
          >
            一次出典・as-of・引用形式すべて備えた、研究者・ジャーナリスト・実務者の基準点
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#94a3b8",
          }}
        >
          <div style={{ display: "flex" }}>data.eic-jp.org</div>
          <div style={{ display: "flex" }}>
            © 2026 EIC ／ CC BY 4.0
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
