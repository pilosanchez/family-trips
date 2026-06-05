'use client'

import { useState, useEffect } from 'react'
import { Plus, Plane } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { TripCard } from '@/components/trips/TripCard'
import { TripForm } from '@/components/trips/TripForm'
import { createClient } from '@/lib/supabase/client'
import { Trip } from '@/types'

const STATUS_TABS = [
  { label: 'Todos', value: '' },
  { label: 'Planificando', value: 'planning' },
  { label: 'Próximos', value: 'upcoming' },
  { label: 'En Curso', value: 'ongoing' },
  { label: 'Finalizados', value: 'completed' },
]

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Trip | null>(null)
  const [activeTab, setActiveTab] = useState('')
  const supabase = createClient()

  const fetchTrips = async () => {
    const { data } = await supabase
      .from('trips')
      .select('*, trip_participants(participant:participants(*))')
      .order('start_date', { ascending: false })
    setTrips(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchTrips() }, [])

  const handleCreate = async (data: Partial<Trip>) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('trips').insert({ ...data, user_id: user?.id })
    await fetchTrips()
    setShowForm(false)
  }

  const handleUpdate = async (data: Partial<Trip>) => {
    if (!editing) return
    await supabase.from('trips').update(data).eq('id', editing.id)
    await fetchTrips()
    setEditing(null)
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este viaje? Esta acción no se puede deshacer.')) return
    await supabase.from('trips').delete().eq('id', id)
    setTrips((prev) => prev.filter((t) => t.id !== id))
  }

  const openEdit = (trip: Trip) => { setEditing(trip); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  const filtered = activeTab ? trips.filter((t) => t.status === activeTab) : trips

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Mis Viajes</h1>
          <p className="text-sm text-stone-500 mt-0.5">{trips.length} viaje{trips.length !== 1 ? 's' : ''} registrado{trips.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Nuevo viaje
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 bg-stone-100 p-1 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === tab.value
                ? 'bg-white text-stone-900 font-medium shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-52 animate-pulse bg-stone-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="No hay viajes aquí"
          description="Crea tu primer viaje para empezar a organizar toda la información."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />
              Crear primer viaje
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((trip) => (
            <TripCard key={trip.id} trip={trip} onDelete={handleDelete} onEdit={openEdit} />
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={closeForm} title={editing ? 'Editar viaje' : 'Nuevo viaje'}>
        <TripForm
          initial={editing ?? undefined}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={closeForm}
        />
      </Modal>
    </>
  )
}
