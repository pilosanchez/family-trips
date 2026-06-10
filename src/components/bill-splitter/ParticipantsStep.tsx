'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface SplitPerson {
  id: string
  name: string
  pays: boolean
  isGuest: boolean
  fromFamily: boolean
}

interface Props {
  people: SplitPerson[]
  onPeopleChange: (people: SplitPerson[]) => void
  onBack: () => void
  onNext: () => void
}

const AVATARS = ['👨', '👩', '👦', '👧', '🧑', '👴', '👵', '🙂']

export function ParticipantsStep({ people, onPeopleChange, onBack, onNext }: Props) {
  const [newName, setNewName] = useState('')

  const toggle = (id: string, field: 'pays' | 'isGuest') => {
    onPeopleChange(people.map(p => {
      if (p.id !== id) return p
      if (field === 'pays') return { ...p, pays: true, isGuest: false }
      return { ...p, pays: false, isGuest: true }
    }))
  }

  const addPerson = () => {
    const name = newName.trim()
    if (!name) return
    onPeopleChange([...people, {
      id: `extra-${Date.now()}`,
      name,
      pays: true,
      isGuest: false,
      fromFamily: false,
    }])
    setNewName('')
  }

  const removePerson = (id: string) => {
    onPeopleChange(people.filter(p => p.id !== id))
  }

  const payers = people.filter(p => p.pays).length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        {people.map((person, i) => (
          <div key={person.id} className="flex items-center gap-3 p-3 border border-stone-200 rounded-xl bg-white">
            <span className="text-xl w-8 text-center select-none">{AVATARS[i % AVATARS.length]}</span>
            <span className="flex-1 text-sm font-medium text-stone-800">{person.name}</span>
            <div className="flex gap-1 text-xs">
              <button
                onClick={() => toggle(person.id, 'pays')}
                className={`px-3 py-1 rounded-lg border transition-colors ${person.pays ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}
              >
                Paga
              </button>
              <button
                onClick={() => toggle(person.id, 'isGuest')}
                className={`px-3 py-1 rounded-lg border transition-colors ${person.isGuest ? 'bg-amber-100 text-amber-800 border-amber-200' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}
              >
                Invitado
              </button>
            </div>
            {!person.fromFamily && (
              <button
                onClick={() => removePerson(person.id)}
                className="text-stone-300 hover:text-red-400 transition-colors text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addPerson()}
          placeholder="Agregar persona..."
          className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
        />
        <Button variant="secondary" onClick={addPerson} disabled={!newName.trim()} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Agregar
        </Button>
      </div>

      <div className="bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-600">
        <span className="font-medium text-stone-900">{payers} persona{payers !== 1 ? 's' : ''}</span> pagan · {people.filter(p => p.isGuest).length} invitado{people.filter(p => p.isGuest).length !== 1 ? 's' : ''}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1 justify-center">
          Atrás
        </Button>
        <Button onClick={onNext} disabled={payers === 0} className="flex-1 justify-center">
          Ver resultado
        </Button>
      </div>
    </div>
  )
}
