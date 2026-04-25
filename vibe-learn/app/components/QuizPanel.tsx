'use client'

type Quiz = {
  question: string
  options: { A: string; B: string; C: string; D: string }
  answer: string
}

interface Props {
  code: string
  isEnabled: boolean
  quiz: Quiz | null
  onAnswer: (selected: string) => void
}

export default function QuizPanel({ code, isEnabled, quiz, onAnswer }: Props) {
  if (!isEnabled) return null

  if (!code && !quiz) {
    return (
      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
        <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
          Generate some code first, then quiz mode will kick in.
        </p>
      </div>
    )
  }

  if (!quiz) return null

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
      <p className="mb-4 text-sm font-medium text-zinc-950 dark:text-zinc-100">{quiz.question}</p>
      <div className="flex flex-col gap-2">
        {(Object.entries(quiz.options) as [string, string][]).map(([key, value]) => (
          <button
            key={key}
            type="button"
            onClick={() => onAnswer(key)}
            className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-500 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"
          >
            <span className="font-semibold">{key}.</span> {value}
          </button>
        ))}
      </div>
    </div>
  )
}
