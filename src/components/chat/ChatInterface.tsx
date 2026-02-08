'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Message, Conversation } from '@/types/chat'
import SettingsModal from '../settings/SettingsModal'
import { getTimeAgo, formatDate } from '@/utils/timeHelpers'
import { compressAndConvertImage, convertHeicToJpeg, fileToBase64 } from './lib/fileProcessing'
import { useAttachmentComposer } from './hooks/useAttachmentComposer'
import { useChatSend } from './hooks/useChatSend'
import { ChatSidebar, ChatSidebarOverlay } from './components/ChatSidebar'
import ChatHeader from './components/ChatHeader'
import ChatMessagesPanel from './components/ChatMessagesPanel'
import ChatComposer from './components/ChatComposer'
import DragDropOverlay from './components/DragDropOverlay'
import PdfConverterModal from './components/PdfConverterModal'

export default function ChatInterface() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [pinnedConversations, setPinnedConversations] = useState<Conversation[]>([])
  const [deepResearchMode, setDeepResearchMode] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  const [showPdfConverter, setShowPdfConverter] = useState(false)
  const [pdfImages, setPdfImages] = useState<File[]>([])
  const [pdfPreviewUrls, setPdfPreviewUrls] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pdfImageInputRef = useRef<HTMLInputElement>(null)
  const pdfPreviewUrlsRef = useRef<string[]>([])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const {
    attachedFiles,
    previewUrls,
    showAttachmentMenu,
    isDragging,
    fileInputRef,
    imageInputRef,
    attachmentMenuRef,
    handleFileUpload,
    removeFile,
    clearComposerAttachments,
    handleImageClick,
    handleFileClick,
    handlePdfConverterClick,
    toggleAttachmentMenu,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  } = useAttachmentComposer({
    onOpenPdfConverter: () => setShowPdfConverter(true),
  })

  // Save dark mode preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(darkMode))
    }
  }, [darkMode])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    pdfPreviewUrlsRef.current = pdfPreviewUrls
  }, [pdfPreviewUrls])

  useEffect(() => {
    return () => {
      pdfPreviewUrlsRef.current.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [])

  // PDF converter functions
  const handlePdfImageUpload = async (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files)
    const processedFiles: File[] = []

    for (const file of newFiles) {
      const isHeicFile = file.name.match(/\.(heic|heif)$/i)
      const isImage = file.type.startsWith('image/') || isHeicFile

      if (!isImage) {
        alert(`Please select only image files: ${file.name}`)
        continue
      }

      const maxSize = 5 * 1024 * 1024 // 5MB limit
      if (file.size > maxSize) {
        alert(`Image too large: ${file.name} (max 5MB)`)
        continue
      }

      try {
        if (isHeicFile) {
          const convertedFile = await convertHeicToJpeg(file)
          processedFiles.push(convertedFile)
        } else {
          processedFiles.push(file)
        }
      } catch (error) {
        console.error('Error processing file:', error)
        alert(`Error processing file: ${file.name}`)
        continue
      }
    }

    if (processedFiles.length > 0) {
      setPdfImages(prev => [...prev, ...processedFiles])

      processedFiles.forEach(file => {
        const url = URL.createObjectURL(file)
        setPdfPreviewUrls(prev => [...prev, url])
      })
    }
  }

  const removePdfImage = (index: number) => {
    const urlToRevoke = pdfPreviewUrls[index]
    URL.revokeObjectURL(urlToRevoke)

    setPdfImages(prev => prev.filter((_, i) => i !== index))
    setPdfPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const movePdfImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pdfImages.length) return

    const newImages = [...pdfImages]
    const newUrls = [...pdfPreviewUrls]

    const [movedImage] = newImages.splice(fromIndex, 1)
    const [movedUrl] = newUrls.splice(fromIndex, 1)

    newImages.splice(toIndex, 0, movedImage)
    newUrls.splice(toIndex, 0, movedUrl)

    setPdfImages(newImages)
    setPdfPreviewUrls(newUrls)
  }

  const generatePDF = async () => {
    if (pdfImages.length === 0) {
      alert('Please select at least one image to convert to PDF')
      return
    }

    try {
      // Dynamically import jsPDF to avoid SSR issues
      const { jsPDF } = await import('jspdf')

      const pdf = new jsPDF()
      let isFirstPage = true

      for (let i = 0; i < pdfImages.length; i++) {
        const file = pdfImages[i]
        const base64 = await compressAndConvertImage(file)

        if (!isFirstPage) {
          pdf.addPage()
        }

        // Calculate image dimensions to fit page while maintaining aspect ratio
        const img = new Image()
        img.src = pdfPreviewUrls[i]

        await new Promise((resolve) => {
          img.onload = () => {
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()
            const margin = 20
            const maxWidth = pageWidth - (2 * margin)
            const maxHeight = pageHeight - (2 * margin)

            let imgWidth = img.width
            let imgHeight = img.height

            // Scale to fit page while maintaining aspect ratio
            const widthRatio = maxWidth / imgWidth
            const heightRatio = maxHeight / imgHeight
            const ratio = Math.min(widthRatio, heightRatio)

            imgWidth *= ratio
            imgHeight *= ratio

            // Center the image on the page
            const x = (pageWidth - imgWidth) / 2
            const y = (pageHeight - imgHeight) / 2

            pdf.addImage(`data:image/jpeg;base64,${base64}`, 'JPEG', x, y, imgWidth, imgHeight)
            resolve(void 0)
          }
        })

        isFirstPage = false
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename = `images-to-pdf-${timestamp}.pdf`

      // Get PDF as blob for download link
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)

      // Don't auto-download, just prepare for user-initiated download
      // pdf.save(filename) - removed auto-download

      // Simulate AI response with PDF
      await simulateAIPdfResponse(filename, pdfImages.length, pdfUrl)

      // Clean up
      pdfPreviewUrls.forEach(url => URL.revokeObjectURL(url))
      setPdfImages([])
      setPdfPreviewUrls([])
      setShowPdfConverter(false)

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const simulateAIPdfResponse = async (filename: string, imageCount: number, pdfUrl: string) => {
    let conversationToUse = currentConversation
    let isFirstMessage = false

    if (!user || !conversationToUse) {
      // Create a new conversation if none exists
      conversationToUse = await createNewConversation()
      if (conversationToUse) {
        setCurrentConversation(conversationToUse)
        isFirstMessage = true
      }
    } else {
      // Check if this is the first message in existing conversation
      isFirstMessage = messages.length === 0
    }

    if (!conversationToUse) return

    const responseContent = `I've successfully converted ${imageCount} image${imageCount > 1 ? 's' : ''} into a PDF document for you! Your PDF is ready for download.

📄 **PDF Details:**
- Images converted: ${imageCount}
- Format: PDF with high-quality JPEG compression
- Layout: Each image centered on its own page
- File name: ${filename}

✅ Click the download button below to save your PDF file.`

    // Add AI response to database
    const { data: aiMessage } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationToUse.id,
        content: responseContent,
        is_ai: true
      })
      .select()
      .single()

    if (aiMessage) {
      // Add the PDF download function to the message object for custom handling
      const enhancedMessage = {
        ...aiMessage,
        pdfDownload: {
          url: pdfUrl,
          filename,
          type: 'pdf_conversion'
        }
      }
      setMessages(prev => [...prev, enhancedMessage])
    }

    // Generate conversation title if this is the first message
    if (isFirstMessage) {
      const newTitle = `PDF: ${imageCount} Image${imageCount > 1 ? 's' : ''} Converted`

      // Update conversation title in database
      const { error } = await supabase
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', conversationToUse.id)

      if (!error) {
        // Update local state
        setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null)

        // Update conversations in sidebar
        setPinnedConversations(prev =>
          prev.map(conv =>
            conv.id === conversationToUse.id
              ? { ...conv, title: newTitle, updated_at: new Date().toISOString() }
              : conv
          )
        )
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationToUse.id
              ? { ...conv, title: newTitle, updated_at: new Date().toISOString() }
              : conv
          )
        )

        // Refresh from database
        await loadConversations()
      }
    }
  }

  // Load all conversations for sidebar
  const loadConversations = useCallback(async () => {
    if (!user) return

    try {
      const { data: allConversations, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching conversations:', error)
        return
      }

      if (allConversations) {
        const pinned = allConversations
          .filter(conv => conv.is_pinned)
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        
        const regular = allConversations
          .filter(conv => !conv.is_pinned)
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

        setPinnedConversations(pinned)
        setConversations(regular)
        setCurrentConversation((previousCurrent) => {
          if (!previousCurrent) {
            return previousCurrent
          }
          return allConversations.find((conv) => conv.id === previousCurrent.id) || previousCurrent
        })
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }, [user])

  const loadOrCreateConversation = useCallback(async () => {
    if (!user) return

    try {
      // First, ensure user profile exists
      const { data: _profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating user profile...')
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0]
          })

        if (createProfileError) {
          console.error('Error creating profile:', createProfileError)
          return
        }
      }

      // Load all conversations for the sidebar
      await loadConversations()

      // Don't auto-load any conversation - stay on landing page
      console.log('User profile ready, staying on landing page')
    } catch (error) {
      console.error('Error in loadOrCreateConversation:', error)
    }
  }, [user, loadConversations])

  // Create new conversation
  const createNewConversation = async () => {
    if (!user) return null

    try {
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: 'New Chat'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating conversation:', error)
        return null
      }

      // Refresh conversations list
      await loadConversations()
      return newConversation
    } catch (error) {
      console.error('Error creating new conversation:', error)
      return null
    }
  }

  // Switch to a conversation
  const switchToConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation)
    loadMessages(conversation.id)
  }

  // Pin/unpin conversation
  const togglePin = async (conversation: Conversation) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_pinned: !conversation.is_pinned })
        .eq('id', conversation.id)

      if (error) {
        console.error('Error toggling pin:', error)
        return
      }

      // Refresh conversations
      await loadConversations()
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  // Delete conversation
  const deleteConversation = async (conversation: Conversation) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversation.id)

      if (error) {
        console.error('Error deleting conversation:', error)
        return
      }

      // If this was the current conversation, create a new one
      if (currentConversation?.id === conversation.id) {
        const newConv = await createNewConversation()
        if (newConv) {
          setCurrentConversation(newConv)
          setMessages([])
        }
      }

      // Refresh conversations
      await loadConversations()
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  // Load or create conversation
  useEffect(() => {
    if (user) {
      loadOrCreateConversation()
    }
  }, [user, loadOrCreateConversation])

  const loadMessages = async (conversationId: string) => {
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messages) {
      setMessages(messages)
    }
  }

  const sendMessage = useChatSend({
    user: user ? { id: user.id } : null,
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
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  if (!user) {
    return <div>Please sign in to use the chat.</div>
  }

  // Get current conversation ID for sidebar
  const currentConversationId = currentConversation?.id

  // Filter conversations based on search query
  const filteredPinnedConversations = pinnedConversations.filter((conv) => {
    if (!searchQuery.trim()) return true
    return conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false
  })

  const filteredUnpinnedConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true
    return conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false
  })

  // Total filtered conversations for "no results" message
  const totalFilteredConversations = filteredPinnedConversations.length + filteredUnpinnedConversations.length

  const closePdfConverter = () => {
    setShowPdfConverter(false)
    pdfPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    setPdfImages([])
    setPdfPreviewUrls([])
  }

  return (
    <div className={`flex h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ChatSidebarOverlay
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <ChatSidebar
        darkMode={darkMode}
        sidebarOpen={sidebarOpen}
        userEmail={user.email}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
        currentConversationId={currentConversationId}
        filteredPinnedConversations={filteredPinnedConversations}
        filteredUnpinnedConversations={filteredUnpinnedConversations}
        totalFilteredConversations={totalFilteredConversations}
        onSwitchConversation={switchToConversation}
        onTogglePin={togglePin}
        onDeleteConversation={deleteConversation}
        onNewConversation={() => {
          setCurrentConversation(null)
          setMessages([])
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={logout}
        formatDate={formatDate}
        getTimeAgo={getTimeAgo}
      />

      <div
        className="flex-1 flex flex-col relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <ChatHeader
          darkMode={darkMode}
          currentConversationTitle={currentConversation?.title || null}
          deepResearchMode={deepResearchMode}
          webSearchEnabled={webSearchEnabled}
          onOpenSidebar={() => setSidebarOpen(true)}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        <ChatMessagesPanel
          messages={messages}
          darkMode={darkMode}
          loading={loading}
          messagesEndRef={messagesEndRef}
        />

        <ChatComposer
          darkMode={darkMode}
          attachedFiles={attachedFiles}
          previewUrls={previewUrls}
          currentMessage={currentMessage}
          loading={loading}
          showAttachmentMenu={showAttachmentMenu}
          webSearchEnabled={webSearchEnabled}
          deepResearchMode={deepResearchMode}
          attachmentMenuRef={attachmentMenuRef}
          fileInputRef={fileInputRef}
          imageInputRef={imageInputRef}
          pdfImageInputRef={pdfImageInputRef}
          onCurrentMessageChange={setCurrentMessage}
          onKeyDown={handleKeyDown}
          onSendMessage={sendMessage}
          onRemoveFile={removeFile}
          onToggleAttachmentMenu={toggleAttachmentMenu}
          onImageClick={handleImageClick}
          onFileClick={handleFileClick}
          onPdfConverterClick={handlePdfConverterClick}
          onWebSearchToggle={() => setWebSearchEnabled(!webSearchEnabled)}
          onDeepResearchToggle={() => setDeepResearchMode(!deepResearchMode)}
          onFileUpload={handleFileUpload}
          onPdfImageUpload={handlePdfImageUpload}
        />

        <DragDropOverlay
          darkMode={darkMode}
          isDragging={isDragging}
        />
      </div>

      <PdfConverterModal
        show={showPdfConverter}
        darkMode={darkMode}
        pdfImages={pdfImages}
        pdfPreviewUrls={pdfPreviewUrls}
        pdfImageInputRef={pdfImageInputRef}
        onClose={closePdfConverter}
        onRemoveImage={removePdfImage}
        onMoveImage={movePdfImage}
        onGeneratePdf={generatePDF}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
      />
    </div>
  )
}
