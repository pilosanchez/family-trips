'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Users, Link as LinkIcon, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRouter } from 'next/navigation'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://family-trips-mu.vercel.app'

export default function SettingsPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [memberCount, setMemberCount] = useState(0)
  const [inviteLink, setInviteLink] = useState('')
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [copied, setCopied] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadFamily = async () => {
      const { data } = await supabase
        .from('family_members')
        .select('family_id')
        .limit(1)
        .single()

      if (!data) return

      const { count } = await supabase
        .from('family_members')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', data.family_id)

      setMemberCount(count ?? 0)
    }
    loadFamily()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 6) { setError('Mínimo 6 caracteres.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setPassword('')
      setConfirm('')
    }
    setLoading(false)
  }

  const generateInvite = async () => {
    setGeneratingInvite(true)

    // Get family_id
    const { data: membership } = await supabase
      .from('family_members')
      .select('family_id, families(owner_id)')
      .limit(1)
      .single()

    if (!membership) {
      setGeneratingInvite(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const isOwner = (membership.families as unknown as { owner_id: string })?.owner_id === user?.id

    if (!isOwner) {
      alert('Solo el administrador de la familia puede generar invitaciones.')
      setGeneratingInvite(false)
      return
    }

    const { data: invite, error } = await supabase
      .from('family_invites')
      .insert({ family_id: membership.family_id, created_by: user?.id })
      .select('token')
      .single()

    if (!error && invite) {
      setInviteLink(`${BASE_URL}/join/${invite.token}`)
    }
    setGeneratingInvite(false)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-md flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-stone-900">Ajustes</h1>

      {/* Family sharing */}
      <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-stone-500" />
          <h2 className="text-base font-semibold text-stone-900">Familia compartida</h2>
        </div>

        <p className="text-sm text-stone-500">
          {memberCount > 0
            ? `${memberCount} miembro${memberCount !== 1 ? 's' : ''} en tu familia`
            : 'Cargando...'}
        </p>

        {!inviteLink ? (
          <Button variant="secondary" onClick={generateInvite} disabled={generatingInvite} className="gap-2">
            {generatingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
            {generatingInvite ? 'Generando...' : 'Generar enlace de invitación'}
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-stone-500">Enlace válido por 7 días — compártelo con un miembro de la familia:</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-lg bg-stone-50 text-stone-600 truncate"
              />
              <button
                onClick={copyLink}
                className="px-3 py-2 border border-stone-200 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => { setInviteLink(''); generateInvite() }}
              className="text-xs text-stone-400 hover:text-stone-600 text-left transition-colors"
            >
              Generar otro enlace
            </button>
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-stone-900 mb-4">Cambiar contraseña</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nueva contraseña" id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
          <Input label="Confirmar contraseña" id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repite la contraseña" required />
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">✓ Contraseña actualizada correctamente.</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </Button>
        </form>
      </div>
    </div>
  )
}
