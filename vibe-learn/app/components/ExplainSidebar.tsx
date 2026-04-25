'use client'

// EXPLAIN TEAMMATE — this is your file.
// Props you receive:
//   selectedText: the code the user highlighted in the editor (empty string if nothing selected)
//   isOpen: whether the sidebar is visible (controlled by the header toggle)
//
// Your job:
//   1. When selectedText changes, POST to /api/explain with { code: selectedText }
//   2. Render the plain-English explanation returned in { explanation: string }
//   3. Create app/api/explain/route.ts for the backend

interface Props {
  selectedText: string
  isOpen: boolean
}

export default function ExplainSidebar({ selectedText, isOpen }: Props) {
  return (
    <aside
      className={`${isOpen ? 'w-80' : 'w-0'} shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden transition-[width] duration-200 flex flex-col`}
    >
      {selectedText ? (
        <div className="p-4 text-sm">
          <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-2">Selected code</p>
          <pre className="font-mono text-xs text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap break-all bg-zinc-50 dark:bg-zinc-900 rounded p-2 mb-4">
            {selectedText}
          </pre>
          {/* TODO: fetch /api/explain with selectedText and render explanation here */}
          <p className="text-zinc-400 dark:text-zinc-500 italic">Explanation will appear here.</p>
        </div>
      ) : (
        <div className="p-4 text-sm text-zinc-400 dark:text-zinc-500">
          Select any code in the editor to get a plain-English explanation.
        </div>
      )}
    </aside>
  )
}
