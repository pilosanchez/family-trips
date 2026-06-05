'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Activity } from '@/types'

interface ActivityFormProps {
  initial?: Partial<Activity>
  onSubmit: (data: Partial<Activity>) => Promise<void>
  onCancel: () => void
}

const ACTIVITY_TYPES = [
  { value: 'tour', label: 'Tour guiado' },
  { value: 'excursion', label: 'Excursión' },
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'museum', label: 'Museo / Galería' },
  { value: 'park', label: 'Parque / Naturaleza' },
  { value: 'show', label: 'Espectáculo / Show' },
  { value: 'sport', label: 'Deporte / Aventura' },
  { value: 'shopping', label: 'Compras' },
  { value: 'other', label: 'Otro' },
]

export function ActivityForm({ initial, onSubmit, onCancel }: ActivityFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    activity_type: initial?.activity_type ?? 'tour',
    activity_date: initial?.activity_date ?? '',
    start_time: initial?.start_time ?? '',
    duration_minutes: initial?.duration_minutes?.toString() ?? '',
    location: initial?.location ?? '',
    price: initial?.price?.toString() ?? '',
    currency: initial?.currency ?? 'USD',
    status: initial?.status ?? 'to_book',
    reservation_number: initial?.reservation_number ?? '',
    notes: initial?.notes ?? '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        price: form.price ? parseFloat(form.price) : undefined,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Nombre de la actividad *" id="name" value={form.name} onChange={set('name')} placeholder="Ej: Tour Machu Picchu, Cena en La Mar..." required />

      <div className="grid grid-cols-2 gap-3">
        <Select label="Tipo" id="activity_type" value={form.activity_type} onChange={set('activity_type')} options={ACTIVITY_TYPES} />
        <Select label="Estado" id="status" value={form.status} onChange={set('status')} options={[
          { value: 'to_book', label: 'Por Reservar' },
          { value: 'reserved', label: 'Reservado' },
          { value: 'completed', label: 'Completado' },
          { value: 'cancelled', label: 'Cancelado' },
        ]} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input label="Fecha *" id="activity_date" type="date" value={form.activity_date} onChange={set('activity_date')} required />
        </div>
        <Input label="Hora inicio" id="start_time" type="time" value={form.start_time} onChange={set('start_time')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Duración (minutos)" id="duration_minutes" type="number" value={form.duration_minutes} onChange={set('duration_minutes')} placeholder="Ej: 180" />
        <Input label="Ubicación" id="location" value={form.location} onChange={set('location')} placeholder="Ej: Cusco, Perú" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input label="Precio" id="price" type="number" value={form.price} onChange={set('price')} placeholder="0.00" />
        </div>
        <Select label="Moneda" id="currency" value={form.currency} onChange={set('currency')} options={[
          { value: 'USD', label: 'USD' }, { value: 'BOB', label: 'BOB' }, { value: 'EUR', label: 'EUR' },
          { value: 'ARS', label: 'ARS' }, { value: 'BRL', label: 'BRL' }, { value: 'CLP', label: 'CLP' },
        ]} />
      </div>

      <Input label="Nro. reserva" id="reservation_number" value={form.reservation_number} onChange={set('reservation_number')} placeholder="Ej: ACT-789" />

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-stone-700">Notas</label>
        <textarea id="notes" value={form.notes} onChange={set('notes')} rows={2} placeholder="Punto de encuentro, qué llevar, restricciones..." className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none placeholder:text-stone-400" />
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-stone-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : initial?.id ? 'Guardar cambios' : 'Agregar actividad'}</Button>
      </div>
    </form>
  )
}
