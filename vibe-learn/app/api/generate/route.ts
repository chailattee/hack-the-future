import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'You are a code generator. Return only the code the user asks for — no explanation, no markdown fences, no commentary. Just the raw code.',
      messages: [{ role: 'user', content: prompt }],
    })

    const code = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    return Response.json({ code })
  } catch (err: any) {
    console.error('generate error:', err)
    return Response.json({ error: err?.message ?? 'Unknown error' }, { status: 500 })
  }
}
