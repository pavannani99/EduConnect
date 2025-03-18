export async function uploadFile(file: File): Promise<string> {
  // Create FormData
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'educonnect_notes') // Changed to a more unique name

  try {
    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error('Failed to upload file')
    }

    const data = await response.json()
    return data.secure_url
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
} 