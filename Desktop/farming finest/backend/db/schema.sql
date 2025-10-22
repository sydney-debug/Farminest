-- Schema for Farming Finest (Supabase / Postgres)
-- Run this in Supabase SQL editor or via psql

create table if not exists farmers (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  created_at timestamptz default now()
);

create table if not exists animals (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references farmers(id) on delete cascade,
  name text,
  species text,
  breed text,
  dob date,
  notes text,
  image_path text,
  created_at timestamptz default now()
);

create table if not exists health_records (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animals(id) on delete cascade,
  recorded_by uuid references farmers(id),
  date date default current_date,
  weight numeric,
  condition text,
  treatments text,
  notes text
);

create table if not exists crops (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references farmers(id) on delete cascade,
  name text,
  area_ha numeric,
  planted date,
  harvest_est date,
  notes text
);

create table if not exists feeds (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references farmers(id) on delete cascade,
  name text,
  quantity numeric,
  unit text,
  threshold numeric,
  notes text
);

create table if not exists vets (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  email text,
  latitude double precision,
  longitude double precision,
  address text,
  created_at timestamptz default now()
);

create table if not exists agrovets (
  id uuid primary key default gen_random_uuid(),
  name text,
  owner text,
  phone text,
  email text,
  address text,
  created_at timestamptz default now()
);

create table if not exists agrovet_products (
  id uuid primary key default gen_random_uuid(),
  agrovet_id uuid references agrovets(id) on delete cascade,
  name text,
  description text,
  price numeric,
  image_path text
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references farmers(id),
  item text,
  amount numeric,
  currency text default 'USD',
  date date default current_date,
  notes text
);
