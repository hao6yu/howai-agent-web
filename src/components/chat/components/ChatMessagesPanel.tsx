import { RefObject } from 'react'
import { Message } from '@/types/chat'
import ChatMessage from '../ChatMessage'

interface ChatMessagesPanelProps {
  messages: Message[]
  darkMode: boolean
  loading: boolean
  messagesEndRef: RefObject<HTMLDivElement>
}

function EmptyState({ darkMode }: { darkMode: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-2 sm:px-6">
      <div className="w-20 h-20 flex items-center justify-center mb-6">
        <img
          src="/howai-icon.png"
          alt="HowAI"
          className="w-20 h-20 rounded-3xl"
        />
      </div>
      <h2 className={`text-2xl sm:text-3xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome to HowAI</h2>
      <p className={`text-base sm:text-lg mb-8 max-w-2xl leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Your intelligent AI assistant with powerful capabilities. I can chat, research, analyze, create, and help you accomplish any task.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl mb-8">
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl mb-3">💬</div>
          <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Smart Conversations</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ask me anything - from complex questions to casual chat</p>
        </div>

        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl mb-3">🧠</div>
          <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Deep Research</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Comprehensive analysis and in-depth research on any topic</p>
        </div>

        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl mb-3">🌐</div>
          <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Web Search</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Get real-time information from across the internet</p>
        </div>

        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl mb-3">📷</div>
          <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Photo Analysis</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Understand and analyze images, photos, and visual content</p>
        </div>

        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl mb-3">🎨</div>
          <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Artwork</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Create stunning images and artwork from your descriptions</p>
        </div>

        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl mb-3">📄</div>
          <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Document Work</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Analyze, summarize, and work with your documents and files</p>
        </div>
      </div>

      <div className={`rounded-xl p-6 max-w-3xl ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
        <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>💡 Quick Tips</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="mr-2">📎</span>
            <span>Drag & drop files or paste images directly</span>
          </div>
          <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="mr-2">🔍</span>
            <span>Toggle web search for current info</span>
          </div>
          <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="mr-2">🧠</span>
            <span>Enable deep research for complex topics</span>
          </div>
          <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="mr-2">🎯</span>
            <span>{'Ask me to "draw" or "create" for artwork'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ThinkingIndicator({ darkMode }: { darkMode: boolean }) {
  return (
    <div className="py-2 sm:py-4 w-full">
      <div className="w-full">
        <div className={`rounded-lg sm:rounded-2xl px-3 py-2 sm:py-3 shadow-sm max-w-[90%] sm:max-w-[80%] lg:max-w-3xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Thinking...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatMessagesPanel({ messages, darkMode, loading, messagesEndRef }: ChatMessagesPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        {messages.length === 0 ? (
          <EmptyState darkMode={darkMode} />
        ) : (
          <div className="py-3 sm:py-6">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} darkMode={darkMode} />
            ))}
            {loading && <ThinkingIndicator darkMode={darkMode} />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}
