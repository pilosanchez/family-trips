import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json()

    if (!imageBase64 || !mediaType) {
      return NextResponse.json({ error: 'Se requiere imagen' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Extrae los items de esta cuenta de restaurante. Devuelve SOLO JSON válido sin texto adicional, con este formato exacto: {"items":[{"name":"nombre del item","qty":1,"price":0.00}]}. El campo "price" es el precio TOTAL de esa línea (cantidad × precio unitario). El campo "qty" es la cantidad de unidades (por defecto 1). Si dice "4x Jugo $8.00", devuelve qty:4 y price:8.00. Excluye subtotales, impuestos, propinas y totales. Solo incluye los items/platos individuales.',
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'No se pudo leer el ticket. Intenta con una foto más clara.' }, { status: 422 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Receipt OCR error:', error)
    return NextResponse.json({ error: 'Error al procesar el ticket' }, { status: 500 })
  }
}
