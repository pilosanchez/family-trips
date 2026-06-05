'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FileUploadProps {
  bucket?: string
  folder?: string
  existingUrls?: string[]
  onUpload: (urls: string[]) => void
  maxFiles?: number
  accept?: string
}

export function FileUpload({
  bucket = 'trips',
  folder = 'files',
  existingUrls = [],
  onUpload,
  maxFiles = 5,
  accept = '.pdf,.jpg,.jpeg,.png',
}: FileUploadProps) {
  const [urls, setUrls] = useState<string[]>(existingUrls)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFiles = async (files: FileList) => {
    if (!files.length) return
    setUploading(true)
    const newUrls: string[] = []

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage.from(bucket).upload(path, file)
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path)
        newUrls.push(publicUrl)
      }
    }

    const updated = [...urls, ...newUrls].slice(0, maxFiles)
    setUrls(updated)
    onUpload(updated)
    setUploading(false)
  }

  const removeUrl = (url: string) => {
    const updated = urls.filter(u => u !== url)
    setUrls(updated)
    onUpload(updated)
  }

  const getFileName = (url: string) => decodeURIComponent(url.split('/').pop() ?? url).replace(/^\d+-[a-z0-9]+\./, 'archivo.')

  return (
    <div className="flex flex-col gap-2">
      {/* Existing files */}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map(url => (
            <div key={url} className="flex items-center gap-1.5 px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-600">
              <FileText className="w-3 h-3 text-stone-400 shrink-0" />
              <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-stone-900 truncate max-w-32">
                {getFileName(url)}
              </a>
              <button onClick={() => removeUrl(url)} className="text-stone-300 hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {urls.length < maxFiles && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            className="hidden"
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 border border-dashed border-stone-300 rounded-lg text-sm text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors w-full justify-center disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Subiendo...' : 'Adjuntar archivo (PDF, imagen)'}
          </button>
        </div>
      )}
    </div>
  )
}
