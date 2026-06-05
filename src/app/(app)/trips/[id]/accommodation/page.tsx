'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Building2, Calendar, Phone, Globe, Pencil, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { AccommodationForm } from '@/components/accommodations/AccommodationForm'
import { createClient } from '@/lib/supabase/client'
import { Accommodation } from '@/types'
import { formatDate, formatCurrency, tripDuration } from '@/lib/utils'

export default function AccommodationPage() {
  const { id } = useParams()
  const [items, setItems] = useState<Accommodation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Accommodation | null>(null)
  const supabase = createClient()

  const fetchItems = async () => {
    const { data } = await supabase.from('accommodations').select('*').eq('trip_id', id).order('checkin_date')
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [id])

  const handleSave = async (data: Partial<Accommodation>) => {
    if (editing) {
      await supabase.from('accommodations').update(data).eq('id', editing.id)
    } else {
      await supabase.from('accommodations').insert({ ...data, trip_id: id })
    }
    await fetchItems()
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('¿Eliminar este alojamiento?')) return
    await supabase.from('accommodations').delete().eq('id', itemId)
    setItems((prev) => prev.filter((a) => a.id !== itemId))
  }

  const openEdit = (item: Accommodation) => { setEditing(item); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  const totalCost = items.reduce((sum, a) => sum + (a.total_price ?? 0), 0)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Alojamiento</h2>
          <p className="text-sm text-stone-500">{items.length} alojamiento{items.length !== 1 ? 's' : ''}{totalCost > 0 ? ` · ${formatCurrency(totalCost)}` : ''}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Agregar alojamiento
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="card h-28 animate-pulse bg-stone-100" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Building2} title="Sin alojamientos registrados" description="Agrega los hoteles y hospedajes del viaje." action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" />Agregar alojamiento</Button>} />
      ) : (
        <div className="space-y-3">
          {items.map((acc) => {
            const nights = tripDuration(acc.checkin_date, acc.checkout_date)
            return (
              <div key={acc.id} className="card p-4 flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-amber-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h3 className="font-semibold text-stone-900">{acc.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        {Array.from({ length: acc.category }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(acc)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(acc.id)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {acc.address && <p className="text-sm text-stone-500">{acc.address}{acc.city ? `, ${acc.city}` : ''}{acc.country ? `, ${acc.country}` : ''}</p>}

                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(acc.checkin_date)} {acc.checkin_time} → {formatDate(acc.checkout_date)} {acc.checkout_time}
                      <span className="text-stone-400">({nights} noche{nights !== 1 ? 's' : ''})</span>
                    </span>
                    {acc.reservation_number && <span className="font-mono bg-stone-50 px-1.5 py-0.5 rounded">{acc.reservation_number}</span>}
                    {acc.total_price && <span className="font-medium text-stone-700">{formatCurrency(acc.total_price, acc.currency)}</span>}
                    {acc.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{acc.contact_phone}</span>}
                    {acc.website && (
                      <a href={acc.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-stone-700 transition-colors">
                        <Globe className="w-3 h-3" />Sitio web
                      </a>
                    )}
                  </div>

                  {acc.notes && <p className="text-xs text-stone-400 mt-1.5 italic">{acc.notes}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showForm} onClose={closeForm} title={editing ? 'Editar alojamiento' : 'Nuevo alojamiento'} size="lg">
        <AccommodationForm initial={editing ?? undefined} onSubmit={handleSave} onCancel={closeForm} />
      </Modal>
    </>
  )
}
