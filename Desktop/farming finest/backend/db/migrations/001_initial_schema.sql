-- Enable Extensions
create extension if not exists "postgis";
create extension if not exists "uuid-ossp";

-- Enums
create type user_role as enum ('farmer', 'vet', 'agrovet', 'admin');
create type animal_event_type as enum ('weight', 'birth', 'sale', 'milk_yield', 'treatment');
create type notification_type as enum ('alert', 'reminder', 'info');

-- Users & Auth
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  password_hash text,
  role user_role not null,
  name text,
  phone text,
  created_at timestamptz default now(),
  last_login timestamptz
);

-- Farms
create table if not exists farms (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  location text,
  country text,
  currency text default 'USD',
  created_at timestamptz default now()
);

-- Create sex enum
create type animal_sex as enum ('Male', 'Female');

-- Animals with enhanced tracking
create table if not exists animals (
  id uuid primary key default uuid_generate_v4(),
  farmer_id uuid references users(id) on delete cascade,
  tag_number text,
  name text,
  species text,
  breed text,
  dob date,
  sex animal_sex,
  photo_url text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Animal Events (production, health, etc)
create table if not exists animal_events (
  id uuid primary key default uuid_generate_v4(),
  animal_id uuid references animals(id) on delete cascade,
  type animal_event_type not null,
  date date not null default current_date,
  notes text,
  value numeric, -- weight in kg, milk in liters, etc
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- Health Records
create table if not exists health_records (
  id uuid primary key default uuid_generate_v4(),
  animal_id uuid references animals(id) on delete cascade,
  vet_id uuid references users(id),
  date date not null default current_date,
  symptoms text,
  diagnosis text,
  treatment text,
  medications text[],
  notes text,
  next_check_date date,
  created_at timestamptz default now()
);

-- Crops
create table if not exists crops (
  id uuid primary key default uuid_generate_v4(),
  farmer_id uuid references users(id) on delete cascade,
  crop_type text not null,
  area_size numeric,
  area_unit text default 'hectares',
  planted_date date,
  expected_harvest date,
  actual_harvest date,
  status text default 'active',
  notes text,
  created_at timestamptz default now()
);

-- Crop Events (treatments, harvests)
create table if not exists crop_events (
  id uuid primary key default uuid_generate_v4(),
  crop_id uuid references crops(id) on delete cascade,
  event_type text not null,
  date date default current_date,
  description text,
  quantity numeric,
  unit text,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- Feed Management
create table if not exists feeds (
  id uuid primary key default uuid_generate_v4(),
  farmer_id uuid references users(id) on delete cascade,
  name text not null,
  type text,
  stock_quantity numeric not null default 0,
  unit text,
  minimum_stock numeric,
  cost_per_unit numeric,
  supplier_id uuid references users(id),
  created_at timestamptz default now()
);

-- Feed Transactions
create table if not exists feed_transactions (
  id uuid primary key default uuid_generate_v4(),
  feed_id uuid references feeds(id) on delete cascade,
  transaction_type text not null, -- purchase, consumption
  quantity numeric not null,
  unit_price numeric,
  date date default current_date,
  supplier_id uuid references users(id),
  notes text,
  created_at timestamptz default now()
);

-- Vet Profiles
create table if not exists vet_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  qualifications text[],
  services text[],
  working_hours jsonb,
  location geometry(Point,4326),
  address text,
  rating numeric default 0,
  review_count int default 0,
  created_at timestamptz default now()
);

-- Vet Reviews
create table if not exists vet_reviews (
  id uuid primary key default uuid_generate_v4(),
  vet_id uuid references vet_profiles(id) on delete cascade,
  farmer_id uuid references users(id),
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- Agrovet Profiles
create table if not exists agrovet_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  business_name text not null,
  business_type text,
  location geometry(Point,4326),
  address text,
  rating numeric default 0,
  review_count int default 0,
  created_at timestamptz default now()
);

-- Agrovet Inventory
create table if not exists agrovet_inventory (
  id uuid primary key default uuid_generate_v4(),
  agrovet_id uuid references agrovet_profiles(id) on delete cascade,
  product_name text not null,
  category text,
  description text,
  price numeric not null,
  quantity numeric not null default 0,
  unit text,
  minimum_stock numeric,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sales Records
create table if not exists sales (
  id uuid primary key default uuid_generate_v4(),
  farmer_id uuid references users(id) on delete cascade,
  date date default current_date,
  product_type text not null, -- milk, eggs, crops, animals
  product_id uuid, -- reference to specific product if applicable
  quantity numeric not null,
  unit text,
  unit_price numeric not null,
  total_amount numeric not null,
  buyer_info jsonb,
  payment_status text default 'paid',
  notes text,
  created_at timestamptz default now()
);

-- Expenses
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  farmer_id uuid references users(id) on delete cascade,
  date date default current_date,
  category text not null,
  description text,
  amount numeric not null,
  payment_method text,
  receipt_url text,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  content text,
  read boolean default false,
  action_url text,
  triggered_at timestamptz default now()
);

-- Row Level Security Policies
alter table animals enable row level security;
alter table animal_events enable row level security;
alter table health_records enable row level security;
alter table crops enable row level security;
alter table crop_events enable row level security;
alter table feeds enable row level security;
alter table feed_transactions enable row level security;
alter table sales enable row level security;
alter table expenses enable row level security;
alter table notifications enable row level security;

-- RLS Policies
create policy "Users can view their own animals"
  on animals for select
  using (farmer_id = auth.uid());

create policy "Users can insert their own animals"
  on animals for insert
  with check (farmer_id = auth.uid());

create policy "Users can update their own animals"
  on animals for update
  using (farmer_id = auth.uid());

create policy "Users can view their own crops"
  on crops for select
  using (farmer_id = auth.uid());

create policy "Users can view their own feeds"
  on feeds for select
  using (farmer_id = auth.uid());

create policy "Users can view their own sales"
  on sales for select
  using (farmer_id = auth.uid());

create policy "Users can view their own expenses"
  on expenses for select
  using (farmer_id = auth.uid());

-- Indexes for performance
create index idx_animals_farmer on animals(farmer_id);
create index idx_animal_events_animal on animal_events(animal_id);
create index idx_health_records_animal on health_records(animal_id);
create index idx_crops_farmer on crops(farmer_id);
create index idx_feeds_farmer on feeds(farmer_id);
create index idx_sales_farmer on sales(farmer_id);
create index idx_expenses_farmer on expenses(farmer_id);

-- Grant necessary permissions
ALTER TABLE users SECURITY DEFINER;
ALTER TABLE animal_events SECURITY DEFINER;
ALTER TABLE health_records SECURITY DEFINER;
ALTER TABLE animals SECURITY DEFINER;
ALTER TABLE crops SECURITY DEFINER;
ALTER TABLE feeds SECURITY DEFINER;
ALTER TABLE vet_profiles SECURITY DEFINER;
ALTER TABLE agrovet_profiles SECURITY DEFINER;