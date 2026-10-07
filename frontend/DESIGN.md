---
name: Voyage TIS
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4947'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#00685d'
  on-tertiary: '#ffffff'
  tertiary-container: '#008376'
  on-tertiary-container: '#f4fffb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#71f8e4'
  tertiary-fixed-dim: '#4fdbc8'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-xs:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system establishes a clean, academic-grade, yet commercially polished aesthetic tailored for an academic database showcase. It marries the structured rigor of an informational directory with the inviting, refreshing nature of leisure exploration.

### Personality & Values
- **Clarity & Authority:** Information architecture leads the interface; structured data points (ratings, coordinates, hours, classifications) are legible without clutter.
- **Inviting & Crisp:** Avoids heavy gradients, gimmicks, or dark sci-fi chrome. The application feels like a sunlit architectural blueprint or an editorial field guide.
- **Academic Polish:** High data-density views transition smoothly into spacious exploratory views, maintaining strict typographic hierarchy and structured alignments suitable for formal presentation.

### Aesthetic Movement
A synthesis of **Modern Utilitarian** and **Editorial Minimalism**:
- Generous micro and macro whitespace preventing cognitive fatigue.
- Pure flat canvas layers contrasted by soft, high-precision perimeter outlines.
- Strategic pops of vibrant natural jewel tones (teal and emerald) with warm sunlight amber accents for key discovery signals.

## Colors

The palette balances utility and natural tranquility, utilizing cool slate neutrals to let travel imagery and system data badges sit with prominence.

### Core Roles
- **Primary (`#0D9488`):** Deep Teal. Used for primary CTAs, active tab indicators, high-emphasis interactive states, and core branding.
- **Secondary (`#F59E0B`):** Warm Amber. Reserved strictly for ratings, operational highlights, curated recommendations, and favorite states.
- **Tertiary (`#14B8A6`):** Vibrant Emerald/Teal. Secondary action buttons, interactive toggles, success feedback, and hovered states.
- **Neutral Dark (`#0F172A`):** Deep Slate. Primary typography and high-contrast borders.
- **Neutral Surface (`#F8FAFC`):** Crisp Off-White canvas base, delivering clarity without stark glare.

### Semantic Badges (POI Categorization)
- **Places / Landmarks:** Teal (`#0D9488` text, `#CCFBF1` surface).
- **Restaurants / Dining:** Burnt Coral (`#EA580C` text, `#FFEDD5` surface).
- **Activities / Recreation:** Sky Blue (`#0284C7` text, `#E0F2FE` surface).
- **Events / Seasonal:** Indigo (`#6366F1` text, `#EEF2FF` surface).

### Surface & Border Hierarchy
- Canvas Base: `#F8FAFC`
- Card Surface: `#FFFFFF`
- Muted Container: `#F1F5F9`
- Subtle Border / Divider: `#E2E8F0`
- Focused Outline: `#0D9488`

## Typography

Typography relies entirely on **Inter** to maintain neutral, systematic readability across tabular metadata and editorial destination descriptions.

### Typographic Hierarchy Guidelines
- **Display & Large Headlines:** Used exclusively for landing portal overviews and major destination banners. Tracking should be tightened to `-0.02em` for sizes 24px and above.
- **Headlines & Titles:** Set with semibold weight (`600`) to anchor scannability when browsing lists of hotels, attractions, and database record tables.
- **Body:** Standardized on `14px` (`body-md`) for standard screen interactions to optimize vertical data density without compromising accessibility. `body-lg` is reserved for editorial intros and destination descriptions.
- **Labels & Metadata:** Upper-case transformation paired with `+0.04em` tracking is applied strictly to `label-xs` for category badges and table column headers.

## Layout & Spacing

The layout is built upon an 8pt structural rhythm within a responsive grid designed for multi-column filtering, spatial mapping, and structured card catalogs.

### Grid & Breakpoints
- **Desktop (1024px+):** 12-column fluid grid. Layout defaults to a persistent or collapsible 280px left sidebar for filters/facets, paired with an 8-to-9 column content viewport. Outer margins are `2rem` (`margin`), column gutters are `1.5rem` (`gutter`).
- **Tablet (768px – 1023px):** 8-column layout. Filter bar collapses into an off-canvas drawer or horizontal segmented scroll bar. Gutters compress to `1rem` (`gutter-sm`).
- **Mobile (< 768px):** 4-column layout. Full-width cards with `1rem` outer margin (`margin-sm`).

