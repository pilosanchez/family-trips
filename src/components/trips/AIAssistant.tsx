'use client'

import { useState } from 'react'
import { Sparkles, Send, X } from 'lucide-react'
import { Trip, Flight, Accommodation, Activity } from '@/types'

const QUICK_PROMPTS = [
  '¿Qué documentos necesito para este viaje?',
  'Sugerencias de actividades para hacer en el destino',
  '¿Qué debo llevar en la maleta según el clima?',
  'Detecta conflictos de horario en mi itinerario',
  'Resume el itinerario completo del viaje',
  '¿Qué vacunas o requisitos de entrada necesito?',
]

interface AIAssistantProps {
  trip: Trip
  flights: Flight[]
  accommodations: Accommodation[]
  activities: Activity[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AIAssistant({ trip, flights, accommodations, activities }: AIAssistantProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async (question: string) => {
    if (!question.trim()) return
    const userMsg: Message = { role: 'user', content: question }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip, flights, accommodations, activities, question }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response ?? data.error }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar con el asistente.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-stone-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-stone-700 transition-all hover:scale-105 z-40"
        title="Asistente IA"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col z-50" style={{ height: '520px' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-stone-700" />
              <span className="text-sm font-semibold text-stone-900">Asistente de Viaje</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div>
                <p className="text-xs text-stone-400 mb-3 text-center">Pregunta cualquier cosa sobre tu viaje a {trip.destination}</p>
                <div className="space-y-2">
                  {QUICK_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(p)}
                      className="w-full text-left text-xs px-3 py-2 bg-stone-50 hover:bg-stone-100 rounded-lg text-stone-600 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-stone-900 text-white rounded-br-sm'
                      : 'bg-stone-100 text-stone-800 rounded-bl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-stone-100 px-3 py-2 rounded-xl rounded-bl-sm">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-stone-100">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 placeholder:text-stone-400"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
