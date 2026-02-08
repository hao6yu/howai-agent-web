import { useCallback, useEffect, useRef } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Conversation, Message } from '@/types/chat'
import { persistImageAttachmentUrl } from '@/lib/chat/attachments'
import { appendAssistantContent } from '@/lib/chat/streaming'
import { readChatStream } from './useChatStreaming'

export type ChatAttachmentPayload =
  | {
      type: 'image'
      name: string
      mimeType: string
      data: string
    }
  | {
      type: 'document'
      name: string
      mimeType: string
      content: string
    }

interface UseChatSendOptions {
  user: { id: string } | null
  supabase: SupabaseClient
  currentConversation: Conversation | null
  setCurrentConversation: Dispatch<SetStateAction<Conversation | null>>
  messages: Message[]
  setMessages: Dispatch<SetStateAction<Message[]>>
  currentMessage: string
  setCurrentMessage: Dispatch<SetStateAction<string>>
  setLoading: Dispatch<SetStateAction<boolean>>
  attachedFiles: File[]
  deepResearchMode: boolean
  webSearchEnabled: boolean
  createNewConversation: () => Promise<Conversation | null>
  loadMessages: (conversationId: string) => Promise<void>
  loadConversations: () => Promise<void>
  fileToBase64: (file: File) => Promise<string>
  clearComposerAttachments: () => void
}

