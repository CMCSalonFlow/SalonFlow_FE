import React from 'react';

/**
 * SalonFlow Modern Abstract Beauty Tech Vector Logo (No scissors)
 * @param {Object} props
 * @param {boolean} props.collapsed - When true, only shows the luxury icon mark
 * @param {string} props.subtitle - Optional sub-branding text (e.g., "OWNER PORTAL", "ADMIN", "BEAUTY & SALON")
 * @param {string} props.size - 'small' | 'medium' | 'large'
 * @param {'dark' | 'light'} props.theme - Background context theme
 */
export default function BrandLogo({
  collapsed = false,
  subtitle = "BEAUTY & SALON",
  size = "medium",
  theme = "dark"
}) {
  const isDark = theme === "dark";
  const iconSize = size === "small" ? 34 : size === "large" ? 46 : 40;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        userSelect: "none",
        cursor: "pointer",
        transition: "all 0.3s ease"
      }}
    >
      {/* LUXURY ABSTRACT VECTOR EMBLEM */}
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: iconSize > 38 ? 14 : 12,
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4f46e5 100%)",
          border: "1.5px solid rgba(167, 139, 250, 0.4)",
          boxShadow: "0 6px 20px rgba(79, 70, 229, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Ambient background glow highlight */}
        <div
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            width: 24,
            height: 24,
            background: "radial-gradient(circle, rgba(236, 72, 153, 0.7) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none"
          }}
        />

        {/* Abstract Beauty Flow & Sparkle Vector Graphic */}
        <svg
          width={iconSize * 0.65}
          height={iconSize * 0.65}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="flowGrad1" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="60%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="flowGrad2" x1="22" y1="4" x2="4" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Flowing abstract 'S' curve representing beauty & hair wave */}
          <path
            d="M17.5 7C17.5 4.5 15 3 12 3C8.5 3 6.5 5 6.5 7.8C6.5 12 17.5 12 17.5 16.2C17.5 19 15.5 21 12 21C8.5 21 6.5 19.5 6.5 17"
            stroke="url(#flowGrad1)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Upward radiant beauty ribbon / flow accent */}
          <path
            d="M12 7V17M9 10L15 14"
            stroke="url(#flowGrad2)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Sparkle Star at Top Right */}
          <circle cx="18.5" cy="5.5" r="1.5" fill="#ffffff" />
          <circle cx="5.5" cy="18.5" r="1.2" fill="#c084fc" />
        </svg>
      </div>

      {/* TYPOGRAPHY */}
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                fontSize: size === "small" ? 17 : 19,
                fontWeight: 800,
                letterSpacing: "-0.4px",
                background: isDark
                  ? "linear-gradient(135deg, #ffffff 0%, #f1f5f9 60%, #cbd5e1 100%)"
                  : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1.15
              }}
            >
              Salon<span style={{ color: "#6366f1", WebkitTextFillColor: "#6366f1" }}>Flow</span>
            </span>
          </div>

          {subtitle && (
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: isDark ? "#94a3b8" : "#64748b",
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
