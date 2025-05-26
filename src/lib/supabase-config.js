// import { createClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// You'll need to replace these with your actual Supabase project URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lyborpfxgfioavqutiap.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Ym9ycGZ4Z2Zpb2F2cXV0aWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMjYxNzIsImV4cCI6MjA2MzYwMjE3Mn0.rn0Wx7ZETpgGYJsEoH9zuFcu33C0iQ5vlPAiUuG2ECM'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Database table names
export const TABLES = {
  USERS: 'users',
  TIME_ENTRIES: 'time_entries', 
  JOB_ADDRESSES: 'job_addresses',
  CSI_TASKS: 'csi_tasks'
}

// Initial team members data
export const INITIAL_USERS = [
  { username: 'admin@timetracker.app', password: 'admin123', name: 'System Admin', role: 'admin' },
  { username: 'stacy@timetracker.app', password: 'stacy123', name: 'Stacy', role: 'user' },
  { username: 'jeremy@timetracker.app', password: 'jeremy123', name: 'Jeremy', role: 'user' },
  { username: 'humberto@timetracker.app', password: 'humberto123', name: 'Humberto', role: 'user' },
  { username: 'enrique@timetracker.app', password: 'enrique123', name: 'Enrique', role: 'user' },
  { username: 'drew@timetracker.app', password: 'drew123', name: 'Drew', role: 'user' },
  { username: 'enriquesr@timetracker.app', password: 'enriquesr123', name: 'Enrique Sr', role: 'user' },
  { username: 'karen@timetracker.app', password: 'karen123', name: 'Karen', role: 'user' },
  { username: 'anthony@timetracker.app', password: 'anthony123', name: 'Anthony', role: 'user' },
  { username: 'angela@timetracker.app', password: 'angela123', name: 'Angela', role: 'user' }
]

// Initial job addresses
export const INITIAL_JOB_ADDRESSES = [
  '1620 Spruce St',
  '1710 OOB, LLC',
  '4 Hayden Ln',
  '408 Kintner LLC',
  '4301 N Delaware OOB',
  '451 Perry Auger, LLC',
  '520 Kintner Road LLC',
  '730 Lonely Cottage, LLC',
  '7658 Easton Road, LLC',
  '804 N Broad St',
  'Amida Special Opportunity Fund',
  'Aquadilla, OOB',
  'CDD 2016 Irv Trust',
  'Daniel Cohen',
  'ECPM Admin',
  'Gimme Shelter',
  'Headquarters Rd',
  '15 Headquarters Rd',
  'Lot 126',
  'Matthew Chaikin',
  'Michael Axelrod and Affiliated Companies',
  'PP Loom, LLC',
  'Rafi Licht',
  '746 S 4th St',
  'Ruby Development',
  '24-30 Bank St'
]

// Initial CSI tasks
export const INITIAL_CSI_TASKS = [
  'General Construction',
  'Site Preparation',
  'Concrete',
  'Masonry',
  'Metals',
  'Wood, Plastics, and Composites',
  'Thermal and Moisture Protection',
  'Openings',
  'Finishes',
  'Specialties',
  'Equipment',
  'Furnishings',
  'Special Construction',
  'Conveying Equipment',
  'Fire Suppression',
  'Plumbing',
  'HVAC',
  'Electrical',
  'Communications',
  'Electronic Safety and Security'
] 