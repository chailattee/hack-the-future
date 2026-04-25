import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system:
        'Explain code to a beginner in plain English. Avoid jargon by default. Focus on what the selected code does, why it is there, and any important concepts the learner should know. Keep the response clean and readable: use short paragraphs, simple bullets only when helpful, and bold only for a few key terms. Do not use Markdown heading markers like # or ##, and do not wrap the answer in code fences.',
      messages: [{ role: 'user', content: code }],
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
