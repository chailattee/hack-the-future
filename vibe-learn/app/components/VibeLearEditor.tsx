
'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'

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
    <div className="flex h-full flex-col bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <span className="text-lg font-semibold tracking-tight">Vibe Learn</span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Build, edit, highlight, and learn from the code.
          </p>
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
    </div>
  )
}
