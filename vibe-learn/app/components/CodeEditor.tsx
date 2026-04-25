'use client'

import { useRef } from 'react'
import Editor from '@monaco-editor/react'

interface Props {
  code: string
  onSelectionChange: (text: string) => void
}

export default function CodeEditor({ code, onSelectionChange }: Props) {
  const editorRef = useRef<any>(null)

  function handleMount(editor: any) {
    editorRef.current = editor
    editor.onDidChangeCursorSelection((e: any) => {
      const model = editor.getModel()
      if (!model) return
      onSelectionChange(model.getValueInRange(e.selection))
    })
  }

  return (
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
  )
}
