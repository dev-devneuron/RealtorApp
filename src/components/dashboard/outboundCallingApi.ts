/**
 * Outbound Calling API Integration
 * 
 * All endpoints require PM authentication and return 403 for non-PM users.
 * Base URL: https://leasing-copilot-mvp.onrender.com
 */

import { API_BASE } from "./constants";

export interface Candidate {
  contact_id: number;
  phone_number: string;
  name?: string;
  email?: string;
  timezone?: string;
  consent_status: boolean;
  opted_out: boolean;
  call_attempt_count: number;
  last_called_at?: string;
  last_call_outcome?: string;
  last_booking_at?: string;
  last_call_id?: string;
  last_call_at?: string;
  eligible: boolean;
  eligibility_reason: string;
  eligibility_checks: {
    has_consent?: boolean;
    not_opted_out?: boolean;
    within_time_window?: boolean;
    cooldown_passed?: boolean;
    under_attempt_limit?: boolean;
    retry_allowed?: boolean;
    bypassed_for_testing?: boolean; // Testing mode flag
  };
}

export interface Contact {
  contact_id: number;
  phone_number: string;
  name?: string;
  email?: string;
  timezone?: string;
  consent_status: boolean;
  consent_source?: string;
  consent_timestamp?: string;
  opted_out: boolean;
  opt_out_timestamp?: string;
  opt_out_method?: string;
  dnc_flag?: boolean;
  call_attempt_count: number;
  last_called_at?: string;
  last_call_outcome?: string;
  last_booking_at?: string;
}

export interface Analytics {
  total_outbound_calls: number;
  opt_outs: number;
  estimated_bookings: number;
  success_rate: number;
  opt_out_rate: number;
  period_days: number;
}

export interface ProcessQueueResponse {
  called: number;
  skipped: number;
  errors: number;
  results: Array<{
    contact_id: number;
    phone_number: string;
    status: "called" | "skipped" | "error";
    reason?: string;
    call_id?: string;
  }>;
}

export interface TriggerCallResponse {
  call_id: string;
  contact_id: number;
  phone_number: string;
}

/**
 * Get candidates for outbound calling
 */
export const fetchCandidates = async (limit: number = 50): Promise<Candidate[]> => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_BASE}/outbound-calls/candidates?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 403) {
    throw new Error("Access denied. Property Manager role required.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch candidates: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates || [];
};

/**
 * Process queue (batch calling)
 */
export const processQueue = async (batchSize: number = 10): Promise<ProcessQueueResponse> => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_BASE}/outbound-calls/process-queue`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ batch_size: batchSize }),
  });

  if (response.status === 403) {
    throw new Error("Access denied. Property Manager role required.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to process queue: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Trigger a single call
 */
export const triggerCall = async (
  phoneNumber: string,
  assistantId?: string | null,
  fromNumber?: string | null
): Promise<TriggerCallResponse> => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_BASE}/outbound-calls/trigger`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone_number: phoneNumber,
      assistant_id: assistantId || null,
      from_number: fromNumber || null,
    }),
  });

  if (response.status === 403) {
    throw new Error("Access denied. Property Manager role required.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to trigger call: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * List contacts with filters
 */
export const fetchContacts = async (
  limit: number = 50,
  offset: number = 0,
  optedOut?: boolean
): Promise<{ contacts: Contact[]; total?: number }> => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Authentication required");
  }

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (optedOut !== undefined) {
    params.append("opted_out", optedOut.toString());
  }

  const response = await fetch(`${API_BASE}/outbound-calls/contacts?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 403) {
    throw new Error("Access denied. Property Manager role required.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch contacts: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Manual opt-out
 */
export const optOutContact = async (contactId: number): Promise<void> => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_BASE}/outbound-calls/contacts/${contactId}/opt-out`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ method: "manual" }),
  });

  if (response.status === 403) {
    throw new Error("Access denied. Property Manager role required.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to opt out contact: ${response.statusText}`);
  }
};

/**
 * Manual consent
 */
export const recordConsent = async (contactId: number, source: string = "manual"): Promise<void> => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_BASE}/outbound-calls/contacts/${contactId}/consent`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source }),
  });

  if (response.status === 403) {
    throw new Error("Access denied. Property Manager role required.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to record consent: ${response.statusText}`);
  }
};

/**
 * Get analytics
 */
export const fetchAnalytics = async (days: number = 30): Promise<Analytics> => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_BASE}/outbound-calls/analytics?days=${days}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 403) {
    throw new Error("Access denied. Property Manager role required.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch analytics: ${response.statusText}`);
  }

  return await response.json();
};

