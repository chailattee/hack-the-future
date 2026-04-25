'use client'

import { useState } from 'react'

interface Props {
  code: string
}

export default function QuizPanel({ code }: Props) {
  const [isEnabled, setIsEnabled] = useState(false)

  return (
    <>
      {/* Toggle fixed in top-right corner */}
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Quiz Mode</span>
        <button
          type="button"
          onClick={() => setIsEnabled((prev) => !prev)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            isEnabled ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
          }`}
          aria-pressed={isEnabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Quiz content panel at bottom */}
      {isEnabled && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
          {code ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
              Quiz mode is on — questions will appear here.
            </p>
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
              Generate some code first, then quiz mode will kick in.
            </p>
          )}
        </div>
      )}
    </>
  )
}
