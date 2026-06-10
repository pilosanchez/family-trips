'use client'

import { useRef, useState } from 'react'
import { Camera, ImageIcon, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface BillItem {
  id: string
  name: string
  price: number  // total for this line (unitPrice × qty)
  qty: number    // number of units
}

interface Props {
  items: BillItem[]
  onItemsChange: (items: BillItem[]) => void
  onNext: () => void
}

export function ReceiptStep({ items, onItemsChange, onNext }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('lectura'))
      reader.onload = (e) => {
        const src = e.target?.result as string
        const img = new Image()
        img.onerror = () => reject(new Error('imagen'))
        img.onload = () => {
          try {
            const MAX = 1200
            let { width, height } = img
            if (width > MAX || height > MAX) {
              if (width > height) { height = Math.round((height / width) * MAX); width = MAX }
              else { width = Math.round((width / height) * MAX); height = MAX }
            }
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (!ctx) { reject(new Error('canvas')); return }
            ctx.drawImage(img, 0, 0, width, height)
            const out = canvas.toDataURL('image/jpeg', 0.82)
            resolve(out.split(',')[1] ?? out)
          } catch (e) {
            reject(e)
          }
        }
        img.src = src
      }
      reader.readAsDataURL(file)
    })

  const handleFile = async (file: File) => {
    setScanning(true)
    setError('')
    try {
      const base64 = await compressImage(file)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)

      const res = await fetch('/api/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: 'image/jpeg' }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout))

      let data: { items?: { name: string; price: number; qty?: number }[]; error?: string }
      try {
        data = await res.json()
      } catch {
        throw new Error('respuesta')
      }

      if (!res.ok || data.error) {
        setError(data.error || 'No se pudo leer el ticket')
      } else if (data.items?.length) {
        const newItems: BillItem[] = data.items.map((it, i) => ({
          id: `ocr-${i}-${Date.now()}`,
          name: it.name,
          qty: Math.max(1, Math.round(Number(it.qty) || 1)),
          price: Number(it.price) || 0,
        }))
        onItemsChange([...items, ...newItems])
      } else {
        setError('No se encontraron items. Agréga los manualmente.')
      }
    } catch (err: unknown) {
      const name = err instanceof Error ? err.message : ''
      if (name === 'AbortError' || (err instanceof Error && err.name === 'AbortError')) {
        setError('La lectura tardó demasiado. Intenta con una foto más nítida.')
      } else {
        setError('No se pudo procesar la imagen. Intenta de nuevo o agrega los items manualmente.')
      }
    } finally {
      setScanning(false)
    }
  }

  const addItem = () => {
    onItemsChange([...items, { id: `manual-${Date.now()}`, name: '', price: 0, qty: 1 }])
  }

  const updateItem = (id: string, field: 'name' | 'price' | 'qty', value: string | number) => {
    onItemsChange(items.map(it => it.id === id ? { ...it, [field]: value } : it))
  }

  const removeItem = (id: string) => {
    onItemsChange(items.filter(it => it.id !== id))
  }

  const subtotal = items.reduce((s, it) => s + (Number(it.price) || 0), 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="absolute opacity-0 w-0 h-0 overflow-hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = '' }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="absolute opacity-0 w-0 h-0 overflow-hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = '' }}
        />
        <Button
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          className="flex-1 justify-center gap-2"
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {scanning ? 'Leyendo...' : 'Cámara'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => galleryRef.current?.click()}
          disabled={scanning}
          className="flex-1 justify-center gap-2"
        >
          <ImageIcon className="w-4 h-4" />
          Galería
        </Button>
        <Button variant="ghost" onClick={addItem} className="px-3">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_52px_88px_32px] gap-2 text-xs text-stone-400 font-medium px-1">
            <span>Item</span>
            <span className="text-center">Cant.</span>
            <span>Total</span>
            <span />
          </div>
          {items.map(item => (
            <div key={item.id} className="grid grid-cols-[1fr_52px_88px_32px] gap-2 items-center">
              <input
                type="text"
                value={item.name}
                onChange={e => updateItem(item.id, 'name', e.target.value)}
                placeholder="Nombre"
                className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
              <input
                type="number"
                min="1"
                step="1"
                value={item.qty || 1}
                onChange={e => updateItem(item.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                className="px-2 py-1.5 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 text-center"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.price || ''}
                onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
              <button
                onClick={() => removeItem(item.id)}
                className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 border-t border-stone-100 mt-1">
            <span className="text-sm text-stone-500">Subtotal</span>
            <span className="text-sm font-semibold text-stone-900">${subtotal.toFixed(2)}</span>
          </div>
        </div>
      )}

      {items.length === 0 && !scanning && (
        <div className="text-center py-8 text-stone-400 text-sm">
          Saca una foto al ticket o agrega items manualmente
        </div>
      )}

      <Button
        onClick={onNext}
        disabled={items.length === 0}
        className="w-full justify-center mt-2"
      >
        Continuar
      </Button>
    </div>
  )
}
