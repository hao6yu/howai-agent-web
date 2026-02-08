import { useCallback, useEffect, useRef, useState } from 'react'
import { convertHeicToJpeg } from '../lib/fileProcessing'

interface UseAttachmentComposerOptions {
  onOpenPdfConverter: () => void
}

export function useAttachmentComposer({ onOpenPdfConverter }: UseAttachmentComposerOptions) {
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [_dragCounter, setDragCounter] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const attachmentMenuRef = useRef<HTMLDivElement>(null)
  const previewUrlsRef = useRef<string[]>([])

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return

    const incomingFiles = Array.from(files)
    const processedFiles: File[] = []

    for (const file of incomingFiles) {
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
        'application/pdf', 'text/plain', 'text/csv',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/javascript', 'text/html', 'text/css', 'application/json',
      ]

      const imageMaxSize = 5 * 1024 * 1024
      const docMaxSize = 10 * 1024 * 1024

      const isHeicFile = /\.(heic|heif)$/i.test(file.name)
      const isAllowedType = allowedTypes.includes(file.type) || isHeicFile
      const isAllowedExtension = /\.(txt|md|js|ts|py|java|cpp|c|h)$/i.test(file.name)

      if (!isAllowedType && !isAllowedExtension) {
        alert(`File type not supported: ${file.name}`)
        continue
      }

      const isImage = file.type.startsWith('image/') || isHeicFile
      const maxSize = isImage ? imageMaxSize : docMaxSize
      const maxSizeText = isImage ? '5MB' : '10MB'

      if (file.size > maxSize) {
        alert(`File too large: ${file.name} (max ${maxSizeText})`)
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
      }
    }

    if (processedFiles.length === 0) {
      return
    }

    setAttachedFiles((previousFiles) => [...previousFiles, ...processedFiles])
    setPreviewUrls((previousUrls) => [
      ...previousUrls,
      ...processedFiles.map((file) => (file.type.startsWith('image/') ? URL.createObjectURL(file) : '')),
    ])
  }, [])

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((previousFiles) => {
      const fileToRemove = previousFiles[index]
      setPreviewUrls((previousUrls) => {
        const urlToRevoke = previousUrls[index]
        if (urlToRevoke && fileToRemove?.type.startsWith('image/')) {
          URL.revokeObjectURL(urlToRevoke)
        }
        return previousUrls.filter((_, urlIndex) => urlIndex !== index)
      })

      return previousFiles.filter((_, fileIndex) => fileIndex !== index)
    })
  }, [])

  const clearComposerAttachments = useCallback(() => {
    setPreviewUrls((existingUrls) => {
      existingUrls.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
      return []
    })
    setAttachedFiles([])
  }, [])

  const handleImageClick = useCallback(() => {
    imageInputRef.current?.click()
    setShowAttachmentMenu(false)
  }, [])

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click()
    setShowAttachmentMenu(false)
  }, [])

  const handlePdfConverterClick = useCallback(() => {
    onOpenPdfConverter()
    setShowAttachmentMenu(false)
  }, [onOpenPdfConverter])

  const toggleAttachmentMenu = useCallback(() => {
    setShowAttachmentMenu((previousState) => !previousState)
  }, [])

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragCounter((previousCounter) => previousCounter + 1)

    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    setDragCounter((previousCounter) => {
      const nextCounter = Math.max(previousCounter - 1, 0)
      if (nextCounter === 0) {
        setIsDragging(false)
      }
      return nextCounter
    })
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    setDragCounter(0)

    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      void handleFileUpload(files)
    }
  }, [handleFileUpload])

  useEffect(() => {
    previewUrlsRef.current = previewUrls
  }, [previewUrls])

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const preventDefaults = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
    }

    const events = ['dragenter', 'dragover', 'dragleave', 'drop']
    events.forEach((eventName) => {
      document.addEventListener(eventName, preventDefaults, false)
    })

    const handleGlobalPaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return

      const pastedFiles: File[] = []
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            pastedFiles.push(file)
          }
        }
      }

      if (pastedFiles.length > 0) {
        event.preventDefault()
        const fileList = new DataTransfer()
        pastedFiles.forEach((file) => fileList.items.add(file))
        await handleFileUpload(fileList.files)
      }
    }

    document.addEventListener('paste', handleGlobalPaste)

    return () => {
      events.forEach((eventName) => {
        document.removeEventListener(eventName, preventDefaults, false)
      })
      document.removeEventListener('paste', handleGlobalPaste)
    }
  }, [handleFileUpload])

  return {
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
  }
}
