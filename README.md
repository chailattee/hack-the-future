# trace

[try it out!](https://hack-the-future-three.vercel.app/)

**trace** is an AI-powered web IDE built for beginners who want to learn how to code by actually doing it — not just reading about it.

Most coding tools assume you already know what you're doing. trace flips that. You describe an idea in plain English — "a to-do list in Python" or "a JavaScript quiz game" — and the AI writes starter code for you. But instead of handing you a black box, trace explains every line in plain language, so you understand what was built and why. Learning happens in the same moment as doing.

## Features

- **Generate from a prompt** — Describe what you want to build, pick a language (JavaScript, Python, TypeScript, Java, HTML, CSS, and more), and Claude generates working starter code instantly.
- **Highlight to explain** — Select any part of the code, click "Explain," and get a plain-English breakdown of exactly what that code does. No jargon, no assumed knowledge.
- **Upload or paste existing code** — Already have classwork or a code snippet? Drop it in and use the explain and quiz features on your own code.
- **Automated code review** — The editor flags syntax and runtime errors with line numbers and fix suggestions as you go, acting like a patient teaching assistant in the background.
- **Quiz mode** — Test your understanding of the code you just generated with AI-written multiple-choice questions. New questions are generated as you answer, so the learning never stops.

## Tech stack

Next.js 16 (App Router), Monaco Editor, Anthropic Claude Sonnet 4.6, Tailwind CSS, deployed on Vercel.

## Preview 
<img width="1173" height="653" alt="Screenshot 2026-04-25 at 12 19 34 PM" src="https://github.com/user-attachments/assets/33edcf2e-3138-4942-8626-7507013db7cd" />


## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

Add your Anthropic API key to `.env.local`:

```
ANTHROPIC_API_KEY=your_key_here
```
