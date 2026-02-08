interface DragDropOverlayProps {
  darkMode: boolean
  isDragging: boolean
}

export default function DragDropOverlay({ darkMode, isDragging }: DragDropOverlayProps) {
  if (!isDragging) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center z-50 pointer-events-none">
      <div className={`rounded-2xl p-8 shadow-2xl border-2 border-dashed border-blue-500 max-w-md mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Drop files to upload
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Drop your photos or documents here to attach them to your message
          </p>
        </div>
      </div>
    </div>
  )
}
