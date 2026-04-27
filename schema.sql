-- Create tables for Delivery Management System

-- Owners table (for system owner)
CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employers table
CREATE TABLE IF NOT EXISTS employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  id_number TEXT NOT NULL,
  id_pic TEXT,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  id_number TEXT NOT NULL,
  id_pic TEXT,
  license_number TEXT NOT NULL,
  license_pic TEXT,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Types table
CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  product_type_id UUID REFERENCES product_types(id),
  city_id UUID REFERENCES cities(id),
  employer_id UUID REFERENCES employers(id),
  assigned_driver_id UUID REFERENCES drivers(id),
  status TEXT DEFAULT 'Pending',
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Create policies for tables (all operations allowed for authenticated users)
-- Owners: all access
CREATE POLICY "Owners full access" ON owners FOR ALL USING (true);

-- Employers: all access
CREATE POLICY "Employers full access" ON employers FOR ALL USING (true);

-- Drivers: all access
CREATE POLICY "Drivers full access" ON drivers FOR ALL USING (true);

-- Cities: all access
CREATE POLICY "Cities full access" ON cities FOR ALL USING (true);

-- Product Types: all access
CREATE POLICY "Product Types full access" ON product_types FOR ALL USING (true);

-- Deliveries: all access
CREATE POLICY "Deliveries full access" ON deliveries FOR ALL USING (true);

-- Logs: all access
CREATE POLICY "Logs full access" ON logs FOR ALL USING (true);

-- Insert sample data for cities
INSERT INTO cities (name) VALUES 
  ('Tunis'),
  ('Sousse'),
  ('Sfax'),
  ('Kairouan'),
  ('Bizerte')
ON CONFLICT (name) DO NOTHING;

-- Insert sample data for product types
INSERT INTO product_types (name) VALUES 
  ('Electronics'),
  ('Clothing'),
  ('Food'),
  ('Documents'),
  ('Furniture')
ON CONFLICT (name) DO NOTHING;