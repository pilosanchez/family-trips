'use client'

import { useRef, useState } from 'react'
import { Camera, Upload, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export interface BillItem {
  id: string
  name: string
  price: number
}

interface Props {
  items: BillItem[]
  onItemsChange: (items: BillItem[]) => void
  onNext: () => void
}

export function ReceiptStep({ items, onItemsChange, onNext }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    setScanning(true)
    setError('')
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        const base64 = dataUrl.split(',')[1]
        const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

        const res = await fetch('/api/receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType }),
        })

        const data = await res.json()
        if (!res.ok || data.error) {
          setError(data.error || 'Error al leer el ticket')
        } else if (data.items?.length) {
          const newItems: BillItem[] = data.items.map((it: { name: string; price: number }, i: number) => ({
            id: `ocr-${i}-${Date.now()}`,
            name: it.name,
            price: Number(it.price) || 0,
          }))
          onItemsChange([...items, ...newItems])
        } else {
          setError('No se encontraron items. Agrega los items manualmente.')
        }
        setScanning(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setError('Error al procesar la imagen')
      setScanning(false)
    }
  }

  const addItem = () => {
    onItemsChange([...items, { id: `manual-${Date.now()}`, name: '', price: 0 }])
  }

  const updateItem = (id: string, field: 'name' | 'price', value: string | number) => {
    onItemsChange(items.map(it => it.id === id ? { ...it, [field]: value } : it))
  }

  const removeItem = (id: string) => {
    onItemsChange(items.filter(it => it.id !== id))
  }

  const subtotal = items.reduce((s, it) => s + (Number(it.price) || 0), 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          className="flex-1 justify-center gap-2"
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {scanning ? 'Leyendo...' : 'Foto del ticket'}
        </Button>
        <Button variant="ghost" onClick={addItem} className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Agregar item
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_100px_32px] gap-2 text-xs text-stone-400 font-medium px-1">
            <span>Item</span>
            <span>Precio</span>
            <span />
          </div>
          {items.map(item => (
            <div key={item.id} className="grid grid-cols-[1fr_100px_32px] gap-2 items-center">
              <input
                type="text"
                value={item.name}
                onChange={e => updateItem(item.id, 'name', e.target.value)}
                placeholder="Nombre del item"
                className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
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
