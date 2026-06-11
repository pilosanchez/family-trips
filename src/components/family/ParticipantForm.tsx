'use client'

import { useState, useRef } from 'react'
import { Plus, X, FileText, Upload, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { Participant, ParticipantDoc } from '@/types'

const DOC_TYPES: { value: ParticipantDoc['type']; label: string }[] = [
  { value: 'passport', label: 'Pasaporte' },
  { value: 'minor_permit', label: 'Permiso del menor' },
  { value: 'credit_card', label: 'Tarjeta de crédito' },
  { value: 'visa', label: 'Visa' },
  { value: 'insurance', label: 'Seguro de viaje' },
  { value: 'other', label: 'Otro' },
]

function DocRow({
  doc,
  onTypeChange,
  onNoteChange,
  onUrlChange,
  onRemove,
}: {
  doc: ParticipantDoc
  onTypeChange: (type: ParticipantDoc['type']) => void
  onNoteChange: (note: string) => void
  onUrlChange: (url: string) => void
  onRemove: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFile = async (file: File) => {
    setUploading(true)
    setUploadError('')
    const ext = file.name.split('.').pop()
    const path = `participants/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('trips').upload(path, file)
    if (error) {
      setUploadError(error.message)
    } else if (data) {
      const { data: { publicUrl } } = supabase.storage.from('trips').getPublicUrl(data.path)
      onUrlChange(publicUrl)
    }
    setUploading(false)
  }

  return (
    <div className="flex flex-col gap-2 p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
      <div className="flex items-center gap-2">
        <select
          value={doc.type}
          onChange={e => onTypeChange(e.target.value as ParticipantDoc['type'])}
          className="text-sm border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-400"
        >
          {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input
          type="text"
          value={doc.note ?? ''}
          onChange={e => onNoteChange(e.target.value)}
          placeholder="Nota (ej: Bolivia)"
          className="flex-1 text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 text-stone-700"
        />
        <button type="button" onClick={onRemove} className="text-stone-300 hover:text-red-500 transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        {doc.url ? (
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-stone-600 hover:text-stone-900 truncate">
              Ver archivo
            </a>
            <button type="button" onClick={() => onUrlChange('')} className="text-stone-300 hover:text-red-500 transition-colors shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Subiendo...' : 'Subir archivo'}
            </button>
            {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
          </>
        )}
      </div>
    </div>
  )
}

interface ParticipantFormProps {
  initial?: Partial<Participant>
  onSubmit: (data: Partial<Participant>) => Promise<void>
  onCancel: () => void
}

export function ParticipantForm({ initial, onSubmit, onCancel }: ParticipantFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    document_type: initial?.document_type ?? 'passport',
    document_number: initial?.document_number ?? '',
    birth_date: initial?.birth_date ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
  })
  const [docs, setDocs] = useState<ParticipantDoc[]>(initial?.documents ?? [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const addDoc = () => setDocs(prev => [...prev, { type: 'passport', label: 'Pasaporte', url: '' }])

  const updateDocType = (i: number, type: ParticipantDoc['type']) => {
    const label = DOC_TYPES.find(t => t.value === type)?.label ?? 'Documento'
    setDocs(prev => prev.map((d, idx) => idx === i ? { ...d, type, label } : d))
  }

  const updateDocNote = (i: number, note: string) => {
    setDocs(prev => prev.map((d, idx) => idx === i ? { ...d, note } : d))
  }

  const updateDocUrl = (i: number, url: string) => {
    setDocs(prev => prev.map((d, idx) => idx === i ? { ...d, url } : d))
  }

  const removeDoc = (i: number) => setDocs(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({ ...form, documents: docs.filter(d => d.url) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Nombre completo *" id="name" value={form.name} onChange={set('name')} placeholder="Ej: María Sánchez" required autoFocus />

      <div className="grid grid-cols-2 gap-3">
        <Select label="Documento" id="document_type" value={form.document_type} onChange={set('document_type')} options={[
          { value: 'passport', label: 'Pasaporte' },
          { value: 'id_card', label: 'Cédula / DNI' },
        ]} />
        <Input label="Número" id="document_number" value={form.document_number} onChange={set('document_number')} placeholder="Ej: PB123456" />
      </div>

      <Input label="Fecha de nacimiento" id="birth_date" type="date" value={form.birth_date} onChange={set('birth_date')} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Email" id="email" type="email" value={form.email} onChange={set('email')} placeholder="email@ejemplo.com" />
        <Input label="Teléfono" id="phone" value={form.phone} onChange={set('phone')} placeholder="+591 7..." />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-stone-700">Documentos</p>
          <button
            type="button"
            onClick={addDoc}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
        </div>
        {docs.length === 0 && (
          <p className="text-xs text-stone-400 italic">Pasaporte, permiso del menor, tarjeta...</p>
        )}
        {docs.map((doc, i) => (
          <DocRow
            key={i}
            doc={doc}
            onTypeChange={type => updateDocType(i, type)}
            onNoteChange={note => updateDocNote(i, note)}
            onUrlChange={url => updateDocUrl(i, url)}
            onRemove={() => removeDoc(i)}
          />
        ))}
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-stone-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : initial?.id ? 'Guardar cambios' : 'Agregar miembro'}</Button>
      </div>
    </form>
  )
}
