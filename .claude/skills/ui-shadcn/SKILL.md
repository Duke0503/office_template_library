---
name: ui-shadcn
description: >-
  The project's UI build skill. Use when building or styling Office Template Library screens with
  React, TypeScript, Tailwind and shadcn/ui: turning DESIGN.md into a themed shadcn setup and
  design-system page, adding or composing components (gallery grid, cards, preview dialog, filters,
  forms, navigation), data fetching with TanStack Query, and making every screen work on phone,
  tablet and desktop.
---

# Office Template Library UI with shadcn/ui

This skill adapts the official shadcn skill to this project. Read the project rules below first;
they win over the upstream references where they differ.

- [references/shadcn.md](references/shadcn.md): the official skill (project context, composition,
  critical rules).
- [references/design-system.md](references/design-system.md) and
  [references/design-system-page.md](references/design-system-page.md): turn a `DESIGN.md` into
  tokens, a theme and a design-system page. The helpers it mentions are in
  [references/assets/showcase/](references/assets/showcase/) and
  [references/scripts/showcase-coverage.mjs](references/scripts/showcase-coverage.mjs).
- [references/rules/](references/rules/): styling, composition, forms, icons, Base UI versus Radix.
- [references/cli.md](references/cli.md), [references/customization.md](references/customization.md),
  [references/registry.md](references/registry.md), [references/mcp.md](references/mcp.md).

Product sources: the spec (`_bmad-output/specs/spec-office-template-library/SPEC.md`) and the UX
documents `DESIGN.md` and `EXPERIENCE.md` written by `bmad-ux`. This skill reads them and never
writes them.

## Project rules

1. `DESIGN.md` is the source of tokens, type, color and spacing. Do not invent a value the design
   system does not define; propose an addition to `DESIGN.md` through `bmad-ux` instead.
2. Office-app look: calm, content first. The template thumbnail is the hero of every card; chrome
   stays quiet so previews carry the colour.
3. Every screen has explicit loading (skeletons shaped like the final layout), error (message plus
   retry), empty (with a way out, such as "Clear filters") and not-found states (SPEC CAP-9).
   Never a blank screen or a spinner alone.
4. Data comes through TanStack Query; the URL holds gallery state (kind, search, category) so a
   filtered view can be shared and survives reload.
5. The ONLYOFFICE editor is embedded full-height in its own route; the app shows its own header
   with document title, save state and download, and handles the editor failing to load.
6. Use the same domain words as the model in `docs/domain-model.json`: Template, Category,
   Document, Preview, "Use template", "My documents". No generic words such as "item" or
   "Something went wrong".
7. All UI text in English.

### Every device

8. Design and build each screen for three widths: phone (360 to 767 px), tablet (768 to 1279 px),
   desktop (1280 px and up). A feature may be simplified on a small screen, never missing.
9. Mobile-first Tailwind classes, with breakpoints matching the three widths above.
10. The gallery grid reflows from one column on phone to four or more on desktop; filters collapse
    into a sheet on phone.
11. Dialogs (such as the template preview) become full-screen sheets on phone.
12. Touch targets are at least 44 by 44 px on touch devices.

## License

shadcn/ui is MIT. See [LICENSE.md](LICENSE.md) and [UPSTREAM.md](UPSTREAM.md).
