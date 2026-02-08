import { parseSSEChunk, type ParsedStreamEvent } from '@/lib/chat/streaming'

interface ReadChatStreamOptions {
  response: Response
  onEvent: (event: ParsedStreamEvent) => void
}

export async function readChatStream({ response, onEvent }: ReadChatStreamOptions): Promise<void> {
  if (!response.body) {
    throw new Error('Streaming response body is missing')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    const decodedChunk = decoder.decode(value, { stream: true })
    const parsed = parseSSEChunk(decodedChunk, buffer)
    buffer = parsed.remainingBuffer

    for (const event of parsed.events) {
      onEvent(event)
    }
  }

  if (buffer.trim().length > 0) {
    const parsed = parseSSEChunk('\n\n', buffer)
    for (const event of parsed.events) {
      onEvent(event)
    }
  }
}
