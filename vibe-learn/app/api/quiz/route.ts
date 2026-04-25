// QUIZ TEAMMATE — this is your file.
// Receives: POST { code: string }  (the full generated code)
// Returns:  { question: string, choices?: string[], answer: string }
//
// Copy the pattern from app/api/generate/route.ts.
// System prompt hint: read the code and produce one beginner-friendly question about it —
// either multiple-choice (return choices[]) or fill-in-the-blank (no choices).

export async function POST() {
  return Response.json({ question: 'TODO: implement quiz route' }, { status: 501 })
}
