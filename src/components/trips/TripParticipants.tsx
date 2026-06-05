'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Participant } from '@/types'

interface TripParticipantsProps {
  tripId: string
}

const AVATARS = ['👨', '👩', '👦', '👧', '🧑', '👴', '👵']

export function TripParticipants({ tripId }: TripParticipantsProps) {
  const [assigned, setAssigned] = useState<Participant[]>([])
  const [all, setAll] = useState<Participant[]>([])
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  const fetchData = async () => {
    const [allRes, assignedRes] = await Promise.all([
      supabase.from('participants').select('*').order('name'),
      supabase.from('trip_participants').select('participant:participants(*)').eq('trip_id', tripId),
    ])
    setAll(allRes.data ?? [])
    setAssigned((assignedRes.data ?? []).map((r: any) => r.participant))
  }

  useEffect(() => { fetchData() }, [tripId])

  const isAssigned = (pid: string) => assigned.some(p => p.id === pid)

  const toggle = async (participant: Participant) => {
    if (isAssigned(participant.id)) {
      await supabase.from('trip_participants').delete()
        .eq('trip_id', tripId).eq('participant_id', participant.id)
      setAssigned(prev => prev.filter(p => p.id !== participant.id))
    } else {
      await supabase.from('trip_participants').insert({ trip_id: tripId, participant_id: participant.id })
      setAssigned(prev => [...prev, participant])
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
      >
        <Users className="w-4 h-4" />
        {assigned.length === 0 ? 'Agregar viajeros' : (
          <span className="flex items-center gap-1">
            {assigned.map((p, i) => (
              <span key={p.id} title={p.name}>{AVATARS[all.findIndex(a => a.id === p.id) % AVATARS.length]}</span>
            ))}
            <span className="text-xs text-stone-400">({assigned.length})</span>
          </span>
        )}
        <Plus className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-8 left-0 z-40 bg-white border border-stone-200 rounded-xl shadow-lg p-3 min-w-48">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Viajeros</p>
            {all.length === 0 ? (
              <p className="text-xs text-stone-400">Sin miembros en Familia aún.</p>
            ) : (
              <div className="space-y-1">
                {all.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => toggle(p)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                      isAssigned(p.id) ? 'bg-stone-900 text-white' : 'hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span>{AVATARS[i % AVATARS.length]}</span>
                    <span className="flex-1 text-left">{p.name}</span>
                    {isAssigned(p.id) && <X className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
