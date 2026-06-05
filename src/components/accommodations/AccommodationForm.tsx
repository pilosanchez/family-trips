'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { FileUpload } from '@/components/ui/FileUpload'
import { Accommodation } from '@/types'

interface AccommodationFormProps {
  initial?: Partial<Accommodation>
  onSubmit: (data: Partial<Accommodation>) => Promise<void>
  onCancel: () => void
}

const STARS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: '★'.repeat(n) + ' — ' + ['Básico', 'Económico', 'Estándar', 'Superior', 'Lujo'][n - 1] }))

export function AccommodationForm({ initial, onSubmit, onCancel }: AccommodationFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    address: initial?.address ?? '',
    city: initial?.city ?? '',
    country: initial?.country ?? '',
    category: initial?.category?.toString() ?? '3',
    checkin_date: initial?.checkin_date ?? '',
    checkin_time: initial?.checkin_time ?? '14:00',
    checkout_date: initial?.checkout_date ?? '',
    checkout_time: initial?.checkout_time ?? '11:00',
    reservation_number: initial?.reservation_number ?? '',
    price_per_night: initial?.price_per_night?.toString() ?? '',
    total_price: initial?.total_price?.toString() ?? '',
    currency: initial?.currency ?? 'USD',
    contact_phone: initial?.contact_phone ?? '',
    contact_email: initial?.contact_email ?? '',
    website: initial?.website ?? '',
    notes: initial?.notes ?? '',
  })
  const [fileUrls, setFileUrls] = useState<string[]>(initial?.file_urls ?? [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        category: parseInt(form.category),
        price_per_night: form.price_per_night ? parseFloat(form.price_per_night) : undefined,
        total_price: form.total_price ? parseFloat(form.total_price) : undefined,
        file_urls: fileUrls,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input label="Nombre del alojamiento *" id="name" value={form.name} onChange={set('name')} placeholder="Ej: Hotel Marriott" required />
        </div>
        <Select label="Categoría" id="category" value={form.category} onChange={set('category')} options={STARS} />
      </div>

      <Input label="Dirección" id="address" value={form.address} onChange={set('address')} placeholder="Av. Principal 123" />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Ciudad" id="city" value={form.city} onChange={set('city')} placeholder="Ej: Lima" />
        <Input label="País" id="country" value={form.country} onChange={set('country')} placeholder="Ej: Perú" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Check-in *" id="checkin_date" type="date" value={form.checkin_date} onChange={set('checkin_date')} required />
        <Input label="Hora check-in" id="checkin_time" type="time" value={form.checkin_time} onChange={set('checkin_time')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Check-out *" id="checkout_date" type="date" value={form.checkout_date} onChange={set('checkout_date')} required />
        <Input label="Hora check-out" id="checkout_time" type="time" value={form.checkout_time} onChange={set('checkout_time')} />
      </div>

      <Input label="Nro. reserva" id="reservation_number" value={form.reservation_number} onChange={set('reservation_number')} placeholder="Ej: BKG-123456" />

      <div className="grid grid-cols-3 gap-3">
        <Input label="Precio por noche" id="price_per_night" type="number" value={form.price_per_night} onChange={set('price_per_night')} placeholder="0.00" />
        <Input label="Precio total" id="total_price" type="number" value={form.total_price} onChange={set('total_price')} placeholder="0.00" />
        <Select label="Moneda" id="currency" value={form.currency} onChange={set('currency')} options={[
          { value: 'USD', label: 'USD' }, { value: 'BOB', label: 'BOB' }, { value: 'EUR', label: 'EUR' },
          { value: 'ARS', label: 'ARS' }, { value: 'BRL', label: 'BRL' }, { value: 'CLP', label: 'CLP' },
        ]} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Teléfono" id="contact_phone" value={form.contact_phone} onChange={set('contact_phone')} placeholder="+51 1 234-5678" />
        <Input label="Email" id="contact_email" type="email" value={form.contact_email} onChange={set('contact_email')} placeholder="hotel@ejemplo.com" />
      </div>

      <Input label="Sitio web" id="website" value={form.website} onChange={set('website')} placeholder="https://..." />

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-stone-700">Notas</label>
        <textarea id="notes" value={form.notes} onChange={set('notes')} rows={2} placeholder="Ej: pedir habitaciones contiguas, desayuno incluido..." className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none placeholder:text-stone-400" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-stone-700">Archivos adjuntos</label>
        <FileUpload folder="accommodations" existingUrls={fileUrls} onUpload={setFileUrls} />
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-stone-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : initial?.id ? 'Guardar cambios' : 'Agregar alojamiento'}</Button>
      </div>
    </form>
  )
}
