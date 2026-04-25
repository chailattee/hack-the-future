@AGENTS.md

# Vibe Learn

A web-based IDE that lets you vibe code while learning — AI generates code, but teaches you what it built. Target user is a beginner; explanations must avoid jargon by default.

## Tech Stack

- **Framework**: Next.js 16 (App Router) — read `node_modules/next/dist/docs/` before writing any Next.js code
- **Editor**: Monaco Editor via `@monaco-editor/react`
- **AI**: Anthropic SDK (`@anthropic-ai/sdk`), model `claude-sonnet-4-6`
- **Deployment**: Vercel (auto-deploy from GitHub) — demo must be a live URL

## File Map — who owns what

| File | Feature | Notes |
|---|---|---|
| `app/components/VibeLearEditor.tsx` | Main layout + all shared state | Monolithic by choice — teammates rewrote it; editor is now editable (readOnly: false) |
| `app/components/CodeEditor.tsx` | Monaco wrapper (unused — logic inlined into VibeLearEditor) | Keep for reference |
| `app/components/ExplainSidebar.tsx` | Sidebar shell (unused — explain inlined into VibeLearEditor) | Keep for reference |
| `app/components/QuizPanel.tsx` | Quiz mode UI | **Quiz teammate's file** |
| `app/api/generate/route.ts` | Code generation | Accepts `{ prompt, language }`, returns `{ code }` |
| `app/api/explain/route.ts` | Click-to-explain | Accepts `{ code }`, returns `{ explanation }` |
| `app/api/quiz/route.ts` | Quiz mode backend | **Quiz teammate's file** — placeholder, returns 501 |

## Key Implementation Details

### VibeLearEditor.tsx
- All state lives here: `code`, `language`, `prompt`, `selectedCode`, `explanation`, `explainButtonPosition`, `quizEnabled`, `settingsOpen`
- Monaco is **editable** (`readOnly: false`) — users can modify generated code
- Language dropdown updates syntax highlighting immediately via `language={language.toLowerCase()}` prop (not `defaultLanguage`)
- Floating "Explain" button appears at cursor position after selection using `editor.getScrolledVisiblePosition()`
- `renderExplanation()` parses markdown-like formatting (bold, code, bullets) into React nodes
- Settings gear icon (top-right of header) opens a dropdown with a quiz mode toggle; click-outside closes it via `useEffect` + `useRef`
- `QuizPanel` is rendered at the bottom of the page, receives `code` and `isEnabled={quizEnabled}`

### API Routes — all follow the same pattern
```
POST body → Anthropic claude-sonnet-4-6 → strip markdown fences → return JSON
```
- `generate`: system prompt includes the selected language; strips ` ``` ` fences defensively
- `explain`: system prompt instructs plain-English, no jargon, no heading markers, no code fences in response
- `quiz`: TODO — stub only

### Avoiding merge conflicts
Each teammate works in their own files. The quiz teammate only touches:
- `app/components/QuizPanel.tsx`
- `app/api/quiz/route.ts`

`QuizPanel` receives `{ code: string, isEnabled: boolean }` as props from `VibeLearEditor`.

## Environment
- `ANTHROPIC_API_KEY` in `.env.local` (never commit — already in `.gitignore` via `.env*`)
- Dev: `npm run dev` at `http://localhost:3000`

## Constraints
- Explanations must be beginner-friendly — no jargon by default
- Keep API routes thin: parse body, call Anthropic, return JSON
- All interactive UI in client components (`'use client'`)
- Never commit `.env.local`
- Before writing any Next.js-specific code, check `node_modules/next/dist/docs/`
- **Desktop only** — do not add mobile/responsive handling. This is a desktop web app. Ignore mobile breakpoints and layout concerns.
