import { ChevronDown, ChevronUp, FileText, X } from 'lucide-react'
import { RefObject } from 'react'

interface PdfConverterModalProps {
  show: boolean
  darkMode: boolean
  pdfImages: File[]
  pdfPreviewUrls: string[]
  pdfImageInputRef: RefObject<HTMLInputElement>
  onClose: () => void
  onRemoveImage: (index: number) => void
  onMoveImage: (fromIndex: number, toIndex: number) => void
  onGeneratePdf: () => void
}

export default function PdfConverterModal({
  show,
  darkMode,
  pdfImages,
  pdfPreviewUrls,
  pdfImageInputRef,
  onClose,
  onRemoveImage,
  onMoveImage,
  onGeneratePdf,
}: PdfConverterModalProps) {
  if (!show) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Convert Images to PDF</h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Select multiple images to combine into a single PDF document</p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {pdfImages.length === 0 ? (
            <div className="text-center py-12">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <FileText className={`w-8 h-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No images selected</h3>
              <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose images to convert into a PDF document</p>
              <button
                onClick={() => pdfImageInputRef.current?.click()}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Select Images
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {pdfImages.length} image{pdfImages.length > 1 ? 's' : ''} selected
                </p>
                <button
                  onClick={() => pdfImageInputRef.current?.click()}
                  className={`text-sm px-3 py-1 rounded-md transition-colors ${darkMode ? 'text-blue-400 hover:bg-blue-900' : 'text-blue-600 hover:bg-blue-100'}`}
                >
                  Add more images
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pdfImages.map((file, index) => (
                  <div key={index} className={`relative rounded-lg overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <img
                      src={pdfPreviewUrls[index]}
                      alt={file.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-start justify-end p-2">
                      <div className="flex space-x-1">
                        {index > 0 && (
                          <button
                            onClick={() => onMoveImage(index, index - 1)}
                            className="bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-70 transition-opacity"
                            title="Move up"
                          >
                            <ChevronUp size={12} />
                          </button>
                        )}
                        {index < pdfImages.length - 1 && (
                          <button
                            onClick={() => onMoveImage(index, index + 1)}
                            className="bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-70 transition-opacity"
                            title="Move down"
                          >
                            <ChevronDown size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveImage(index)}
                          className="bg-red-500 bg-opacity-80 text-white p-1 rounded hover:bg-opacity-100 transition-opacity"
                          title="Remove"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 p-2 ${darkMode ? 'bg-gray-800' : 'bg-white'} bg-opacity-90`}>
                      <p className={`text-xs truncate ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{file.name}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Page {index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {pdfImages.length > 0 && (
          <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                📄 Images will be arranged in the order shown above
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className={`px-4 py-2 rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={onGeneratePdf}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Generate PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
