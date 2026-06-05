import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate, formatTime, getTransportTypeLabel, getActivityTypeLabel } from '@/lib/utils'
import { Plane, Building2, Car, MapPin, Clock, Calendar } from 'lucide-react'
import { eachDayOfInterval, parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: Props) {
  const { token } = await params

  // Decode trip_id from token
  let tripId: string
  try {
    tripId = Buffer.from(token, 'base64url').toString('utf-8')
  } catch {
    notFound()
  }

  const supabase = await createClient()
  const [tripRes, flightsRes, accRes, transRes, actRes] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).single(),
    supabase.from('flights').select('*').eq('trip_id', tripId).order('departure_datetime'),
    supabase.from('accommodations').select('*').eq('trip_id', tripId).order('checkin_date'),
    supabase.from('transports').select('*').eq('trip_id', tripId).order('departure_datetime'),
    supabase.from('activities').select('*').eq('trip_id', tripId).order('activity_date'),
  ])

  const trip = tripRes.data
  if (!trip) notFound()

  const flights = flightsRes.data ?? []
  const accommodations = accRes.data ?? []
  const transports = transRes.data ?? []
  const activities = actRes.data ?? []

  const allDays = eachDayOfInterval({ start: parseISO(trip.start_date), end: parseISO(trip.end_date) })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafaf9' }}>
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-stone-400 text-sm mb-4">
            <Plane className="w-4 h-4" />
            <span>FamilyTrips</span>
            <span className="text-stone-300">·</span>
            <span>Itinerario compartido</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">{trip.name}</h1>
          <p className="text-stone-500">{trip.destination}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-stone-500">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(trip.start_date)} — {formatDate(trip.end_date)}</span>
          </div>
          {trip.description && <p className="mt-3 text-sm text-stone-400">{trip.description}</p>}
        </div>

        {/* Days */}
        <div className="space-y-4">
          {allDays.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayFlights = flights.filter((f: any) => f.departure_datetime.startsWith(dateStr))
            const dayAccs = accommodations.filter((a: any) => a.checkin_date === dateStr || a.checkout_date === dateStr)
            const dayTrans = transports.filter((t: any) => t.departure_datetime.startsWith(dateStr))
            const dayActs = activities.filter((a: any) => a.activity_date === dateStr)
            const hasContent = dayFlights.length + dayAccs.length + dayTrans.length + dayActs.length > 0
            if (!hasContent) return null

            const dayLabel = format(day, "EEEE d 'de' MMMM", { locale: es })

            return (
              <div key={dateStr} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Día {i + 1}</span>
                  <span className="text-sm font-medium text-stone-700 capitalize">{dayLabel}</span>
                </div>
                <div className="divide-y divide-stone-50">
                  {dayFlights.map((f: any) => (
                    <div key={f.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Plane className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-900">{f.airline} {f.flight_number}</p>
                        <p className="text-sm text-stone-600">{f.origin} → {f.destination}</p>
                        <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{formatTime(f.departure_datetime)} → {formatTime(f.arrival_datetime)}</p>
                      </div>
                    </div>
                  ))}
                  {dayAccs.map((a: any) => (
                    <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Building2 className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-900">{a.name}</p>
                        <p className="text-sm text-stone-600">{a.checkin_date === dateStr ? `Check-in ${a.checkin_time}` : `Check-out ${a.checkout_time}`}</p>
                      </div>
                    </div>
                  ))}
                  {dayTrans.map((t: any) => (
                    <div key={t.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Car className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-900">{getTransportTypeLabel(t.transport_type)}{t.provider ? ` — ${t.provider}` : ''}</p>
                        <p className="text-sm text-stone-600">{t.from_location} → {t.to_location}</p>
                        <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{formatTime(t.departure_datetime)}</p>
                      </div>
                    </div>
                  ))}
                  {dayActs.map((a: any) => (
                    <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-900">{a.name}</p>
                        <p className="text-sm text-stone-600">{getActivityTypeLabel(a.activity_type)}{a.start_time ? ` — ${a.start_time}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-stone-300 mt-10">Generado con FamilyTrips</p>
      </div>
    </div>
  )
}
