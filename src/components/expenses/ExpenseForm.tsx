'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Expense, Participant } from '@/types'

interface ExpenseFormProps {
  initial?: Partial<Expense>
  participants: Participant[]
  onSubmit: (data: Partial<Expense>) => Promise<void>
  onCancel: () => void
}

const CATEGORIES = [
  { value: 'flight', label: '✈️ Vuelo' },
  { value: 'accommodation', label: '🏨 Alojamiento' },
  { value: 'transport', label: '🚗 Transporte' },
  { value: 'food', label: '🍽️ Comida' },
  { value: 'activity', label: '🎭 Actividad' },
  { value: 'shopping', label: '🛍️ Compras' },
  { value: 'health', label: '💊 Salud' },
  { value: 'other', label: '📦 Otro' },
]

export function ExpenseForm({ initial, participants, onSubmit, onCancel }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    description: initial?.description ?? '',
    category: initial?.category ?? 'food',
    amount: initial?.amount?.toString() ?? '',
    currency: initial?.currency ?? 'USD',
    expense_date: initial?.expense_date ?? new Date().toISOString().slice(0, 10),
    paid_by: initial?.paid_by ?? '',
    notes: initial?.notes ?? '',
  })
  const [splitAmong, setSplitAmong] = useState<string[]>(initial?.split_among ?? participants.map(p => p.id))

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const toggleSplit = (pid: string) => {
    setSplitAmong(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        amount: parseFloat(form.amount),
        paid_by: form.paid_by || undefined,
        split_among: splitAmong,
      })
    } finally {
      setLoading(false)
    }
  }

  const perPerson = form.amount && splitAmong.length > 0
    ? (parseFloat(form.amount) / splitAmong.length).toFixed(2)
    : null

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Descripción *" id="description" value={form.description} onChange={set('description')} placeholder="Ej: Cena en restaurante" required autoFocus />

      <div className="grid grid-cols-2 gap-3">
        <Select label="Categoría" id="category" value={form.category} onChange={set('category')} options={CATEGORIES} />
        <Input label="Fecha *" id="expense_date" type="date" value={form.expense_date} onChange={set('expense_date')} required />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input label="Monto *" id="amount" type="number" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" required />
        </div>
        <Select label="Moneda" id="currency" value={form.currency} onChange={set('currency')} options={[
          { value: 'USD', label: 'USD' }, { value: 'BOB', label: 'BOB' }, { value: 'EUR', label: 'EUR' },
          { value: 'ARS', label: 'ARS' }, { value: 'BRL', label: 'BRL' }, { value: 'CLP', label: 'CLP' },
        ]} />
      </div>

      {participants.length > 0 && (
        <Select label="Pagado por" id="paid_by" value={form.paid_by} onChange={set('paid_by')} options={[
          { value: '', label: '— Sin especificar —' },
          ...participants.map(p => ({ value: p.id, label: p.name })),
        ]} />
      )}

      {participants.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-stone-700">
            Dividir entre
            {perPerson && <span className="ml-2 text-xs text-stone-400 font-normal">{form.currency} {perPerson} por persona</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {participants.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleSplit(p.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  splitAmong.includes(p.id)
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-stone-700">Notas</label>
        <textarea id="notes" value={form.notes} onChange={set('notes')} rows={2} placeholder="Notas adicionales..." className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none placeholder:text-stone-400" />
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-stone-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : initial?.id ? 'Guardar cambios' : 'Agregar gasto'}</Button>
      </div>
    </form>
  )
}
