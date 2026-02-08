import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase-server'
import { AIPersonalityService } from '@/services/aiPersonalityService'
import { UserProfileService } from '@/services/userProfileService'
import { AIPersonalityConfigService } from '@/services/aiPersonalityConfigService'
import { isWebPortalUnrestricted } from '@/lib/chat/accessPolicy'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const maxDuration = 240

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      conversationId,
      deepResearch,
      attachments = [],
      generateTitle = false,
    } = await request.json()

    if ((!message && attachments.length === 0) || !conversationId) {
      return new Response('Message or attachments and conversation ID are required', { status: 400 })
    }

    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      return new Response('Conversation not found or unauthorized', { status: 404 })
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('content, is_ai, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    const { data: userProfileData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    const userName = userProfileData?.name || user?.email?.split('@')[0] || 'User'

    const userProfile = await UserProfileService.getOrCreateProfile(user.id)
    const profileContext = await UserProfileService.getProfileContext(user.id)
    const characteristicsSummary = UserProfileService.formatCharacteristicsForAI(userProfile)

    const aiPersonality = await AIPersonalityConfigService.getOrCreatePersonality(user.id)
    const personalityPrompt = AIPersonalityConfigService.generatePersonalityPrompt(aiPersonality)

    const mergedContext = await AIPersonalityConfigService.getMergedContext(user.id)

    const modelToUse = 'gpt-5'
    const reasoningLevel = deepResearch ? 'high' : 'low'

    let systemPrompt = AIPersonalityService.generateConciseSystemPrompt({
      userName,
      aiName: aiPersonality?.ai_name,
      characteristicsSummary,
      generateTitle: false,
      isPremiumUser: isWebPortalUnrestricted(),
      userWantsPresentations: false,
    })

    if (mergedContext) {
      systemPrompt += '\n\n**AI Configuration & User Context:**\n' + mergedContext
    } else if (profileContext) {
      systemPrompt += '\n\n**User Context:**\n' + profileContext
    }

    if (personalityPrompt) {
      systemPrompt += '\n\n**Personality Settings:**\n' + personalityPrompt
    }

    if (deepResearch) {
      systemPrompt +=
        '\n\n🧠 GPT-5 DEEP REASONING MODE: You are using OpenAI\'s advanced GPT-5 model with high reasoning effort. Provide deep, step-by-step logical analysis with comprehensive insights, multiple perspectives, and thorough explanations. Break down complex problems, consider pros and cons, and provide detailed reasoning for your conclusions. Focus on educational value and helping users understand not just the "what" but the "why" behind your answers.'
    } else {
      systemPrompt +=
        '\n\n⚡ GPT-5 FAST MODE: You are using OpenAI\'s GPT-5 model optimized for quick, efficient responses while maintaining high quality. Be helpful, accurate, and concise.'
    }

    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ]

    if (messages) {
      messages.forEach((msg) => {
        openaiMessages.push({
          role: msg.is_ai ? 'assistant' : 'user',
          content: msg.content,
        })
      })
    }

    const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = []

    if (message) {
      userContent.push({
        type: 'text',
        text: message,
      })
    }

    attachments.forEach((attachment: {
      type: 'image' | 'document'
      mimeType?: string
      data?: string
      name?: string
      content?: string
    }) => {
      if (attachment.type === 'image' && attachment.mimeType && attachment.data) {
        userContent.push({
          type: 'image_url',
          image_url: {
            url: `data:${attachment.mimeType};base64,${attachment.data}`,
            detail: deepResearch ? 'high' : 'auto',
          },
        })
      } else if (attachment.type === 'document' && attachment.name && attachment.content) {
        userContent.push({
          type: 'text',
          text: `Document "${attachment.name}" content:\n\n${attachment.content}`,
        })
      }
    })

    openaiMessages.push({
      role: 'user',
      content:
        userContent.length === 1 && userContent[0].type === 'text'
          ? userContent[0].text
          : userContent,
    })

    let conversationTitle: string | null = null
    if (generateTitle && message) {
      try {
        const titleModel = process.env.OPENAI_TTITLE_GEN_MODEL || 'gpt-4o-mini'
        const titleResponse = await openai.chat.completions.create({
          model: titleModel,
          messages: [
            {
              role: 'system',
              content:
                'Generate a brief 3-5 word title for this conversation based on the user message. Respond with only the title text.',
            },
            {
              role: 'user',
              content: message,
            },
          ],
          max_completion_tokens: 20,
        })

        const generatedTitle = titleResponse.choices[0]?.message?.content?.trim()
        if (generatedTitle && generatedTitle.length > 0 && generatedTitle.length < 50) {
          conversationTitle = generatedTitle
        }
      } catch (titleError) {
        console.error('[Chat Stream API] Failed to generate title:', titleError)
      }
    }

    const stream = (await openai.chat.completions.create({
      model: modelToUse,
      messages: openaiMessages,
      stream: true,
      max_completion_tokens: deepResearch ? 8000 : 4000,
      reasoning_effort: reasoningLevel,
      verbosity: deepResearch ? 'medium' : 'low',
      temperature: deepResearch ? 0.3 : 0.7,
    } as any)) as unknown as AsyncIterable<{
      choices?: Array<{
        delta?: {
          content?: string
        }
      }>
    }>

    let fullResponse = ''

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content || ''

            if (!content) {
              continue
            }

            fullResponse += content
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
          }

          if (fullResponse.trim().length > 0) {
            await supabase.from('messages').insert({
              conversation_id: conversationId,
              content: fullResponse,
              is_ai: true,
            })

            const conversationUpdate: { title?: string; updated_at: string } = {
              updated_at: new Date().toISOString(),
            }

            if (conversationTitle) {
              conversationUpdate.title = conversationTitle
            }

            await supabase
              .from('conversations')
              .update(conversationUpdate)
              .eq('id', conversationId)
          }

          await UserProfileService.evaluateAndUpdateProfile(user.id, conversationId, messages || []).catch(
            (error) => {
              console.error('[Chat Stream API] Error evaluating user profile:', error)
            }
          )

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', title: conversationTitle })}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (streamError) {
          console.error('[Chat Stream API] Streaming error:', streamError)
          controller.error(streamError)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat streaming error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
