import FontSizeControl from '@/components/ui/FontSizeControl'
import { Globe, Menu, Moon, SearchCheck, Sun } from 'lucide-react'

interface ChatHeaderProps {
  darkMode: boolean
  currentConversationTitle: string | null
  deepResearchMode: boolean
  webSearchEnabled: boolean
  onOpenSidebar: () => void
  onToggleDarkMode: () => void
}

export default function ChatHeader({
  darkMode,
  currentConversationTitle,
  deepResearchMode,
  webSearchEnabled,
  onOpenSidebar,
  onToggleDarkMode,
}: ChatHeaderProps) {
  return (
    <div className={`border-b px-2 sm:px-4 lg:px-6 py-3 sm:py-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenSidebar}
            className={`p-2 rounded-md lg:hidden ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 flex items-center justify-center lg:hidden">
            <img
              src="/howai-icon.png"
              alt="HowAI"
              className="w-8 h-8 rounded-lg"
            />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {currentConversationTitle || 'HowAI'}
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {deepResearchMode && (
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-50 text-purple-700'}`}>
              <SearchCheck size={16} />
              <span className="text-sm font-medium hidden sm:inline">Deep Research</span>
            </div>
          )}
          {webSearchEnabled && (
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
              <Globe size={16} />
              <span className="text-sm font-medium hidden sm:inline">Web Search</span>
            </div>
          )}

          <FontSizeControl darkMode={darkMode} inline={true} />

          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'text-white hover:bg-gray-700 hover:text-gray-200'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            }`}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
