# Office Template Library

Take-home test: DOCX and PPTX template galleries with copy-on-create and an ONLYOFFICE editor.
The contract is `_bmad-output/specs/spec-office-template-library/SPEC.md`; the source brief is
`docs/reference/brief.md`.

## Design work

Applies whenever the conversation is about screens, layout, colours or UX, even without a command.

- Always go through the design skills; never design a screen ad hoc.
  - `bmad-ux` captures and updates the UX source of truth: `DESIGN.md` (look) and
    `EXPERIENCE.md` (behaviour) in `_bmad-output/planning-artifacts/ux-designs/`. Record every
    design decision there; never decide silently.
  - `bmad-agent-ux-designer` (Sally) for UX discussion and review of a screen.
  - `ui-shadcn` for building screens with React, Tailwind and shadcn/ui (adapted from the MIT
    shadcn skill; sources in its `UPSTREAM.md`).
- Every screen covers loading, error, empty and not-found states (SPEC CAP-9) and works on
  phone, tablet and desktop.

## Rules

- Everything in files is written in English, including the UI. Chat in the person's language.
- The domain model lives in `docs/domain-model.json`, managed with the `bmad-domain-driven` skill.
  Generated views in `docs/domain-viz/` are never edited by hand.
- Template originals are never written to. Editing always targets a copy.
