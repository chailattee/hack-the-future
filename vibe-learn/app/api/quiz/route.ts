import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { code, language = 'JavaScript', previousQuestions = [] } = await request.json()

    const avoidClause = previousQuestions.length > 0
      ? `\n\nDo NOT repeat any of these already-asked questions:\n${previousQuestions.map((q: { question: string }) => `- ${q.question}`).join('\n')}`
      : ''

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: "You are a coding teacher. Given code, generate exactly 3 multiple choice quiz questions that test a beginner's understanding of what the code does. Return ONLY a valid JSON array with no other text, markdown, or explanation.",
      messages: [
        {
          role: 'user',
          content: `Generate 3 quiz questions about this ${language} code:\n\n${code}${avoidClause}\n\nReturn a JSON array in this exact format:\n[{"question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"A"},...]`,
        },
      ],
    })

    const raw = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
      .replace(/^```json\n?/, '')
      .replace(/\n?```$/, '')

    const questions = JSON.parse(raw)
    return Response.json({ questions })
  } catch (err) {
    console.error('quiz error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