export function useChatSend({
  user,
  supabase,
  currentConversation,
  setCurrentConversation,
  messages,
  setMessages,
  currentMessage,
  setCurrentMessage,
  setLoading,
  attachedFiles,
  deepResearchMode,
  webSearchEnabled,
  createNewConversation,
  loadMessages,
  loadConversations,
  fileToBase64,
  clearComposerAttachments,
}: UseChatSendOptions) {
  const requestControllerRef = useRef<AbortController | null>(null)
  const thinkingDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isProcessingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (thinkingDelayRef.current) {
        clearTimeout(thinkingDelayRef.current)
      }
      requestControllerRef.current?.abort()
    }
  }, [])

  return useCallback(async () => {
    console.log('Send message clicked', {
      hasMessage: !!currentMessage.trim(),
      hasConversation: !!currentConversation,
      hasUser: !!user,
      attachedFiles: attachedFiles.length,
    })

    if ((!currentMessage.trim() && attachedFiles.length === 0) || !user) {
      console.log('Send message aborted - missing requirements')
      return
    }

    let conversationToUse = currentConversation
    if (!conversationToUse) {
      conversationToUse = await createNewConversation()
      if (!conversationToUse) {
        console.error('Failed to create new conversation')
        return
      }
      setCurrentConversation(conversationToUse)
    }

    if (isProcessingRef.current) {
      console.log('[Chat] Already processing a request, ignoring duplicate')
      return
    }
    isProcessingRef.current = true

    thinkingDelayRef.current = setTimeout(() => {
      if (isProcessingRef.current) {
        setLoading(true)
      }
      thinkingDelayRef.current = null
    }, 800)

    try {
      const isFirstMessage = messages.length === 0
      const messageToSend = currentMessage.trim()
      const attachmentsToSend: ChatAttachmentPayload[] = []
      const encodedImageMap = new Map<File, string>()

      for (const file of attachedFiles) {
        if (file.type.startsWith('image/')) {
          const base64 = await fileToBase64(file)
          encodedImageMap.set(file, base64)
          attachmentsToSend.push({
            type: 'image',
            name: file.name,
            mimeType: file.type,
            data: base64,
          })
          continue
        }

        const text = await file.text()
        attachmentsToSend.push({
          type: 'document',
          name: file.name,
          mimeType: file.type,
          content: text.substring(0, 10000),
        })
      }

      const attachedImageUrls: string[] = []
      for (const file of attachedFiles) {
        if (!file.type.startsWith('image/')) {
          continue
        }

        const persistedUrl = await persistImageAttachmentUrl({
          supabase,
          userId: user.id,
          conversationId: conversationToUse.id,
          file,
          fallbackProvider: async () => {
            const base64 = encodedImageMap.get(file) ?? (await fileToBase64(file))
            return `data:image/jpeg;base64,${base64}`
          },
        })

        attachedImageUrls.push(persistedUrl)
      }

      const { data: userMessage } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationToUse.id,
          content: messageToSend || '📎 Attached files',
          is_ai: false,
          image_urls: attachedImageUrls.length > 0 ? attachedImageUrls : null,
        })
        .select()
        .single()

      if (userMessage) {
        setMessages((previousMessages) => [...previousMessages, userMessage])
      }

      setCurrentMessage('')
      clearComposerAttachments()

      const requestBody = {
        message: messageToSend,
        conversationId: conversationToUse.id,
        deepResearch: deepResearchMode,
        attachments: attachmentsToSend,
        generateTitle: isFirstMessage,
        allowWebSearch: webSearchEnabled,
        enableAIWebSearchDetection: !webSearchEnabled,
      }

      if (requestControllerRef.current) {
        requestControllerRef.current.abort()
      }
      requestControllerRef.current = new AbortController()

      const timeoutId = setTimeout(() => {
        console.log('[Chat] Request timeout - aborting after 4 minutes')
        requestControllerRef.current?.abort()
      }, 240000)

      try {
        const needsToolingTransport =
          webSearchEnabled ||
          /\b(weather|stock|price|news|exchange rate|latest|today|current|draw|image|picture|artwork|generate)\b/i.test(
            messageToSend
          )

        const useStreamTransport = !needsToolingTransport
        const endpoint = useStreamTransport ? '/api/chat/stream' : '/api/chat'

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: requestControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to get AI response')
        }

        if (useStreamTransport) {
          const streamingMessageId = `streaming-${Date.now()}`
          let sawContent = false

          setMessages((previousMessages) => [
            ...previousMessages,
            {
              id: streamingMessageId,
              conversation_id: conversationToUse.id,
              content: '',
              is_ai: true,
              created_at: new Date().toISOString(),
            },
          ])

          await readChatStream({
            response,
            onEvent: (event) => {
              if (event.type === 'content') {
                sawContent = true
                if (thinkingDelayRef.current) {
                  clearTimeout(thinkingDelayRef.current)
                  thinkingDelayRef.current = null
                }
                setLoading(false)
                setMessages((previousMessages) =>
                  previousMessages.map((message) =>
                    message.id === streamingMessageId
                      ? {
                          ...message,
                          content: appendAssistantContent(message.content, event.content),
                        }
                      : message
                  )
                )
              }
            },
          })

          if (!sawContent) {
            setMessages((previousMessages) =>
              previousMessages.filter((message) => message.id !== streamingMessageId)
            )
          }
        } else {
          await response.json()
        }

        await Promise.all([loadMessages(conversationToUse.id), loadConversations()])
      } finally {
        clearTimeout(timeoutId)
        requestControllerRef.current = null
      }
    } catch (apiError) {
      console.error('Error calling chat API:', apiError)

      let errorContent = 'Sorry, I encountered an error processing your message. Please try again.'
      if (apiError instanceof Error) {
        if (apiError.name === 'AbortError') {
          errorContent = 'Request timed out after 4 minutes. Please try again.'
        } else if (apiError.message.includes('Failed to fetch')) {
          errorContent = 'Network error. Please check your connection and try again.'
        }
      }

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: `error-${Date.now()}`,
          conversation_id: conversationToUse.id,
          content: errorContent,
          is_ai: true,
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      if (thinkingDelayRef.current) {
        clearTimeout(thinkingDelayRef.current)
        thinkingDelayRef.current = null
      }
      setLoading(false)
      isProcessingRef.current = false
      requestControllerRef.current = null
    }
  }, [
    attachedFiles,
    clearComposerAttachments,
    createNewConversation,
    currentConversation,
    currentMessage,
    deepResearchMode,
    fileToBase64,
    loadConversations,
    loadMessages,
    messages.length,
    setCurrentConversation,
    setCurrentMessage,
    setLoading,
    setMessages,
    supabase,
    user,
    webSearchEnabled,
  ])
}
