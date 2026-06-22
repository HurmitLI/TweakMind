import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      spacing: {
        "tm-section": "var(--tm-space-section-gap)",
        "tm-card": "var(--tm-space-card-padding)",
        "tm-sm": "var(--tm-space-gap-sm)",
        "tm-md": "var(--tm-space-gap-md)",
        "tm-lg": "var(--tm-space-gap-lg)",
        "tm-hero-y": "var(--tm-space-hero-padding-y)"
      },
      borderRadius: {
        "tm-sm": "var(--tm-radius-sm)",
        "tm-md": "var(--tm-radius-md)",
        "tm-lg": "var(--tm-radius-lg)",
        "tm-hero": "var(--tm-radius-hero)"
      },
      boxShadow: {
        "tm-soft": "var(--tm-shadow-soft)",
        "tm-medium": "var(--tm-shadow-medium)"
      },
      colors: {
        "tm-surface": "var(--tm-color-surface)",
        "tm-surface-muted": "var(--tm-color-surface-muted)",
        "tm-border-soft": "var(--tm-color-border-soft)",
        "tm-text": "var(--tm-color-text)",
        "tm-text-muted": "var(--tm-color-text-muted)",
        "tm-accent": "var(--tm-color-accent)"
      }
    }
  },
  plugins: []
} satisfies Config;
