/**
 * TweakMind design system class names.
 * Token values are defined in src/styles/design-tokens.css.
 */
export const DesignSystem = {
  typography: {
    hero: "tm-typo-hero",
    page: "tm-typo-page",
    section: "tm-typo-section",
    body: "tm-typo-body",
    bodyEmphasis: "tm-typo-body-emphasis",
    caption: "tm-typo-caption"
  },
  layout: {
    page: "tm-layout-page",
    section: "tm-layout-section",
    stack: "tm-layout-stack",
    grid: "tm-layout-grid",
    shell: "tm-layout-shell",
    main: "tm-layout-main",
    content: "tm-layout-content",
    centeredShell: "tm-centered-shell"
  },
  buttons: {
    primary: "tm-button-primary",
    secondary: "tm-button-secondary",
    ghost: "tm-button-ghost",
    disabled: "tm-button-disabled"
  },
  cards: {
    default: "tm-card",
    hover: "tm-card-hover",
    hero: "tm-card-hero",
    metadata: "tm-card-metadata",
    section: "tm-section-card",
    centered: "tm-centered-card"
  }
} as const;

export type DesignSystemClass =
  (typeof DesignSystem)[keyof typeof DesignSystem][keyof (typeof DesignSystem)[keyof typeof DesignSystem]];
