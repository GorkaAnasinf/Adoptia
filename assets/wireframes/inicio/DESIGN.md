---
name: Warm Earth & Tail
colors:
  surface: '#fef8f0'
  surface-dim: '#dfd9d2'
  surface-bright: '#fef8f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f3eb'
  surface-container: '#f3ede5'
  surface-container-high: '#ede7e0'
  surface-container-highest: '#e7e2da'
  on-surface: '#1d1b17'
  on-surface-variant: '#56423e'
  inverse-surface: '#32302b'
  inverse-on-surface: '#f6f0e8'
  outline: '#89726d'
  outline-variant: '#ddc0ba'
  surface-tint: '#9f402d'
  primary: '#9f402d'
  on-primary: '#ffffff'
  primary-container: '#e2725b'
  on-primary-container: '#5a0d02'
  inverse-primary: '#ffb4a5'
  secondary: '#396662'
  on-secondary: '#ffffff'
  secondary-container: '#bcece6'
  on-secondary-container: '#3f6c68'
  tertiary: '#4e635a'
  on-tertiary: '#ffffff'
  tertiary-container: '#81978d'
  on-tertiary-container: '#1b2f28'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad3'
  primary-fixed-dim: '#ffb4a5'
  on-primary-fixed: '#3e0500'
  on-primary-fixed-variant: '#802918'
  secondary-fixed: '#bcece6'
  secondary-fixed-dim: '#a1cfca'
  on-secondary-fixed: '#00201e'
  on-secondary-fixed-variant: '#204e4a'
  tertiary-fixed: '#d1e8dd'
  tertiary-fixed-dim: '#b5ccc1'
  on-tertiary-fixed: '#0b1f18'
  on-tertiary-fixed-variant: '#374b43'
  background: '#fef8f0'
  on-background: '#1d1b17'
  surface-variant: '#e7e2da'
typography:
  headline-xl:
    fontFamily: Montserrat
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Open Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Open Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Open Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Open Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-max: 1200px
  gutter: 20px
  margin-mobile: 16px
---

## Brand & Style

The design system is centered on the concept of "Nurturing Connection." It targets compassionate individuals and families looking to expand their homes through pet adoption. The emotional response is one of safety, warmth, and quiet joy.

The aesthetic blends **Modern Minimalism** with **Tactile Softness**. By utilizing a high-ratio of white space and a palette of organic, earthy tones, the interface acts as a quiet frame for high-quality animal photography. Visual clutter is ruthlessly eliminated to reduce cognitive load, ensuring the transition from browsing to adoption feels seamless and supportive. The UI avoids the clinical feel of typical search platforms, opting instead for a "homestyle" digital environment that feels as welcoming as a living room.

## Colors

The palette is rooted in organic, earth-derived tones to foster a sense of reliability and groundedness.

- **Primary (Terracotta):** Used for brand expression, active states, and primary actions. It evokes the warmth of a home.
- **Secondary (Teal):** Reserved for high-priority Call-to-Actions (CTAs). Its coolness provides a clear visual contrast against the warm backgrounds without being jarring.
- **Tertiary (Sage):** Used for success states, labels, or secondary decorative elements to reinforce the natural theme.
- **Neutral (Sand/Cream):** The primary background color. It is softer on the eyes than pure white, providing a "paper-like" warmth.
- **Text (Charcoal):** High-contrast for accessibility (WCAG AA), used for all primary reading experiences.

## Typography

This design system utilizes a pairing of **Montserrat** for headlines and **Open Sans** for body text. This combination ensures high readability while maintaining a friendly, humanist character.

All Spanish-language content should follow standard capitalization rules, though headlines use a slightly tighter letter-spacing to appear more cohesive in display sizes. Body text is set with generous line heights to accommodate the longer average word length of the Spanish language, preventing text blocks from appearing overly dense. All interactive labels must be at least 14px to maintain legibility for a broad demographic range.

## Layout & Spacing

The layout utilizes a **Fluid Grid** system with a focus on generous padding to create a "breathable" interface.

- **Desktop:** 12-column grid, 1200px max-width, 24px gutters.
- **Tablet:** 8-column grid, 20px gutters, 32px side margins.
- **Mobile:** 4-column grid, 16px gutters, 16px side margins.

A strict 4px base-unit scale is used for all internal component spacing. Vertical rhythm is maintained by using `lg` (24px) or `xl` (32px) increments between major content sections. Photography should always attempt to break the inner gutters of its container to feel expansive and immersive.

## Elevation & Depth

To maintain the soft and friendly brand personality, this design system avoids harsh borders. Instead, it uses **Ambient Shadows** and **Tonal Layers**.

1.  **Low Elevation (Resting Cards):** A very soft, diffused shadow with a slight Terracotta tint (`rgba(226, 114, 91, 0.08)`) and a 12px blur.
2.  **High Elevation (Modals/Overlays):** A more pronounced shadow with a 24px blur to signify priority and focus.
3.  **Tonal Depth:** Surfaces use the Sand/Cream neutral color to sit atop the primary background, creating depth through color value shifts rather than just shadows.
4.  **Glassmorphism:** Used sparingly on top-navigation bars to allow the colors of the pet photos to bleed through subtly as the user scrolls.

## Shapes

The shape language is inherently "Organic and Rounded." To reflect the softness of pets and the kindness of the adoption process, sharp corners are strictly avoided.

- **Base Radius:** 8px (0.5rem) for small elements like checkboxes and input fields.
- **Large Radius:** 16px (1rem) for cards and primary containers.
- **Full Radius:** Used for tags, chips, and circular buttons to create a pill-shaped appearance.

Images of pets should always carry the `rounded-lg` (16px) or `rounded-xl` (24px) treatment to ensure they feel like they belong within the soft aesthetic of the interface.

## Components

### Buttons & Interaction
- **Primary Button:** Filled Terracotta (#E2725B) with white text. Height: 48px. 16px rounded corners.
- **Secondary CTA:** Filled Teal (#2D5A56) with white text. Used for "Adoptar" or "Donar."
- **Touch Targets:** All interactive elements maintain a minimum area of 44x44px.

### Cards
- **Pet Profile Cards:** 16px corner radius. Image takes up the top 60% of the card. Content area uses the Sand neutral color with primary Charcoal text. No borders; use ambient shadows for definition.

### Form Elements
- **Input Fields:** 8px corner radius. 2px Sage Green border on focus. Labels are always positioned above the input for clarity.
- **Checkboxes/Radio:** 4px radius for checkboxes, circular for radio. Uses the primary Terracotta for the "selected" state.

### Specialized Components
- **Status Chips:** Small, pill-shaped tags (e.g., "Urgente", "Recién llegado") using low-saturation versions of the primary/tertiary colors to signify status without distracting from the pet's photo.
- **Photo Gallery:** A horizontal carousel for mobile and a masonry-inspired grid for desktop, prioritizing large-scale imagery.