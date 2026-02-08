import { Globe, Paperclip, Plus, SearchCheck, Send, X } from 'lucide-react'
import { RefObject } from 'react'

interface ChatComposerProps {
  darkMode: boolean
  attachedFiles: File[]
  previewUrls: string[]
  currentMessage: string
  loading: boolean
  showAttachmentMenu: boolean
  webSearchEnabled: boolean
  deepResearchMode: boolean
  attachmentMenuRef: RefObject<HTMLDivElement>
  fileInputRef: RefObject<HTMLInputElement>
  imageInputRef: RefObject<HTMLInputElement>
  pdfImageInputRef: RefObject<HTMLInputElement>
  onCurrentMessageChange: (value: string) => void
  onKeyDown: (event: React.KeyboardEvent) => void
  onSendMessage: () => void
  onRemoveFile: (index: number) => void
  onToggleAttachmentMenu: () => void
  onImageClick: () => void
  onFileClick: () => void
  onPdfConverterClick: () => void
  onWebSearchToggle: () => void
  onDeepResearchToggle: () => void
  onFileUpload: (files: FileList | null) => void | Promise<void>
  onPdfImageUpload: (files: FileList | null) => void | Promise<void>
}

export default function ChatComposer({
  darkMode,
  attachedFiles,
  previewUrls,
  currentMessage,
  loading,
  showAttachmentMenu,
  webSearchEnabled,
  deepResearchMode,
  attachmentMenuRef,
  fileInputRef,
  imageInputRef,
  pdfImageInputRef,
  onCurrentMessageChange,
  onKeyDown,
  onSendMessage,
  onRemoveFile,
  onToggleAttachmentMenu,
  onImageClick,
  onFileClick,
  onPdfConverterClick,
  onWebSearchToggle,
  onDeepResearchToggle,
  onFileUpload,
  onPdfImageUpload,
}: ChatComposerProps) {
  return (
    <>
      <div className={`px-2 sm:px-4 lg:px-6 py-2 sm:py-4 border-t flex-shrink-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="w-full">
          <div className={`rounded-2xl p-2 sm:p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div key={index} className={`relative rounded-lg p-2 flex items-center space-x-2 max-w-full sm:max-w-xs ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                    {file.type.startsWith('image/') && previewUrls[index] ? (
                      <img
                        src={previewUrls[index]}
                        alt={file.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${darkMode ? 'bg-gray-500' : 'bg-gray-200'}`}>
                        <Paperclip size={16} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{file.name}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={() => onRemoveFile(index)}
                      className={`p-1 rounded-full ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-3">
              <textarea
                value={currentMessage}
                onChange={(event) => onCurrentMessageChange(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask anything... paste images (Ctrl+V), attach files, or ask me to create artwork!"
                className={`w-full bg-transparent resize-none focus:outline-none text-base leading-6 ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
                rows={1}
                disabled={loading}
                style={{ minHeight: '24px', maxHeight: '200px' }}
                onInput={(event) => {
                  const target = event.target as HTMLTextAreaElement
                  target.style.height = '24px'
                  target.style.height = Math.min(target.scrollHeight, 200) + 'px'
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="relative" ref={attachmentMenuRef}>
                  <button
                    onClick={onToggleAttachmentMenu}
                    className={`p-3 sm:p-2 rounded-lg transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-[auto] sm:min-h-[auto] ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
                    title="Add attachments"
                  >
                    <Plus size={18} />
                  </button>

                  {showAttachmentMenu && (
                    <div className={`absolute bottom-full left-0 mb-2 rounded-lg shadow-lg border py-1 min-w-48 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                      <button
                        onClick={onImageClick}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        📷 Upload photo
                      </button>
                      <button
                        onClick={onFileClick}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        📄 Upload file
                      </button>
                      <button
                        onClick={onPdfConverterClick}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        📄 Convert to PDF
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={onWebSearchToggle}
                  className={`p-3 sm:p-2 rounded-lg transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-[auto] sm:min-h-[auto] ${
                    webSearchEnabled
                      ? darkMode ? 'bg-blue-800 text-blue-300 hover:bg-blue-700' : 'bg-blue-200 text-blue-700 hover:bg-blue-300'
                      : darkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
                  }`}
                  title={webSearchEnabled ? 'Disable Web Search' : 'Enable Web Search'}
                >
                  <Globe size={18} />
                </button>

                <button
                  onClick={onDeepResearchToggle}
                  className={`p-3 sm:p-2 rounded-lg transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-[auto] sm:min-h-[auto] ${
                    deepResearchMode
                      ? darkMode ? 'bg-purple-800 text-purple-300 hover:bg-purple-700' : 'bg-purple-200 text-purple-700 hover:bg-purple-300'
                      : darkMode ? 'text-gray-400 hover:text-purple-400 hover:bg-purple-900' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-100'
                  }`}
                  title={deepResearchMode ? 'Disable Deep Research Mode' : 'Enable Deep Research Mode'}
                >
                  <SearchCheck size={18} />
                </button>
              </div>

              <div className="flex items-center">
                <button
                  onClick={onSendMessage}
                  disabled={loading || (!currentMessage.trim() && attachedFiles.length === 0)}
                  className={`px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 min-h-[44px] ${
                    (currentMessage.trim() || attachedFiles.length > 0) && !loading
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send size={16} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.js,.ts,.py,.java,.cpp,.c,.h,.md,.json,.html,.css"
          onChange={(event) => {
            void onFileUpload(event.target.files)
          }}
          className="hidden"
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          onChange={(event) => {
            void onFileUpload(event.target.files)
          }}
          className="hidden"
        />
        <input
          ref={pdfImageInputRef}
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          onChange={(event) => {
            void onPdfImageUpload(event.target.files)
          }}
          className="hidden"
        />
      </div>
    </>
  )
}
