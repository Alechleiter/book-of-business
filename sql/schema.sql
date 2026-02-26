-- ============================================================
-- BOOK OF BUSINESS - Supabase Schema
-- Run this ENTIRE file in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- 1. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  source_id TEXT,
  name TEXT NOT NULL,
  former_name TEXT,
  address TEXT,
  city TEXT,
  zip TEXT NOT NULL,
  county TEXT,
  state TEXT DEFAULT 'CA',
  market TEXT,
  submarket TEXT,
  neighborhood TEXT,
  management_company TEXT,
  onsite_manager TEXT,
  regional_supervisor TEXT,
  phone TEXT,
  email TEXT,
  onsite_manager_email TEXT,
  regional_supervisor_email TEXT,
  url TEXT,
  units INTEGER DEFAULT 0,
  stories INTEGER DEFAULT 0,
  built_type TEXT,
  year_built INTEGER,
  year_renovated INTEGER,
  classification TEXT,
  housing_type TEXT,
  software_system TEXT,
  ownership TEXT,
  flat_fee TEXT,
  avg_rent NUMERIC(10,2) DEFAULT 0,
  avg_eff_rent NUMERIC(10,2) DEFAULT 0,
  avg_sqft NUMERIC(10,2) DEFAULT 0,
  avg_price_per_sqft NUMERIC(10,4) DEFAULT 0,
  avg_eff_price_per_sqft NUMERIC(10,4) DEFAULT 0,
  total_rentable_sqft INTEGER DEFAULT 0,
  occupancy NUMERIC(5,2) DEFAULT 0,
  min_lease_term INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  has_concessions BOOLEAN DEFAULT FALSE,
  concessions_text TEXT,
  former_management_company TEXT,
  former_onsite_manager TEXT,
  former_supervisor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties(zip);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_county ON properties(county);
CREATE INDEX IF NOT EXISTS idx_properties_market ON properties(market);
CREATE INDEX IF NOT EXISTS idx_properties_mgmt ON properties(management_company);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_units ON properties(units DESC);
CREATE INDEX IF NOT EXISTS idx_properties_housing ON properties(housing_type);
CREATE INDEX IF NOT EXISTS idx_properties_classification ON properties(classification);
CREATE INDEX IF NOT EXISTS idx_properties_software ON properties(software_system);
CREATE INDEX IF NOT EXISTS idx_properties_built_type ON properties(built_type);
CREATE INDEX IF NOT EXISTS idx_properties_year_built ON properties(year_built);

ALTER TABLE properties ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(address, '') || ' ' ||
      coalesce(city, '') || ' ' ||
      coalesce(zip, '') || ' ' ||
      coalesce(management_company, '') || ' ' ||
      coalesce(county, '')
    )
  ) STORED;
CREATE INDEX IF NOT EXISTS idx_properties_fts ON properties USING gin(fts);

-- 2. ZIP AGGREGATES
CREATE TABLE IF NOT EXISTS zip_aggregates (
  zip TEXT PRIMARY KEY,
  city TEXT,
  county TEXT,
  market TEXT,
  total_units INTEGER DEFAULT 0,
  total_properties INTEGER DEFAULT 0,
  active_properties INTEGER DEFAULT 0,
  avg_rent NUMERIC(10,2) DEFAULT 0,
  avg_occupancy NUMERIC(5,2) DEFAULT 0,
  lat NUMERIC(10,6),
  lng NUMERIC(10,6)
);

CREATE INDEX IF NOT EXISTS idx_zip_agg_market ON zip_aggregates(market);
CREATE INDEX IF NOT EXISTS idx_zip_agg_units ON zip_aggregates(total_units DESC);

-- 3. NOTES
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT 'team',
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notes_property ON notes(property_id);

-- 4. FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  user_name TEXT DEFAULT 'team',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, user_name)
);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_name);

-- 5. PIPELINE
CREATE TABLE IF NOT EXISTS pipeline (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'prospect',
  assigned_to TEXT,
  estimated_value NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id)
);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage ON pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_assigned ON pipeline(assigned_to);

-- 6. ROW LEVEL SECURITY - Public access
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE zip_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read properties" ON properties FOR SELECT USING (true);
CREATE POLICY "Public read zips" ON zip_aggregates FOR SELECT USING (true);
CREATE POLICY "Public read notes" ON notes FOR SELECT USING (true);
CREATE POLICY "Public read favorites" ON favorites FOR SELECT USING (true);
CREATE POLICY "Public read pipeline" ON pipeline FOR SELECT USING (true);

CREATE POLICY "Public insert properties" ON properties FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert notes" ON notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert favorites" ON favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete favorites" ON favorites FOR DELETE USING (true);
CREATE POLICY "Public insert pipeline" ON pipeline FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update pipeline" ON pipeline FOR UPDATE USING (true);
CREATE POLICY "Public delete pipeline" ON pipeline FOR DELETE USING (true);
CREATE POLICY "Public insert zips" ON zip_aggregates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update zips" ON zip_aggregates FOR UPDATE USING (true);
CREATE POLICY "Public delete zips" ON zip_aggregates FOR DELETE USING (true);

-- 7. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION get_zip_mgmt_breakdown(zip_code TEXT)
RETURNS TABLE(management_company TEXT, unit_count BIGINT, property_count BIGINT) AS $$
  SELECT
    COALESCE(management_company, '(Unknown)') as management_company,
    SUM(units)::BIGINT as unit_count,
    COUNT(*)::BIGINT as property_count
  FROM properties
  WHERE zip = zip_code
  GROUP BY management_company
  ORDER BY unit_count DESC;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_mgmt_summary()
RETURNS TABLE(management_company TEXT, total_units BIGINT, total_properties BIGINT, active_count BIGINT, zip_count BIGINT) AS $$
  SELECT
    management_company,
    SUM(units)::BIGINT as total_units,
    COUNT(*)::BIGINT as total_properties,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_count,
    COUNT(DISTINCT zip)::BIGINT as zip_count
  FROM properties
  WHERE management_company IS NOT NULL AND management_company != ''
  GROUP BY management_company
  ORDER BY total_units DESC;
$$ LANGUAGE sql STABLE;
