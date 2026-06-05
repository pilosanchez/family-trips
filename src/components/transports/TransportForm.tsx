'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Transport } from '@/types'

interface TransportFormProps {
  initial?: Partial<Transport>
  onSubmit: (data: Partial<Transport>) => Promise<void>
  onCancel: () => void
}

const TRANSPORT_TYPES = [
  { value: 'transfer', label: 'Transfer aeropuerto' },
  { value: 'car_rental', label: 'Auto rentado' },
  { value: 'taxi', label: 'Taxi / Remís' },
  { value: 'bus', label: 'Bus / Colectivo' },
  { value: 'train', label: 'Tren' },
  { value: 'ferry', label: 'Ferry / Barco' },
  { value: 'metro', label: 'Metro / Subte' },
  { value: 'other', label: 'Otro' },
]

export function TransportForm({ initial, onSubmit, onCancel }: TransportFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    transport_type: initial?.transport_type ?? 'transfer',
    provider: initial?.provider ?? '',
    reservation_number: initial?.reservation_number ?? '',
    from_location: initial?.from_location ?? '',
    to_location: initial?.to_location ?? '',
    departure_datetime: initial?.departure_datetime?.slice(0, 16) ?? '',
    arrival_datetime: initial?.arrival_datetime?.slice(0, 16) ?? '',
    price: initial?.price?.toString() ?? '',
    currency: initial?.currency ?? 'USD',
    maps_url: initial?.maps_url ?? '',
    notes: initial?.notes ?? '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({ ...form, price: form.price ? parseFloat(form.price) : undefined })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Select label="Tipo de transporte *" id="transport_type" value={form.transport_type} onChange={set('transport_type')} options={TRANSPORT_TYPES} />
        <Input label="Proveedor / Empresa" id="provider" value={form.provider} onChange={set('provider')} placeholder="Ej: Hertz, Metro Lima..." />
      </div>

      <Input label="Reserva / Código" id="reservation_number" value={form.reservation_number} onChange={set('reservation_number')} placeholder="Ej: RT-456789" />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Origen *" id="from_location" value={form.from_location} onChange={set('from_location')} placeholder="Ej: Aeropuerto Lima" required />
        <Input label="Destino *" id="to_location" value={form.to_location} onChange={set('to_location')} placeholder="Ej: Hotel Marriott" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Salida *" id="departure_datetime" type="datetime-local" value={form.departure_datetime} onChange={set('departure_datetime')} required />
        <Input label="Llegada estimada" id="arrival_datetime" type="datetime-local" value={form.arrival_datetime} onChange={set('arrival_datetime')} />
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

      <Input label="Link Google Maps" id="maps_url" value={form.maps_url} onChange={set('maps_url')} placeholder="https://maps.google.com/..." />

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-stone-700">Notas</label>
        <textarea id="notes" value={form.notes} onChange={set('notes')} rows={2} placeholder="Instrucciones especiales, placa del auto, número de conductor..." className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none placeholder:text-stone-400" />
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-stone-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : initial?.id ? 'Guardar cambios' : 'Agregar transporte'}</Button>
      </div>
    </form>
  )
}
