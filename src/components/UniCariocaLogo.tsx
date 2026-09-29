import React from "react";

interface UniCariocaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "seal-only" | "full" | "on-navy";
  className?: string;
}

export default function UniCariocaLogo({
  size = "md",
  variant = "full",
  className = ""
}: UniCariocaLogoProps) {
  const sizeMap = {
    sm: { seal: 40, textTitle: "text-xs", textSub: "text-[9px]" },
    md: { seal: 52, textTitle: "text-sm", textSub: "text-[11px]" },
    lg: { seal: 68, textTitle: "text-base", textSub: "text-xs" },
    xl: { seal: 96, textTitle: "text-xl", textSub: "text-sm" },
  };

  const currentSize = sizeMap[size];

  // Exact 1:1 vector reproduction of the UniCarioca official circular seal from image.png
  const sealSvg = (
    <div
      style={{ width: currentSize.seal, height: currentSize.seal }}
      className="relative flex items-center justify-center flex-shrink-0 select-none"
      title="UniCarioca"
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glowing neon ring gradient: yellow/orange at bottom-left to magenta/purple at top-right */}
          <linearGradient id="unicarioca-neon-ring" x1="15%" y1="85%" x2="85%" y2="15%">
            <stop offset="0%" stopColor="#FFC700" />
            <stop offset="22%" stopColor="#FF6B00" />
            <stop offset="48%" stopColor="#FF0044" />
            <stop offset="75%" stopColor="#E6007A" />
            <stop offset="100%" stopColor="#C000FF" />
          </linearGradient>

          {/* Deep crimson/red radial gradient inside the circle */}
          <radialGradient id="unicarioca-red-disc" cx="42%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#E51D24" />
            <stop offset="60%" stopColor="#C41318" />
            <stop offset="100%" stopColor="#8A0C10" />
          </radialGradient>

          {/* Drop shadow for text and crest */}
          <filter id="logo-depth" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#400000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer Glowing Gradient Ring (identical to image.png) */}
        <circle
          cx="100"
          cy="100"
          r="96"
          fill="none"
          stroke="url(#unicarioca-neon-ring)"
          strokeWidth="6.5"
        />

        {/* Inner Solid Red Disc */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="url(#unicarioca-red-disc)"
        />

        {/* --- Symbol on the Right (White wings / leaves / crest of UniCarioca) --- */}
        <g filter="url(#logo-depth)">
          {/* Back small wing */}
          <path
            d="M 144 58 C 152 64 158 74 156 86 C 153 82 147 78 141 75 C 144 68 144 63 144 58 Z"
            fill="#FFFFFF"
            opacity="0.95"
          />

          {/* Main wing - outer contour */}
          <path
            d="M 108 103 C 118 104 135 101 150 94 C 158 87 160 76 156 70 C 150 78 140 84 128 87 C 138 72 144 56 146 54 C 137 60 126 73 118 84 C 112 76 109 72 108 72 C 109 78 111 87 114 94 C 110 98 108 101 108 103 Z"
            fill="#FFFFFF"
          />

          {/* Large flowing front petal */}
          <path
            d="M 110 102 C 120 103 138 98 152 86 C 160 74 155 60 145 54 C 142 62 136 74 124 85 C 134 68 138 52 140 50 C 130 58 119 72 112 85 C 110 88 109 96 110 102 Z"
            fill="#FFFFFF"
          />

          {/* Curved red line inside the white petal (authentic UniCarioca detail from image.png) */}
          <path
            d="M 124 86 C 135 76 142 65 144 55 C 142 63 135 73 124 86 Z"
            fill="#A70E12"
          />
        </g>

        {/* --- Typography on the Left (exact typography from image.png) --- */}
        <g fill="#FFFFFF" textAnchor="start">
          {/* "UNI" */}
          <text
            x="36"
            y="106"
            fontFamily="'Poppins', 'Arial Black', -apple-system, sans-serif"
            fontWeight="900"
            fontSize="48"
            letterSpacing="-1.5"
            transform="scale(1, 0.95)"
          >
            UNI
          </text>

          {/* "CARIOCA" */}
          <text
            x="36"
            y="132"
            fontFamily="'Poppins', 'Arial Black', -apple-system, sans-serif"
            fontWeight="900"
            fontSize="32"
            letterSpacing="-0.2"
          >
            CARIOCA
          </text>
        </g>
      </svg>
    </div>
  );

  if (variant === "seal-only") {
    return <div className={`inline-flex items-center ${className}`}>{sealSvg}</div>;
  }

  const isNavy = variant === "on-navy";

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {sealSvg}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-extrabold tracking-tight ${currentSize.textTitle} ${
              isNavy ? "text-white" : "text-[#0A1733]"
            }`}
          >
            UniCarioca
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-[#D0201A] text-white text-[9px] font-bold uppercase tracking-wider">
            2026/2
          </span>
        </div>
        <span
          className={`font-medium tracking-wide ${currentSize.textSub} ${
            isNavy ? "text-[#CBD4E8]" : "text-[#66728C]"
          }`}
        >
          Agendamento de Apresentações
        </span>
      </div>
    </div>
  );
}
