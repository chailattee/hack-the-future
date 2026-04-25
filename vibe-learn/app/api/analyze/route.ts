import Anthropic from '@anthropic-ai/sdk'

type CodeIssue = {
  lineNumber: number
  type: 'syntax' | 'runtime' | 'logic' | 'style'
  explanation: string
  suggestedFix: string
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const issueTypes = new Set(['syntax', 'runtime', 'logic', 'style'])

function parseIssueResponse(text: string): CodeIssue[] {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
  const parsed = JSON.parse(cleaned) as unknown
  const rawIssues = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === 'object' &&
        'issues' in parsed &&
        Array.isArray(parsed.issues)
      ? parsed.issues
      : []

  return rawIssues
    .map((issue) => {
      if (!issue || typeof issue !== 'object') return null
      const lineNumber = Number('lineNumber' in issue ? issue.lineNumber : 0)
      const type = 'type' in issue ? String(issue.type) : ''
      const explanation =
        'explanation' in issue ? String(issue.explanation).trim() : ''
      const suggestedFix =
        'suggestedFix' in issue ? String(issue.suggestedFix).trim() : ''

      if (
        !Number.isInteger(lineNumber) ||
        lineNumber < 1 ||
        !issueTypes.has(type) ||
        !explanation ||
        !suggestedFix
      ) {
        return null
      }

      return {
        lineNumber,
        type: type as CodeIssue['type'],
        explanation,
        suggestedFix,
      }
    })
    .filter((issue): issue is CodeIssue => issue !== null)
}

export async function POST(request: Request) {
  try {
    const {
      code,
      language = 'Plain Text',
      source = 'user',
    } = await request.json()

    if (!String(code ?? '').trim()) {
      return Response.json({ issues: [] })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system:
        'You review beginner code as a quiet support feature, not the main experience. Prioritize actual problems only. Report syntax and runtime issues when they are likely to break execution. Report logic issues only when the program likely behaves incorrectly. Report style issues only when they strongly improve beginner understanding; do not nitpick harmless choices. If source is "generated", be especially conservative: avoid style comments and only report important logic concerns or real errors. Return at most 2 style issues. Return only valid JSON with this shape: {"issues":[{"lineNumber":1,"type":"syntax","explanation":"plain English","suggestedFix":"plain English"}]}. The type must be exactly one of: syntax, runtime, logic, style. If no important issues are found, return {"issues":[]}. Do not include markdown, code fences, or commentary.',
      messages: [
        {
          role: 'user',
          content: `Language: ${language}\nSource: ${source}\n\nCode:\n${code}`,
        },
      ],
    })

    const raw = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    return Response.json({ issues: parseIssueResponse(raw) })
  } catch (err) {
    console.error('analyze error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error', issues: [] },
      { status: 500 },
    )
  }
}
