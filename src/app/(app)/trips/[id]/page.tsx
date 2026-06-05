'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trip, Flight, Accommodation, Transport, Activity, ItineraryDay } from '@/types'
import { formatDate, formatTime, getTransportTypeLabel, getActivityTypeLabel, getActivityStatusColor, getActivityStatusLabel } from '@/lib/utils'
import { Plane, Building2, Car, MapPin, Clock, Calendar, Download, Share2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AIAssistant } from '@/components/trips/AIAssistant'
import { TripParticipants } from '@/components/trips/TripParticipants'
import { exportItineraryPDF } from '@/lib/exportPDF'
import { parseISO, eachDayOfInterval, format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function TripItineraryPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [days, setDays] = useState<ItineraryDay[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const [tripRes, flightsRes, accRes, transRes, actRes] = await Promise.all([
        supabase.from('trips').select('*').eq('id', id).single(),
        supabase.from('flights').select('*').eq('trip_id', id).order('departure_datetime'),
        supabase.from('accommodations').select('*').eq('trip_id', id).order('checkin_date'),
        supabase.from('transports').select('*').eq('trip_id', id).order('departure_datetime'),
        supabase.from('activities').select('*').eq('trip_id', id).order('activity_date'),
      ])

      const t = tripRes.data as Trip
      setTrip(t)
      setFlights((flightsRes.data ?? []) as Flight[])
      setAccommodations((accRes.data ?? []) as Accommodation[])
      setActivities((actRes.data ?? []) as Activity[])

      if (!t) { setLoading(false); return }

      const allDays = eachDayOfInterval({
        start: parseISO(t.start_date),
        end: parseISO(t.end_date),
      })

      const flights = (flightsRes.data ?? []) as Flight[]
      const accs = (accRes.data ?? []) as Accommodation[]
      const trans = (transRes.data ?? []) as Transport[]
      const acts = (actRes.data ?? []) as Activity[]

      const itinerary: ItineraryDay[] = allDays.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd')
        return {
          date: dateStr,
          flights: flights.filter((f) => f.departure_datetime.startsWith(dateStr)),
          accommodations: accs.filter((a) => a.checkin_date === dateStr || a.checkout_date === dateStr),
          transports: trans.filter((tr) => tr.departure_datetime.startsWith(dateStr)),
          activities: acts.filter((a) => a.activity_date === dateStr),
        }
      })

      setDays(itinerary)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="animate-pulse h-96 bg-stone-100 rounded-xl" />
  if (!trip) return <p className="text-stone-500">Viaje no encontrado.</p>

  const hasContent = (day: ItineraryDay) =>
    day.flights.length + day.accommodations.length + day.transports.length + day.activities.length > 0

  return (
    <div>
      {/* Trip header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-stone-900">{trip.name}</h1>
            <p className="text-stone-500 text-sm mt-0.5">{trip.destination}</p>
            <div className="flex gap-4 mt-4 text-sm text-stone-600">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate(trip.start_date)} — {formatDate(trip.end_date)}</span>
            </div>
            {trip.description && <p className="mt-3 text-sm text-stone-500">{trip.description}</p>}
            <div className="mt-3">
              <TripParticipants tripId={trip.id} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                const res = await fetch('/api/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trip_id: trip.id }) })
                const { url } = await res.json()
                const full = `${window.location.origin}${url}`
                await navigator.clipboard.writeText(full)
                alert(`Link copiado:\n${full}`)
              }}
            >
              <Share2 className="w-3.5 h-3.5" />
              Compartir
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const allFlights = days.flatMap(d => d.flights)
                const allAccs = days.flatMap(d => d.accommodations)
                const allTrans = days.flatMap(d => d.transports)
                const allActs = days.flatMap(d => d.activities)
                exportItineraryPDF(trip, allFlights, allAccs, allTrans, allActs)
              }}
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Day-by-day */}
      <div className="space-y-4">
        {days.map((day, i) => {
          const dayLabel = format(parseISO(day.date), "EEEE d 'de' MMMM", { locale: es })
          if (!hasContent(day)) {
            return (
              <div key={day.date} className="flex items-center gap-3">
                <div className="w-20 shrink-0 text-center">
                  <span className="text-xs text-stone-400 font-medium">Día {i + 1}</span>
                </div>
                <div className="flex-1 border-t border-dashed border-stone-200" />
                <span className="text-xs text-stone-400 capitalize">{dayLabel}</span>
                <div className="flex-1 border-t border-dashed border-stone-200" />
              </div>
            )
          }
          return (
            <div key={day.date} className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 bg-stone-50 flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Día {i + 1}</span>
                <span className="text-sm font-medium text-stone-700 capitalize">{dayLabel}</span>
              </div>
              <div className="divide-y divide-stone-50">
                {day.flights.map((f) => (
                  <div key={f.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Plane className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-stone-900">{f.airline} {f.flight_number}</span>
                        <Badge className="bg-blue-50 text-blue-700">{f.flight_direction === 'outbound' ? 'Ida' : f.flight_direction === 'return' ? 'Vuelta' : 'Escala'}</Badge>
                      </div>
                      <p className="text-sm text-stone-600">{f.origin} → {f.destination}</p>
                      <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{formatTime(f.departure_datetime)} → {formatTime(f.arrival_datetime)}</p>
                    </div>
                    {f.confirmation_number && <span className="text-xs text-stone-400 font-mono">{f.confirmation_number}</span>}
                  </div>
                ))}

                {day.accommodations.map((a) => (
                  <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stone-900">{a.name}</span>
                        <Badge className={a.checkin_date === day.date ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}>
                          {a.checkin_date === day.date ? 'Check-in' : 'Check-out'}
                        </Badge>
                      </div>
                      <p className="text-sm text-stone-600">{a.city}{a.country ? `, ${a.country}` : ''}</p>
                      <p className="text-xs text-stone-400">
                        {a.checkin_date === day.date ? `Entrada: ${a.checkin_time}` : `Salida: ${a.checkout_time}`}
                      </p>
                    </div>
                  </div>
                ))}

                {day.transports.map((tr) => (
                  <div key={tr.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Car className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stone-900">{getTransportTypeLabel(tr.transport_type)}</span>
                        {tr.provider && <span className="text-sm text-stone-500">— {tr.provider}</span>}
                      </div>
                      <p className="text-sm text-stone-600">{tr.from_location} → {tr.to_location}</p>
                      <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{formatTime(tr.departure_datetime)}</p>
                    </div>
                  </div>
                ))}

                {day.activities.map((a) => (
                  <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-stone-900">{a.name}</span>
                        <Badge className={getActivityStatusColor(a.status)}>{getActivityStatusLabel(a.status)}</Badge>
                      </div>
                      <p className="text-sm text-stone-600">{getActivityTypeLabel(a.activity_type)}{a.location ? ` — ${a.location}` : ''}</p>
                      {a.start_time && <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{a.start_time}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {trip && (
        <AIAssistant trip={trip} flights={flights} accommodations={accommodations} activities={activities} />
      )}
    </div>
  )
}
