/**
 * Vendor Management API Integration
 * 
 * All endpoints require PM authentication.
 * Base URL: https://leasing-copilot-mvp.onrender.com
 */

import { API_BASE } from "./constants";

// Helper to get auth token
const getAuthToken = (): string => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Not authenticated");
  }
  return token;
};

// Helper to handle API errors
const handleApiError = async (response: Response): Promise<never> => {
  const error = await response.json().catch(() => ({ detail: "An error occurred" }));
  throw new Error(error.detail || "An error occurred");
};

// ============================================================================
// Types
// ============================================================================

export interface Vendor {
  vendor_id: number;
  name: string;
  service_type: 'electrician' | 'plumber' | 'carpenter' | 'hvac' | 'general' | 'emergency';
  phone_number: string; // E.164 format: +14125551234
  backup_phone?: string;
  email?: string;
  operating_hours_start?: string; // "09:00:00"
  operating_hours_end?: string; // "17:00:00"
  emergency_available: boolean;
  timezone: string; // "America/New_York"
  notes?: string;
  is_active: boolean;
  opted_out: boolean;
  opt_out_timestamp?: string;
  opt_out_method?: 'voice' | 'keypad' | 'sms' | 'email' | 'manual';
  created_at: string;
  updated_at: string;
}

export interface PropertyVendor {
  property_vendor_id: number;
  property_id: number;
  vendor_id: number;
  vendor_name: string;
  service_type: string;
  priority: number; // 1 = first call, 2 = second call, etc.
  notes?: string;
  vendor_phone: string;
  vendor_email?: string;
  emergency_available: boolean;
}

export interface VendorCallQueue {
  queue_id: number;
  maintenance_request_id: number;
  status: 'pending' | 'calling' | 'completed' | 'cancelled' | 'paused';
  current_vendor_index: number;
  vendor_queue: Array<{
    vendor_id: number;
    priority: number;
    name: string;
  }>;
  max_retries_per_vendor: number;
  retry_delay_minutes: number;
  started_at?: string;
  completed_at?: string;
}

export interface VendorCallAttempt {
  attempt_id: number;
  maintenance_request_id: number;
  vendor_id: number;
  vendor_name: string;
  call_status: 'initiated' | 'answered' | 'declined' | 'no_answer' | 'voicemail' | 'failed';
  outcome?: 'accepted' | 'declined' | 'no_response' | 'voicemail';
  is_available?: boolean;
  earliest_available_time?: string;
  estimated_cost_range?: string;
  vendor_notes?: string;
  vapi_call_id?: string;
  call_transcript?: string;
  call_recording_url?: string;
  /**
   * Optional tool payload snapshots + extra details from vendor calls.
   * When present, can include: retry/callback suggestions, access instructions, emergency surcharge, etc.
   */
  call_metadata?: Record<string, any> | null;
  call_duration_seconds?: number;
  attempt_number: number;
  initiated_at?: string | null;
  answered_at?: string | null;
  completed_at?: string | null;
}

export interface VendorCallStatus {
  maintenance_request_id: number;
  vendor_call_status: 'not_started' | 'calling' | 'vendor_accepted' | 'vendor_declined' | 'no_response' | 'paused' | 'cancelled';
  assigned_vendor_id?: number | null;
  queue: VendorCallQueue | null;
  call_attempts: VendorCallAttempt[];
}

export interface PropertyVendorSettings {
  settings_id: number;
  property_id: number;
  auto_call_enabled: boolean;
  emergency_only: boolean;
  call_time_restrictions?: {
    start_hour: number;
    end_hour: number;
    timezone: string;
  } | null;
}

// ============================================================================
// Vendor Management Endpoints
// ============================================================================

/**
 * Create a new vendor
 */
