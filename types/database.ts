export interface Property {
  id: number;
  source_id: string | null;
  name: string;
  former_name: string | null;
  address: string | null;
  city: string | null;
  zip: string;
  county: string | null;
  state: string;
  market: string | null;
  submarket: string | null;
  neighborhood: string | null;
  management_company: string | null;
  onsite_manager: string | null;
  regional_supervisor: string | null;
  phone: string | null;
  email: string | null;
  onsite_manager_email: string | null;
  regional_supervisor_email: string | null;
  url: string | null;
  units: number;
  stories: number;
  built_type: string | null;
  year_built: number | null;
  year_renovated: number | null;
  classification: string | null;
  housing_type: string | null;
  software_system: string | null;
  ownership: string | null;
  flat_fee: string | null;
  avg_rent: number;
  avg_eff_rent: number;
  avg_sqft: number;
  avg_price_per_sqft: number;
  avg_eff_price_per_sqft: number;
  total_rentable_sqft: number;
  occupancy: number;
  min_lease_term: number;
  status: string;
  has_concessions: boolean;
  concessions_text: string | null;
  former_management_company: string | null;
  former_onsite_manager: string | null;
  former_supervisor: string | null;
  created_at: string;
  updated_at: string;
}

export interface ZipAggregate {
  zip: string;
  city: string | null;
  county: string | null;
  market: string | null;
  total_units: number;
  total_properties: number;
  active_properties: number;
  avg_rent: number;
  avg_occupancy: number;
  lat: number | null;
  lng: number | null;
}

export interface Note {
  id: number;
  property_id: number;
  author: string;
  note: string;
  note_type: string;
  created_at: string;
}

export interface Favorite {
  id: number;
  property_id: number;
  user_name: string;
  created_at: string;
  properties?: Property;
}

export interface PipelineItem {
  id: number;
  property_id: number;
  stage: string;
  assigned_to: string | null;
  estimated_value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  properties?: Property;
}

export interface MgmtSummary {
  management_company: string;
  total_units: number;
  total_properties: number;
  active_count: number;
  zip_count: number;
}

export interface PropertyFilters {
  search?: string;
  status?: string;
  market?: string;
  housing_type?: string;
  classification?: string;
  software_system?: string;
  built_type?: string;
  county?: string;
  min_units?: number;
  max_units?: number;
  min_rent?: number;
  max_rent?: number;
  min_occupancy?: number;
  max_occupancy?: number;
  min_year_built?: number;
  max_year_built?: number;
  has_concessions?: boolean;
  has_phone?: boolean;
  has_email?: boolean;
  management_company?: string;
  ownership?: string;
  submarket?: string;
  neighborhood?: string;
  regional_supervisor?: string;
  has_regional?: boolean;
}
