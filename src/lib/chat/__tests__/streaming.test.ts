import { describe, expect, it } from 'vitest'
import { appendAssistantContent, parseSSEChunk, parseSSEData } from '../streaming'

describe('streaming parser', () => {
  it('parses content and done events across chunk boundaries', () => {
    const first = parseSSEChunk('data: {"content":"Hel"}\n\n' + 'data: {"content":"lo"}\n')

    expect(first.events).toEqual([
      { type: 'content', content: 'Hel' },
    ])
    expect(first.remainingBuffer).toContain('data: {"content":"lo"}')

    const second = parseSSEChunk('\n' + 'data: [DONE]\n\n', first.remainingBuffer)

    expect(second.events).toEqual([
      { type: 'content', content: 'lo' },
      { type: 'done' },
    ])
    expect(second.remainingBuffer).toBe('')
  })

  it('treats non-json data lines as plain content', () => {
    const event = parseSSEData('plain text response')

    expect(event).toEqual({ type: 'content', content: 'plain text response' })
  })

  it('appends assistant chunks deterministically', () => {
    expect(appendAssistantContent('hello', ' world')).toBe('hello world')
  })
})
