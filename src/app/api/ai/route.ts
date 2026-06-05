import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { trip, flights, accommodations, activities, question } = await req.json()

    const context = `
Viaje: ${trip.name} a ${trip.destination}
Fechas: ${trip.start_date} al ${trip.end_date}
Tipo: ${trip.trip_type === 'family' ? 'Familiar' : 'Individual'}
${flights?.length ? `Vuelos: ${flights.map((f: any) => `${f.airline} ${f.flight_number} (${f.origin} → ${f.destination})`).join(', ')}` : ''}
${accommodations?.length ? `Alojamiento: ${accommodations.map((a: any) => `${a.name} en ${a.city}`).join(', ')}` : ''}
${activities?.length ? `Actividades: ${activities.map((a: any) => a.name).join(', ')}` : ''}
`.trim()

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `Eres un asistente de viajes experto y amigable. Ayudas a familias a planificar y organizar sus viajes de manera práctica. Responde siempre en español, de forma concisa y útil. Usa listas cuando sea apropiado.`,
      messages: [
        {
          role: 'user',
          content: `Contexto del viaje:\n${context}\n\nPregunta: ${question}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ response: text })
  } catch (error) {
    console.error('AI error:', error)
    return NextResponse.json({ error: 'Error al consultar el asistente' }, { status: 500 })
  }
}
