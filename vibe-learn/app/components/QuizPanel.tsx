'use client'

import { useState } from 'react'

type Quiz = {
  question: string
  options: { A: string; B: string; C: string; D: string }
  answer: string
}

interface Props {
  code: string
  isEnabled: boolean
  quiz: Quiz | null
  onAnswer: () => void
  onEnd: () => void
}

export default function QuizPanel({ code, isEnabled, quiz, onAnswer, onEnd }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [feedbackExplanation, setFeedbackExplanation] = useState<string | null>(null)
  const [loadingFeedback, setLoadingFeedback] = useState(false)

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

  const isCorrect = selected === quiz.answer

  async function handleSelect(key: string) {
    if (selected || !quiz) return
    setSelected(key)
    setLoadingFeedback(true)
    setFeedbackExplanation(null)
    try {
      const res = await fetch('/api/quiz-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: quiz.question, options: quiz.options, correctAnswer: quiz.answer, userAnswer: key }),
      })
      const data = await res.json()
      if (!data.error) setFeedbackExplanation(data.explanation)
    } finally {
      setLoadingFeedback(false)
    }
  }

  function handleContinue() {
    if (!selected) return
    setSelected(null)
    setFeedbackExplanation(null)
    onAnswer()
  }

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 max-h-72 overflow-y-auto p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-100">{quiz.question}</p>
        <button
          type="button"
          onClick={onEnd}
          className="shrink-0 rounded-md border border-zinc-200 px-3 py-1 text-xs text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
        >
          End quiz
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {(Object.entries(quiz.options) as [string, string][]).map(([key, value]) => {
          const isSelected = selected === key
          const isRight = key === quiz.answer
          const isWrong = isSelected && !isCorrect

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              disabled={!!selected}
              className={`flex items-center gap-3 rounded-md border px-4 py-2.5 text-left text-sm transition-colors
                ${selected && isRight ? 'border-green-400 bg-green-50 text-green-800 dark:border-green-600 dark:bg-green-950 dark:text-green-300' : ''}
                ${isWrong ? 'border-red-400 bg-red-50 text-red-800 dark:border-red-600 dark:bg-red-950 dark:text-red-300' : ''}
                ${!selected ? 'border-zinc-200 bg-zinc-50 text-zinc-800 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-500 dark:hover:bg-indigo-950 dark:hover:text-indigo-300' : ''}
                ${selected && !isRight && !isWrong ? 'border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500' : ''}
              `}
            >
              <span className="font-semibold">{key}.</span> {value}
              {selected && isRight && <span className="ml-auto">✓</span>}
              {isWrong && <span className="ml-auto">✗</span>}
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="mt-4 space-y-3">
          <p className={`text-sm font-medium ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isCorrect ? 'Correct!' : `Not quite — the answer was ${quiz.answer}.`}
          </p>
          {loadingFeedback && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">Getting explanation...</p>
          )}
          {feedbackExplanation && (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{feedbackExplanation}</p>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={loadingFeedback}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
