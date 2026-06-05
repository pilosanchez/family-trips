'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Plane, Clock, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FlightForm } from '@/components/flights/FlightForm'
import { createClient } from '@/lib/supabase/client'
import { Flight } from '@/types'
import { formatDate, formatTime, getFlightStatusLabel, formatCurrency } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  checked_in: 'bg-violet-100 text-violet-700',
  boarded: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-stone-100 text-stone-600',
  cancelled: 'bg-red-100 text-red-700',
}

const DIRECTION_LABELS: Record<string, string> = {
  outbound: 'Ida', return: 'Vuelta', connection: 'Escala',
}

export default function FlightsPage() {
  const { id } = useParams()
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Flight | null>(null)
  const supabase = createClient()

  const fetch = async () => {
    const { data } = await supabase.from('flights').select('*').eq('trip_id', id).order('departure_datetime')
    setFlights(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [id])

  const handleSave = async (data: Partial<Flight>) => {
    if (editing) {
      await supabase.from('flights').update(data).eq('id', editing.id)
    } else {
      await supabase.from('flights').insert({ ...data, trip_id: id })
    }
    await fetch()
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = async (flightId: string) => {
    if (!confirm('¿Eliminar este vuelo?')) return
    await supabase.from('flights').delete().eq('id', flightId)
    setFlights((prev) => prev.filter((f) => f.id !== flightId))
  }

  const openEdit = (flight: Flight) => { setEditing(flight); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  const outbound = flights.filter((f) => f.flight_direction === 'outbound')
  const returning = flights.filter((f) => f.flight_direction === 'return')
  const connections = flights.filter((f) => f.flight_direction === 'connection')

  const totalCost = flights.reduce((sum, f) => sum + (f.price ?? 0), 0)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Vuelos</h2>
          <p className="text-sm text-stone-500">{flights.length} vuelo{flights.length !== 1 ? 's' : ''}{totalCost > 0 ? ` · ${formatCurrency(totalCost)}` : ''}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Agregar vuelo
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="card h-24 animate-pulse bg-stone-100" />)}</div>
      ) : flights.length === 0 ? (
        <EmptyState icon={Plane} title="Sin vuelos registrados" description="Agrega los vuelos del viaje para verlos en el itinerario." action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" />Agregar primer vuelo</Button>} />
      ) : (
        <div className="space-y-6">
          {[{ label: 'Vuelos de Ida', items: outbound }, { label: 'Vuelos de Vuelta', items: returning }, { label: 'Escalas / Conexiones', items: connections }]
            .filter((g) => g.items.length > 0)
            .map((group) => (
              <div key={group.label}>
                <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">{group.label}</h3>
                <div className="space-y-2">
                  {group.items.map((flight) => (
                    <div key={flight.id} className="card p-4 flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                        <Plane className="w-5 h-5 text-blue-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-stone-900">{flight.airline} {flight.flight_number}</span>
                          <Badge className={STATUS_COLORS[flight.status] ?? 'bg-stone-100 text-stone-600'}>
                            {getFlightStatusLabel(flight.status)}
                          </Badge>
                          <Badge className="bg-stone-100 text-stone-600">{flight.class === 'economy' ? 'Económica' : flight.class === 'business' ? 'Ejecutiva' : 'Primera'}</Badge>
                        </div>

                        <div className="flex items-center gap-2 text-stone-700">
                          <span className="font-medium">{flight.origin_code || flight.origin}</span>
                          <span className="text-stone-300">—</span>
                          <span className="font-medium">{flight.destination_code || flight.destination}</span>
                        </div>
                        <p className="text-sm text-stone-500">{flight.origin} → {flight.destination}</p>

                        <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(flight.departure_datetime, 'dd MMM')} {formatTime(flight.departure_datetime)} → {formatTime(flight.arrival_datetime)}</span>
                          {flight.confirmation_number && <span className="font-mono bg-stone-50 px-1.5 py-0.5 rounded">{flight.confirmation_number}</span>}
                          {flight.price && <span className="font-medium text-stone-700">{formatCurrency(flight.price, flight.currency)}</span>}
                        </div>

                        {flight.notes && <p className="text-xs text-stone-400 mt-1 italic">{flight.notes}</p>}
                      </div>

                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEdit(flight)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(flight.id)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      <Modal open={showForm} onClose={closeForm} title={editing ? 'Editar vuelo' : 'Nuevo vuelo'} size="lg">
        <FlightForm initial={editing ?? undefined} onSubmit={handleSave} onCancel={closeForm} />
      </Modal>
    </>
  )
}
