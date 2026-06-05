'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { FileUpload } from '@/components/ui/FileUpload'
import { Flight } from '@/types'

interface FlightFormProps {
  initial?: Partial<Flight>
  onSubmit: (data: Partial<Flight>) => Promise<void>
  onCancel: () => void
}

export function FlightForm({ initial, onSubmit, onCancel }: FlightFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    airline: initial?.airline ?? '',
    flight_number: initial?.flight_number ?? '',
    origin: initial?.origin ?? '',
    origin_code: initial?.origin_code ?? '',
    destination: initial?.destination ?? '',
    destination_code: initial?.destination_code ?? '',
    departure_datetime: initial?.departure_datetime?.slice(0, 16) ?? '',
    arrival_datetime: initial?.arrival_datetime?.slice(0, 16) ?? '',
    confirmation_number: initial?.confirmation_number ?? '',
    pnr: initial?.pnr ?? '',
    class: initial?.class ?? 'economy',
    price: initial?.price?.toString() ?? '',
    currency: initial?.currency ?? 'USD',
    status: initial?.status ?? 'confirmed',
    flight_direction: initial?.flight_direction ?? 'outbound',
    notes: initial?.notes ?? '',
  })
  const [fileUrls, setFileUrls] = useState<string[]>(initial?.file_urls ?? [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({ ...form, price: form.price ? parseFloat(form.price) : undefined, file_urls: fileUrls })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Aerolínea *" id="airline" value={form.airline} onChange={set('airline')} placeholder="Ej: LATAM" required />
        <Input label="Número de vuelo *" id="flight_number" value={form.flight_number} onChange={set('flight_number')} placeholder="Ej: LA4500" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Origen *" id="origin" value={form.origin} onChange={set('origin')} placeholder="Ej: La Paz" required />
        <Input label="Código IATA" id="origin_code" value={form.origin_code} onChange={set('origin_code')} placeholder="Ej: LPB" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Destino *" id="destination" value={form.destination} onChange={set('destination')} placeholder="Ej: Lima" required />
        <Input label="Código IATA" id="destination_code" value={form.destination_code} onChange={set('destination_code')} placeholder="Ej: LIM" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Salida *" id="departure_datetime" type="datetime-local" value={form.departure_datetime} onChange={set('departure_datetime')} required />
        <Input label="Llegada *" id="arrival_datetime" type="datetime-local" value={form.arrival_datetime} onChange={set('arrival_datetime')} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Nro. confirmación" id="confirmation_number" value={form.confirmation_number} onChange={set('confirmation_number')} placeholder="Ej: ABC123" />
        <Input label="PNR" id="pnr" value={form.pnr} onChange={set('pnr')} placeholder="Ej: XY789" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Select label="Clase" id="class" value={form.class} onChange={set('class')} options={[
          { value: 'economy', label: 'Económica' },
          { value: 'business', label: 'Ejecutiva' },
          { value: 'first', label: 'Primera' },
        ]} />
        <Select label="Tipo" id="flight_direction" value={form.flight_direction} onChange={set('flight_direction')} options={[
          { value: 'outbound', label: 'Ida' },
          { value: 'return', label: 'Vuelta' },
          { value: 'connection', label: 'Escala' },
        ]} />
        <Select label="Estado" id="status" value={form.status} onChange={set('status')} options={[
          { value: 'pending', label: 'Pendiente' },
          { value: 'confirmed', label: 'Confirmado' },
          { value: 'checked_in', label: 'Check-in' },
          { value: 'boarded', label: 'Embarcado' },
          { value: 'completed', label: 'Completado' },
          { value: 'cancelled', label: 'Cancelado' },
        ]} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Precio" id="price" type="number" value={form.price} onChange={set('price')} placeholder="0.00" />
        <Select label="Moneda" id="currency" value={form.currency} onChange={set('currency')} options={[
          { value: 'USD', label: 'USD' }, { value: 'BOB', label: 'BOB' }, { value: 'EUR', label: 'EUR' },
          { value: 'ARS', label: 'ARS' }, { value: 'BRL', label: 'BRL' }, { value: 'CLP', label: 'CLP' },
        ]} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-stone-700">Notas</label>
        <textarea id="notes" value={form.notes} onChange={set('notes')} rows={2} placeholder="Ej: asientos 14A y 14B, equipaje incluido..." className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none placeholder:text-stone-400" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-stone-700">Archivos adjuntos</label>
        <FileUpload folder="flights" existingUrls={fileUrls} onUpload={setFileUrls} />
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-stone-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : initial?.id ? 'Guardar cambios' : 'Agregar vuelo'}</Button>
      </div>
    </form>
  )
}
