-- Farm360 Pro Database Schema
-- PostgreSQL database for farm management system

-- Users table (both farmers and vets)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    user_type VARCHAR(20) CHECK (user_type IN ('farmer', 'vet')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Veterinarians table (extended info for vets)
CREATE TABLE veterinarians (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    clinic_name VARCHAR(255),
    specialization VARCHAR(255),
    license_number VARCHAR(100),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    rating DECIMAL(3, 2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Animals table
CREATE TABLE animals (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- cow, sheep, goat, pig, etc.
    breed VARCHAR(100),
    date_of_birth DATE,
    weight DECIMAL(8, 2), -- in kg
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    photo_url TEXT,
    tag_number VARCHAR(50) UNIQUE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'deceased')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calves table (for tracking calf information)
CREATE TABLE calves (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    date_born DATE NOT NULL,
    nursing_duration INTEGER, -- in days
    weaning_date DATE,
    mother_id INTEGER REFERENCES animals(id),
    birth_weight DECIMAL(8, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pregnancies table
CREATE TABLE pregnancies (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'overdue')),
    assigned_vet_id INTEGER REFERENCES veterinarians(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feeds table
CREATE TABLE feeds (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    feed_type VARCHAR(100) NOT NULL,
    quantity DECIMAL(8, 2) NOT NULL, -- in kg
    unit VARCHAR(20) DEFAULT 'kg',
    feeding_time TIME,
    date DATE DEFAULT CURRENT_DATE,
    supplements TEXT, -- JSON array of supplements
    cost DECIMAL(8, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crops table
CREATE TABLE crops (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- corn, wheat, vegetables, etc.
    planting_date DATE NOT NULL,
    expected_harvest_date DATE,
    area DECIMAL(8, 2), -- in hectares or acres
    status VARCHAR(20) DEFAULT 'growing' CHECK (status IN ('planted', 'growing', 'harvested', 'failed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Produce table
CREATE TABLE produce (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    crop_id INTEGER REFERENCES crops(id) ON DELETE SET NULL,
    animal_id INTEGER REFERENCES animals(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- crop, milk, eggs, meat, etc.
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- kg, liters, pieces, etc.
    harvest_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    quality_grade VARCHAR(20),
    storage_location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Health records table
CREATE TABLE health_records (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    vet_id INTEGER REFERENCES veterinarians(id),
    visit_date DATE NOT NULL,
    diagnosis TEXT,
    treatment TEXT,
    medications TEXT, -- JSON array of medications
    vaccination BOOLEAN DEFAULT false,
    next_checkup_date DATE,
    cost DECIMAL(8, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    location_coordinates TEXT, -- JSON for lat/lng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id),
    produce_id INTEGER REFERENCES produce(id),
    product_name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(8, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    amount_pending DECIMAL(10, 2) DEFAULT 0,
    sale_date DATE DEFAULT CURRENT_DATE,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'partial', 'pending')),
    payment_due_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplements table (for detailed supplement tracking)
CREATE TABLE supplements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50), -- vitamin, mineral, protein, etc.
    unit VARCHAR(20) DEFAULT 'grams',
    cost_per_unit DECIMAL(8, 2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_animals_farmer_id ON animals(farmer_id);
CREATE INDEX idx_animals_type ON animals(type);
CREATE INDEX idx_crops_farmer_id ON crops(farmer_id);
CREATE INDEX idx_produce_farmer_id ON produce(farmer_id);
CREATE INDEX idx_produce_type ON produce(type);
CREATE INDEX idx_sales_farmer_id ON sales(farmer_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_health_records_animal_id ON health_records(animal_id);
CREATE INDEX idx_feeds_animal_id ON feeds(animal_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_animals_updated_at BEFORE UPDATE ON animals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_veterinarians_updated_at BEFORE UPDATE ON veterinarians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crops_updated_at BEFORE UPDATE ON crops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pregnancies_updated_at BEFORE UPDATE ON pregnancies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON health_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
