'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function JoinFamilyPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [familyName, setFamilyName] = useState('')
  const [inviteId, setInviteId] = useState('')
  const [familyId, setFamilyId] = useState('')
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const [{ data: { user } }, { data: invite, error: inviteError }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('family_invites')
          .select('id, family_id, expires_at, used_by, families(name)')
          .eq('token', token)
          .single(),
      ])

      setUser(user)

      if (inviteError || !invite) {
        setError('Invitación inválida.')
      } else if (invite.used_by) {
        setError('Esta invitación ya fue usada.')
      } else if (new Date(invite.expires_at) < new Date()) {
        setError('Esta invitación expiró.')
      } else {
        setInviteId(invite.id)
        setFamilyId(invite.family_id)
        setFamilyName((invite.families as { name: string })?.name ?? 'Mi Familia')
      }
      setLoading(false)
    }
    load()
  }, [token])

  const handleJoin = async () => {
    if (!user) {
      router.push(`/auth?next=/join/${token}`)
      return
    }

    setJoining(true)

    // Check if already in this family
    const { data: existing } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      setDone(true)
      setJoining(false)
      return
    }

    // Remove user from their auto-created solo family (if they're the sole owner)
    const { data: myMemberships } = await supabase
      .from('family_members')
      .select('family_id, families(owner_id)')
      .eq('user_id', user.id)

    for (const m of myMemberships ?? []) {
      const { count } = await supabase
        .from('family_members')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', m.family_id)

      const isOwner = (m.families as { owner_id: string })?.owner_id === user.id
      if (count === 1 && isOwner) {
        await supabase.from('families').delete().eq('id', m.family_id)
      }
    }

    // Join the family
    const { error: joinError } = await supabase
      .from('family_members')
      .insert({ family_id: familyId, user_id: user.id, role: 'member' })

    if (joinError) {
      setError(`Error al unirse: ${joinError.message}`)
      setJoining(false)
      return
    }

    // Mark invite as used
    await supabase.from('family_invites').update({ used_by: user.id }).eq('id', inviteId)

    setDone(true)
    setJoining(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fafaf9' }}>
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#fafaf9' }}>
      <div className="w-full max-w-sm">
        <div className="card p-8 flex flex-col items-center gap-5 text-center">
          {done ? (
            <>
              <CheckCircle className="w-12 h-12 text-emerald-500" />
              <div>
                <p className="text-lg font-semibold text-stone-900">¡Ya eres parte de la familia!</p>
                <p className="text-sm text-stone-500 mt-1">Ahora puedes ver y editar todos los datos compartidos.</p>
              </div>
              <Button onClick={() => router.push('/trips')} className="w-full justify-center">
                Ir a mis viajes
              </Button>
            </>
          ) : error ? (
            <>
              <AlertCircle className="w-12 h-12 text-red-400" />
              <div>
                <p className="text-lg font-semibold text-stone-900">Invitación no válida</p>
                <p className="text-sm text-stone-500 mt-1">{error}</p>
              </div>
              <Link href="/" className="text-sm text-stone-500 hover:text-stone-800 underline underline-offset-2">
                Ir al inicio
              </Link>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold text-stone-900">Invitación a unirte</p>
                <p className="text-2xl font-bold text-stone-900 mt-1">{familyName}</p>
              </div>

              {user ? (
                <div className="w-full flex flex-col gap-3">
                  <p className="text-xs text-stone-400">Entrando como <span className="text-stone-600 font-medium">{user.email}</span></p>
                  <Button onClick={handleJoin} disabled={joining} className="w-full justify-center">
                    {joining ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uniéndome...</> : 'Unirme a la familia'}
                  </Button>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-3">
                  <p className="text-sm text-stone-500">Para unirte necesitas iniciar sesión o crear una cuenta.</p>
                  <Button onClick={handleJoin} className="w-full justify-center">
                    Iniciar sesión / Registrarse
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
