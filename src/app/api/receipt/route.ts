import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json()

    if (!imageBase64 || !mediaType) {
      return NextResponse.json({ error: 'Se requiere imagen' }, { status: 400 })
    }

    const key = process.env.ANTHROPIC_API_KEY ?? ''
    if (!key.startsWith('sk-ant-') || key.includes(' ')) {
      return NextResponse.json({ error: `API key inválida (largo: ${key.length}, inicio: ${key.slice(0, 10)})` }, { status: 500 })
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: 'You are a receipt parser. You ALWAYS respond with ONLY valid JSON — no text before or after, no markdown, no explanation. Never refuse.',
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
              text: `Extract all line items from this receipt.
Respond with ONLY this JSON format, nothing else:
{"items":[{"name":"item name","qty":1,"price":0.00}]}

Rules:
- "price" = total for that line (qty × unit price)
- "qty" = number of units (default 1). Example: "4x Jugo $8.00" → qty:4, price:8.00
- Exclude subtotals, taxes, tips, service charges, totals
- If image is unclear, sideways, or not a receipt → return {"items":[]}
- ONLY the raw JSON object, no other text`,
            },
          ],
        },
      ],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // Extract JSON — handle cases where model wraps it in backticks
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ items: [] })
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({ items: [] })
    }
  } catch (error) {
    const name = error instanceof Error ? error.constructor.name : 'Unknown'
    const msg = error instanceof Error ? error.message.slice(0, 120) : String(error).slice(0, 120)
    console.error('Receipt OCR error:', name, msg)
    return NextResponse.json({ error: `${name}: ${msg}` }, { status: 500 })
  }
}
