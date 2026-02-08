export async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default

  const convertedBlob = (await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.8,
  })) as Blob

  return new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
    type: 'image/jpeg',
  })
}

export function compressAndConvertImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const sourceUrl = URL.createObjectURL(file)

    img.onload = () => {
      let { width, height } = img
      const maxSize = 1024

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height * maxSize) / width
          width = maxSize
        } else {
          width = (width * maxSize) / height
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      ctx?.drawImage(img, 0, 0, width, height)

      const quality = file.type === 'image/png' ? 1.0 : 0.8
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
      URL.revokeObjectURL(sourceUrl)

      resolve(compressedDataUrl.split(',')[1])
    }

    img.onerror = () => {
      URL.revokeObjectURL(sourceUrl)
      reject(new Error('Failed to load image'))
    }
    img.src = sourceUrl
  })
}

export function fileToBase64(file: File): Promise<string> {
  if (file.type.startsWith('image/')) {
    return compressAndConvertImage(file)
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = (error) => reject(error)
  })
}
