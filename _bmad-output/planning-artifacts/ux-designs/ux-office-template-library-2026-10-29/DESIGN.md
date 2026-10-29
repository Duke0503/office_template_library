---
name: Office Template Library
description: Template galleries inside an office app. shadcn/ui with Tailwind CSS; this DESIGN.md specifies only the brand-layer delta.
status: final
updated: 2026-10-29
colors:
  # Brand overrides on top of shadcn's neutral base. Unlisted tokens (background, foreground,
  # muted, muted-foreground, card, popover, border, input, destructive) inherit from shadcn.
  primary: '#2563EB'
  primary-foreground: '#FFFFFF'
  ring: '#2563EB'
  primary-dark: '#60A5FA'
  primary-foreground-dark: '#0B1220'
  ring-dark: '#60A5FA'
  thumbnail-backdrop: '#F1F5F9'
  thumbnail-backdrop-dark: '#1E293B'
typography:
  # shadcn default sans stack throughout. Only the page title size is named here.
  page-title:
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  card-title:
    fontSize: 15px
    fontWeight: '600'
    lineHeight: '1.3'
rounded:
  sm: 4px
  md: 6px
  lg: 10px
spacing:
  # Tailwind's 4-based scale inherited. Named tokens only.
  page-gutter-phone: 16px
  page-gutter-desktop: 32px
  grid-gap: 20px
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
  template-card:
    radius: '{rounded.lg}'
    thumbnail-background: '{colors.thumbnail-backdrop}'
  preview-dialog:
    radius: '{rounded.lg}'
    stage-background: '{colors.thumbnail-backdrop}'
  nav-item-active:
    foreground: '{colors.primary}'
---

## Brand & Style

A calm office suite. The product sits inside an office app, so it should feel like a familiar part of one: quiet, neutral chrome, generous whitespace and no decoration. **The templates are the colour.** Every card leads with its thumbnail, and the interface steps back so the previews carry the visual weight.

The UI inherits shadcn/ui wholesale. This file names only the brand-layer deltas: a blue primary, a backdrop tone for thumbnails, slightly rounder cards, and four product components.

## Colors

- **Primary blue (`#2563EB` light / `#60A5FA` dark).** Used for primary buttons ("Use template"), links, focus rings and the active nav item. It means "act here". It is never used for decoration or for status.
- **Thumbnail backdrop (`#F1F5F9` light / `#1E293B` dark).** A soft surface behind every thumbnail and the preview stage. White pages and dark slides both stay legible against it.
- **Everything else** inherits shadcn's neutral palette, including `destructive` for errors.
- **Dark mode** follows the system setting by default, and the user can override it with the top-bar toggle. Template thumbnails are never recoloured in dark mode.

## Typography

shadcn's default sans stack is used throughout. There are two named roles:

- **`page-title` (24/600).** One per screen, such as "Document templates" or "My documents".
- **`card-title` (15/600).** Template and document names on cards and rows.

Descriptions use shadcn's `muted-foreground` at body size, clamped to two lines on cards.

## Layout & Spacing

- The content width is capped at 1280px and centred.
- The page gutter is `{spacing.page-gutter-phone}` on phone and `{spacing.page-gutter-desktop}` from tablet up.
- The gallery grid uses auto-fill columns with a minimum card width of 220px and a gap of `{spacing.grid-gap}`. That gives 1 column on a small phone, 2 on a large phone, 3 on tablet and 4–5 on desktop.
- The editor route is the exception: full width and full height under a 56px header.

## Elevation & Depth

Flat at rest. A card lifts with shadcn's `shadow-md` on hover or keyboard focus. Dialogs use shadcn's overlay and shadow. No other elevation is used.

## Shapes

- `{rounded.sm}` for badges and inputs.
- `{rounded.md}` for buttons.
- `{rounded.lg}` for cards and dialogs. It is slightly softer than shadcn's default, so cards feel like paper.

Thumbnails sit inside the card's rounded top. The thumbnail image itself is not rounded, so pages keep square corners.

## Components

These shadcn components are used unchanged: Button, Badge, Input, Dialog, Sheet, Tabs, Skeleton, Table, Tooltip, DropdownMenu, Sonner (toasts) and Alert.

Product components:

- **Template card.**
  - The thumbnail sits on `{colors.thumbnail-backdrop}`, letterboxed to the kind's aspect: portrait A4 for documents, 16:9 for presentations.
  - Below it: the `card-title`, a category badge (shadcn `secondary`), and a two-line description in `muted-foreground`.
  - The whole card is one button.
- **Preview dialog.**
  - Large stage: the selected page or slide on `{colors.preview-dialog.stage-background}`.
  - A filmstrip of numbered page or slide thumbnails. The selected one has a `{colors.primary}` outline.
  - A side panel with the name, category, page or slide count, description and the primary "Use template" button.
  - It stacks vertically on phone.
- **Editor header.** 56px high: back link, document title, version badge, a hint that saving happens on close, a Download button, and a "Done" button (primary).
- **Kind tabs.** "Documents" and "Presentations" as the top-bar nav. The active item uses `{components.nav-item-active.foreground}` with a 2px underline.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Let thumbnails carry the colour | Add gradients, illustrations or coloured section backgrounds |
| Use `{colors.primary}` for the one main action per surface | Put two primary buttons on one surface |
| Keep each thumbnail's true aspect ratio | Crop pages or stretch slides to fill a card |
| Use shadcn components as shipped | Restyle shadcn components beyond the tokens above |
| Use the same layout in light and dark mode | Recolour template previews in dark mode |