export const createVendor = async (vendorData: Partial<Vendor>): Promise<Vendor> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/vendors`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(vendorData),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

/**
 * Get all vendors with optional filters
 */
export const fetchVendors = async (filters?: {
  service_type?: string;
  is_active?: boolean;
}): Promise<{ vendors: Vendor[] }> => {
  const token = getAuthToken();
  const params = new URLSearchParams();
  
  if (filters?.service_type) {
    params.append('service_type', filters.service_type);
  }
  if (filters?.is_active !== undefined) {
    params.append('is_active', String(filters.is_active));
  }

  const url = `${API_BASE}/vendors${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

/**
 * Get a single vendor by ID
 */
export const fetchVendor = async (vendorId: number): Promise<Vendor> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/vendors/${vendorId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

/**
 * Update a vendor
 */
export const updateVendor = async (
  vendorId: number,
  updates: Partial<Vendor>
): Promise<Vendor> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/vendors/${vendorId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

/**
 * Delete a vendor (soft delete)
 */
export const deleteVendor = async (vendorId: number): Promise<{
  message: string;
  vendor_id: number;
}> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/vendors/${vendorId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

/**
 * Opt-out a vendor
 */
export const optOutVendor = async (vendorId: number): Promise<{
  message: string;
  vendor_id: number;
  vendor_name: string;
  opted_out: boolean;
  opt_out_timestamp: string;
}> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/vendors/${vendorId}/opt-out`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

/**
 * Clear vendor opt-out status
 */
export const clearVendorOptOut = async (vendorId: number): Promise<{
  message: string;
  vendor_id: number;
  vendor_name: string;
  opted_out: boolean;
}> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/vendors/${vendorId}/clear-opt-out`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

// ============================================================================
// Property-Vendor Linking Endpoints
// ============================================================================

/**
 * Link a vendor to a property
 */
export const linkVendorToProperty = async (
  propertyId: number,
  vendorData: {
    vendor_id: number;
    service_type: string;
    priority: number;
    notes?: string;
  }
): Promise<PropertyVendor> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/properties/${propertyId}/vendors`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(vendorData),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

/**
 * Get all vendors linked to a property
 */
export const fetchPropertyVendors = async (
  propertyId: number,
  serviceType?: string
): Promise<{ property_vendors: PropertyVendor[] }> => {
  const token = getAuthToken();
  const params = new URLSearchParams();
  
  if (serviceType) {
    params.append('service_type', serviceType);
  }

  const url = `${API_BASE}/properties/${propertyId}/vendors${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

/**
 * Unlink a vendor from a property
 */
export const unlinkVendorFromProperty = async (
  propertyId: number,
  propertyVendorId: number
): Promise<{
  message: string;
  property_vendor_id: number;
}> => {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE}/properties/${propertyId}/vendors/${propertyVendorId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

// ============================================================================
// Vendor Calling Endpoints
// ============================================================================

/**
 * Start vendor calls for a maintenance request
 */
export const startVendorCalls = async (
  maintenanceRequestId: number
): Promise<{
  success: boolean;
  call_id: string;
  vendor_id: number;
  vendor_name: string;
  attempt_id: number;
}> => {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE}/maintenance-requests/${maintenanceRequestId}/start-vendor-calls`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

/**
 * Get vendor call status for a maintenance request
 */
export const fetchVendorCallStatus = async (
  maintenanceRequestId: number
): Promise<VendorCallStatus> => {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE}/maintenance-requests/${maintenanceRequestId}/vendor-call-status`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

/**
 * Pause vendor calls for a maintenance request
 */
export const pauseVendorCalls = async (
  maintenanceRequestId: number
): Promise<{
  success: boolean;
  message: string;
}> => {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE}/maintenance-requests/${maintenanceRequestId}/pause-vendor-calls`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

/**
 * Cancel vendor calls for a maintenance request
 */
export const cancelVendorCalls = async (
  maintenanceRequestId: number
): Promise<{
  success: boolean;
  message: string;
}> => {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE}/maintenance-requests/${maintenanceRequestId}/cancel-vendor-calls`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

// ============================================================================
// Property Vendor Settings Endpoints
// ============================================================================

/**
 * Update property vendor settings
 */
export const updatePropertyVendorSettings = async (
  propertyId: number,
  settings: {
    auto_call_enabled: boolean;
    emergency_only?: boolean;
    call_time_restrictions?: {
      start_hour: number;
      end_hour: number;
      timezone: string;
    } | null;
  }
): Promise<PropertyVendorSettings> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/properties/${propertyId}/vendor-settings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

/**
 * Get property vendor settings
 */
export const fetchPropertyVendorSettings = async (
  propertyId: number
): Promise<PropertyVendorSettings> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/properties/${propertyId}/vendor-settings`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
};

