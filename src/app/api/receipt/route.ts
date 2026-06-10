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
      system: 'You are a receipt parser. Only extract what is clearly visible in the image. Never invent, guess or hallucinate items. Respond ONLY with raw JSON — no markdown, no explanation.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `Look at this receipt image carefully. Extract ONLY the line items that you can actually read in the image.

Return ONLY this JSON format:
{"items":[{"name":"exact name from receipt","qty":1,"price":0.00}]}

Rules:
- "price" = total for that line (qty × unit price)
- "qty" = quantity shown (default 1)
- ONLY include items you can clearly read — do NOT invent or guess
- Exclude subtotals, taxes, tips, totals
- If image is unreadable or not a receipt → return {"items":[]}
- Raw JSON only, nothing else`,
            },
          ],
        },
      ],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ items: [] })

    try {
      return NextResponse.json(JSON.parse(jsonMatch[0]))
    } catch {
      return NextResponse.json({ items: [] })
    }
  } catch (error) {
    console.error('Receipt OCR error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Error al conectar con el lector. Intenta de nuevo.' }, { status: 500 })
  }
}
