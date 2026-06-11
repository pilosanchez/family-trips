'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, Pencil, Trash2, Mail, Phone, CreditCard, Calendar, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ParticipantForm } from '@/components/family/ParticipantForm'
import { createClient } from '@/lib/supabase/client'
import { Participant } from '@/types'
import { formatDate } from '@/lib/utils'

const AVATARS = ['👨', '👩', '👦', '👧', '🧑', '👴', '👵']

export default function FamilyPage() {
  const [members, setMembers] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Participant | null>(null)
  const supabase = createClient()

  const fetchMembers = async () => {
    const { data } = await supabase.from('participants').select('*').order('name')
    setMembers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchMembers() }, [])

  const handleSave = async (data: Partial<Participant>) => {
    const { data: { user } } = await supabase.auth.getUser()
    let dbError
    if (editing) {
      const { error } = await supabase.from('participants').update({ ...data, user_id: user?.id }).eq('id', editing.id)
      dbError = error
    } else {
      const { error } = await supabase.from('participants').insert({ ...data, user_id: user?.id })
      dbError = error
    }
    if (dbError) {
      alert(`Error al guardar: ${dbError.message}`)
      return
    }
    await fetchMembers()
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = async (pid: string) => {
    if (!confirm('¿Eliminar este miembro? También se eliminará de todos los viajes.')) return
    await supabase.from('participants').delete().eq('id', pid)
    setMembers(prev => prev.filter(m => m.id !== pid))
  }

  const openEdit = (m: Participant) => { setEditing(m); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Familia</h1>
          <p className="text-sm text-stone-500 mt-0.5">{members.length} miembro{members.length !== 1 ? 's' : ''} registrado{members.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Agregar miembro
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card h-40 animate-pulse bg-stone-100" />)}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin miembros registrados"
          description="Agrega los miembros de tu familia para asignarlos a viajes y dividir gastos."
          action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" />Agregar primer miembro</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map((m, i) => (
            <div key={m.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-2xl">
                    {AVATARS[i % AVATARS.length]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900">{m.name}</h3>
                    {m.birth_date && (
                      <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />{formatDate(m.birth_date)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-stone-300 hover:text-stone-700 hover:bg-stone-100 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="space-y-1.5">
                {(m.document_type || m.document_number) && (
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <CreditCard className="w-3.5 h-3.5 text-stone-400" />
                    <span>{m.document_type === 'passport' ? 'Pasaporte' : 'Cédula'}</span>
                    {m.document_number && <span className="font-mono text-stone-700">{m.document_number}</span>}
                  </div>
                )}
                {m.email && (
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{m.email}</span>
                  </div>
                )}
                {m.phone && (
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{m.phone}</span>
                  </div>
                )}
                {!m.document_number && !m.email && !m.phone && (!m.documents || m.documents.length === 0) && (
                  <p className="text-xs text-stone-300 italic">Sin datos adicionales</p>
                )}
              </div>

              {m.documents && m.documents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap gap-1.5">
                  {m.documents.map((doc, di) => (
                    <a
                      key={di}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-600 hover:text-stone-900 hover:border-stone-300 transition-colors"
                    >
                      <FileText className="w-3 h-3 text-stone-400 shrink-0" />
                      {doc.label}{doc.note ? ` · ${doc.note}` : ''}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={closeForm} title={editing ? 'Editar miembro' : 'Nuevo miembro familiar'}>
        <ParticipantForm initial={editing ?? undefined} onSubmit={handleSave} onCancel={closeForm} />
      </Modal>
    </>
  )
}
