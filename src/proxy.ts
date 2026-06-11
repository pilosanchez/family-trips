import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Root redirect: send to app or bill-splitter depending on auth
  if (path === '/') {
    return NextResponse.redirect(new URL(user ? '/trips' : '/bill-splitter', request.url))
  }

  const isAuthPage = path.startsWith('/auth')
  const isResetPage = path === '/reset-password'
  const isPublic = isAuthPage || isResetPage || path.startsWith('/share') || path.startsWith('/bill-splitter') || path === '/api/receipt'
  const isProtected = !isPublic

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/trips', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
