'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Luggage, Trash2, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { PackingItem } from '@/types'

const CATEGORIES = [
  { value: 'documents', label: '📄 Documentos', color: 'bg-blue-50 text-blue-700' },
  { value: 'clothing', label: '👕 Ropa', color: 'bg-amber-50 text-amber-700' },
  { value: 'toiletries', label: '🧴 Higiene', color: 'bg-pink-50 text-pink-700' },
  { value: 'electronics', label: '💻 Electrónica', color: 'bg-violet-50 text-violet-700' },
  { value: 'medications', label: '💊 Medicamentos', color: 'bg-red-50 text-red-700' },
  { value: 'other', label: '📦 Otros', color: 'bg-stone-50 text-stone-600' },
]

const QUICK_TEMPLATES: Record<string, string[]> = {
  documents: ['Pasaporte', 'DNI / CI', 'Tickets de vuelo', 'Voucher hotel', 'Seguro de viaje', 'Tarjeta de crédito', 'Efectivo'],
  clothing: ['Ropa interior (7)', 'Medias (7)', 'Pantalón', 'Camisetas (5)', 'Abrigo / Chaqueta', 'Pijama', 'Zapatos'],
  toiletries: ['Cepillo de dientes', 'Pasta dental', 'Shampoo', 'Desodorante', 'Protector solar', 'Maquillaje'],
  electronics: ['Celular + cargador', 'Adaptador de corriente', 'Power bank', 'Auriculares', 'Laptop'],
  medications: ['Analgésicos', 'Antihistamínicos', 'Antiácidos', 'Botiquín básico'],
}

export default function PackingPage() {
  const { id } = useParams()
  const [items, setItems] = useState<PackingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', category: 'documents', is_essential: false })
  const [activeCategory, setActiveCategory] = useState('all')
  const supabase = createClient()

  const fetchItems = async () => {
    const { data } = await supabase.from('packing_items').select('*').eq('trip_id', id).order('category').order('name')
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [id])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from('packing_items').insert({ ...newItem, trip_id: id, is_packed: false, quantity: 1 })
    await fetchItems()
    setNewItem({ name: '', category: 'documents', is_essential: false })
    setShowForm(false)
  }

  const togglePacked = async (item: PackingItem) => {
    await supabase.from('packing_items').update({ is_packed: !item.is_packed }).eq('id', item.id)
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_packed: !i.is_packed } : i))
  }

  const handleDelete = async (itemId: string) => {
    await supabase.from('packing_items').delete().eq('id', itemId)
    setItems((prev) => prev.filter((i) => i.id !== itemId))
  }

  const addTemplate = async (category: string) => {
    const templates = QUICK_TEMPLATES[category] ?? []
    const existing = items.map((i) => i.name.toLowerCase())
    const toAdd = templates.filter((t) => !existing.includes(t.toLowerCase()))
    if (toAdd.length === 0) return
    await supabase.from('packing_items').insert(toAdd.map((name) => ({ name, category, trip_id: id, is_packed: false, quantity: 1, is_essential: category === 'documents' })))
    await fetchItems()
  }

  const filtered = activeCategory === 'all' ? items : items.filter((i) => i.category === activeCategory)
  const packed = items.filter((i) => i.is_packed).length
  const pct = items.length ? Math.round((packed / items.length) * 100) : 0

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Lista de Equipaje</h2>
          <p className="text-sm text-stone-500">{packed}/{items.length} empacado{packed !== 1 ? 's' : ''} · {pct}%</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Agregar item
        </Button>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mb-5">
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-1 mb-5 flex-wrap">
        <button onClick={() => setActiveCategory('all')} className={`px-3 py-1 text-xs rounded-full transition-colors ${activeCategory === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>Todos</button>
        {CATEGORIES.map((cat) => (
          <button key={cat.value} onClick={() => setActiveCategory(cat.value)} className={`px-3 py-1 text-xs rounded-full transition-colors ${activeCategory === cat.value ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Quick templates */}
      {items.length === 0 && !loading && (
        <div className="card p-4 mb-5">
          <p className="text-sm font-medium text-stone-700 mb-3">Agregar plantillas rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat.value} onClick={() => addTemplate(cat.value)} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${cat.color}`}>
                + {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-stone-100 rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Luggage} title="Lista vacía" description="Agrega items o usa las plantillas rápidas para empezar." action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" />Agregar item</Button>} />
      ) : (
        <div className="space-y-1">
          {CATEGORIES.filter((cat) => activeCategory === 'all' || cat.value === activeCategory).map((cat) => {
            const catItems = filtered.filter((i) => i.category === cat.value)
            if (catItems.length === 0) return null
            return (
              <div key={cat.value} className="mb-4">
                <h3 className={`text-xs font-semibold px-2 py-1 rounded-md w-fit mb-2 ${cat.color}`}>{cat.label}</h3>
                <div className="space-y-1">
                  {catItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-50 group transition-colors">
                      <button onClick={() => togglePacked(item)} className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${item.is_packed ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300 hover:border-stone-500'}`}>
                        {item.is_packed && <CheckSquare className="w-3 h-3 text-white" />}
                      </button>
                      <span className={`flex-1 text-sm ${item.is_packed ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                        {item.name}
                        {item.is_essential && !item.is_packed && <span className="ml-1.5 text-xs text-red-500">●</span>}
                      </span>
                      <button onClick={() => handleDelete(item.id)} className="p-1 rounded text-stone-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo item" size="sm">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <Input label="Nombre *" id="item-name" value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))} placeholder="Ej: Pasaporte" required autoFocus />
          <Select label="Categoría" id="item-cat" value={newItem.category} onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))} options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} />
          <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
            <input type="checkbox" checked={newItem.is_essential} onChange={(e) => setNewItem((p) => ({ ...p, is_essential: e.target.checked }))} className="w-4 h-4 rounded" />
            Marcar como esencial
          </label>
          <div className="flex gap-2 justify-end pt-2 border-t border-stone-100">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
