import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'You are a JavaScript code generator. Output only valid JavaScript code — no markdown, no backticks, no code fences, no comments, no explanation. Just the raw JS code itself.',
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    // Strip markdown code fences if the model includes them anyway
    const code = raw
      .replace(/^```[\w]*\n?/, '')
      .replace(/\n?```$/, '')
      .trim()

    return Response.json({ code })
  } catch (err) {
    console.error('generate error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
