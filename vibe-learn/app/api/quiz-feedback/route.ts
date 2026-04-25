import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { question, options, correctAnswer, userAnswer } = await request.json()

    const isCorrect = userAnswer === correctAnswer

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: 'You are a coding teacher explaining quiz answers to a beginner. Give a 1-2 sentence plain-English explanation. No jargon. No markdown.',
      messages: [
        {
          role: 'user',
          content: `Question: ${question}
Options: ${Object.entries(options).map(([k, v]) => `${k}) ${v}`).join(', ')}
Correct answer: ${correctAnswer}) ${options[correctAnswer as keyof typeof options]}
User answered: ${userAnswer}) ${options[userAnswer as keyof typeof options]}
The user was ${isCorrect ? 'correct' : 'wrong'}. Explain why ${correctAnswer} is the right answer.`,
        },
      ],
    })

    const explanation = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()

    return Response.json({ explanation })
  } catch (err) {
    console.error('quiz-feedback error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
