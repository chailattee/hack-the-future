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
    <div className="max-h-72 overflow-y-auto bg-[#1c1c1c] p-5 text-[#d4cfc9]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-[#d4cfc9]">{quiz.question}</p>
        <button
          type="button"
          onClick={onEnd}
          className="shrink-0 rounded-none px-3 py-1 text-xs text-[#d4cfc9] transition-colors hover:text-[#d4cfc9]"
        >
          end quiz
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
              className={`flex items-center gap-3 rounded-none px-4 py-2.5 text-left text-sm transition-colors
                ${selected && isRight ? 'bg-[#3a853e]/10 text-[#3a853e] dark:bg-[#3a853e]/15 dark:text-[#3a853e]' : ''}
                ${isWrong ? 'bg-[#852419]/10 text-[#852419] dark:bg-[#852419]/15 dark:text-[#852419]' : ''}
                ${!selected ? 'bg-[var(--color-surface-raised)] text-[var(--color-text)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]' : ''}
                ${selected && !isRight && !isWrong ? 'bg-[var(--color-surface)] text-[var(--color-text-dim)]' : ''}
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
            className="rounded-none bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[#d4cfc9] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
