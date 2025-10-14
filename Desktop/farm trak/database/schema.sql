-- FarmTrak 360 Database Schema
-- Complete database setup for farm management system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    farm_role TEXT DEFAULT 'farmer', -- farmer, vet, agrovet, admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farms table
CREATE TABLE public.farms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    area_hectares DECIMAL(10, 2),
    farm_type TEXT, -- crop, livestock, mixed
    established_date DATE,
    contact_phone TEXT,
    contact_email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Livestock table
CREATE TABLE public.livestock (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    tag_number TEXT UNIQUE NOT NULL,
    name TEXT,
    species TEXT NOT NULL, -- cattle, sheep, pigs, poultry, etc.
    breed TEXT,
    gender TEXT CHECK (gender IN ('male', 'female')),
    birth_date DATE,
    purchase_date DATE,
    purchase_price DECIMAL(10, 2),
    current_weight DECIMAL(8, 2),
    color TEXT,
    markings TEXT,
    mother_tag TEXT,
    father_tag TEXT,
    health_status TEXT DEFAULT 'healthy', -- healthy, sick, under_treatment
    location TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Livestock health records
CREATE TABLE public.livestock_health (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    livestock_id UUID REFERENCES public.livestock(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    vet_id UUID REFERENCES public.user_profiles(id),
    condition TEXT NOT NULL,
    treatment TEXT,
    medication TEXT,
    dosage TEXT,
    cost DECIMAL(8, 2),
    notes TEXT,
    next_checkup DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crops table
CREATE TABLE public.crops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    variety TEXT,
    field_name TEXT,
    planted_date DATE NOT NULL,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    area_hectares DECIMAL(8, 2),
    seed_quantity DECIMAL(8, 2),
    seed_source TEXT,
    planting_method TEXT,
    irrigation_type TEXT,
    fertilizer_used TEXT,
    pesticide_used TEXT,
    yield_kg DECIMAL(10, 2),
    yield_grade TEXT,
    market_price_per_kg DECIMAL(8, 2),
    total_revenue DECIMAL(12, 2),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crop activities (watering, fertilizing, etc.)
CREATE TABLE public.crop_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    crop_id UUID REFERENCES public.crops(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    activity_type TEXT NOT NULL, -- planting, watering, fertilizing, harvesting, etc.
    description TEXT,
    quantity DECIMAL(8, 2),
    unit TEXT, -- kg, liters, hours, etc.
    cost DECIMAL(8, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Veterinarians table
CREATE TABLE public.veterinarians (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    license_number TEXT UNIQUE,
    specialization TEXT,
    experience_years INTEGER,
    clinic_name TEXT,
    clinic_address TEXT,
    clinic_phone TEXT,
    clinic_email TEXT,
    service_area TEXT, -- radius or specific areas
    emergency_available BOOLEAN DEFAULT false,
    consultation_fee DECIMAL(8, 2),
    is_verified BOOLEAN DEFAULT false,
    rating DECIMAL(3, 2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agrovets (Agricultural suppliers) table
CREATE TABLE public.agrovets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    license_number TEXT,
    owner_name TEXT,
    business_address TEXT,
    business_phone TEXT,
    business_email TEXT,
    business_website TEXT,
    specialization TEXT, -- seeds, fertilizers, equipment, etc.
    service_area TEXT,
    delivery_available BOOLEAN DEFAULT false,
    min_order_amount DECIMAL(8, 2),
    is_verified BOOLEAN DEFAULT false,
    rating DECIMAL(3, 2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products catalog for agrovets
CREATE TABLE public.agrovet_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agrovet_id UUID REFERENCES public.agrovets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- seeds, fertilizers, pesticides, equipment, feed
    brand TEXT,
    description TEXT,
    unit_price DECIMAL(8, 2) NOT NULL,
    unit_type TEXT NOT NULL, -- kg, liters, pieces, etc.
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 10,
    is_available BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Information sharing posts
CREATE TABLE public.shared_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL, -- tips, news, questions, experiences, market
    tags TEXT[], -- array of tags
    image_urls TEXT[],
    is_public BOOLEAN DEFAULT true,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments on shared posts
CREATE TABLE public.info_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.shared_info(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.info_comments(id), -- for nested comments
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table (farmers' contact book)
CREATE TABLE public.contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    contact_type TEXT NOT NULL, -- farmer, vet, agrovet, supplier, buyer
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    last_contact_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments (vet visits, meetings, etc.)
CREATE TABLE public.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    appointment_type TEXT NOT NULL, -- vet_visit, meeting, delivery, consultation
    title TEXT NOT NULL,
    description TEXT,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location TEXT,
    contact_id UUID REFERENCES public.contacts(id),
    vet_id UUID REFERENCES public.veterinarians(id),
    status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled
    reminder_sent BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location tracking for livestock/farm assets
CREATE TABLE public.locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    asset_type TEXT NOT NULL, -- livestock, equipment, field
    asset_id UUID NOT NULL, -- references livestock.id, etc.
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accuracy DECIMAL(8, 2), -- GPS accuracy in meters
    notes TEXT
);

-- User likes on posts
CREATE TABLE public.post_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.shared_info(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Comment likes
CREATE TABLE public.comment_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.info_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, comment_id)
);

-- Create indexes for better performance
CREATE INDEX idx_farms_owner_id ON public.farms(owner_id);
CREATE INDEX idx_livestock_farm_id ON public.livestock(farm_id);
CREATE INDEX idx_livestock_species ON public.livestock(species);
CREATE INDEX idx_crops_farm_id ON public.crops(farm_id);
CREATE INDEX idx_shared_info_category ON public.shared_info(category);
CREATE INDEX idx_shared_info_author ON public.shared_info(author_id);
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_type ON public.contacts(contact_type);
CREATE INDEX idx_locations_asset ON public.locations(asset_type, asset_id);
CREATE INDEX idx_locations_recorded_at ON public.locations(recorded_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_livestock_updated_at BEFORE UPDATE ON public.livestock FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crops_updated_at BEFORE UPDATE ON public.crops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_veterinarians_updated_at BEFORE UPDATE ON public.veterinarians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agrovets_updated_at BEFORE UPDATE ON public.agrovets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agrovet_products_updated_at BEFORE UPDATE ON public.agrovet_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shared_info_updated_at BEFORE UPDATE ON public.shared_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veterinarians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agrovets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agrovet_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.info_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- User profiles: users can view/edit their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- Farms: users can manage their own farms
CREATE POLICY "Users can view own farms" ON public.farms FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create farms" ON public.farms FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own farms" ON public.farms FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own farms" ON public.farms FOR DELETE USING (auth.uid() = owner_id);

-- Livestock: users can manage livestock on their farms
CREATE POLICY "Users can view livestock on their farms" ON public.livestock FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid())
);
CREATE POLICY "Users can manage livestock on their farms" ON public.livestock FOR ALL USING (
    EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid())
);

-- Similar policies for other tables...
CREATE POLICY "Users can manage crops on their farms" ON public.crops FOR ALL USING (
    EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid())
);

CREATE POLICY "Users can view public shared info" ON public.shared_info FOR SELECT USING (is_public = true);
CREATE POLICY "Users can manage own shared info" ON public.shared_info FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Users can view comments on accessible posts" ON public.info_comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shared_info WHERE id = post_id AND (is_public = true OR author_id = auth.uid()))
);
CREATE POLICY "Users can manage own comments" ON public.info_comments FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Users can manage own contacts" ON public.contacts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own appointments" ON public.appointments FOR ALL USING (auth.uid() = user_id);

-- Public read access for verified vets and agrovets
CREATE POLICY "Anyone can view verified veterinarians" ON public.veterinarians FOR SELECT USING (is_verified = true);
CREATE POLICY "Anyone can view verified agrovets" ON public.agrovets FOR SELECT USING (is_verified = true);
CREATE POLICY "Anyone can view agrovet products" ON public.agrovet_products FOR SELECT USING (true);

-- Location tracking policies
CREATE POLICY "Users can view locations of their assets" ON public.locations FOR SELECT USING (
    CASE
        WHEN asset_type = 'livestock' THEN EXISTS (SELECT 1 FROM public.livestock l JOIN public.farms f ON l.farm_id = f.id WHERE l.id = asset_id::uuid AND f.owner_id = auth.uid())
        ELSE false
    END
);

-- Likes policies
CREATE POLICY "Users can manage own likes" ON public.post_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own comment likes" ON public.comment_likes FOR ALL USING (auth.uid() = user_id);

-- Create a function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample data for development
-- Note: Sample user profiles will be created through Supabase Auth
-- The trigger handle_new_user() will automatically create user_profiles entries

-- Sample farm (using a placeholder user ID that should be replaced with actual auth user)
-- INSERT INTO public.farms (id, owner_id, name, description, location, area_hectares, farm_type) VALUES
--     ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Green Valley Farm', 'Mixed crop and livestock farm', 'Nairobi, Kenya', 50.5, 'mixed');

-- Sample livestock (commented out until farms exist)
-- INSERT INTO public.livestock (id, farm_id, tag_number, name, species, breed, gender, birth_date) VALUES
--     ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'GV-001', 'Bessie', 'cattle', 'Holstein', 'female', '2020-03-15'),
--     ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'GV-002', 'Duke', 'cattle', 'Angus', 'male', '2019-08-22');

-- Sample crops (commented out until farms exist)
-- INSERT INTO public.crops (id, farm_id, name, variety, planted_date, area_hectares) VALUES
--     ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Maize', 'Hybrid Variety', '2024-03-01', 20.0),
--     ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Beans', 'Bush Beans', '2024-03-15', 15.0);

-- Sample veterinarian (commented out until user exists)
-- INSERT INTO public.veterinarians (id, user_id, license_number, specialization, clinic_name, clinic_phone) VALUES
--     ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'VET-2024-001', 'Large Animal', 'County Veterinary Clinic', '+254-712-345678');

-- Sample agrovet (commented out until user exists)
-- INSERT INTO public.agrovets (id, user_id, business_name, business_phone, specialization) VALUES
--     ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Farm Supplies Ltd', '+254-733-456789', 'seeds,fertilizers');

-- Sample shared info post (commented out until user exists)
-- INSERT INTO public.shared_info (id, author_id, title, content, category) VALUES
--     ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Best Practices for Maize Farming', 'Here are some tips for successful maize cultivation...', 'tips');
