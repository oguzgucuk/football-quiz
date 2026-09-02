import React from "react";

interface NerdBallLogoProps {
  size?: number;
  className?: string;
}

export function NerdBallLogo({ size = 36, className = "" }: NerdBallLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Top Dış Çerçevesi & Glow */}
      <circle cx="50" cy="50" r="46" fill="#0D1522" stroke="#10B981" strokeWidth="4" />
      <circle cx="50" cy="50" r="44" fill="url(#ballGradient)" />

      {/* Futbol Topu Pentagon Çizgileri */}
      <polygon points="50,22 62,32 58,46 42,46 38,32" fill="#10B981" fillOpacity="0.85" />
      <polygon points="20,52 28,42 38,46 40,58 28,66" fill="#10B981" fillOpacity="0.4" />
      <polygon points="80,52 72,42 62,46 60,58 72,66" fill="#10B981" fillOpacity="0.4" />
      <polygon points="50,82 38,72 42,60 58,60 62,72" fill="#10B981" fillOpacity="0.6" />

      {/* Dikiş Çizgileri */}
      <line x1="50" y1="22" x2="50" y2="8" stroke="#10B981" strokeWidth="2" strokeOpacity="0.5" />
      <line x1="62" y1="32" x2="76" y2="26" stroke="#10B981" strokeWidth="2" strokeOpacity="0.5" />
      <line x1="38" y1="32" x2="24" y2="26" stroke="#10B981" strokeWidth="2" strokeOpacity="0.5" />

      {/* Kalın Siyah Nerd Gözlüğü */}
      {/* Sol Cam */}
      <rect
        x="24"
        y="42"
        width="22"
        height="18"
        rx="5"
        fill="#080C14"
        stroke="#FFFFFF"
        strokeWidth="3.5"
      />
      {/* Sağ Cam */}
      <rect
        x="54"
        y="42"
        width="22"
        height="18"
        rx="5"
        fill="#080C14"
        stroke="#FFFFFF"
        strokeWidth="3.5"
      />
      {/* Gözlük Köprüsü */}
      <path d="M46 50 Q50 46 54 50" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      {/* Gözlük Sapları */}
      <line x1="24" y1="48" x2="10" y2="44" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="76" y1="48" x2="90" y2="44" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />

      {/* Gözlük İçi Zeki Gözler & Parıltı */}
      <circle cx="35" cy="51" r="3.5" fill="#00E676" />
      <circle cx="36" cy="49" r="1.2" fill="#FFFFFF" />
      <circle cx="65" cy="51" r="3.5" fill="#00E676" />
      <circle cx="66" cy="49" r="1.2" fill="#FFFFFF" />

      {/* Zeki Sırıtış */}
      <path
        d="M42 68 Q50 75 58 68"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Gradient Tanımı */}
      <defs>
        <radialGradient id="ballGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0A0F18" />
        </radialGradient>
      </defs>
    </svg>
  );
}
