/**
 * TweakMind design system class names.
 * Token values are defined in src/styles/design-tokens.css.
 */
export const DesignSystem = {
  typography: {
    heroTitle: "tm-typo-hero-title",
    pageTitle: "tm-typo-page-title",
    sectionTitle: "tm-typo-section-title",
    body: "tm-typo-body",
    bodyEmphasis: "tm-typo-body-emphasis",
    caption: "tm-typo-caption"
  },
  spacing: {
    page: "tm-page",
    sectionGap: "tm-gap-section",
    stackSm: "tm-stack-sm",
    stackMd: "tm-stack-md",
    stackLg: "tm-stack-lg",
    cardPadding: "tm-space-card-padding"
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
    metadata: "tm-metadata-panel",
    section: "tm-section-card"
  },
  layout: {
    shell: "tm-layout-shell",
    main: "tm-layout-main",
    content: "tm-layout-content"
  }
} as const;

export type DesignSystemClass =
  (typeof DesignSystem)[keyof typeof DesignSystem][keyof (typeof DesignSystem)[keyof typeof DesignSystem]];
