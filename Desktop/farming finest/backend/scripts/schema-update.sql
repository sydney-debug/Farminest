-- Drop existing tables if they exist
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS agrovet_inventory;
DROP TABLE IF EXISTS agrovet_profiles;
DROP TABLE IF EXISTS vet_reviews;
DROP TABLE IF EXISTS vet_profiles;
DROP TABLE IF EXISTS feed_transactions;
DROP TABLE IF EXISTS feeds;
DROP TABLE IF EXISTS crop_events;
DROP TABLE IF EXISTS crops;
DROP TABLE IF EXISTS animal_events;
DROP TABLE IF EXISTS health_records;
DROP TABLE IF EXISTS animals;
DROP TABLE IF EXISTS farms CASCADE;
DROP TABLE IF EXISTS users;

-- Drop existing types
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS animal_event_type;
DROP TYPE IF EXISTS notification_type;
DROP TYPE IF EXISTS animal_sex;

-- Create enums
CREATE TYPE user_role AS ENUM ('farmer', 'vet', 'agrovet', 'admin');
CREATE TYPE animal_event_type AS ENUM ('weight', 'birth', 'sale', 'milk_yield', 'treatment');
CREATE TYPE notification_type AS ENUM ('alert', 'reminder', 'info');
CREATE TYPE animal_sex AS ENUM ('Male', 'Female');

-- Create tables
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role user_role NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE TABLE animals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  tag_number TEXT,
  name TEXT,
  species TEXT,
  breed TEXT,
  dob DATE,
  sex animal_sex,
  photo_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE animal_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id uuid REFERENCES animals(id) ON DELETE CASCADE,
  type animal_event_type NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  value NUMERIC,
  created_by uuid REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE health_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id uuid REFERENCES animals(id) ON DELETE CASCADE,
  vet_id uuid REFERENCES users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  symptoms TEXT,
  diagnosis TEXT,
  treatment TEXT,
  medications TEXT[],
  notes TEXT,
  next_check_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crops (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  crop_type TEXT NOT NULL,
  area_size NUMERIC,
  area_unit TEXT DEFAULT 'hectares',
  planted_date DATE,
  expected_harvest DATE,
  actual_harvest DATE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE feeds (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  stock_quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  minimum_stock NUMERIC,
  cost_per_unit NUMERIC,
  supplier_id uuid REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vet_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  qualifications TEXT[],
  services TEXT[],
  working_hours JSONB,
  location GEOMETRY(Point,4326),
  address TEXT,
  rating NUMERIC DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agrovet_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT,
  location GEOMETRY(Point,4326),
  address TEXT,
  rating NUMERIC DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agrovet_inventory (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agrovet_id uuid REFERENCES agrovet_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_animals_farmer ON animals(farmer_id);
CREATE INDEX idx_animal_events_animal ON animal_events(animal_id);
CREATE INDEX idx_health_records_animal ON health_records(animal_id);
CREATE INDEX idx_crops_farmer ON crops(farmer_id);
CREATE INDEX idx_feeds_farmer ON feeds(farmer_id);

-- Enable RLS
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agrovet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agrovet_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own animals"
  ON animals FOR SELECT
  USING (farmer_id = auth.uid());

CREATE POLICY "Users can insert their own animals"
  ON animals FOR INSERT
  WITH CHECK (farmer_id = auth.uid());

CREATE POLICY "Users can update their own animals"
  ON animals FOR UPDATE
  USING (farmer_id = auth.uid());