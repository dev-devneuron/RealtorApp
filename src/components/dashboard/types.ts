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
  id: string; // UUID - database ID
  call_id: string; // VAPI call ID - use this for API calls
  caller_number?: string;
  recording_url?: string;
  transcript?: string;
  call_status?: string;
  call_duration?: number;
  realtor_number?: string;
  created_at?: string;
  updated_at?: string;
  live_transcript_chunks?: string[];
  transcript_segments?: any[];
  transcript_summary?: string;
  metadata?: any;
  [key: string]: any;
}

export interface Booking {
  bookingId: number;
  propertyId: number;
  propertyAddress?: string;
  visitor: {
    name: string;
    phone: string;
    email?: string;
  };
  startAt: string; // ISO date string
  endAt: string; // ISO date string
  timezone: string;
  status: "pending" | "approved" | "denied" | "cancelled" | "rescheduled";
  createdBy: "vapi" | "dashboard";
  notes?: string;
  proposedSlots?: Array<{
    startAt: string;
    endAt: string;
  }>;
  requestedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  approverId?: number;
  approverType?: "property_manager" | "realtor";
  auditLog?: Array<{
    action: string;
    performedBy: string;
    performedAt: string;
    notes?: string;
  }>;
  callRecord?: {
    vapiCallId?: string;
    callTranscript?: string;
    callRecordingUrl?: string;
  };
  [key: string]: any;
}

export interface AvailabilitySlot {
  startAt: string; // ISO date string
  endAt: string; // ISO date string
  slotType?: "available" | "unavailable" | "booked";
  reason?: string;
}

export interface CalendarPreferences {
  workingHours: {
    start: string; // "09:00"
    end: string; // "17:00"
    timezone: string;
    defaultSlotLength: number; // minutes
  };
  unavailableSlots?: AvailabilitySlot[];
}

export interface PropertyAssignment {
  propertyId: number;
  propertyAddress?: string;
  assignedTo: {
    userId: number;
    userType: "property_manager" | "realtor";
    name: string;
    phone?: string;
    email?: string;
  };
  assignedAt?: string;
  assignedBy?: number;
  reason?: string;
}

export interface PhoneNumber {
  id: number;
  phone_number: string;
  [key: string]: any;
}

