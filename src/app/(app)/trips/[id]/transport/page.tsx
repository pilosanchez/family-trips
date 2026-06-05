'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Car, Clock, MapPin, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { TransportForm } from '@/components/transports/TransportForm'
import { createClient } from '@/lib/supabase/client'
import { Transport } from '@/types'
import { formatDate, formatTime, getTransportTypeLabel, formatCurrency } from '@/lib/utils'

const TRANSPORT_ICONS: Record<string, string> = {
  transfer: '🚐', car_rental: '🚗', taxi: '🚕', bus: '🚌', train: '🚆', ferry: '⛴️', metro: '🚇', other: '🚦',
}

export default function TransportPage() {
  const { id } = useParams()
  const [items, setItems] = useState<Transport[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Transport | null>(null)
  const supabase = createClient()

  const fetchItems = async () => {
    const { data } = await supabase.from('transports').select('*').eq('trip_id', id).order('departure_datetime')
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [id])

  const handleSave = async (data: Partial<Transport>) => {
    if (editing) {
      await supabase.from('transports').update(data).eq('id', editing.id)
    } else {
      await supabase.from('transports').insert({ ...data, trip_id: id })
    }
    await fetchItems()
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('¿Eliminar este transporte?')) return
    await supabase.from('transports').delete().eq('id', itemId)
    setItems((prev) => prev.filter((t) => t.id !== itemId))
  }

  const openEdit = (item: Transport) => { setEditing(item); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  const totalCost = items.reduce((sum, t) => sum + (t.price ?? 0), 0)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Transporte Local</h2>
          <p className="text-sm text-stone-500">{items.length} traslado{items.length !== 1 ? 's' : ''}{totalCost > 0 ? ` · ${formatCurrency(totalCost)}` : ''}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Agregar transporte
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="card h-24 animate-pulse bg-stone-100" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Car} title="Sin transportes registrados" description="Agrega transfers, autos rentados, buses o cualquier traslado del viaje." action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" />Agregar transporte</Button>} />
      ) : (
        <div className="space-y-3">
          {items.map((tr) => (
            <div key={tr.id} className="card p-4 flex items-start gap-4">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0 text-lg">
                {TRANSPORT_ICONS[tr.transport_type] ?? '🚦'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-stone-900">{getTransportTypeLabel(tr.transport_type)}</span>
                  {tr.provider && <span className="text-sm text-stone-500">— {tr.provider}</span>}
                </div>

                <div className="flex items-center gap-2 text-stone-700 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{tr.from_location}</span>
                  <span className="text-stone-300">→</span>
                  <span>{tr.to_location}</span>
                </div>

                <div className="flex flex-wrap gap-4 mt-2 text-xs text-stone-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(tr.departure_datetime, 'dd MMM')} {formatTime(tr.departure_datetime)}{tr.arrival_datetime ? ` → ${formatTime(tr.arrival_datetime)}` : ''}</span>
                  {tr.reservation_number && <span className="font-mono bg-stone-50 px-1.5 py-0.5 rounded">{tr.reservation_number}</span>}
                  {tr.price && <span className="font-medium text-stone-700">{formatCurrency(tr.price, tr.currency)}</span>}
                  {tr.maps_url && (
                    <a href={tr.maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-stone-700 transition-colors">
                      <ExternalLink className="w-3 h-3" />Maps
                    </a>
                  )}
                </div>

                {tr.notes && <p className="text-xs text-stone-400 mt-1.5 italic">{tr.notes}</p>}
              </div>

              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(tr)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(tr.id)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={closeForm} title={editing ? 'Editar transporte' : 'Nuevo transporte'} size="lg">
        <TransportForm initial={editing ?? undefined} onSubmit={handleSave} onCancel={closeForm} />
      </Modal>
    </>
  )
}