### Content Rhythms
- Card internal padding uses `space-md` (16px) for compact listings and `space-lg` (24px) for featured hero cards.
- Vertical stack spacing between distinct search controls and result counts maintains a strict `space-md` or `space-lg` distance.

## Elevation & Depth

This system avoids heavy shadows, dark glows, and layered blur cascades. Visual separation relies on crisp line definitions paired with gentle ambient occlusion.

### Elevation Levels
- **Level 0 (Flat / Canvas):** Surface color `#F8FAFC`. Zero elevation.
- **Level 1 (Default Containers & Cards):** Surface color `#FFFFFF`, border `1px solid #E2E8F0`. Shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`.
- **Level 2 (Hovered Cards & Dropdowns):** Surface color `#FFFFFF`, border `1px solid #CBD5E1`. Shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Modals & Sticky Map Overlays):** Surface color `#FFFFFF`, border `1px solid #E2E8F0`. Shadow: `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)`.

### Border Guidelines
Borders act as primary perimeter dividers throughout the system. Borders are consistently `1px` thickness, utilizing `#E2E8F0` on static components and shifting to `#0D9488` upon input focus or selected state.

## Shapes

The geometric identity balances contemporary soft software conventions with structured, architectural lines.

### Radius Assignments
- **Inputs, Buttons, and Select Menus:** `0.5rem` (`rounded-md` / base roundedness).
- **Listing Cards, Panels, and Dialogs:** `1rem` (`rounded-lg`).
- **Pills, Filter Tags, and Categorical Badges:** `9999px` (fully rounded pill format to visually contrast against the card containers).
- **Thumbnail Images:** Consistent `0.5rem` internal clipping within listing cards.

## Components

### Buttons
- **Primary:** Filled `#0D9488` background, `#FFFFFF` text, `0.5rem` border radius, padding `0.625rem 1.25rem`. Hover state transitions to `#0F766E`. Focus shows a `2px` ring in `#14B8A6` with `2px` offset.
- **Secondary / Outlined:** Transparent background, `1px solid #CBD5E1`, text `#0F172A`. Hover transitions background to `#F1F5F9`.
- **Ghost:** Text `#0F172A`, no border. Used for tertiary actions and clear filters. Hover: `#F1F5F9`.

### Chips & Badges
- **Categorical POI Badges:** Compact height (24px), font `label-xs` in uppercase, pill radius. Tinted low-opacity background with saturated text (e.g., Places: `#CCFBF1` background, `#0D9488` text).
- **Filter Chips:** Height 32px, border `1px solid #E2E8F0`, background `#FFFFFF`, text `#0F172A`. When active: background `#0D9488`, border `#0D9488`, text `#FFFFFF`.

### Cards (POI & Travel Items)
- Built on Level 1 elevation: `#FFFFFF` surface, `1px solid #E2E8F0` border, `1rem` radius.
- Upper region contains a `16:10` aspect ratio image container. Top-left overlay anchors the POI Type Badge; top-right contains the secondary amber rating indicator (`#FFFFFF` background pill with `#F59E0B` star icon and rating number).
- Content zone utilizes `space-md` internal padding, featuring title (`title-md`), geo-location subtitle (`body-sm` in slate muted `#64748B`), and a bottom metadata strip with price tier or opening status.

### Form Inputs & Search Bars
- Background `#FFFFFF`, border `1px solid #CBD5E1`, font `body-md`, placeholder `#94A3B8`.
- Global search incorporates a leading search icon, elevated with a subtle Level 1 shadow and trailing quick-filter buttons.
- Focused state: border `#0D9488`, ring `3px rgba(13, 148, 136, 0.15)`.

### Checkboxes & Radio Buttons
- Checkbox: 18x18px box with `0.25rem` radius, border `1.5px solid #94A3B8`. Checked state fills `#0D9488` with white checkmark icon.
- Radio: 18x18px circle, filled with `#0D9488` center pip when active.

### Data Tables (Database Entity Inspector)
- Designed for academic verification of database records. Header row has `#F8FAFC` background with uppercase `label-xs` typography in `#64748B`.
- Alternate rows maintain pure white canvas with subtle horizontal separator lines (`#F1F5F9`). Interactive rows display hover tint `#F8FAFC`.