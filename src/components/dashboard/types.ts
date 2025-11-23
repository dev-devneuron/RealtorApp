/**
 * Shared types for Dashboard components
 */

export interface Property {
  id: number;
  address: string;
  listing_status?: string;
  listing_metadata?: any;
  [key: string]: any;
}

export interface Realtor {
  id: number;
  name: string;
  email: string;
  contact?: string;
  [key: string]: any;
}

export interface Tenant {
  tenant_id: number;
  name: string;
  phone_number?: string;
  email?: string;
  property_id: number;
  realtor_id?: number;
  unit_number?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  is_active: boolean;
  notes?: string;
  property?: Property;
  realtor?: Realtor;
  [key: string]: any;
}

export interface MaintenanceRequest {
  maintenance_request_id: number;
  tenant_id: number;
  property_id: number;
  issue_description: string;
  priority: string;
  status: string;
  category?: string;
  location?: string;
  tenant_name?: string;
  tenant_phone?: string;
  tenant_email?: string;
  submitted_via?: string;
  vapi_call_id?: string;
  call_transcript?: string;
  call_recording_url?: string;
  assigned_to_realtor_id?: number;
  pm_notes?: string;
  resolution_notes?: string;
  submitted_at?: string;
  updated_at?: string;
  completed_at?: string;
  tenant?: Tenant;
  property?: Property;
  assigned_realtor?: Realtor;
  [key: string]: any;
}

export interface CallRecord {
  id: string;
  caller_number?: string;
  recording_url?: string;
  transcript?: string;
  call_status?: string;
  [key: string]: any;
}

export interface Booking {
  id: number;
  property_id: number;
  [key: string]: any;
}

export interface PhoneNumber {
  id: number;
  phone_number: string;
  [key: string]: any;
}

