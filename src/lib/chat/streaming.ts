export type ParsedStreamEvent =
  | { type: 'content'; content: string }
  | { type: 'done'; title?: string | null }

export interface StreamChunkParseResult {
  events: ParsedStreamEvent[]
  remainingBuffer: string
}

export function appendAssistantContent(previous: string, nextChunk: string): string {
  return `${previous}${nextChunk}`
}

export function parseSSEChunk(chunk: string, existingBuffer = ''): StreamChunkParseResult {
  const buffer = `${existingBuffer}${chunk}`
  const events: ParsedStreamEvent[] = []

  const frames = buffer.split('\n\n')
  const completeFrames = frames.slice(0, -1)
  const remainingBuffer = frames[frames.length - 1] ?? ''

  for (const frame of completeFrames) {
    const line = frame
      .split('\n')
      .find((candidate) => candidate.startsWith('data:'))

    if (!line) {
      continue
    }

    const payload = line.slice('data:'.length).trim()
    const parsed = parseSSEData(payload)

    if (parsed) {
      events.push(parsed)
    }
  }

  return {
    events,
    remainingBuffer,
  }
}

export function parseSSEData(payload: string): ParsedStreamEvent | null {
  if (!payload) {
    return null
  }

  if (payload === '[DONE]') {
    return { type: 'done' }
  }

  try {
    const parsed = JSON.parse(payload) as {
      type?: string
      content?: string
      title?: string | null
    }

    if (parsed.type === 'done') {
      return {
        type: 'done',
        title: parsed.title,
      }
    }

    if (typeof parsed.content === 'string' && parsed.content.length > 0) {
      return {
        type: 'content',
        content: parsed.content,
      }
    }

    return null
  } catch {
    return {
      type: 'content',
      content: payload,
    }
  }
}
