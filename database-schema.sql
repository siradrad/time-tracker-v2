-- Time Tracker V2 Database Schema for Supabase
-- Run this in your Supabase SQL Editor to create all tables and policies

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create Users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Job Addresses table
CREATE TABLE job_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CSI Tasks table
CREATE TABLE csi_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Time Entries table
CREATE TABLE time_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- Duration in seconds
    job_address TEXT NOT NULL,
    csi_division TEXT NOT NULL,
    notes TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_created_at ON time_entries(created_at);
CREATE INDEX idx_job_addresses_user_id ON job_addresses(user_id);
CREATE INDEX idx_users_username ON users(username);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE csi_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users table
-- Admin can see all users, users can only see themselves
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR 
                     (SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin');

CREATE POLICY "Admin can insert users" ON users
    FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin');

CREATE POLICY "Admin can update users" ON users
    FOR UPDATE USING ((SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin');

-- RLS Policies for Job Addresses table
-- Users can manage their own addresses, admin can see all
CREATE POLICY "Users can view own job addresses" ON job_addresses
    FOR SELECT USING (user_id::text = auth.uid()::text OR 
                     (SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin');

CREATE POLICY "Users can insert own job addresses" ON job_addresses
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own job addresses" ON job_addresses
    FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own job addresses" ON job_addresses
    FOR DELETE USING (user_id::text = auth.uid()::text);

-- RLS Policies for CSI Tasks table
-- Everyone can read, only admin can modify
CREATE POLICY "Anyone can view csi tasks" ON csi_tasks
    FOR SELECT USING (true);

CREATE POLICY "Admin can insert csi tasks" ON csi_tasks
    FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin');

CREATE POLICY "Admin can update csi tasks" ON csi_tasks
    FOR UPDATE USING ((SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin');

CREATE POLICY "Admin can delete csi tasks" ON csi_tasks
    FOR DELETE USING ((SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin');

-- RLS Policies for Time Entries table
-- Users can manage their own entries, admin can see all
CREATE POLICY "Users can view own time entries" ON time_entries
    FOR SELECT USING (user_id::text = auth.uid()::text OR 
                     (SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin');

CREATE POLICY "Users can insert own time entries" ON time_entries
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own time entries" ON time_entries
    FOR UPDATE USING (user_id::text = auth.uid()::text OR 
                     (SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin');

CREATE POLICY "Users can delete own time entries" ON time_entries
    FOR DELETE USING (user_id::text = auth.uid()::text OR 
                     (SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_addresses_updated_at BEFORE UPDATE ON job_addresses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_csi_tasks_updated_at BEFORE UPDATE ON csi_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial CSI tasks
INSERT INTO csi_tasks (name) VALUES
    ('General Construction'),
    ('Site Preparation'),
    ('Concrete'),
    ('Masonry'),
    ('Metals'),
    ('Wood, Plastics, and Composites'),
    ('Thermal and Moisture Protection'),
    ('Openings'),
    ('Finishes'),
    ('Specialties'),
    ('Equipment'),
    ('Furnishings'),
    ('Special Construction'),
    ('Conveying Equipment'),
    ('Fire Suppression'),
    ('Plumbing'),
    ('HVAC'),
    ('Electrical'),
    ('Communications'),
    ('Electronic Safety and Security');

-- Note: Initial users and job addresses will be inserted via the application
-- since passwords need to be hashed properly 