'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, MapPin, Clock, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ActivityForm } from '@/components/activities/ActivityForm'
import { createClient } from '@/lib/supabase/client'
import { Activity } from '@/types'
import { formatDate, getActivityTypeLabel, getActivityStatusColor, getActivityStatusLabel, formatCurrency } from '@/lib/utils'

const ACTIVITY_ICONS: Record<string, string> = {
  tour: '🗺️', excursion: '🏔️', restaurant: '🍽️', museum: '🏛️',
  park: '🌿', show: '🎭', sport: '⚽', shopping: '🛍️', other: '✨',
}

const STATUS_TABS = [
  { label: 'Todas', value: '' },
  { label: 'Por Reservar', value: 'to_book' },
  { label: 'Reservadas', value: 'reserved' },
  { label: 'Completadas', value: 'completed' },
]

export default function ActivitiesPage() {
  const { id } = useParams()
  const [items, setItems] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [activeTab, setActiveTab] = useState('')
  const supabase = createClient()

  const fetchItems = async () => {
    const { data } = await supabase.from('activities').select('*').eq('trip_id', id).order('activity_date').order('start_time')
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [id])

  const handleSave = async (data: Partial<Activity>) => {
    if (editing) {
      await supabase.from('activities').update(data).eq('id', editing.id)
    } else {
      await supabase.from('activities').insert({ ...data, trip_id: id })
    }
    await fetchItems()
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('¿Eliminar esta actividad?')) return
    await supabase.from('activities').delete().eq('id', itemId)
    setItems((prev) => prev.filter((a) => a.id !== itemId))
  }

  const toggleStatus = async (activity: Activity) => {
    const next = activity.status === 'reserved' ? 'completed' : activity.status === 'to_book' ? 'reserved' : activity.status
    await supabase.from('activities').update({ status: next }).eq('id', activity.id)
    setItems((prev) => prev.map((a) => a.id === activity.id ? { ...a, status: next } : a))
  }

  const openEdit = (item: Activity) => { setEditing(item); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  const filtered = activeTab ? items.filter((a) => a.status === activeTab) : items
  const totalCost = items.reduce((sum, a) => sum + (a.price ?? 0), 0)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Actividades</h2>
          <p className="text-sm text-stone-500">{items.length} actividad{items.length !== 1 ? 'es' : ''}{totalCost > 0 ? ` · ${formatCurrency(totalCost)}` : ''}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Agregar actividad
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 mb-5 bg-stone-100 p-1 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === tab.value ? 'bg-white text-stone-900 font-medium shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="card h-20 animate-pulse bg-stone-100" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={MapPin} title="Sin actividades" description="Agrega tours, restaurantes, museos y todo lo que quieras hacer en el viaje." action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" />Agregar actividad</Button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map((act) => (
            <div key={act.id} className="card p-4 flex items-start gap-3">
              <button
                onClick={() => toggleStatus(act)}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg transition-all hover:scale-105"
                style={{ background: act.status === 'completed' ? '#f0fdf4' : '#fafaf9' }}
                title="Cambiar estado"
              >
                {act.status === 'completed' ? '✅' : (ACTIVITY_ICONS[act.activity_type] ?? '✨')}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`font-medium text-stone-900 ${act.status === 'completed' ? 'line-through text-stone-400' : ''}`}>
                    {act.name}
                  </span>
                  <Badge className={getActivityStatusColor(act.status)}>{getActivityStatusLabel(act.status)}</Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-stone-500">
                  <span>{getActivityTypeLabel(act.activity_type)}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(act.activity_date)}{act.start_time ? ` ${act.start_time}` : ''}{act.duration_minutes ? ` (${Math.floor(act.duration_minutes / 60)}h${act.duration_minutes % 60 > 0 ? `${act.duration_minutes % 60}m` : ''})` : ''}</span>
                  {act.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{act.location}</span>}
                  {act.price && <span className="font-medium text-stone-700">{formatCurrency(act.price, act.currency)}</span>}
                  {act.reservation_number && <span className="font-mono bg-stone-50 px-1.5 py-0.5 rounded">{act.reservation_number}</span>}
                </div>

                {act.notes && <p className="text-xs text-stone-400 mt-1 italic">{act.notes}</p>}
              </div>

              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(act)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(act.id)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={closeForm} title={editing ? 'Editar actividad' : 'Nueva actividad'}>
        <ActivityForm initial={editing ?? undefined} onSubmit={handleSave} onCancel={closeForm} />
      </Modal>
    </>
  )
}
