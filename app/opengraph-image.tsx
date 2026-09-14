import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "AlimBALL — Canlı 1v1 Futbol Quiz & Kadro Kurma Arenası";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#070e0a",
          backgroundImage:
            "radial-gradient(circle at 50% 25%, rgba(16, 185, 129, 0.28), transparent 60%), radial-gradient(circle at 15% 85%, rgba(16, 185, 129, 0.12), transparent 45%), radial-gradient(circle at 85% 85%, rgba(52, 211, 153, 0.12), transparent 45%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "70px 80px",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {/* Üst Kısım: Marka Rozeti */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            padding: "8px 24px",
            borderRadius: "9999px",
          }}
        >
          <span style={{ fontSize: "20px" }}>⚡</span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 800,
              letterSpacing: "3px",
              color: "#34d399",
              textTransform: "uppercase",
            }}
          >
            ALİMBALL SCOUT ARENA
          </span>
        </div>

        {/* Orta Kısım: Başlık & Açıklama */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "18px",
          }}
        >
          <h1
            style={{
              fontSize: "72px",
              fontWeight: 900,
              letterSpacing: "-1px",
              lineHeight: 1.1,
              margin: 0,
              display: "flex",
              gap: "14px",
            }}
          >
            <span>Alim</span>
            <span style={{ color: "#34d399" }}>BALL</span>
          </h1>
          <p
            style={{
              fontSize: "24px",
              color: "#cbd5e1",
              maxWidth: "850px",
              margin: 0,
              lineHeight: 1.4,
              fontWeight: 400,
            }}
          >
            Gerçek zamanlı 1v1 futbol bilgi düelloları, canlı müzayede transfer pazarı ve
            18.000+ futbolcu veritabanı.
          </p>
        </div>

        {/* Alt Kısım: Mod Rozetleri */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {[
            { icon: "🤝", label: "Ortak Oyuncu Modu" },
            { icon: "🌍", label: "Millet-Takım Düellosu" },
            { icon: "🔨", label: "Canlı Müzayede" },
            { icon: "📊", label: "18.000+ Scout" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                padding: "10px 18px",
                borderRadius: "14px",
                fontSize: "16px",
                fontWeight: 600,
                color: "#e2e8f0",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
