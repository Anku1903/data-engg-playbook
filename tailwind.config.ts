import type { Config } from "tailwindcss";

// Material 3 dark palette — minimal, slick. Tokens still live under the `vsc`
// namespace to avoid mass-renaming classes across the codebase; only the values
// change. Roles are semantic, not literal (vsc.bg = base surface, vsc.accent =
// primary, etc.).
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        vsc: {
          // Surfaces (Material 3 "surface container" ladder, tuned darker)
          bg:          "#111318", // surface
          bgDeep:      "#0B0D11", // surface-dim
          sidebar:     "#15171C", // surface-container-low
          sidebarRaw:  "#15171C",
          panel:       "#1A1C22", // surface-container
          panelElev:   "#1F2128", // surface-container-high
          codeBg:      "#15171C", // code surface
          codeHeader:  "#1A1C22",
          hover:       "rgba(168,199,250,0.08)",      // state layer hover
          active:      "rgba(168,199,250,0.14)",      // state layer pressed
          activeSoft:  "rgba(168,199,250,0.10)",
          // Outlines (Material 3 outline / outline-variant)
          border:      "#2A2D34",
          borderSoft:  "#24272D",
          borderHair:  "#1F2128",
          // Primary
          accent:      "#A8C7FA", // primary
          accentHover: "#C2D7FB",
          accentSoft:  "rgba(168,199,250,0.14)",
          onAccent:    "#062E6F", // on-primary
          // Text
          text:        "#E3E3E7", // on-surface
          textMuted:   "#C4C7CF", // on-surface-variant
          textDim:     "#8A8D94",
          textFaint:   "#5F6269",
          heading:     "#FFFFFF",
          link:        "#A8C7FA",
          inlineCode:  "#F2B8B5",
          // Semantic
          success:     "#81C995",
          warning:     "#FDD663",
          error:       "#F2B8B5",
        },
      },
      fontFamily: {
        // Roboto Flex is Google's modern variable Roboto — the one their teams
        // have moved to. Keeps a Material feel without looking generic.
        sans: ['"Roboto Flex Variable"', '"Roboto Flex"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        display: ['"Roboto Flex Variable"', '"Roboto Flex"', "system-ui", "sans-serif"],
      },
      fontSize: {
        "micro": ["11px", { lineHeight: "1.45", letterSpacing: "0.06em" }],
        "body2": ["13px", { lineHeight: "1.55" }],
        "body":  ["14px", { lineHeight: "1.65" }],
        "lead":  ["16px", { lineHeight: "1.6" }],
        "h3":    ["18px", { lineHeight: "1.4",  letterSpacing: "0",        fontWeight: "600" }],
        "h2":    ["22px", { lineHeight: "1.3",  letterSpacing: "-0.005em", fontWeight: "600" }],
        "h1":    ["30px", { lineHeight: "1.2",  letterSpacing: "-0.015em", fontWeight: "600" }],
        "hero":  ["44px", { lineHeight: "1.08", letterSpacing: "-0.025em", fontWeight: "700" }],
      },
      spacing: {
        "sidebar": "284px",
        "topbar":  "64px",
      },
      letterSpacing: {
        "tightest": "-0.025em",
        "kbd":      "0.06em",
      },
      maxWidth: {
        "prose2": "68ch",
      },
      boxShadow: {
        // Material 3 elevation (dark, subtle)
        "elev-1": "0 1px 2px rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)",
        "elev-2": "0 1px 2px rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15)",
        "elev-3": "0 1px 3px rgba(0,0,0,0.3), 0 4px 8px 3px rgba(0,0,0,0.15)",
        "elev-4": "0 2px 3px rgba(0,0,0,0.3), 0 6px 10px 4px rgba(0,0,0,0.15)",
        "ring-accent": "0 0 0 2px rgba(168,199,250,0.35)",
        "inset-hair": "inset 0 -1px 0 #1F2128",
      },
      borderRadius: {
        // Material 3 shape scale
        "xs2":  "4px",
        "sm2":  "8px",
        "md2":  "12px",
        "lg2":  "16px",
        "xl2":  "20px",
        "2xl2": "28px",
        "full2": "9999px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "translate(-50%, -48%) scale(0.98)" },
          "100%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "fade-backdrop": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "stagger-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in":       "fade-in 220ms cubic-bezier(0.2, 0, 0, 1) both",
        "scale-in":      "scale-in 200ms cubic-bezier(0.2, 0, 0, 1) both",
        "fade-backdrop": "fade-backdrop 180ms ease-out both",
        "stagger-up":    "stagger-up 280ms cubic-bezier(0.2, 0, 0, 1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
