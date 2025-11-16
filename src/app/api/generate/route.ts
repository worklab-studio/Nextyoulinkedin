import { NextResponse } from "next/server"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages, system } = body as { messages?: ChatMessage[]; system?: string }

    if (!system || typeof system !== "string") {
      return NextResponse.json({ error: "Missing system prompt" }, { status: 400 })
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing messages" }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.75,
      max_tokens: 1200,
      messages: [
        { role: "system", content: system },
        ...messages.map(message => ({
          role: message.role,
          content: message.content,
        })),
      ],
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    if (!response.ok) {
      const errorMessage = data?.error?.message || "OpenAI request failed"
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const content = data?.choices?.[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json({ error: "OpenAI returned an empty response" }, { status: 502 })
    }

    return NextResponse.json({ content })
  } catch (error) {
    console.error("Generate API error", error)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
