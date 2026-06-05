'use client'

import Link from 'next/link'
import { MapPin, Calendar, Users, Trash2, Pencil } from 'lucide-react'
import { Trip } from '@/types'
import { formatDate, getTripStatusColor, getTripStatusLabel, tripDuration } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

interface TripCardProps {
  trip: Trip
  onDelete: (id: string) => void
  onEdit: (trip: Trip) => void
}

const COVER_COLORS = [
  'bg-amber-100',
  'bg-blue-100',
  'bg-emerald-100',
  'bg-violet-100',
  'bg-rose-100',
  'bg-cyan-100',
]

export function TripCard({ trip, onDelete, onEdit }: TripCardProps) {
  const colorIdx = trip.name.charCodeAt(0) % COVER_COLORS.length
  const nights = tripDuration(trip.start_date, trip.end_date)
  const participantCount = trip.trip_participants?.length ?? 0

  return (
    <div className="card overflow-hidden group hover:shadow-md transition-shadow">
      {/* Cover */}
      <Link href={`/trips/${trip.id}`}>
        <div className={`h-32 ${COVER_COLORS[colorIdx]} flex items-center justify-center relative`}>
          {trip.cover_image ? (
            <img src={trip.cover_image} alt={trip.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl select-none">✈️</span>
          )}
          <div className="absolute top-3 right-3">
            <Badge className={getTripStatusColor(trip.status)}>
              {getTripStatusLabel(trip.status)}
            </Badge>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/trips/${trip.id}`} className="block mb-2">
          <h3 className="font-semibold text-stone-900 group-hover:text-stone-700 transition-colors leading-tight">
            {trip.name}
          </h3>
          <div className="flex items-center gap-1 mt-0.5 text-stone-500">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-sm">{trip.destination}</span>
          </div>
        </Link>

        <div className="flex items-center justify-between text-xs text-stone-500 mt-3 pt-3 border-t border-stone-100">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(trip.start_date, 'dd MMM')} — {formatDate(trip.end_date, 'dd MMM yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{nights}n</span>
            {participantCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Users className="w-3.5 h-3.5" />
                {participantCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-1 mt-2">
          <button
            onClick={(e) => { e.preventDefault(); onEdit(trip) }}
            className="p-1.5 rounded-lg text-stone-300 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            title="Editar viaje"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(trip.id) }}
            className="p-1.5 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Eliminar viaje"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
