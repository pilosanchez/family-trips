'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Plane, Home, Users, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/trips" className="flex items-center gap-2 font-semibold text-stone-900">
          <Plane className="w-5 h-5" />
          <span>FamilyTrips</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/trips" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${pathname.startsWith('/trips') ? 'bg-stone-100 text-stone-900 font-medium' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}>
            <Home className="w-4 h-4" />
            Viajes
          </Link>
          <Link href="/family" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${pathname === '/family' ? 'bg-stone-100 text-stone-900 font-medium' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}>
            <Users className="w-4 h-4" />
            Familia
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors ml-2"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </header>
  )
}
