import { describe, expect, it, vi } from 'vitest'
import {
  buildAttachmentStoragePath,
  resolvePersistentImageUrlWithFallback,
  sanitizeAttachmentSegment,
} from '../attachments'

describe('attachment persistence helpers', () => {
  it('sanitizes storage path segments', () => {
    expect(sanitizeAttachmentSegment('Hello World!.PNG')).toBe('hello-world-.png')
  })

  it('builds deterministic storage path when optional fields are provided', () => {
    const path = buildAttachmentStoragePath({
      userId: 'user-1',
      conversationId: 'conv-2',
      fileName: 'My File (Final).PNG',
      now: new Date('2026-02-08T12:30:45.000Z'),
      randomSuffix: 'abc123',
    })

    expect(path).toBe('user-1/conv-2/2026-02-08T12-30-45-000Z-abc123-my-file-final.png')
  })

  it('uses uploaded URL when storage succeeds', async () => {
    const fallback = vi.fn(async () => 'fallback-url')

    const resolved = await resolvePersistentImageUrlWithFallback(
      async () => 'https://cdn.example.com/image.png',
      fallback
    )

    expect(resolved).toBe('https://cdn.example.com/image.png')
    expect(fallback).not.toHaveBeenCalled()
  })

  it('falls back when storage upload fails', async () => {
    const fallback = vi.fn(async () => 'data:image/jpeg;base64,fallback')

    const resolved = await resolvePersistentImageUrlWithFallback(
      async () => {
        throw new Error('bucket not found')
      },
      fallback
    )

    expect(resolved).toBe('data:image/jpeg;base64,fallback')
    expect(fallback).toHaveBeenCalledOnce()
  })
})
