'use client'

import { useState, useEffect } from 'react'
import { Plane } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError('El link expiró o es inválido. Solicita uno nuevo.')
        else setReady(true)
      })
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true)
        else setError('Link inválido. Solicita un nuevo link desde el login.')
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 6) { setError('Mínimo 6 caracteres.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/trips')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#fafaf9' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-900 rounded-xl mb-4">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Nueva contraseña</h1>
          <p className="text-stone-500 text-sm mt-1">Elige una contraseña segura</p>
        </div>

        <div className="card p-6">
          {!ready && !error && (
            <p className="text-sm text-stone-500 text-center py-4">Verificando link...</p>
          )}
          {error && !ready && (
            <div>
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
              <Button variant="secondary" className="w-full justify-center" onClick={() => router.push('/auth')}>
                Volver al login
              </Button>
            </div>
          )}
          {ready && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input label="Nueva contraseña" id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required autoFocus />
              <Input label="Confirmar contraseña" id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repite la contraseña" required />
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full justify-center mt-1">
                {loading ? 'Guardando...' : 'Guardar contraseña'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
