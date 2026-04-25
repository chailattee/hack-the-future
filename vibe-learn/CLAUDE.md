@AGENTS.md

# Vibe Learn

A web-based IDE that lets you vibe code while learning — AI generates code, but teaches you what it built. Target user is a beginner; explanations must avoid jargon by default.

## Tech Stack

- **Framework**: Next.js (App Router) — read `node_modules/next/dist/docs/` before writing any Next.js code
- **Editor**: Monaco Editor via `@monaco-editor/react`
- **AI**: Anthropic SDK (`@anthropic-ai/sdk`), model `claude-sonnet-4-20250514`
- **Deployment**: Vercel (auto-deploy from GitHub) — demo must be a live URL

## Current State

Steps 1–3 are complete:
- Monaco editor renders in `app/components/VibeLearEditor.tsx` (client component)
- Prompt input + Generate button at the top
- `POST /api/generate` calls Anthropic, returns code into the editor

## Feature Priority

| Priority | Feature | Status |
|---|---|---|
| P0 | Natural language → code generation | ✅ Done |
| P0 | Click-to-explain | Next |
| P1 | Quiz mode | After click-to-explain works end-to-end |
| P2 | Architecture explainer panel | Stretch |

**Do not start quiz mode (P1) before click-to-explain (P0) works end-to-end.**

## Key Files

- `app/components/VibeLearEditor.tsx` — main client component (editor + prompt form)
- `app/api/generate/route.ts` — code generation API route
- `app/page.tsx` — renders `<VibeLearEditor />`
- `app/layout.tsx` — root layout with Geist fonts
- `.env.local` — `ANTHROPIC_API_KEY` (never commit)

## Click-to-Explain (next feature)

When the user selects text in the Monaco editor, a sidebar or popover should show a plain-English explanation of what that code does and why it's there.

- Use Monaco's `onDidChangeCursorSelection` to capture the selected text
- Wire selection to a new API route `POST /api/explain` — same pattern as `/api/generate`
- System prompt: explain to a beginner, no jargon, focus on *what it does* and *why it's there*
- Render explanation in a sidebar panel next to the editor

## Constraints

- Explanations must be beginner-friendly — no jargon by default
- Keep API routes thin: parse body, call Anthropic, return JSON
- All new interactive UI goes in client components (`'use client'`)
- Do not store secrets anywhere except `.env.local`
