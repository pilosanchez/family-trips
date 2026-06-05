'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ShieldAlert, Phone, Plus, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

interface EmergencyInfo {
  id?: string
  trip_id?: string
  insurance_provider?: string
  insurance_policy?: string
  insurance_phone?: string
  embassy_info?: { country: string; address: string; phone: string }[]
  local_emergency_numbers?: { police?: string; ambulance?: string; fire?: string }
  hospital_info?: string
  important_contacts?: { name: string; relation: string; phone: string }[]
  notes?: string
}

export default function EmergencyPage() {
  const { id } = useParams()
  const [data, setData] = useState<EmergencyInfo>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: res } = await supabase.from('emergency_info').select('*').eq('trip_id', id).single()
      if (res) setData(res)
      setLoading(false)
    }
    load()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    const payload = { ...data, trip_id: id }
    if (data.id) {
      await supabase.from('emergency_info').update(payload).eq('id', data.id)
    } else {
      const { data: res } = await supabase.from('emergency_info').insert(payload).select().single()
      if (res) setData(res)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const set = (field: keyof EmergencyInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setData(prev => ({ ...prev, [field]: e.target.value }))

  const setEmergNum = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData(prev => ({ ...prev, local_emergency_numbers: { ...(prev.local_emergency_numbers ?? {}), [field]: e.target.value } }))

  const addEmbassy = () =>
    setData(prev => ({ ...prev, embassy_info: [...(prev.embassy_info ?? []), { country: '', address: '', phone: '' }] }))

  const updateEmbassy = (i: number, field: string, value: string) =>
    setData(prev => {
      const arr = [...(prev.embassy_info ?? [])]
      arr[i] = { ...arr[i], [field]: value }
      return { ...prev, embassy_info: arr }
    })

  const removeEmbassy = (i: number) =>
    setData(prev => ({ ...prev, embassy_info: (prev.embassy_info ?? []).filter((_, idx) => idx !== i) }))

  const addContact = () =>
    setData(prev => ({ ...prev, important_contacts: [...(prev.important_contacts ?? []), { name: '', relation: '', phone: '' }] }))

  const updateContact = (i: number, field: string, value: string) =>
    setData(prev => {
      const arr = [...(prev.important_contacts ?? [])]
      arr[i] = { ...arr[i], [field]: value }
      return { ...prev, important_contacts: arr }
    })

  const removeContact = (i: number) =>
    setData(prev => ({ ...prev, important_contacts: (prev.important_contacts ?? []).filter((_, idx) => idx !== i) }))

  if (loading) return <div className="animate-pulse h-96 bg-stone-100 rounded-xl" />

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Información de Emergencia</h2>
          <p className="text-sm text-stone-500">Datos importantes para situaciones de emergencia durante el viaje.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar'}
        </Button>
      </div>

      {/* Seguro */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-500" />
          Seguro de Viaje
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Aseguradora" id="ins_provider" value={data.insurance_provider ?? ''} onChange={set('insurance_provider')} placeholder="Ej: Mapfre, AXA..." />
          <Input label="Nro. de póliza" id="ins_policy" value={data.insurance_policy ?? ''} onChange={set('insurance_policy')} placeholder="Ej: POL-123456" />
          <div className="col-span-2">
            <Input label="Teléfono de emergencia 24h" id="ins_phone" value={data.insurance_phone ?? ''} onChange={set('insurance_phone')} placeholder="Ej: +1 800 123-4567" />
          </div>
        </div>
      </div>

      {/* Números de emergencia locales */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2">
          <Phone className="w-4 h-4 text-red-500" />
          Números de Emergencia Locales
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Policía" id="police" value={data.local_emergency_numbers?.police ?? ''} onChange={setEmergNum('police')} placeholder="Ej: 110" />
          <Input label="Ambulancia" id="ambulance" value={data.local_emergency_numbers?.ambulance ?? ''} onChange={setEmergNum('ambulance')} placeholder="Ej: 118" />
          <Input label="Bomberos" id="fire" value={data.local_emergency_numbers?.fire ?? ''} onChange={setEmergNum('fire')} placeholder="Ej: 116" />
        </div>
      </div>

      {/* Hospital */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-3">Hospital / Clínica Cercana</h3>
        <textarea
          value={data.hospital_info ?? ''}
          onChange={set('hospital_info')}
          rows={2}
          placeholder="Nombre, dirección y teléfono del hospital más cercano al alojamiento..."
          className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none placeholder:text-stone-400"
        />
      </div>

      {/* Embajadas */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-700">Embajadas / Consulados</h3>
          <button onClick={addEmbassy} className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors">
            <Plus className="w-3.5 h-3.5" />Agregar
          </button>
        </div>
        {(data.embassy_info ?? []).length === 0 ? (
          <p className="text-sm text-stone-300 italic">Sin embajadas registradas.</p>
        ) : (
          <div className="space-y-3">
            {(data.embassy_info ?? []).map((emb, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="grid grid-cols-3 gap-2 flex-1">
                  <input value={emb.country} onChange={e => updateEmbassy(i, 'country', e.target.value)} placeholder="País" className="px-2 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900" />
                  <input value={emb.address} onChange={e => updateEmbassy(i, 'address', e.target.value)} placeholder="Dirección" className="px-2 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900" />
                  <input value={emb.phone} onChange={e => updateEmbassy(i, 'phone', e.target.value)} placeholder="Teléfono" className="px-2 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900" />
                </div>
                <button onClick={() => removeEmbassy(i)} className="p-1.5 text-stone-300 hover:text-red-500 transition-colors mt-0.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contactos importantes */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-700">Contactos de Emergencia</h3>
          <button onClick={addContact} className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors">
            <Plus className="w-3.5 h-3.5" />Agregar
          </button>
        </div>
        {(data.important_contacts ?? []).length === 0 ? (
          <p className="text-sm text-stone-300 italic">Sin contactos registrados.</p>
        ) : (
          <div className="space-y-3">
            {(data.important_contacts ?? []).map((c, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="grid grid-cols-3 gap-2 flex-1">
                  <input value={c.name} onChange={e => updateContact(i, 'name', e.target.value)} placeholder="Nombre" className="px-2 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900" />
                  <input value={c.relation} onChange={e => updateContact(i, 'relation', e.target.value)} placeholder="Relación" className="px-2 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900" />
                  <input value={c.phone} onChange={e => updateContact(i, 'phone', e.target.value)} placeholder="Teléfono" className="px-2 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900" />
                </div>
                <button onClick={() => removeContact(i)} className="p-1.5 text-stone-300 hover:text-red-500 transition-colors mt-0.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notas */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-3">Notas adicionales</h3>
        <textarea
          value={data.notes ?? ''}
          onChange={set('notes')}
          rows={3}
          placeholder="Alergias, medicamentos importantes, condiciones médicas a informar..."
          className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none placeholder:text-stone-400"
        />
      </div>

      <div className="flex justify-end pb-4">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar todo'}
        </Button>
      </div>
    </div>
  )
}
