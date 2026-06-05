'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, Plane, Building2, Car, MapPin, Calendar, Luggage, Receipt, ShieldAlert } from 'lucide-react'

const TABS = [
  { label: 'Itinerario', href: '', icon: Calendar },
  { label: 'Vuelos', href: '/flights', icon: Plane },
  { label: 'Alojamiento', href: '/accommodation', icon: Building2 },
  { label: 'Transporte', href: '/transport', icon: Car },
  { label: 'Actividades', href: '/activities', icon: MapPin },
  { label: 'Gastos', href: '/expenses', icon: Receipt },
  { label: 'Equipaje', href: '/packing', icon: Luggage },
  { label: 'Emergencia', href: '/emergency', icon: ShieldAlert },
]

interface TripTabNavProps {
  tripId: string
}

export function TripTabNav({ tripId }: TripTabNavProps) {
  const pathname = usePathname()
  const base = `/trips/${tripId}`

  return (
    <div className="mb-6">
      <Link href="/trips" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Mis viajes
      </Link>

      <div className="flex gap-1 overflow-x-auto pb-px border-b border-stone-200">
        {TABS.map((tab) => {
          const href = `${base}${tab.href}`
          const isActive = tab.href === '' ? pathname === base : pathname.startsWith(href)
          return (
            <Link
              key={tab.href}
              href={href}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                isActive
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
