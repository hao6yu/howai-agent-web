import { Conversation } from '@/types/chat'
import { MessageSquare, MessageSquarePlus, Pin, PinOff, Search, Settings, Trash2, XCircle } from 'lucide-react'

interface ChatSidebarOverlayProps {
  sidebarOpen: boolean
  onClose: () => void
}

export function ChatSidebarOverlay({ sidebarOpen, onClose }: ChatSidebarOverlayProps) {
  if (!sidebarOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
      onClick={onClose}
    />
  )
}

interface ChatSidebarProps {
  darkMode: boolean
  sidebarOpen: boolean
  userEmail?: string
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onClearSearch: () => void
  currentConversationId?: string
  filteredPinnedConversations: Conversation[]
  filteredUnpinnedConversations: Conversation[]
  totalFilteredConversations: number
  onSwitchConversation: (conversation: Conversation) => void
  onTogglePin: (conversation: Conversation) => void
  onDeleteConversation: (conversation: Conversation) => void
  onNewConversation: () => void
  onOpenSettings: () => void
  onLogout: () => void
  formatDate: (date: string) => string
  getTimeAgo: (date: string) => string
}

export function ChatSidebar({
  darkMode,
  sidebarOpen,
  userEmail,
  searchQuery,
  onSearchQueryChange,
  onClearSearch,
  currentConversationId,
  filteredPinnedConversations,
  filteredUnpinnedConversations,
  totalFilteredConversations,
  onSwitchConversation,
  onTogglePin,
  onDeleteConversation,
  onNewConversation,
  onOpenSettings,
  onLogout,
  formatDate,
  getTimeAgo,
}: ChatSidebarProps) {
  return (
    <div
      className={`
        fixed lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        w-80 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col flex-shrink-0
        transition-all duration-300 ease-in-out z-50 lg:z-auto
        h-full lg:flex
      `}
    >
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <img
                src="/howai-icon.png"
                alt="HowAI"
                className="w-8 h-8 rounded-lg"
              />
            </div>
            <h1 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>HowAI</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onNewConversation}
              className={`p-2 rounded-md transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              title="New conversation"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className={`w-full pl-10 pr-10 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'}`}
          />
          {searchQuery && (
            <button
              onClick={onClearSearch}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              title="Clear search"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredPinnedConversations.length > 0 && (
          <div className="p-3">
            <h3 className={`text-xs font-medium uppercase tracking-wider mb-2 px-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Pinned
            </h3>
            <div className="space-y-1">
              {filteredPinnedConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                    currentConversationId === conversation.id
                      ? darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'
                      : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => onSwitchConversation(conversation)}
                  title={`Created ${formatDate(conversation.created_at)}`}
                >
                  <div className="flex items-center">
                    <Pin className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{conversation.title}</div>
                      <div className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {getTimeAgo(conversation.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          onTogglePin(conversation)
                        }}
                        className={`p-1 rounded ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Unpin"
                      >
                        <PinOff className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          onDeleteConversation(conversation)
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-3">
          {filteredPinnedConversations.length > 0 && (
            <h3 className={`text-xs font-medium uppercase tracking-wider mb-2 px-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Recent
            </h3>
          )}
          <div className="space-y-1">
            {filteredUnpinnedConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                  currentConversationId === conversation.id
                    ? darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'
                    : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => onSwitchConversation(conversation)}
                title={`Created ${formatDate(conversation.created_at)}`}
              >
                <div className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{conversation.title}</div>
                    <div className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {getTimeAgo(conversation.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        onTogglePin(conversation)
                      }}
                      className="p-1 text-gray-400 hover:text-yellow-500 rounded"
                      title="Pin"
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        onDeleteConversation(conversation)
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {searchQuery.trim() && totalFilteredConversations === 0 && (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Search className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className="text-sm">No conversations found</p>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Try a different search term</p>
            </div>
          )}
        </div>
      </div>

      <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-xs mb-3 px-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {userEmail}
        </div>

        <button
          onClick={onOpenSettings}
          className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </button>
        <button
          onClick={onLogout}
          className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors mt-1 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <span className="w-4 h-4 mr-2">↗</span>
          Logout
        </button>
      </div>
    </div>
  )
}
