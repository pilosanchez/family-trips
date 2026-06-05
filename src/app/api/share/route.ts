import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { trip_id } = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Generate a simple token: base64 of trip_id + timestamp
  const token = Buffer.from(`${trip_id}:${Date.now()}`).toString('base64url')

  // Store the share token in trip description or a simple approach: encode trip_id in token
  // For simplicity, the token IS the base64 of the trip_id
  const shareToken = Buffer.from(trip_id).toString('base64url')

  return NextResponse.json({ token: shareToken, url: `/share/${shareToken}` })
}
