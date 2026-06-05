import { format, differenceInDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: es })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd MMM yyyy 'a las' HH:mm", { locale: es })
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm')
}

export function tripDuration(startDate: string, endDate: string): number {
  return differenceInDays(parseISO(endDate), parseISO(startDate))
}

export function getTripStatusColor(status: string): string {
  const map: Record<string, string> = {
    planning: 'bg-amber-100 text-amber-800',
    upcoming: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-green-100 text-green-800',
    completed: 'bg-stone-100 text-stone-600',
  }
  return map[status] ?? 'bg-stone-100 text-stone-600'
}

export function getTripStatusLabel(status: string): string {
  const map: Record<string, string> = {
    planning: 'Planificando',
    upcoming: 'Próximo',
    ongoing: 'En Curso',
    completed: 'Finalizado',
  }
  return map[status] ?? status
}

export function getFlightStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    checked_in: 'Check-in',
    boarded: 'Embarcado',
    completed: 'Completado',
    cancelled: 'Cancelado',
  }
  return map[status] ?? status
}

export function getTransportTypeLabel(type: string): string {
  const map: Record<string, string> = {
    transfer: 'Transfer',
    car_rental: 'Auto',
    taxi: 'Taxi',
    bus: 'Bus',
    train: 'Tren',
    ferry: 'Ferry',
    metro: 'Metro',
    other: 'Otro',
  }
  return map[type] ?? type
}

export function getActivityTypeLabel(type: string): string {
  const map: Record<string, string> = {
    tour: 'Tour',
    excursion: 'Excursión',
    restaurant: 'Restaurante',
    museum: 'Museo',
    park: 'Parque',
    show: 'Espectáculo',
    sport: 'Deporte',
    shopping: 'Compras',
    other: 'Otro',
  }
  return map[type] ?? type
}

export function getActivityStatusColor(status: string): string {
  const map: Record<string, string> = {
    to_book: 'bg-amber-100 text-amber-800',
    reserved: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-stone-100 text-stone-600'
}

export function getActivityStatusLabel(status: string): string {
  const map: Record<string, string> = {
    to_book: 'Por Reservar',
    reserved: 'Reservado',
    completed: 'Completado',
    cancelled: 'Cancelado',
  }
  return map[status] ?? status
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency }).format(amount)
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
