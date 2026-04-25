'use client'

// QUIZ TEAMMATE — this is your file.
// Props you receive:
//   code: the full generated code currently in the editor
//   isEnabled: whether quiz mode is toggled on
//
// Your job:
//   1. When isEnabled becomes true (and code is non-empty), POST to /api/quiz with { code }
//   2. Render a question (multiple-choice or fill-in-the-blank) for the user to answer
//   3. Show feedback after the user answers, then allow them to continue
//   4. Create app/api/quiz/route.ts for the backend

interface Props {
  code: string
  isEnabled: boolean
}

export default function QuizPanel({ code, isEnabled }: Props) {
  if (!isEnabled || !code) return null

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
      {/* TODO: quiz UI goes here */}
      <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">Quiz mode is on — questions will appear here.</p>
    </div>
  )
}
