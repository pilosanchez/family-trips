export type TripStatus = 'planning' | 'upcoming' | 'ongoing' | 'completed'
export type TripType = 'individual' | 'family'
export type FlightStatus = 'pending' | 'confirmed' | 'checked_in' | 'boarded' | 'completed' | 'cancelled'
export type FlightDirection = 'outbound' | 'return' | 'connection'
export type ActivityStatus = 'to_book' | 'reserved' | 'completed' | 'cancelled'
export type TransportType = 'transfer' | 'car_rental' | 'taxi' | 'bus' | 'train' | 'ferry' | 'metro' | 'other'
export type ExpenseCategory = 'flight' | 'accommodation' | 'transport' | 'food' | 'activity' | 'shopping' | 'health' | 'other'
export type PackingCategory = 'documents' | 'clothing' | 'toiletries' | 'electronics' | 'medications' | 'other'
export type DocumentType = 'passport' | 'id_card' | 'visa' | 'insurance' | 'vaccination' | 'other'

export interface Participant {
  id: string
  user_id: string
  name: string
  photo_url?: string
  document_type?: string
  document_number?: string
  birth_date?: string
  email?: string
  phone?: string
  created_at: string
}

export interface Trip {
  id: string
  user_id: string
  name: string
  destination: string
  destinations?: string[]
  start_date: string
  end_date: string
  cover_image?: string
  status: TripStatus
  trip_type: TripType
  description?: string
  base_currency: string
  total_budget?: number
  created_at: string
  updated_at: string
  trip_participants?: { participant: Participant }[]
}

export interface Flight {
  id: string
  trip_id: string
  airline: string
  flight_number: string
  origin: string
  origin_code?: string
  destination: string
  destination_code?: string
  departure_datetime: string
  arrival_datetime: string
  confirmation_number?: string
  pnr?: string
  class: 'economy' | 'business' | 'first'
  price?: number
  currency: string
  status: FlightStatus
  notes?: string
  file_urls?: string[]
  seats?: { participant_id: string; seat_number: string }[]
  flight_direction: FlightDirection
  created_at: string
}

export interface Accommodation {
  id: string
  trip_id: string
  name: string
  address?: string
  city?: string
  country?: string
  category: number
  checkin_date: string
  checkin_time: string
  checkout_date: string
  checkout_time: string
  reservation_number?: string
  price_per_night?: number
  total_price?: number
  currency: string
  contact_phone?: string
  contact_email?: string
  website?: string
  notes?: string
  file_urls?: string[]
  created_at: string
}

export interface Transport {
  id: string
  trip_id: string
  transport_type: TransportType
  provider?: string
  reservation_number?: string
  from_location: string
  to_location: string
  departure_datetime: string
  arrival_datetime?: string
  price?: number
  currency: string
  maps_url?: string
  notes?: string
  file_urls?: string[]
  created_at: string
}

export interface Activity {
  id: string
  trip_id: string
  name: string
  activity_type: string
  activity_date: string
  start_time?: string
  duration_minutes?: number
  location?: string
  price?: number
  currency: string
  participant_ids?: string[]
  status: ActivityStatus
  reservation_number?: string
  notes?: string
  file_urls?: string[]
  created_at: string
}

export interface Expense {
  id: string
  trip_id: string
  category: ExpenseCategory
  description: string
  amount: number
  currency: string
  expense_date: string
  paid_by?: string
  split_among?: string[]
  receipt_url?: string
  notes?: string
  created_at: string
}

export interface PackingItem {
  id: string
  trip_id: string
  participant_id?: string
  name: string
  category: PackingCategory
  is_packed: boolean
  is_essential: boolean
  quantity: number
  created_at: string
}

export interface ItineraryDay {
  date: string
  flights: Flight[]
  accommodations: Accommodation[]
  transports: Transport[]
  activities: Activity[]
}
