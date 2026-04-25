
'use client'

import { useState } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'

type ExplainButtonPosition = {
  top: number
  left: number
}

export default function VibeLearEditor() {
  const [prompt, setPrompt] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCode, setSelectedCode] = useState('')
  const [explanation, setExplanation] = useState('')
  const [explaining, setExplaining] = useState(false)
  const [error, setError] = useState('')
  const [explainButtonPosition, setExplainButtonPosition] =
    useState<ExplainButtonPosition | null>(null)

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
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
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
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <span className="text-lg font-semibold tracking-tight">Vibe Learn</span>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What do you want to build?"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </form>

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative min-h-[360px] flex-1">
          <Editor
            height="100%"
            defaultLanguage="javascript"
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
              className="absolute z-10 rounded-md border border-indigo-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 shadow-lg shadow-zinc-950/15 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-indigo-500/60 dark:bg-zinc-950 dark:text-indigo-200 dark:hover:bg-zinc-900"
              style={{
                top: explainButtonPosition.top,
                left: explainButtonPosition.left,
              }}
            >
              {explaining ? 'Explaining...' : 'Explain'}
            </button>
          ) : null}
        </div>

        <aside className="flex w-full flex-col border-t border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 md:w-80 md:border-l md:border-t-0 lg:w-96">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
              Explanation
            </h2>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            {explaining ? (
              <p className="text-zinc-500 dark:text-zinc-400">
                Explaining the highlighted code...
              </p>
            ) : explanation ? (
              <p className="whitespace-pre-wrap">{explanation}</p>
            ) : (
              <p className="text-zinc-500 dark:text-zinc-400">
                Highlight some code to get an explanation.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
