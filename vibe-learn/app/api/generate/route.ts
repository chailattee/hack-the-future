import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function stripCodeFenceLines(text: string) {
  return text
    .trim()
    .split(/\r?\n/)
    .filter((line) => !/^\s*`{2,3}[\w#+.-]*\s*$/.test(line))
    .join('\n')
    .trim()
}

export async function POST(request: Request) {
  try {
    const { prompt, language = 'JavaScript', quizMode = false, priorCode = '', userAnswer = '' } = await request.json()

    const isContinuation = Boolean(priorCode && userAnswer)

    const system = quizMode
      ? isContinuation ? CONTINUE_SYSTEM(language) : QUIZ_SYSTEM(language)
      : PLAIN_SYSTEM(language)

    const userMessage = isContinuation
      ? `Here is the code generated so far:\n${priorCode}\n\nThe user answered the quiz question with: ${userAnswer}\n\nNow continue generating the rest of the code.`
      : prompt

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: `You are a careful ${language} tutor and code generator for beginners. Generate clean, runnable, complete ${language} code for the user's request. Prefer simple, conventional code over clever shortcuts. Avoid known syntax/runtime errors, undefined variables, missing imports, and incomplete functions. Include only useful beginner-friendly comments when they clarify the code. Output raw ${language} code only: no markdown, no backticks, no code fences, no explanation.`,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    // Strip markdown fence marker lines if the model includes them anyway.
    const code = stripCodeFenceLines(raw)

    // Extract quiz block if present
    const quizMatch = code.match(/<QUIZ>([\s\S]*?)<\/QUIZ>/)
    if (quizMatch) {
      const codeBeforeQuiz = code.slice(0, code.indexOf('<QUIZ>')).trim()
      const quiz = JSON.parse(quizMatch[1])
      return Response.json({ code: codeBeforeQuiz, quiz })
    }

    return Response.json({ code })
  } catch (err) {
    console.error('generate error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
