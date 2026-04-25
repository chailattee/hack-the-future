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
        'Explain code to a beginner in plain English. Be brief. Use short phrases and bullets — not full sentences. 1 phrase summarizing what the code does, then up to 3 bullets for key details. Never write paragraphs. Bold only a few key terms. No Markdown headings or code fences.',
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
