
'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import QuizPanel from './QuizPanel'

type ExplainButtonPosition = {
  top: number
  left: number
}

type Mode = 'generate' | 'upload'

type CodeIssue = {
  lineNumber: number
  type: 'syntax' | 'runtime' | 'logic' | 'style'
  explanation: string
  suggestedFix: string
}

type SelectedRange = {
  startLine: number
  endLine: number
}

type MonacoEditor = Parameters<OnMount>[0]
type Monaco = Parameters<OnMount>[1]
type DecorationsCollection = ReturnType<MonacoEditor['createDecorationsCollection']>

const languageOptions = [
  'JavaScript',
  'Python',
  'TypeScript',
  'Java',
  'HTML',
  'CSS',
  'Markdown',
  'Plain Text',
]
const modeTabs: Array<{ id: Mode; label: string; description: string }> = [
  {
    id: 'generate',
    label: 'Generate from idea',
    description: 'Describe what you want and let AI write starter code.',
  },
  {
    id: 'upload',
    label: 'Upload/Paste existing code',
    description: 'Start from classwork, notes, or a code file.',
  },
]
const acceptedFileExtensions = [
  'java',
  'py',
  'js',
  'ts',
  'tsx',
  'jsx',
  'html',
  'css',
  'txt',
  'md',
]
const acceptedFileTypes = acceptedFileExtensions
  .map((extension) => `.${extension}`)
  .join(',')

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function getLanguageFromFileName(fileName: string) {
  const extension = getFileExtension(fileName)

  switch (extension) {
    case 'py':
      return 'Python'
    case 'ts':
    case 'tsx':
      return 'TypeScript'
    case 'java':
      return 'Java'
    case 'js':
    case 'jsx':
      return 'JavaScript'
    case 'html':
      return 'HTML'
    case 'css':
      return 'CSS'
    case 'md':
      return 'Markdown'
    case 'txt':
    default:
      return 'Plain Text'
  }
}

function getExportExtension(languageName: string) {
  switch (languageName) {
    case 'JavaScript': return 'js'
    case 'TypeScript': return 'ts'
    case 'Python': return 'py'
    case 'Java': return 'java'
    case 'HTML': return 'html'
    case 'CSS': return 'css'
    case 'Markdown': return 'md'
    default: return 'txt'
  }
}

function getMonacoLanguage(languageName: string) {
  switch (languageName) {
    case 'JavaScript':
      return 'javascript'
    case 'TypeScript':
      return 'typescript'
    case 'Python':
      return 'python'
    case 'Java':
      return 'java'
    case 'HTML':
      return 'html'
    case 'CSS':
      return 'css'
    case 'Markdown':
      return 'markdown'
    case 'Plain Text':
    default:
      return 'plaintext'
  }
}

