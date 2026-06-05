'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Receipt, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { createClient } from '@/lib/supabase/client'
import { Expense, Participant } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'

const CAT_ICONS: Record<string, string> = {
  flight: '✈️', accommodation: '🏨', transport: '🚗', food: '🍽️',
  activity: '🎭', shopping: '🛍️', health: '💊', other: '📦',
}
const CAT_LABELS: Record<string, string> = {
  flight: 'Vuelo', accommodation: 'Alojamiento', transport: 'Transporte', food: 'Comida',
  activity: 'Actividad', shopping: 'Compras', health: 'Salud', other: 'Otro',
}
const CAT_COLORS: Record<string, string> = {
  flight: 'bg-blue-50 text-blue-700', accommodation: 'bg-amber-50 text-amber-700',
  transport: 'bg-violet-50 text-violet-700', food: 'bg-orange-50 text-orange-700',
  activity: 'bg-emerald-50 text-emerald-700', shopping: 'bg-pink-50 text-pink-700',
  health: 'bg-red-50 text-red-700', other: 'bg-stone-50 text-stone-600',
}

export default function ExpensesPage() {
  const { id } = useParams()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const supabase = createClient()

  const fetchData = async () => {
    const [expRes, partRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('trip_id', id).order('expense_date', { ascending: false }),
      supabase.from('trip_participants').select('participant:participants(*)').eq('trip_id', id),
    ])
    setExpenses(expRes.data ?? [])
    setParticipants((partRes.data ?? []).map((r: any) => r.participant))
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  const handleSave = async (data: Partial<Expense>) => {
    if (editing) {
      await supabase.from('expenses').update(data).eq('id', editing.id)
    } else {
      await supabase.from('expenses').insert({ ...data, trip_id: id })
    }
    await fetchData()
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = async (expId: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    await supabase.from('expenses').delete().eq('id', expId)
    setExpenses(prev => prev.filter(e => e.id !== expId))
  }

  const openEdit = (e: Expense) => { setEditing(e); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  const filtered = activeCategory === 'all' ? expenses : expenses.filter(e => e.category === activeCategory)
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const currency = expenses[0]?.currency ?? 'USD'

  // Balance por persona
  const balances: Record<string, number> = {}
  participants.forEach(p => { balances[p.id] = 0 })
  expenses.forEach(e => {
    if (e.paid_by) balances[e.paid_by] = (balances[e.paid_by] ?? 0) + e.amount
    if (e.split_among?.length) {
      const share = e.amount / e.split_among.length
      e.split_among.forEach(pid => { balances[pid] = (balances[pid] ?? 0) - share })
    }
  })

  // By category totals
  const byCategory: Record<string, number> = {}
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount })

  const categories = Object.keys(CAT_LABELS).filter(c => byCategory[c] > 0)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Gastos</h2>
          <p className="text-sm text-stone-500">{expenses.length} gasto{expenses.length !== 1 ? 's' : ''} · Total {formatCurrency(total, currency)}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Agregar gasto
        </Button>
      </div>

      {/* Summary cards */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Total */}
          <div className="card p-4 col-span-2">
            <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Total gastado</p>
            <p className="text-2xl font-bold text-stone-900">{formatCurrency(total, currency)}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {categories.map(cat => (
                <div key={cat} className="flex items-center gap-1">
                  <span>{CAT_ICONS[cat]}</span>
                  <span className="text-xs text-stone-500">{formatCurrency(byCategory[cat], currency)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Balance por persona */}
          {participants.length > 0 && (
            <div className="card p-4 col-span-2">
              <p className="text-xs text-stone-400 uppercase tracking-wide mb-3">Balance</p>
              <div className="space-y-2">
                {participants.map(p => {
                  const bal = balances[p.id] ?? 0
                  return (
                    <div key={p.id} className="flex items-center justify-between">
                      <span className="text-sm text-stone-700">{p.name}</span>
                      <span className={`text-sm font-medium ${bal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {bal >= 0 ? '+' : ''}{formatCurrency(bal, currency)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex gap-1 mb-5 flex-wrap">
          <button onClick={() => setActiveCategory('all')} className={`px-3 py-1 text-xs rounded-full transition-colors ${activeCategory === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>Todos</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1 text-xs rounded-full transition-colors ${activeCategory === cat ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
              {CAT_ICONS[cat]} {CAT_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="card h-16 animate-pulse bg-stone-100" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="Sin gastos registrados" description="Registra los gastos del viaje para llevar el control del presupuesto." action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" />Agregar gasto</Button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map(exp => {
            const paidByName = participants.find(p => p.id === exp.paid_by)?.name
            const splitCount = exp.split_among?.length ?? 0
            return (
              <div key={exp.id} className="card p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-base ${CAT_COLORS[exp.category]}`}>
                  {CAT_ICONS[exp.category]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-stone-900 truncate">{exp.description}</span>
                    <Badge className={CAT_COLORS[exp.category]}>{CAT_LABELS[exp.category]}</Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-stone-400 mt-0.5">
                    <span>{formatDate(exp.expense_date)}</span>
                    {paidByName && <span>Pagó: {paidByName}</span>}
                    {splitCount > 0 && <span>÷ {splitCount} persona{splitCount !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
                <span className="text-sm font-semibold text-stone-900 shrink-0">{formatCurrency(exp.amount, exp.currency)}</span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg text-stone-300 hover:text-stone-700 hover:bg-stone-100 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded-lg text-stone-300 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showForm} onClose={closeForm} title={editing ? 'Editar gasto' : 'Nuevo gasto'}>
        <ExpenseForm initial={editing ?? undefined} participants={participants} onSubmit={handleSave} onCancel={closeForm} />
      </Modal>
    </>
  )
}
