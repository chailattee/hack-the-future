import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const {
      code,
      fullCode = '',
      startLine,
      endLine,
      language = 'Plain Text',
      scope = 'selection',
    } = await request.json()

    const lineContext =
      typeof startLine === 'number' && typeof endLine === 'number'
        ? `Selected lines: ${startLine}-${endLine}`
        : 'Selected lines: not provided'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      system:
        'Explain code to a beginner in plain English. Be brief — 3 sentences maximum, or 2 sentences plus up to 3 bullets for longer selections. Explain what the code does and why it matters. Cut everything else. Bold only a few key terms. No Markdown headings or code fences.',
      messages: [
        {
          role: 'user',
          content: `Language: ${language}\nScope: ${scope}\n${lineContext}\n\nCode to explain:\n${code}\n\nFull program context:\n${fullCode}`,
        },
      ],
    })

    const explanation = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    return Response.json({ explanation })
  } catch (err) {
    console.error('explain error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
