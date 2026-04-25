'use client'

import Editor, { type OnMount } from '@monaco-editor/react'

interface Props {
  code: string
  onSelectionChange: (text: string) => void
}

export default function CodeEditor({ code, onSelectionChange }: Props) {
  const handleMount: OnMount = (editor) => {
    editor.onDidChangeCursorSelection(() => {
      const model = editor.getModel()
      const selection = editor.getSelection()
      
      if (!selection) return
      if (!model) return
      onSelectionChange(model.getValueInRange(selection))
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
