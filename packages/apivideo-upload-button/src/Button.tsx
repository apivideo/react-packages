import * as React from "react";
import { VideoUploader } from '@api.video/video-uploader'

export interface ButtonProps {
  children?: React.ReactNode
  apiKey: string
  style?: React.CSSProperties
  disabledWhileUploading?: boolean
}

export function Button({ 
  children,
  apiKey,
  style,
}: ButtonProps) {
  // LOCAL STATE
  const [progress, setProgress] = React.useState<number>(0)
  const [uploadToken, setUploadToken] = React.useState<{ token: string, ttl: number } | undefined>(undefined)

  // CONSTANTS
  const inputRef = React.useRef<HTMLInputElement>(null)

  // COMPONENT LIFECYCLES
  React.useEffect(() => {
    const getUploadToken = async (): Promise<void> => {
      const { access_token }: { access_token: string } = await fetch(
        'https://ws.api.video/auth/api-key', 
        {
          method: 'POST',
          body: JSON.stringify({
            apiKey
          }),
        })
        .then(res => res.json())

      const { data }: { data: Array<{ token: string, ttl: number }> } = await fetch(
        'https://ws.api.video/upload-tokens', 
        {
          method: 'GET',
          headers: {
              Authorization: access_token
          }
        })
        .then(res => res.json())
      
      if (data && data.length > 0) {
        setUploadToken({ token: data[0].token, ttl: data[0].ttl })
        return
      }

      const { token, ttl }: { token: string, ttl: number } = await fetch(
        'https://ws.api.video/upload-tokens', 
        {
          method: 'POST',
          headers: {
              Authorization: access_token
          }
        })
        .then(res => res.json())
      
      setUploadToken({ token, ttl })
    }
    getUploadToken()
  }, [apiKey])

  // HANDLERS - METHODS
  const handleClick = (): void => inputRef.current?.click()
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (!e.currentTarget?.files || !uploadToken) return
    const videoUploader = new VideoUploader({
      uploadToken: uploadToken.token,
      file: e.currentTarget.files[0]
    })
    videoUploader.onProgress(e => setProgress(Math.round(e.uploadedBytes*100/e.totalBytes)))
    videoUploader.upload()
  }

  // RETURN
  return (
    <>
      <button 
        onClick={handleClick}
        style={style ?? {
          background: '#FFFFFF',
          border: '1px solid #000000',
          borderRadius: 3,
          padding: '5px 10px'
        }}
      >
        {children ?? "Upload Button"}
      </button>
      <input type="file" hidden ref={inputRef} onChange={handleUpload} />
    </>
  )
}

Button.displayName = "Upload button"
