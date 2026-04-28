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

-- Drop old permissive policies
DROP POLICY IF EXISTS "Owners full access" ON owners;
DROP POLICY IF EXISTS "Employers full access" ON employers;
DROP POLICY IF EXISTS "Drivers full access" ON drivers;
DROP POLICY IF EXISTS "Cities full access" ON cities;
DROP POLICY IF EXISTS "Product Types full access" ON product_types;
DROP POLICY IF EXISTS "Deliveries full access" ON deliveries;
DROP POLICY IF EXISTS "Logs full access" ON logs;

-- Restrictive policies for anon role
-- The backend uses service_role key which bypasses RLS entirely,
-- so these policies only block direct Supabase access via the anon key.

-- Sensitive tables: no anon access
CREATE POLICY "No anon access owners" ON owners FOR ALL USING (false);
CREATE POLICY "No anon access employers" ON employers FOR ALL USING (false);
CREATE POLICY "No anon access drivers" ON drivers FOR ALL USING (false);
CREATE POLICY "No anon access logs" ON logs FOR ALL USING (false);

-- Reference tables: anon read-only
CREATE POLICY "Anon read cities" ON cities FOR SELECT USING (true);
CREATE POLICY "No anon write cities" ON cities FOR INSERT WITH CHECK (false);
CREATE POLICY "No anon update cities" ON cities FOR UPDATE USING (false);
CREATE POLICY "No anon delete cities" ON cities FOR DELETE USING (false);

CREATE POLICY "Anon read product_types" ON product_types FOR SELECT USING (true);
CREATE POLICY "No anon write product_types" ON product_types FOR INSERT WITH CHECK (false);
CREATE POLICY "No anon update product_types" ON product_types FOR UPDATE USING (false);
CREATE POLICY "No anon delete product_types" ON product_types FOR DELETE USING (false);

-- Deliveries: anon read-only
CREATE POLICY "Anon read deliveries" ON deliveries FOR SELECT USING (true);
CREATE POLICY "No anon write deliveries" ON deliveries FOR INSERT WITH CHECK (false);
CREATE POLICY "No anon update deliveries" ON deliveries FOR UPDATE USING (false);
CREATE POLICY "No anon delete deliveries" ON deliveries FOR DELETE USING (false);

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