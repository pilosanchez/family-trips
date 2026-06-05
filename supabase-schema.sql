-- FamilyTrips Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Participants (family members)
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  document_type TEXT DEFAULT 'passport',
  document_number TEXT,
  birth_date DATE,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  destinations TEXT[], -- multiple destinations
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_image TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'upcoming', 'ongoing', 'completed')),
  trip_type TEXT DEFAULT 'family' CHECK (trip_type IN ('individual', 'family')),
  description TEXT,
  base_currency TEXT DEFAULT 'USD',
  total_budget DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip participants (many-to-many)
CREATE TABLE trip_participants (
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  PRIMARY KEY (trip_id, participant_id)
);

-- Flights
CREATE TABLE flights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  airline TEXT NOT NULL,
  flight_number TEXT NOT NULL,
  origin TEXT NOT NULL,
  origin_code TEXT,
  destination TEXT NOT NULL,
  destination_code TEXT,
  departure_datetime TIMESTAMPTZ NOT NULL,
  arrival_datetime TIMESTAMPTZ NOT NULL,
  confirmation_number TEXT,
  pnr TEXT,
  class TEXT DEFAULT 'economy' CHECK (class IN ('economy', 'business', 'first')),
  price DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'boarded', 'completed', 'cancelled')),
  notes TEXT,
  file_urls TEXT[],
  seats JSONB DEFAULT '[]', -- [{participant_id, seat_number}]
  flight_direction TEXT DEFAULT 'outbound' CHECK (flight_direction IN ('outbound', 'return', 'connection')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accommodations
CREATE TABLE accommodations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  category INTEGER DEFAULT 3 CHECK (category BETWEEN 1 AND 5),
  checkin_date DATE NOT NULL,
  checkin_time TIME DEFAULT '14:00',
  checkout_date DATE NOT NULL,
  checkout_time TIME DEFAULT '11:00',
  reservation_number TEXT,
  price_per_night DECIMAL(12,2),
  total_price DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,
  notes TEXT,
  file_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Local transports
CREATE TABLE transports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  transport_type TEXT NOT NULL CHECK (transport_type IN ('transfer', 'car_rental', 'taxi', 'bus', 'train', 'ferry', 'metro', 'other')),
  provider TEXT,
  reservation_number TEXT,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  departure_datetime TIMESTAMPTZ NOT NULL,
  arrival_datetime TIMESTAMPTZ,
  price DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  maps_url TEXT,
  notes TEXT,
  file_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  activity_type TEXT DEFAULT 'other' CHECK (activity_type IN ('tour', 'excursion', 'restaurant', 'museum', 'park', 'show', 'sport', 'shopping', 'other')),
  activity_date DATE NOT NULL,
  start_time TIME,
  duration_minutes INTEGER,
  location TEXT,
  price DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  participant_ids UUID[],
  status TEXT DEFAULT 'to_book' CHECK (status IN ('to_book', 'reserved', 'completed', 'cancelled')),
  reservation_number TEXT,
  notes TEXT,
  file_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('flight', 'accommodation', 'transport', 'food', 'activity', 'shopping', 'health', 'other')),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  expense_date DATE NOT NULL,
  paid_by UUID REFERENCES participants(id),
  split_among UUID[],
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packing items
CREATE TABLE packing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN ('documents', 'clothing', 'toiletries', 'electronics', 'medications', 'other')),
  is_packed BOOLEAN DEFAULT FALSE,
  is_essential BOOLEAN DEFAULT FALSE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emergency info
CREATE TABLE emergency_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE UNIQUE,
  insurance_provider TEXT,
  insurance_policy TEXT,
  insurance_phone TEXT,
  embassy_info JSONB DEFAULT '[]', -- [{country, address, phone}]
  local_emergency_numbers JSONB DEFAULT '{}', -- {police, ambulance, fire}
  hospital_info TEXT,
  important_contacts JSONB DEFAULT '[]', -- [{name, relation, phone}]
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participant documents
CREATE TABLE participant_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('passport', 'id_card', 'visa', 'insurance', 'vaccination', 'other')),
  doc_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users only see their own data)
CREATE POLICY "Users own participants" ON participants FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own trips" ON trips FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own trip_participants via trip" ON trip_participants FOR ALL
  USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_participants.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "Users own flights via trip" ON flights FOR ALL
  USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = flights.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "Users own accommodations via trip" ON accommodations FOR ALL
  USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = accommodations.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "Users own transports via trip" ON transports FOR ALL
  USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = transports.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "Users own activities via trip" ON activities FOR ALL
  USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = activities.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "Users own expenses via trip" ON expenses FOR ALL
  USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = expenses.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "Users own packing_items via trip" ON packing_items FOR ALL
  USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = packing_items.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "Users own emergency_info via trip" ON emergency_info FOR ALL
  USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = emergency_info.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "Users own participant_documents" ON participant_documents FOR ALL
  USING (EXISTS (SELECT 1 FROM participants WHERE participants.id = participant_documents.participant_id AND participants.user_id = auth.uid()));
