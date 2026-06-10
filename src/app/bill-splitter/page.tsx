'use client'

import { useState, useEffect } from 'react'
import { Calculator, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ReceiptStep, type BillItem } from '@/components/bill-splitter/ReceiptStep'
import { ItemsStep } from '@/components/bill-splitter/ItemsStep'
import { ParticipantsStep, type SplitPerson } from '@/components/bill-splitter/ParticipantsStep'
import { ResultStep } from '@/components/bill-splitter/ResultStep'
import type { Participant } from '@/types'

const STEPS = ['Ticket', 'Items', 'Participantes', 'Resultado']

export default function BillSplitterPage() {
  const [step, setStep] = useState(1)
  const [items, setItems] = useState<BillItem[]>([])
  const [tip, setTip] = useState(0)
  const [tipType, setTipType] = useState<'percent' | 'fixed'>('percent')
  const [people, setPeople] = useState<SplitPerson[]>([])
  const [trips, setTrips] = useState<{ id: string; name: string }[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      setIsAuthenticated(true)

      const [participantsRes, tripsRes] = await Promise.all([
        supabase.from('participants').select('*').order('name'),
        supabase.from('trips').select('id, name, status').neq('status', 'completed').order('start_date'),
      ])

      const familyPeople: SplitPerson[] = (participantsRes.data ?? []).map((p: Participant) => ({
        id: p.id,
        name: p.name,
        pays: true,
        isGuest: false,
        fromFamily: true,
      }))
      setPeople(familyPeople)
      setTrips((tripsRes.data ?? []) as { id: string; name: string }[])
    }
    load()
  }, [])

  const reset = () => {
    setStep(1)
    setItems([])
    setTip(0)
    setTipType('percent')
    setPeople(prev => prev.map(p => ({ ...p, pays: true, isGuest: false })))
  }

  const saveToTrip = async (tripId: string) => {
    const subtotal = items.reduce((s, it) => s + (Number(it.price) || 0), 0)
    const tipAmount = tipType === 'percent' ? subtotal * (tip / 100) : Number(tip) || 0
    const total = subtotal + tipAmount
    const payers = people.filter(p => p.pays)
    const today = new Date().toISOString().split('T')[0]

    await supabase.from('expenses').insert({
      trip_id: tripId,
      category: 'food',
      description: 'División de cuenta',
      amount: total,
      currency: 'USD',
      paid_by: payers[0]?.id ?? null,
      split_among: payers.map(p => p.id),
      expense_date: today,
    })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafaf9' }}>
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/trips" className="p-1.5 -ml-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          ) : (
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center shrink-0">
              <Calculator className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold text-stone-900 leading-tight">Dividir cuenta</p>
            {!isAuthenticated && (
              <p className="text-xs text-stone-400">FamilyTrips</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center gap-1 mb-6">
          {STEPS.map((label, i) => {
            const n = i + 1
            const done = step > n
            const active = step === n
            return (
              <div key={n} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    done ? 'bg-stone-900 text-white' : active ? 'bg-stone-900 text-white ring-4 ring-stone-200' : 'bg-stone-100 text-stone-400'
                  }`}>
                    {done ? '✓' : n}
                  </div>
                  <span className={`text-xs mt-1 ${active ? 'text-stone-700 font-medium' : 'text-stone-400'}`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 mb-4 mx-1 transition-colors ${done ? 'bg-stone-900' : 'bg-stone-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        <div className="card p-5">
          {step === 1 && (
            <ReceiptStep
              items={items}
              onItemsChange={setItems}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <ItemsStep
              items={items}
              onItemsChange={setItems}
              tip={tip}
              tipType={tipType}
              onTipChange={(t, type) => { setTip(t); setTipType(type) }}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <ParticipantsStep
              people={people}
              onPeopleChange={setPeople}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <ResultStep
              items={items}
              tip={tip}
              tipType={tipType}
              people={people}
              trips={isAuthenticated ? trips : []}
              onSaveToTrip={saveToTrip}
              onBack={() => setStep(3)}
              onReset={reset}
            />
          )}
        </div>

        {!isAuthenticated && (
          <p className="text-center text-xs text-stone-400 mt-6">
            ¿Tienes cuenta?{' '}
            <Link href="/auth" className="text-stone-600 hover:text-stone-900 underline underline-offset-2">
              Inicia sesión
            </Link>{' '}
            para guardar en tus viajes
          </p>
        )}
      </main>
    </div>
  )
}
