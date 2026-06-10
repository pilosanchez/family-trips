'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { BillItem } from './ReceiptStep'
import type { SplitPerson } from './ParticipantsStep'

interface Props {
  items: BillItem[]
  tip: number
  tipType: 'percent' | 'fixed'
  people: SplitPerson[]
  trips: { id: string; name: string }[]
  onSaveToTrip: (tripId: string) => Promise<void>
  onBack: () => void
  onReset: () => void
}

const AVATARS = ['👨', '👩', '👦', '👧', '🧑', '👴', '👵', '🙂']

// itemQtys: itemId → personId → qty taken by that person
type ItemQtys = Record<string, Record<string, number>>

export function ResultStep({ items, tip, tipType, people, trips, onSaveToTrip, onBack, onReset }: Props) {
  const [mode, setMode] = useState<'even' | 'byItem'>('even')
  const [itemQtys, setItemQtys] = useState<ItemQtys>(() => {
    const init: ItemQtys = {}
    items.forEach(it => {
      init[it.id] = {}
    })
    return init
  })
  const [copied, setCopied] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const subtotal = items.reduce((s, it) => s + (Number(it.price) || 0), 0)
  const tipAmount = tipType === 'percent' ? subtotal * (tip / 100) : Number(tip) || 0
  const total = subtotal + tipAmount

  const payers = people.filter(p => p.pays)
  const evenShare = payers.length > 0 ? total / payers.length : 0

  const adjustQty = (itemId: string, personId: string, delta: number, maxQty: number) => {
    setItemQtys(prev => {
      const personQtys = prev[itemId] || {}
      const current = personQtys[personId] || 0
      const totalAssigned = Object.values(personQtys).reduce((a, b) => a + b, 0)
      const otherAssigned = totalAssigned - current
      const newVal = Math.max(0, Math.min(maxQty - otherAssigned, current + delta))
      return { ...prev, [itemId]: { ...personQtys, [personId]: newVal } }
    })
  }

  const byItemShares = (): Record<string, number> => {
    const shares: Record<string, number> = {}
    payers.forEach(p => { shares[p.id] = 0 })

    items.forEach(item => {
      const personQtys = itemQtys[item.id] || {}
      const totalAssigned = Object.values(personQtys).reduce((a, b) => a + b, 0)
      if (totalAssigned === 0) return
      const unitPrice = (Number(item.price) || 0) / item.qty
      payers.forEach(p => {
        const taken = personQtys[p.id] || 0
        shares[p.id] = (shares[p.id] || 0) + taken * unitPrice
      })
    })

    // distribute tip proportionally to each person's item subtotal
    const itemsTotal = Object.values(shares).reduce((a, b) => a + b, 0)
    if (itemsTotal > 0 && tipAmount > 0) {
      payers.forEach(p => {
        shares[p.id] = shares[p.id] * (1 + tipAmount / itemsTotal)
      })
    }

    return shares
  }

  const shares = mode === 'even'
    ? Object.fromEntries(payers.map(p => [p.id, evenShare]))
    : byItemShares()

  const copyToClipboard = () => {
    const lines = [
      `💰 División de cuenta — Total: $${total.toFixed(2)}`,
      '',
      ...payers.map((p, i) => `${AVATARS[i % AVATARS.length]} ${p.name}: $${(shares[p.id] || 0).toFixed(2)}`),
      ...(people.filter(p => p.isGuest).length > 0
        ? ['', `🎁 Invitados (sin cargo): ${people.filter(p => p.isGuest).map(p => p.name).join(', ')}`]
        : []),
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    if (!selectedTrip) return
    setSaving(true)
    await onSaveToTrip(selectedTrip)
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
        <button
          onClick={() => setMode('even')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'even' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
        >
          División pareja
        </button>
        <button
          onClick={() => setMode('byItem')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'byItem' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
        >
          Por items
        </button>
      </div>

      {mode === 'byItem' && (
        <div className="border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2 bg-stone-50 border-b border-stone-100">
            <p className="text-xs text-stone-500 font-medium">¿Cuántas unidades tomó cada uno?</p>
          </div>
          <div className="divide-y divide-stone-100">
            {items.map(item => {
              const unitPrice = (Number(item.price) || 0) / item.qty
              const personQtys = itemQtys[item.id] || {}
              const totalAssigned = Object.values(personQtys).reduce((a, b) => a + b, 0)
              const remaining = item.qty - totalAssigned
              return (
                <div key={item.id} className="px-4 py-3 flex flex-col gap-2.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-medium text-stone-800">{item.name || 'Item'}</span>
                    <span className="text-xs text-stone-400">
                      ${unitPrice.toFixed(2)} c/u · {item.qty} unid.
                      {remaining > 0 && <span className="text-amber-500 ml-1">({remaining} sin asignar)</span>}
                      {remaining === 0 && <span className="text-emerald-600 ml-1">✓</span>}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {payers.map((p, i) => {
                      const taken = personQtys[p.id] || 0
                      const canIncrease = totalAssigned < item.qty
                      return (
                        <div key={p.id} className="flex items-center gap-2">
                          <span className="text-base w-6 text-center select-none">{AVATARS[i % AVATARS.length]}</span>
                          <span className="flex-1 text-sm text-stone-700">{p.name}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => adjustQty(item.id, p.id, -1, item.qty)}
                              disabled={taken === 0}
                              className="w-7 h-7 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-base font-medium leading-none flex items-center justify-center"
                            >
                              −
                            </button>
                            <span className={`w-8 text-center text-sm font-semibold ${taken > 0 ? 'text-stone-900' : 'text-stone-300'}`}>
                              {taken}
                            </span>
                            <button
                              onClick={() => adjustQty(item.id, p.id, 1, item.qty)}
                              disabled={!canIncrease}
                              className="w-7 h-7 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-base font-medium leading-none flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                          {taken > 0 && (
                            <span className="text-xs text-stone-400 w-14 text-right">
                              ${(taken * unitPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Cuánto paga cada uno</p>
        {payers.map((person, i) => (
          <div key={person.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
            <span className="text-xl">{AVATARS[i % AVATARS.length]}</span>
            <span className="flex-1 text-sm font-medium text-stone-800">{person.name}</span>
            <span className="text-base font-bold text-stone-900">${(shares[person.id] || 0).toFixed(2)}</span>
          </div>
        ))}
        {people.filter(p => p.isGuest).map((person, i) => (
          <div key={person.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl opacity-70">
            <span className="text-xl">{AVATARS[(payers.length + i) % AVATARS.length]}</span>
            <span className="flex-1 text-sm text-stone-600">{person.name} <span className="text-xs text-amber-600">(invitado)</span></span>
            <span className="text-sm text-stone-400">$0.00</span>
          </div>
        ))}
      </div>

      <div className="bg-stone-100 rounded-xl px-4 py-3 flex justify-between text-sm font-semibold text-stone-900">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      <Button variant="secondary" onClick={copyToClipboard} className="w-full justify-center gap-2">
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copiado!' : 'Copiar resumen'}
      </Button>

      {trips.length > 0 && !saved && (
        <div className="border border-stone-200 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-stone-700">Guardar en un viaje</p>
          <div className="flex gap-2">
            <select
              value={selectedTrip}
              onChange={e => setSelectedTrip(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
            >
              <option value="">Seleccionar viaje...</option>
              {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <Button onClick={handleSave} disabled={!selectedTrip || saving} className="shrink-0">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      )}

      {saved && (
        <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> Guardado en el viaje
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1 justify-center">
          Atrás
        </Button>
        <Button variant="ghost" onClick={onReset} className="flex-1 justify-center">
          Nueva cuenta
        </Button>
      </div>
    </div>
  )
}
