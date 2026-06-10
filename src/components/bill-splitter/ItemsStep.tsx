'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { BillItem } from './ReceiptStep'

interface Props {
  items: BillItem[]
  onItemsChange: (items: BillItem[]) => void
  tip: number
  tipType: 'percent' | 'fixed'
  onTipChange: (tip: number, type: 'percent' | 'fixed') => void
  onBack: () => void
  onNext: () => void
}

export function ItemsStep({ items, onItemsChange, tip, tipType, onTipChange, onBack, onNext }: Props) {
  const subtotal = items.reduce((s, it) => s + (Number(it.price) || 0), 0)
  const tipAmount = tipType === 'percent' ? subtotal * (tip / 100) : Number(tip) || 0
  const total = subtotal + tipAmount

  const updateItem = (id: string, field: 'name' | 'price', value: string | number) => {
    onItemsChange(items.map(it => it.id === id ? { ...it, [field]: value } : it))
  }

  const removeItem = (id: string) => {
    onItemsChange(items.filter(it => it.id !== id))
  }

  const addItem = () => {
    onItemsChange([...items, { id: `manual-${Date.now()}`, name: '', price: 0 }])
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_100px_32px] gap-2 text-xs text-stone-400 font-medium px-1">
          <span>Item</span>
          <span>Precio</span>
          <span />
        </div>
        {items.map(item => (
          <div key={item.id} className="grid grid-cols-[1fr_100px_32px] gap-2 items-center">
            <input
              type="text"
              value={item.name}
              onChange={e => updateItem(item.id, 'name', e.target.value)}
              placeholder="Nombre del item"
              className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.price || ''}
              onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
            <button
              onClick={() => removeItem(item.id)}
              className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addItem}
          className="text-xs text-stone-400 hover:text-stone-700 text-left px-1 pt-1 transition-colors"
        >
          + Agregar item
        </button>
      </div>

      <div className="border border-stone-200 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-sm font-medium text-stone-700">Propina</p>
        <div className="flex gap-2">
          <div className="flex border border-stone-200 rounded-lg overflow-hidden text-sm">
            <button
              onClick={() => onTipChange(tip, 'percent')}
              className={`px-3 py-1.5 transition-colors ${tipType === 'percent' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'}`}
            >
              %
            </button>
            <button
              onClick={() => onTipChange(tip, 'fixed')}
              className={`px-3 py-1.5 transition-colors ${tipType === 'fixed' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'}`}
            >
              $
            </button>
          </div>
          <input
            type="number"
            min="0"
            step={tipType === 'percent' ? '1' : '0.01'}
            value={tip || ''}
            onChange={e => onTipChange(parseFloat(e.target.value) || 0, tipType)}
            placeholder={tipType === 'percent' ? '10' : '0.00'}
            className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>
        <div className="flex gap-2">
          {[10, 15, 18, 20].map(pct => (
            <button
              key={pct}
              onClick={() => onTipChange(pct, 'percent')}
              className={`px-3 py-1 text-xs rounded-lg border transition-colors ${tipType === 'percent' && tip === pct ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      <div className="bg-stone-50 rounded-xl p-4 flex flex-col gap-2 text-sm">
        <div className="flex justify-between text-stone-500">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-stone-500">
          <span>Propina ({tipType === 'percent' ? `${tip}%` : 'fija'})</span>
          <span>${tipAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-stone-900 pt-2 border-t border-stone-200">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1 justify-center">
          Atrás
        </Button>
        <Button onClick={onNext} disabled={items.length === 0 || total === 0} className="flex-1 justify-center">
          Continuar
        </Button>
      </div>
    </div>
  )
}
