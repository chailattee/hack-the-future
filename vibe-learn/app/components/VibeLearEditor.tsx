
'use client'

import type { ReactNode } from 'react'
import { useState, useRef, useEffect } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import QuizPanel from './QuizPanel'

type ExplainButtonPosition = {
  top: number
  left: number
}

function renderInlineFormatting(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-zinc-950 dark:text-zinc-50">
          {part.slice(2, -2)}
        </strong>
      )
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-mono text-[0.8em] text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    return part
  })
}

function renderExplanation(explanation: string) {
  return explanation
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const heading = line.match(/^#{1,4}\s+(.+)/)
      if (heading) {
        return (
          <h3
            key={index}
            className="mt-5 first:mt-0 text-sm font-semibold text-zinc-950 dark:text-zinc-50"
          >
            {renderInlineFormatting(heading[1])}
          </h3>
        )
      }

      const bullet = line.match(/^[-*]\s+(.+)/)
      if (bullet) {
        return (
          <p key={index} className="relative pl-4">
            <span className="absolute left-0 text-indigo-500">•</span>
            {renderInlineFormatting(bullet[1])}
          </p>
        )
      }

      const numbered = line.match(/^\d+\.\s+(.+)/)
      if (numbered) {
        return <p key={index}>{renderInlineFormatting(numbered[1])}</p>
      }

      return <p key={index}>{renderInlineFormatting(line)}</p>
    })
}

export default function VibeLearEditor() {
  const [prompt, setPrompt] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('JavaScript')
  const [loading, setLoading] = useState(false)
  const [selectedCode, setSelectedCode] = useState('')
  const [explanation, setExplanation] = useState('')
  const [explaining, setExplaining] = useState(false)
  const [error, setError] = useState('')
  const [explainButtonPosition, setExplainButtonPosition] =
    useState<ExplainButtonPosition | null>(null)
  const [quizEnabled, setQuizEnabled] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<{ question: string; options: { A: string; B: string; C: string; D: string }; answer: string }[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function updateSelectedCode(editor: Parameters<OnMount>[0]) {
    const selection = editor.getSelection()
    const model = editor.getModel()

    if (!selection || !model || selection.isEmpty()) {
      setSelectedCode('')
      setExplainButtonPosition(null)
      return
    }

    const value = model.getValueInRange(selection).trim()

    if (!value) {
      setSelectedCode('')
      setExplainButtonPosition(null)
      return
    }

    const endPosition = selection.getEndPosition()
    const visiblePosition = editor.getScrolledVisiblePosition(endPosition)

    setSelectedCode(value)
    setExplainButtonPosition(
      visiblePosition
        ? {
          top: Math.max(12, visiblePosition.top + visiblePosition.height + 8),
          left: Math.max(12, visiblePosition.left),
        }
        : { top: 12, left: 12 },
    )
  }

  const handleEditorMount: OnMount = (editor) => {
    const selectionDisposable = editor.onDidChangeCursorSelection(() => {
      updateSelectedCode(editor)
    })
    const scrollDisposable = editor.onDidScrollChange(() => {
      if (editor.getSelection()?.isEmpty()) return
      updateSelectedCode(editor)
    })

    editor.onDidDispose(() => {
      selectionDisposable.dispose()
      scrollDisposable.dispose()
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    setError('')
    setQuizQuestions([])
    setQuizIndex(0)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, language }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }
      setCode(data.code)
      setSelectedCode('')
      setExplainButtonPosition(null)
      setExplanation('')
      if (quizEnabled && data.code) {
        const qRes = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: data.code, language, previousQuestions: [] }),
        })
        const qData = await qRes.json()
        if (qData.questions) setQuizQuestions(qData.questions)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleAnswer() {
    const nextIndex = quizIndex + 1
    setQuizIndex(nextIndex)
    if (nextIndex >= quizQuestions.length - 1 && code) {
      try {
        const qRes = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language, previousQuestions: quizQuestions }),
        })
        const qData = await qRes.json()
        if (qData.questions) setQuizQuestions((prev) => [...prev, ...qData.questions])
      } catch {
        // silently ignore — user still has remaining questions
      }
    }
  }

  async function handleExplain() {
    if (!selectedCode.trim()) return
    setExplaining(true)
    setError('')
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: selectedCode }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }
      setExplanation(data.explanation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setExplaining(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <span className="text-lg font-semibold tracking-tight">Vibe Learn</span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Build, edit, highlight, and learn from the code.
          </p>
        </div>

        <div className="relative" ref={settingsRef}>
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {settingsOpen ? (
            <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <div className="px-4 py-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Settings
                </p>
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <span className="text-sm text-zinc-800 dark:text-zinc-200">Quiz mode</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={quizEnabled}
                    onClick={() => setQuizEnabled((v) => !v)}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${quizEnabled ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${quizEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </button>
                </label>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What do you want to build?"
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {['JavaScript', 'Python', 'TypeScript', 'Java'].map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </form>

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-0 md:flex-row">
        <div className="relative min-h-[360px] flex-1 overflow-hidden border-r border-zinc-800 bg-zinc-950">
          <Editor
            height="100%"
            language={language.toLowerCase()}
            value={code}
            onChange={(value) => setCode(value ?? '')}
            onMount={handleEditorMount}
            options={{
              readOnly: false,
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
            theme="vs-dark"
          />

          {code && selectedCode && explainButtonPosition ? (
            <button
              type="button"
              onClick={handleExplain}
              disabled={explaining}
              className="absolute z-10 rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-lg shadow-zinc-950/20 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-indigo-400/60 dark:bg-zinc-900 dark:text-indigo-100 dark:hover:bg-zinc-800"
              style={{
                top: explainButtonPosition.top,
                left: explainButtonPosition.left,
              }}
            >
              {explaining ? 'Explaining...' : 'Explain'}
            </button>
          ) : null}
        </div>

        <aside className="flex w-full flex-col border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 md:w-[22rem] md:border-t-0 lg:w-[25rem]">
          <div className="border-b border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
              Learning notes
            </p>
            <h2 className="mt-1 text-base font-semibold text-zinc-950 dark:text-zinc-50">
              Explanation
            </h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Highlight code, then choose Explain to get a beginner-friendly breakdown.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            {selectedCode ? (
              <div className="mb-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Selected code
                </p>
                <pre className="max-h-28 overflow-auto rounded-md border border-zinc-200 bg-white p-3 font-mono text-xs leading-5 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                  {selectedCode}
                </pre>
              </div>
            ) : null}

            {explaining ? (
              <p className="text-zinc-500 dark:text-zinc-400">
                Explaining the highlighted code...
              </p>
            ) : explanation ? (
              <div className="space-y-3">{renderExplanation(explanation)}</div>
            ) : (
              <div className="rounded-md border border-dashed border-zinc-300 bg-white p-4 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                Highlight some code to get an explanation.
              </div>
            )}
          </div>
        </aside>
      </div>

      <QuizPanel code={code} isEnabled={quizEnabled} quiz={quizQuestions[quizIndex] ?? null} onAnswer={handleAnswer} onEnd={() => { setQuizQuestions([]); setQuizIndex(0); setQuizEnabled(false) }} />
    </div>
  )
}
