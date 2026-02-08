import type { SupabaseClient } from '@supabase/supabase-js'

const CHAT_ATTACHMENTS_BUCKET = 'chat-attachments'

export function sanitizeAttachmentSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export function buildAttachmentStoragePath(params: {
  userId: string
  conversationId: string
  fileName: string
  now?: Date
  randomSuffix?: string
}): string {
  const { userId, conversationId, fileName, now = new Date() } = params
  const randomSuffix = params.randomSuffix ?? Math.random().toString(36).slice(2, 10)

  const lastDot = fileName.lastIndexOf('.')
  const rawBase = lastDot >= 0 ? fileName.slice(0, lastDot) : fileName
  const rawExt = lastDot >= 0 ? fileName.slice(lastDot + 1) : 'bin'

  const safeBase = sanitizeAttachmentSegment(rawBase || 'attachment') || 'attachment'
  const safeExt = sanitizeAttachmentSegment(rawExt || 'bin') || 'bin'
  const timestamp = now.toISOString().replace(/[:.]/g, '-')

  return `${userId}/${conversationId}/${timestamp}-${randomSuffix}-${safeBase}.${safeExt}`
}

export async function resolvePersistentImageUrlWithFallback(
  uploadAttempt: () => Promise<string | null>,
  fallbackProvider: () => Promise<string>
): Promise<string> {
  try {
    const uploadedUrl = await uploadAttempt()
    if (uploadedUrl) {
      return uploadedUrl
    }
  } catch {
    // Intentionally ignored; fallback below guarantees a durable URL.
  }

  return fallbackProvider()
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`))
    reader.readAsDataURL(file)
  })
}

export async function uploadImageToStorage(params: {
  supabase: SupabaseClient
  userId: string
  conversationId: string
  file: File
  bucket?: string
}): Promise<string | null> {
  const bucket = params.bucket ?? CHAT_ATTACHMENTS_BUCKET
  const storagePath = buildAttachmentStoragePath({
    userId: params.userId,
    conversationId: params.conversationId,
    fileName: params.file.name,
  })

  const { error } = await params.supabase.storage
    .from(bucket)
    .upload(storagePath, params.file, {
      cacheControl: '3600',
      upsert: false,
      contentType: params.file.type || 'application/octet-stream',
    })

  if (error) {
    return null
  }

  const { data: signedData, error: signedError } = await params.supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365)

  if (!signedError && signedData?.signedUrl) {
    return signedData.signedUrl
  }

  const { data } = params.supabase.storage.from(bucket).getPublicUrl(storagePath)

  return data.publicUrl || null
}

export async function persistImageAttachmentUrl(params: {
  supabase: SupabaseClient
  userId: string
  conversationId: string
  file: File
  fallbackProvider?: () => Promise<string>
}): Promise<string> {
  const fallbackProvider = params.fallbackProvider ?? (() => fileToDataUrl(params.file))

  return resolvePersistentImageUrlWithFallback(
    () =>
      uploadImageToStorage({
        supabase: params.supabase,
        userId: params.userId,
        conversationId: params.conversationId,
        file: params.file,
      }),
    fallbackProvider
  )
}
