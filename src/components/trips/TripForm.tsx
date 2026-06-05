'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { FileUpload } from '@/components/ui/FileUpload'
import { Trip } from '@/types'

interface TripFormProps {
  initial?: Partial<Trip>
  onSubmit: (data: Partial<Trip>) => Promise<void>
  onCancel: () => void
}

export function TripForm({ initial, onSubmit, onCancel }: TripFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    destination: initial?.destination ?? '',
    start_date: initial?.start_date ?? '',
    end_date: initial?.end_date ?? '',
    status: initial?.status ?? 'planning',
    trip_type: initial?.trip_type ?? 'family',
    total_budget: initial?.total_budget?.toString() ?? '',
    base_currency: initial?.base_currency ?? 'USD',
    description: initial?.description ?? '',
  })
  const [coverUrl, setCoverUrl] = useState<string>(initial?.cover_image ?? '')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        total_budget: form.total_budget ? parseFloat(form.total_budget) : undefined,
        cover_image: coverUrl || undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Nombre del viaje *" id="name" value={form.name} onChange={set('name')} placeholder="Ej: Vacaciones en Europa 2025" required />

      <Input label="Destino principal *" id="destination" value={form.destination} onChange={set('destination')} placeholder="Ej: París, Francia" required />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Fecha de salida *" id="start_date" type="date" value={form.start_date} onChange={set('start_date')} required />
        <Input label="Fecha de regreso *" id="end_date" type="date" value={form.end_date} onChange={set('end_date')} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Tipo"
          id="trip_type"
          value={form.trip_type}
          onChange={set('trip_type')}
          options={[
            { value: 'family', label: 'Familiar' },
            { value: 'individual', label: 'Individual' },
          ]}
        />
        <Select
          label="Estado"
          id="status"
          value={form.status}
          onChange={set('status')}
          options={[
            { value: 'planning', label: 'Planificando' },
            { value: 'upcoming', label: 'Próximo' },
            { value: 'ongoing', label: 'En Curso' },
            { value: 'completed', label: 'Finalizado' },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Presupuesto total" id="total_budget" type="number" value={form.total_budget} onChange={set('total_budget')} placeholder="0.00" />
        <Select
          label="Moneda"
          id="base_currency"
          value={form.base_currency}
          onChange={set('base_currency')}
          options={[
            { value: 'USD', label: 'USD — Dólar' },
            { value: 'BOB', label: 'BOB — Boliviano' },
            { value: 'EUR', label: 'EUR — Euro' },
            { value: 'ARS', label: 'ARS — Peso AR' },
            { value: 'BRL', label: 'BRL — Real BR' },
            { value: 'CLP', label: 'CLP — Peso CL' },
          ]}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-stone-700">Notas</label>
        <textarea
          id="description"
          value={form.description}
          onChange={set('description')}
          rows={3}
          placeholder="Notas sobre el viaje..."
          className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent placeholder:text-stone-400 resize-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-stone-700">Foto de portada</label>
        {coverUrl && (
          <img src={coverUrl} alt="Portada" className="w-full h-32 object-cover rounded-lg mb-1" />
        )}
        <FileUpload
          folder="covers"
          existingUrls={coverUrl ? [coverUrl] : []}
          onUpload={(urls) => setCoverUrl(urls[0] ?? '')}
          maxFiles={1}
          accept=".jpg,.jpeg,.png,.webp"
        />
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-stone-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : initial?.id ? 'Guardar cambios' : 'Crear viaje'}
        </Button>
      </div>
    </form>
  )
}
