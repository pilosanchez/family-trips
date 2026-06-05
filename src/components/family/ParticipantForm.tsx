'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Participant } from '@/types'

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

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try { await onSubmit(form) } finally { setLoading(false) }
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

      <div className="flex gap-2 justify-end pt-2 border-t border-stone-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : initial?.id ? 'Guardar cambios' : 'Agregar miembro'}</Button>
      </div>
    </form>
  )
}
