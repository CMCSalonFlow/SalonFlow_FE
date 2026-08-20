import React from 'react';

/**
 * SalonFlow Professional Vector Logo Component
 * @param {Object} props
 * @param {boolean} props.collapsed - When true, only shows the luxury icon mark
 * @param {string} props.subtitle - Optional sub-branding text (e.g., "OWNER PORTAL", "ADMIN")
 * @param {string} props.size - 'small' | 'medium' | 'large'
 * @param {'dark' | 'light'} props.theme - Background context theme
 */
export default function BrandLogo({
  collapsed = false,
  subtitle = "OWNER PORTAL",
  size = "medium",
  theme = "dark"
}) {
  const isDark = theme === "dark";
  const iconSize = size === "small" ? 32 : size === "large" ? 44 : 38;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        userSelect: "none",
        cursor: "pointer",
        transition: "all 0.3s ease"
      }}
    >
      {/* LUXURY VECTOR EMBLEM ICON */}
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: iconSize > 36 ? 12 : 10,
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          border: "1px solid rgba(129, 140, 248, 0.4)",
          boxShadow: "0 4px 16px rgba(79, 70, 229, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Subtle ambient light inside badge */}
        <div
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            width: 25,
            height: 25,
            background: "radial-gradient(circle, rgba(167, 139, 250, 0.8) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none"
          }}
        />

        {/* Scalable Professional Vector Scissors / Wave Monogram */}
        <svg
          width={iconSize * 0.62}
          height={iconSize * 0.62}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bladeGrad1" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="bladeGrad2" x1="22" y1="2" x2="2" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Left Loop */}
          <circle cx="6" cy="18" r="3.2" stroke="url(#bladeGrad1)" strokeWidth="1.8" />
          {/* Right Loop */}
          <circle cx="18" cy="18" r="3.2" stroke="url(#bladeGrad2)" strokeWidth="1.8" />

          {/* Left Blade curving to top right */}
          <path
            d="M8.2 15.8L18 4.5C18.5 4 19 4.2 18.8 5L13.8 12.5"
            stroke="url(#bladeGrad1)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Right Blade curving to top left */}
          <path
            d="M15.8 15.8L6 4.5C5.5 4 5 4.2 5.2 5L10.2 12.5"
            stroke="url(#bladeGrad2)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pivot Diamond Sparkle */}
          <circle cx="12" cy="11.5" r="1.4" fill="#ffffff" />
          <path d="M12 9.5V13.5M10 11.5H14" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
        </svg>
      </div>

      {/* TYPOGRAPHY */}
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: size === "small" ? 16 : 18,
                fontWeight: 800,
                letterSpacing: "-0.4px",
                background: isDark
                  ? "linear-gradient(135deg, #ffffff 0%, #f1f5f9 60%, #cbd5e1 100%)"
                  : "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1.15
              }}
            >
              Salon<span style={{ color: "#818cf8", WebkitTextFillColor: "#818cf8" }}>Flow</span>
            </span>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#818cf8",
                display: "inline-block",
                boxShadow: "0 0 8px #818cf8"
              }}
            />
          </div>

          {subtitle && (
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: isDark ? "#818cf8" : "#6366f1",
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                marginTop: 2,
                lineHeight: 1
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