function stripCodeFenceLines(text: string) {
  return text
    .trim()
    .split(/\r?\n/)
    .filter((line) => !/^\s*`{2,3}[\w#+.-]*\s*$/.test(line))
    .join('\n')
    .trim()
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
  const [mode, setMode] = useState<Mode>('generate')
  const [prompt, setPrompt] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('JavaScript')
  const [pastedCode, setPastedCode] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCode, setSelectedCode] = useState('')
  const [selectedRange, setSelectedRange] = useState<SelectedRange | null>(null)
  const [explanation, setExplanation] = useState('')
  const [explaining, setExplaining] = useState(false)
  const [issues, setIssues] = useState<CodeIssue[]>([])
  const [analyzingIssues, setAnalyzingIssues] = useState(false)
  const [issueAnalysisError, setIssueAnalysisError] = useState('')
  const [error, setError] = useState('')
  const [explainButtonPosition, setExplainButtonPosition] =
    useState<ExplainButtonPosition | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(384)
  const [quizEnabled, setQuizEnabled] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<{ question: string; options: { A: string; B: string; C: string; D: string }; answer: string }[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  const editorRef = useRef<MonacoEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const issueDecorationsRef = useRef<DecorationsCollection | null>(null)
  const issueAnalysisIdRef = useRef(0)
  const programmaticCodeUpdateRef = useRef(false)
  const settingsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setSidebarWidth(Math.round(window.innerWidth * 0.25))
  }, [])

  useEffect(() => {
    applyIssueDecorations(issues)
  }, [issues])

  useEffect(() => {
    if (!settingsOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [settingsOpen])

  function applyIssueDecorations(nextIssues: CodeIssue[]) {
    const editor = editorRef.current
    const monaco = monacoRef.current
    const model = editor?.getModel()

    if (!editor || !monaco || !model) return

    const lineCount = model.getLineCount()
    const decorations = nextIssues
      .filter(
        (issue) =>
          (issue.type === 'syntax' || issue.type === 'runtime') &&
          issue.lineNumber >= 1 &&
          issue.lineNumber <= lineCount,
      )
      .map((issue) => ({
        range: new monaco.Range(issue.lineNumber, 1, issue.lineNumber, 1),
        options: {
          isWholeLine: true,
          className: `vibe-issue-line vibe-issue-${issue.type}`,
          glyphMarginClassName: `vibe-issue-glyph vibe-issue-glyph-${issue.type}`,
          hoverMessage: {
            value: `**${issue.type} issue**: ${issue.explanation}\n\nSuggested fix: ${issue.suggestedFix}`,
          },
        },
      }))

    if (!issueDecorationsRef.current) {
      issueDecorationsRef.current = editor.createDecorationsCollection(decorations)
      return
    }

    issueDecorationsRef.current.set(decorations)
  }

  function resetLearningState() {
    setSelectedCode('')
    setSelectedRange(null)
    setExplainButtonPosition(null)
    setExplanation('')
  }

  function clearIssueAnalysis() {
    issueAnalysisIdRef.current += 1
    setIssues([])
    setIssueAnalysisError('')
    setAnalyzingIssues(false)
    issueDecorationsRef.current?.clear()
  }

  function updateEditorCode(nextCode: string) {
    programmaticCodeUpdateRef.current = true
    setCode(nextCode)
    window.setTimeout(() => {
      programmaticCodeUpdateRef.current = false
    }, 50)
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode)
    setError('')
  }

  function handleExport() {
    if (!code.trim()) return
    const ext = getExportExtension(language)
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function analyzeCodeForIssues(
    nextCode: string,
    nextLanguage: string,
    source: 'generated' | 'user' = 'user',
  ) {
    const analysisId = issueAnalysisIdRef.current + 1
    issueAnalysisIdRef.current = analysisId
    setIssues([])
    setIssueAnalysisError('')

    if (!nextCode.trim()) {
      setAnalyzingIssues(false)
      issueDecorationsRef.current?.clear()
      return
    }

    setAnalyzingIssues(true)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: nextCode, language: nextLanguage, source }),
      })
      const data = await res.json()

      if (analysisId !== issueAnalysisIdRef.current) return

      if (data.error) {
        setIssueAnalysisError('Issue analysis is unavailable right now.')
        setIssues([])
        return
      }

      setIssues(Array.isArray(data.issues) ? data.issues : [])
    } catch {
      if (analysisId !== issueAnalysisIdRef.current) return
      setIssueAnalysisError('Issue analysis is unavailable right now.')
      setIssues([])
    } finally {
      if (analysisId === issueAnalysisIdRef.current) {
        setAnalyzingIssues(false)
      }
    }
  }

  function updateSelectedCode(editor: Parameters<OnMount>[0]) {
    const selection = editor.getSelection()
    const model = editor.getModel()

    if (!selection || !model || selection.isEmpty()) {
      setSelectedCode('')
      setSelectedRange(null)
      setExplainButtonPosition(null)
      return
    }

    const value = model.getValueInRange(selection).trim()

    if (!value) {
      setSelectedCode('')
      setSelectedRange(null)
      setExplainButtonPosition(null)
      return
    }

    const endPosition = selection.getEndPosition()
    const visiblePosition = editor.getScrolledVisiblePosition(endPosition)

    setSelectedCode(value)
    setSelectedRange({
      startLine: selection.startLineNumber,
      endLine: selection.endLineNumber,
    })
    setExplainButtonPosition(
      visiblePosition
        ? {
          top: Math.max(12, visiblePosition.top + visiblePosition.height + 8),
          left: Math.max(12, visiblePosition.left),
        }
        : { top: 12, left: 12 },
    )
  }

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    applyIssueDecorations(issues)
    const selectionDisposable = editor.onDidChangeCursorSelection(() => {
      updateSelectedCode(editor)
    })
    const scrollDisposable = editor.onDidScrollChange(() => {
      if (editor.getSelection()?.isEmpty()) return
      updateSelectedCode(editor)
    })

    editor.onDidDispose(() => {
      editorRef.current = null
      monacoRef.current = null
      issueDecorationsRef.current = null
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

  function handleLoadPastedCode() {
    const cleanedPastedCode = stripCodeFenceLines(pastedCode)
    if (!cleanedPastedCode.trim()) return
    updateEditorCode(cleanedPastedCode)
    resetLearningState()
    setError('')
    setUploadedFileName('')
    analyzeCodeForIssues(cleanedPastedCode, language, 'user')
  }

  async function handleFileUpload(file: File | undefined) {
    if (!file) return
    setError('')
    const extension = getFileExtension(file.name)

    if (!acceptedFileExtensions.includes(extension)) {
      setUploadedFileName('')
      setError(
        'Unsupported file type. Upload a .java, .py, .js, .ts, .tsx, .jsx, .html, .css, .txt, or .md file.',
      )
      return
    }

    try {
      const text = stripCodeFenceLines(await file.text())
      setPastedCode(text)
      const nextLanguage = getLanguageFromFileName(file.name)
      updateEditorCode(text)
      resetLearningState()
      setError('')
      setUploadedFileName(file.name)
      if (nextLanguage !== language) setLanguage(nextLanguage)
      analyzeCodeForIssues(text, nextLanguage, 'user')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that file')
    }
  }

  function handleResizerMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidth

    function onMouseMove(ev: MouseEvent) {
      const delta = startX - ev.clientX
      setSidebarWidth(Math.max(200, Math.min(700, startWidth + delta)))
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
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

  async function handleExplain(target: 'selection' | 'full') {
    if (target === 'selection' && !selectedCode.trim()) return
    setExplaining(true)
    setError('')
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: target === 'selection' ? selectedCode : code,
          fullCode: code,
          language,
          scope: target,
          startLine: target === 'selection' ? selectedRange?.startLine : 1,
          endLine:
            target === 'selection'
              ? selectedRange?.endLine
              : code.split(/\r?\n/).length,
        }),
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

  const editorStatus = loading
    ? 'Generating code...'
    : analyzingIssues
      ? 'Checking for likely issues...'
      : code
        ? `${uploadedFileName ? `${uploadedFileName} loaded` : `${language} code loaded`} in the editor.`
        : 'No code loaded yet.'
  const hasCode = code.trim().length > 0
  const errorIssues = issues.filter(
    (issue) => issue.type === 'syntax' || issue.type === 'runtime',
  )
  const improvementIssues = issues.filter(
    (issue) => issue.type === 'logic' || issue.type === 'style',
  )

  return (
    <div className="flex h-full flex-col bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-2.5 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <span className="text-lg font-semibold tracking-tight">Vibe Learn</span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Generate, bring in classwork, then learn what the code is doing.
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
                <label className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-800 dark:text-zinc-200">Language</span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    {languageOptions.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <div
        className={`border-b border-zinc-200 bg-white px-5 dark:border-zinc-800 dark:bg-zinc-900 ${hasCode ? 'py-2' : 'py-3'
          }`}
      >
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          {modeTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => changeMode(tab.id)}
              className={`rounded-md border px-3 py-2 text-left transition-colors ${mode === tab.id
                ? 'border-indigo-300 bg-indigo-50 text-indigo-950 shadow-sm dark:border-indigo-500/60 dark:bg-indigo-950 dark:text-indigo-50'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700'
                }`}
            >
              <span className="block text-sm font-semibold">{tab.label}</span>
              {!hasCode ? (
                <span className="mt-0.5 block text-xs leading-4 text-zinc-500 dark:text-zinc-400">
                  {tab.description}
                </span>
              ) : null}
            </button>
          ))}
          <button
            type="button"
            onClick={handleExport}
            disabled={!hasCode}
            className="flex items-center gap-1.5 self-start rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export .{getExportExtension(language)}
          </button>
        </div>

        {mode === 'generate' ? (
          <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap gap-2">
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
              {loading ? 'Generating...' : 'Generate Code'}
            </button>
          </form>
        ) : (
          <div className="mt-3 grid gap-3 lg:grid-cols-[16rem_minmax(0,1fr)_auto]">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Upload file
              </label>
              <input
                type="file"
                accept={acceptedFileTypes}
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
                className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700 dark:text-zinc-300"
              />
              {uploadedFileName ? (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Loaded {uploadedFileName}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Paste code or classwork
              </label>
              <textarea
                value={pastedCode}
                onChange={(e) => setPastedCode(e.target.value)}
                placeholder="Paste code or classwork text here."
                className={`w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs leading-5 text-zinc-900 placeholder-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 ${hasCode ? 'h-20' : 'h-32'
                  }`}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleLoadPastedCode}
                disabled={!pastedCode.trim()}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
              >
                Load into Editor
              </button>
            </div>
          </div>
        )}

      </div>

      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-5 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        <span>{editorStatus}</span>
        <button
          type="button"
          onClick={() => handleExplain('full')}
          disabled={!code.trim() || explaining}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {explaining ? 'Explaining...' : 'Explain Code'}
        </button>
      </div>

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-0 md:flex-row">
          <div className="relative min-h-0 flex-1 overflow-hidden border-r border-zinc-800 bg-zinc-950">
            <Editor
              height="100%"
              language={getMonacoLanguage(language)}
              value={code}
              onChange={(value) => {
                setCode(value ?? '')
                if (!programmaticCodeUpdateRef.current) {
                  clearIssueAnalysis()
                }
              }}
              onMount={handleEditorMount}
              options={{
                readOnly: false,
                minimap: { enabled: false },
                fontSize: 14,
                glyphMargin: true,
                scrollBeyondLastLine: false,
                padding: { top: 16 },
              }}
              theme="vs-dark"
            />

            {!code && !loading ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-zinc-950/80 px-6 text-center">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    Upload code or generate something to begin.
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Your code will appear here in the editor.
                  </p>
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="absolute inset-x-0 top-0 z-10 bg-indigo-600 px-4 py-2 text-xs font-medium text-white">
                Generating code with AI...
              </div>
            ) : null}

            {code && selectedCode && explainButtonPosition ? (
              <button
                type="button"
                onClick={() => handleExplain('selection')}
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

          <div
            className="group hidden cursor-col-resize md:flex md:w-2 md:items-center md:justify-center md:border-x md:border-zinc-800 md:bg-zinc-950 md:hover:border-indigo-500/60 md:hover:bg-indigo-950/40"
            onMouseDown={handleResizerMouseDown}
            role="separator"
            aria-label="Resize sidebar"
          >
            <div className="h-8 w-0.5 rounded-full bg-zinc-700 transition-colors group-hover:bg-indigo-400" />
          </div>

          <aside
            className="flex max-w-full flex-col border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 md:border-t-0 md:shrink-0"
            style={{ width: sidebarWidth }}
          >
            <div className="border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                AI help
              </p>
              <h2 className="mt-1 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Explanations and issues
              </h2>
              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Highlight code or use Explain Code for a beginner-friendly breakdown.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              {selectedCode ? (
                <div className="mb-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Selected code
                    {selectedRange
                      ? `, lines ${selectedRange.startLine}-${selectedRange.endLine}`
                      : ''}
                  </p>
                  <pre className="max-h-28 overflow-auto rounded-md border border-zinc-200 bg-white p-3 font-mono text-xs leading-5 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                    {selectedCode}
                  </pre>
                </div>
              ) : null}

              {explaining ? (
                <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950 dark:text-indigo-100">
                  Explaining with AI...
                </div>
              ) : explanation ? (
                <div className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Explanation
                  </p>
                  <div className="space-y-3">{renderExplanation(explanation)}</div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-zinc-300 bg-white p-4 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                  {code.trim()
                    ? 'Highlight code or click Explain Code to see a beginner-friendly explanation.'
                    : 'Upload code or generate something to begin.'}
                </div>
              )}

              <div className="mt-4 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Code review
                  </p>
                  {analyzingIssues ? (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Checking...
                    </span>
                  ) : null}
                </div>

                {issueAnalysisError ? (
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {issueAnalysisError}
                  </p>
                ) : errorIssues.length ? (
                  <div className="mt-3 space-y-3">
                    {errorIssues.map((issue, index) => (
                      <div
                        key={`${issue.lineNumber}-${issue.type}-${index}`}
                        className="rounded-md border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-950 dark:border-red-900/60 dark:bg-red-950 dark:text-red-100"
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="font-semibold">Line {issue.lineNumber}</span>
                          <span className="rounded bg-red-100 px-2 py-0.5 font-medium uppercase tracking-wide text-red-800 dark:bg-red-900 dark:text-red-100">
                            {issue.type}
                          </span>
                        </div>
                        <p>{issue.explanation}</p>
                        <p className="mt-2">
                          <span className="font-semibold">Suggested fix:</span>{' '}
                          {issue.suggestedFix}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {code.trim()
                      ? 'No syntax or runtime errors found.'
                      : 'Add code to check for errors.'}
                  </p>
                )}

                {improvementIssues.length ? (
                  <details className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <summary className="cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                      Optional improvements ({improvementIssues.length})
                    </summary>
                    <div className="mt-3 space-y-3">
                      {improvementIssues.map((issue, index) => (
                        <div
                          key={`${issue.lineNumber}-${issue.type}-${index}`}
                          className="text-xs leading-5 text-zinc-700 dark:text-zinc-300"
                        >
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="font-semibold">Line {issue.lineNumber}</span>
                            <span className="rounded bg-zinc-200 px-2 py-0.5 font-medium uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                              {issue.type}
                            </span>
                          </div>
                          <p>{issue.explanation}</p>
                          <p className="mt-1">
                            <span className="font-semibold">Suggestion:</span>{' '}
                            {issue.suggestedFix}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            </div>
          </aside>
        </div>

        <QuizPanel code={code} isEnabled={quizEnabled} quiz={quizQuestions[quizIndex] ?? null} onAnswer={handleAnswer} onEnd={() => { setQuizQuestions([]); setQuizIndex(0); setQuizEnabled(false) }} />
      </div>
    </div>
  )
}
