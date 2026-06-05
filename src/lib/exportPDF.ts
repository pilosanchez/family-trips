import jsPDF from 'jspdf'
import { Trip, Flight, Accommodation, Transport, Activity } from '@/types'
import { formatDate, formatTime, getTransportTypeLabel, getActivityTypeLabel } from './utils'
import { eachDayOfInterval, parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'

export function exportItineraryPDF(
  trip: Trip,
  flights: Flight[],
  accommodations: Accommodation[],
  transports: Transport[],
  activities: Activity[]
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 15
  let y = margin

  const addLine = (text: string, size = 10, bold = false, indent = 0, color: [number,number,number] = [28,25,23]) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, W - margin * 2 - indent)
    lines.forEach((line: string) => {
      if (y > 275) { doc.addPage(); y = margin }
      doc.text(line, margin + indent, y)
      y += size * 0.45
    })
    y += 1
  }

  const addDivider = (color: [number,number,number] = [231,229,228]) => {
    doc.setDrawColor(...color)
    doc.line(margin, y, W - margin, y)
    y += 4
  }

  const addSection = (emoji: string, title: string) => {
    if (y > 255) { doc.addPage(); y = margin }
    y += 3
    addLine(`${emoji}  ${title}`, 11, true, 0, [28,25,23])
    addDivider([200,200,200])
  }

  // Header
  doc.setFillColor(28, 25, 23)
  doc.rect(0, 0, W, 28, 'F')
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(trip.name, margin, 13)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`${trip.destination}  ·  ${formatDate(trip.start_date)} — ${formatDate(trip.end_date)}`, margin, 21)
  y = 36

  // Days
  const allDays = eachDayOfInterval({ start: parseISO(trip.start_date), end: parseISO(trip.end_date) })

  allDays.forEach((day, i) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayFlights = flights.filter(f => f.departure_datetime.startsWith(dateStr))
    const dayAccs = accommodations.filter(a => a.checkin_date === dateStr || a.checkout_date === dateStr)
    const dayTrans = transports.filter(t => t.departure_datetime.startsWith(dateStr))
    const dayActs = activities.filter(a => a.activity_date === dateStr)

    const hasContent = dayFlights.length + dayAccs.length + dayTrans.length + dayActs.length > 0
    if (!hasContent) return

    const dayLabel = format(day, "EEEE d 'de' MMMM", { locale: es })
    if (y > 255) { doc.addPage(); y = margin }

    // Day header
    doc.setFillColor(250, 250, 249)
    doc.roundedRect(margin, y, W - margin * 2, 7, 1, 1, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(120, 113, 108)
    doc.text(`DÍA ${i + 1}  ·  ${dayLabel.toUpperCase()}`, margin + 3, y + 4.5)
    y += 10

    dayFlights.forEach(f => {
      addLine(`✈  ${f.airline} ${f.flight_number}  ${f.origin} → ${f.destination}`, 9, true, 2)
      addLine(`${formatTime(f.departure_datetime)} → ${formatTime(f.arrival_datetime)}${f.confirmation_number ? `  |  Conf: ${f.confirmation_number}` : ''}`, 8, false, 5, [120,113,108])
      y += 1
    })

    dayAccs.forEach(a => {
      const tag = a.checkin_date === dateStr ? 'Check-in' : 'Check-out'
      addLine(`🏨  ${a.name}  [${tag}]`, 9, true, 2)
      if (a.address) addLine(a.address, 8, false, 5, [120,113,108])
      y += 1
    })

    dayTrans.forEach(t => {
      addLine(`🚗  ${getTransportTypeLabel(t.transport_type)}${t.provider ? `  ·  ${t.provider}` : ''}`, 9, true, 2)
      addLine(`${t.from_location} → ${t.to_location}  |  ${formatTime(t.departure_datetime)}`, 8, false, 5, [120,113,108])
      y += 1
    })

    dayActs.forEach(a => {
      addLine(`📍  ${a.name}`, 9, true, 2)
      addLine(`${getActivityTypeLabel(a.activity_type)}${a.start_time ? `  |  ${a.start_time}` : ''}${a.location ? `  |  ${a.location}` : ''}`, 8, false, 5, [120,113,108])
      y += 1
    })

    y += 3
  })

  // Footer
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    doc.text(`FamilyTrips  ·  ${trip.name}  ·  Página ${p} de ${pages}`, margin, 292)
  }

  doc.save(`itinerario-${trip.name.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}
