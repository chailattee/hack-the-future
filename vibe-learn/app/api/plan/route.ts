import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { prompt, language = 'JavaScript' } = await request.json()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 64,
      system: `You are a ${language} code planning assistant. Given a coding task, estimate how many 5–15 line chunks you would need to implement it. Reply with ONLY a single integer — no explanation, no punctuation.`,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()

    const totalChunks = Math.max(1, parseInt(raw, 10) || 3)
    return Response.json({ totalChunks })
  } catch (err) {
    console.error('plan error:', err)
    return Response.json({ totalChunks: 3 })
  }
}
