'use client'

import { useRef, useState } from 'react'
import Editor from '@monaco-editor/react'

export default function VibeLearEditor() {
  const [prompt, setPrompt] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const editorRef = useRef<any>(null)

  function handleMount(editor: any) {
    editorRef.current = editor
    editor.onDidChangeCursorSelection((e: any) => {
      const model = editor.getModel()
      if (!model) return
      const text = model.getValueInRange(e.selection)
      setSelectedText(text)
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
      if (data.error) { setError(data.error); return }
      setCode(data.code)
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <span className="font-semibold text-lg tracking-tight">Vibe Learn</span>
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {sidebarOpen ? 'Hide explain panel ›' : '‹ Explain panel'}
        </button>
      </header>

      <form onSubmit={handleSubmit} className="flex gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What do you want to build?"
          className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-zinc-100 placeholder-zinc-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </form>

      {error && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 border-b border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Main area: editor + sidebar side by side */}
      <div className="flex flex-1 overflow-hidden">

        {/* Monaco editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onMount={handleMount}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
            theme="vs-dark"
          />
        </div>

        {/* Explanation sidebar — click-to-explain panel */}
        <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden transition-[width] duration-200 flex flex-col`}>
          {selectedText ? (
            <div className="p-4 text-sm">
              <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-2">Selected code</p>
              <pre className="font-mono text-xs text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap break-all bg-zinc-50 dark:bg-zinc-900 rounded p-2 mb-4">
                {selectedText}
              </pre>
              {/* TODO: fetch /api/explain with selectedText and render the explanation here */}
              <p className="text-zinc-400 dark:text-zinc-500 italic">Explanation will appear here.</p>
            </div>
          ) : (
            <div className="p-4 text-sm text-zinc-400 dark:text-zinc-500">
              Select any code in the editor to get a plain-English explanation.
            </div>
          )}
        </aside>

      </div>
    </div>
  )
}
