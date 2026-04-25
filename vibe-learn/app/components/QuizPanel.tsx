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
    <div className="max-h-72 overflow-y-auto border-t border-[#d4cfc9]/20 bg-[#1c1c1c] p-5 text-[#d4cfc9]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-[#d4cfc9]">{quiz.question}</p>
        <button
          type="button"
          onClick={onEnd}
          className="shrink-0 rounded-md border border-[#d4cfc9]/35 px-3 py-1 text-xs text-[#d4cfc9] transition-colors hover:border-[#d4cfc9]/60 hover:text-[#d4cfc9]"
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
                ${selected && isRight ? 'border-[#3a853e]/45 bg-[#3a853e]/10 text-[#3a853e] dark:border-[#3a853e]/50 dark:bg-[#3a853e]/15 dark:text-[#3a853e]' : ''}
                ${isWrong ? 'border-[#852419]/45 bg-[#852419]/10 text-[#852419] dark:border-[#852419]/50 dark:bg-[#852419]/15 dark:text-[#852419]' : ''}
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
          <p className={`text-sm font-medium ${isCorrect ? 'text-[#3a853e] dark:text-[#3a853e]' : 'text-[#852419] dark:text-[#852419]'}`}>
            {isCorrect ? 'Correct!' : `Not quite — the answer was ${quiz.answer}.`}
          </p>
          {loadingFeedback && (
            <p className="text-sm italic text-[#d4cfc9]">Getting explanation...</p>
          )}
          {feedbackExplanation && (
            <p className="text-sm text-[#d4cfc9]">{feedbackExplanation}</p>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={loadingFeedback}
            className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[#d4cfc9] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
