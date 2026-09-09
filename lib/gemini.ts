// lib/gemini.ts
// Helper to call the /api/chat backend endpoint
// Supports both streaming (SSE) and non-streaming modes

import { ChatMessage } from '@/context/ChatContext'

interface SendMessageOptions {
  stationId: string
  messages: ChatMessage[]
  imageBase64?: string
  mimeType?: string
  studentName?: string
  onChunk?: (text: string) => void  // streaming callback
}

/**
 * Send a chat message to the /api/chat endpoint.
 * If `onChunk` is provided, uses Server-Sent Events streaming.
 * Returns the full response text.
 */
export async function sendChatMessage(opts: SendMessageOptions): Promise<string> {
  const useStream = typeof opts.onChunk === 'function'

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stationId: opts.stationId,
      messages: opts.messages,
      imageBase64: opts.imageBase64,
      mimeType: opts.mimeType ?? 'image/jpeg',
      studentName: opts.studentName,
      stream: useStream,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }

  // ── Streaming mode ────────────────────────────────────────────────────────
  if (useStream && opts.onChunk) {
    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response body for streaming')

    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''  // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') break

        try {
          const parsed = JSON.parse(data) as { text?: string; error?: string }
          if (parsed.error) throw new Error(parsed.error)
          if (parsed.text) {
            fullText += parsed.text
            opts.onChunk!(parsed.text)
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    return fullText
  }

  // ── Non-streaming fallback ────────────────────────────────────────────────
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.text as string
}
