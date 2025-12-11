import { getCachedData, setCachedData, getCacheKey, clearCacheForEndpoint } from "../../utils/cache";

/**
 * Helper function to parse and extract metadata from property objects
 * 
 * Handles properties that may have metadata stored as JSON strings or objects.
 * Provides safe fallbacks for all fields and ensures consistent data structure.
 * 
 * @param property - Property object that may contain listing_metadata
 * @returns Normalized property object with all metadata fields extracted
 */
export const getPropertyMetadata = (property: any) => {
  // Safety check: return empty object if property is null/undefined
  if (!property) {
    return {
      listing_id: null,
      square_feet: null,
      lot_size_sqft: null,
      year_built: null,
      property_type: null,
      listing_status: null,
      days_on_market: null,
      listing_date: null,
      features: [],
      agent: null,
      description: null,
      address: null,
      price: null,
      bedrooms: null,
      bathrooms: null,
      image_url: null,
      is_assigned: false,
      assigned_to_realtor_id: null,
      assigned_to_realtor_name: null,
    };
  }

  // Try to parse listing_metadata if it's a string
  let metadata = property.listing_metadata;
  if (typeof metadata === "string") {
    try {
      metadata = JSON.parse(metadata);
    } catch (e) {
      metadata = {};
    }
  }

  // Extract all relevant fields with fallbacks
  return {
    listing_id: property.listing_id || metadata?.listing_id,
    square_feet: property.square_feet || metadata?.square_feet,
    lot_size_sqft: property.lot_size_sqft || metadata?.lot_size_sqft,
    year_built: property.year_built || metadata?.year_built,
    property_type: property.property_type || metadata?.property_type,
    listing_status: property.listing_status || metadata?.listing_status,
    days_on_market: property.days_on_market ?? metadata?.days_on_market,
    listing_date: property.listing_date || metadata?.listing_date,
    features: property.features || metadata?.features || [],
    agent: property.agent || metadata?.agent,
    description: property.description || metadata?.description,
    // Keep direct properties as fallback
    address: property.address,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    image_url: property.image_url,
    is_assigned: property.is_assigned,
    assigned_to_realtor_id: property.assigned_to_realtor_id,
    assigned_to_realtor_name: property.assigned_to_realtor_name,
  };
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "N/A";
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Return original if not standard format
  return phone;
};

/**
 * Format call duration from seconds to readable format
 */
export const formatCallDuration = (seconds: number | null | undefined): string => {
  if (!seconds || seconds === 0) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

/**
 * Format date for display (YYYY-MM-DD format)
 */
export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return "N/A";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "Invalid Date";
  
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
};

/**
 * Format time for display (HH:MM AM/PM UTC format)
 */
export const formatTime = (dateString: string | Date): string => {
  if (!dateString) return "N/A";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "Invalid Time";
  
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  
  const hour12 = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";
  const minutesStr = String(minutes).padStart(2, "0");
  
  return `${hour12}:${minutesStr} ${ampm} UTC`;
};

/**
 * Format date and time for display (YYYY-MM-DD at HH:MM AM/PM UTC format)
 */
export const formatDateTime = (dateString: string | Date): string => {
  if (!dateString) return "N/A";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "Invalid Date/Time";
  
  const dateStr = formatDate(date);
  const timeStr = formatTime(date);
  
  return `${dateStr} at ${timeStr}`;
};

/**
 * Get status badge color
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "approved":
      return "bg-green-100 text-green-800 border-green-200";
    case "denied":
      return "bg-red-100 text-red-800 border-red-200";
    case "cancelled":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "rescheduled":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

/**
 * Booking API functions
 */
import { API_BASE } from "./constants";
import type { Booking, AvailabilitySlot } from "./types";

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem("access_token");
};

/**
 * Extract error message from error object, handling [object Object] cases
 */
export const extractErrorMessage = (error: any): string => {
  if (!error) return "An unknown error occurred";
  
  // If it's already a string, return it
  if (typeof error === 'string') return error;
  
  // Try to get message from error object
  if (error.message) {
    if (typeof error.message === 'string') return error.message;
    if (typeof error.message === 'object') {
      // Handle validation errors that might be arrays
      if (Array.isArray(error.message)) {
        return error.message.map((err: any) => {
          if (typeof err === 'string') return err;
          if (err.msg) return err.msg;
          return JSON.stringify(err);
        }).join(', ');
      }
      return JSON.stringify(error.message);
    }
  }
  
  // Try detail field (common in FastAPI errors)
  if (error.detail) {
    if (typeof error.detail === 'string') return error.detail;
    if (Array.isArray(error.detail)) {
      return error.detail.map((err: any) => {
        if (typeof err === 'string') return err;
        if (err.msg) return err.msg;
        if (err.loc && err.msg) return `${err.loc.join('.')}: ${err.msg}`;
        return JSON.stringify(err);
      }).join(', ');
    }
    if (typeof error.detail === 'object') {
      return JSON.stringify(error.detail);
    }
  }
  
  // Try error field
  if (error.error) {
    if (typeof error.error === 'string') return error.error;
    return JSON.stringify(error.error);
  }
  
  // Last resort: stringify the whole object
  try {
    return JSON.stringify(error);
  } catch {
    return "An unknown error occurred";
  }
};

/**
 * Get user's bookings
 */
export const fetchUserBookings = async (
  userId: number,
  userType: string,
  status?: string,
  dateRange?: { from: string; to: string }
): Promise<Booking[]> => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (dateRange) {
    params.append("from", dateRange.from);
    params.append("to", dateRange.to);
  }

  // Check cache first (cache for 2 minutes for bookings)
  const cacheKey = getCacheKey(`/api/users/${userId}/bookings`, { status, dateRange });
  const cached = getCachedData<Booking[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Ensure token is valid and properly formatted
  if (!token || token.trim() === "") {
    throw new Error("Authentication token is missing");
  }

  // Prepare headers with explicit Authorization header
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token.trim()}`,
  };

  const response = await fetch(`${API_BASE}/api/users/${userId}/bookings?${params}`, {
    method: "GET",
    headers: headers,
  });

  // Handle token expiration
  if (response.status === 401) {
    localStorage.clear();
    window.location.href = "/signin";
    throw new Error("Token expired. Redirecting to login...");
  }

  if (!response.ok) {
    let error: any = {};
    try {
      error = await response.json();
    } catch {
      error = { detail: "Failed to fetch bookings" };
    }
    
    // Extract error message properly (handle both string and object)
    let errorMessage = "Failed to fetch bookings";
    if (error.detail) {
      errorMessage = typeof error.detail === 'string' 
        ? error.detail 
        : JSON.stringify(error.detail);
    } else if (error.message) {
      errorMessage = typeof error.message === 'string'
        ? error.message
        : JSON.stringify(error.message);
    }
    
    // Handle 422 validation errors gracefully
    if (response.status === 422) {
      console.warn("Validation error fetching bookings:", error);
      console.warn("Error message:", errorMessage);
      return []; // Return empty array instead of throwing
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const bookings = data.bookings || [];
  
  // Cache the result for 2 minutes
  setCachedData(cacheKey, bookings, 2 * 60 * 1000);
  
  return bookings;
};

/**
 * Get booking details
 */
export const fetchBookingDetail = async (bookingId: number): Promise<Booking> => {
  const token = getAuthToken();
  if (!token || token.trim() === "") throw new Error("Not authenticated");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token.trim()}`,
  };

  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
    method: "GET",
    headers: headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch booking" }));
    throw new Error(error.detail || "Failed to fetch booking");
  }

  return await response.json();
};

/**
 * Approve booking
 */
export const approveBooking = async (
  bookingId: number,
  approverId: number
): Promise<Booking> => {
  const token = getAuthToken();
  if (!token || token.trim() === "") throw new Error("Not authenticated");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token.trim()}`,
  };

  try {
    const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/approve`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ approver_id: approverId }),
    });

    // IMPORTANT: Always parse JSON response first, even for errors
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // If response is not JSON, handle it
      const text = await response.text();
      throw new Error(`Server error: ${text || response.statusText}`);
    }

    if (!response.ok) {
      // Extract error message properly - prevents [object Object] error
      const errorMsg = data.detail || data.message || "Failed to approve booking";
      throw new Error(errorMsg);
    }

    // Clear bookings cache after mutation
    clearCacheForEndpoint(`/api/users/${approverId}/bookings`);
    
    return data;
  } catch (error) {
    // Re-throw if it's already an Error with message
    if (error instanceof Error) {
      throw error;
    }
    // Handle unexpected errors (network, JSON parsing, etc.)
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Deny booking
 */
export const denyBooking = async (
  bookingId: number,
  approverId: number,
  reason?: string
): Promise<Booking> => {
  const token = getAuthToken();
  if (!token || token.trim() === "") throw new Error("Not authenticated");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token.trim()}`,
  };

  try {
    const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/deny`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ approver_id: approverId, reason }),
    });

    // IMPORTANT: Always parse JSON response first, even for errors
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // If response is not JSON, handle it
      const text = await response.text();
      throw new Error(`Server error: ${text || response.statusText}`);
    }

    if (!response.ok) {
      // Extract error message properly - prevents [object Object] error
      const errorMsg = data.detail || data.message || "Failed to deny booking";
      throw new Error(errorMsg);
    }

    // Clear bookings cache after mutation
    clearCacheForEndpoint(`/api/users/${approverId}/bookings`);
    
    return data;
  } catch (error) {
    // Re-throw if it's already an Error with message
    if (error instanceof Error) {
      throw error;
    }
    // Handle unexpected errors (network, JSON parsing, etc.)
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Reschedule booking
 */
export const rescheduleBooking = async (
  bookingId: number,
  proposedSlots: Array<{ startAt: string; endAt: string }>,
  reason?: string
): Promise<Booking> => {
  const token = getAuthToken();
  if (!token || token.trim() === "") throw new Error("Not authenticated");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token.trim()}`,
  };

  try {
    const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/reschedule`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ proposed_slots: proposedSlots, reason }),
    });

    // IMPORTANT: Always parse JSON response first, even for errors
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // If response is not JSON, handle it
      const text = await response.text();
      throw new Error(`Server error: ${text || response.statusText}`);
    }

    if (!response.ok) {
      // Extract error message properly - prevents [object Object] error
      const errorMsg = data.detail || data.message || "Failed to reschedule booking";
      throw new Error(errorMsg);
    }

    // Clear bookings cache after mutation
    clearCacheForEndpoint(`/api/users/${approverId}/bookings`);
    
    return data;
  } catch (error) {
    // Re-throw if it's already an Error with message
    if (error instanceof Error) {
      throw error;
    }
    // Handle unexpected errors (network, JSON parsing, etc.)
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Cancel booking
 */
export const cancelBooking = async (
  bookingId: number,
  reason?: string
): Promise<Booking> => {
  const token = getAuthToken();
  if (!token || token.trim() === "") throw new Error("Not authenticated");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token.trim()}`,
  };

  try {
    const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ reason: reason || null }),
    });

    // IMPORTANT: Always parse JSON response first, even for errors
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // If response is not JSON, handle it
      const text = await response.text();
      throw new Error(`Server error: ${text || response.statusText}`);
    }

    if (!response.ok) {
      // Extract error message properly - prevents [object Object] error
      const errorMsg = data.detail || data.message || "Failed to cancel booking";
      throw new Error(errorMsg);
    }

    // Clear bookings cache after mutation - need to get approverId from booking
    // We'll clear all booking caches to be safe
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('api_cache_') && key.includes('/bookings')
    );
    cacheKeys.forEach(key => localStorage.removeItem(key));
    
    return data;
  } catch (error) {
    // Re-throw if it's already an Error with message
    if (error instanceof Error) {
      throw error;
    }
    // Handle unexpected errors (network, JSON parsing, etc.)
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Update booking (PUT /api/bookings/{booking_id})
 * Only assigned approver can update
 */
export const updateBooking = async (
  bookingId: number,
  updates: {
    visitor_name?: string;
    visitor_phone?: string;
    visitor_email?: string;
    start_at?: string;
    end_at?: string;
    timezone?: string;
    notes?: string;
    status?: string;
  }
): Promise<Booking> => {
  const token = getAuthToken();
  if (!token || token.trim() === "") throw new Error("Not authenticated");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token.trim()}`,
  };

  try {
    const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(updates),
    });

    // IMPORTANT: Always parse JSON response first, even for errors
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // If response is not JSON, handle it
      const text = await response.text();
      throw new Error(`Server error: ${text || response.statusText}`);
    }

    if (!response.ok) {
      // Extract error message properly - prevents [object Object] error
      const errorMsg = data.detail || data.message || "Failed to update booking";
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    // Re-throw if it's already an Error with message
    if (error instanceof Error) {
      throw error;
    }
    // Handle unexpected errors (network, JSON parsing, etc.)
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Delete booking (DELETE /api/bookings/{booking_id})
 * Only assigned approver can delete - this is a HARD DELETE
 */
export const deleteBooking = async (
  bookingId: number
): Promise<{ bookingId: number; message: string }> => {
  const token = getAuthToken();
  if (!token || token.trim() === "") throw new Error("Not authenticated");

  const headers: HeadersInit = {
    "Authorization": `Bearer ${token.trim()}`,
  };

  try {
    const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
      method: "DELETE",
      headers: headers,
    });

    // IMPORTANT: Always parse JSON response first, even for errors
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // If response is not JSON, handle it
      const text = await response.text();
      throw new Error(`Server error: ${text || response.statusText}`);
    }

    if (!response.ok) {
      // Extract error message properly - prevents [object Object] error
      const errorMsg = data.detail || data.message || "Failed to delete booking";
      throw new Error(errorMsg);
    }

    // Clear bookings cache after mutation
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('api_cache_') && key.includes('/bookings')
    );
    cacheKeys.forEach(key => localStorage.removeItem(key));
    
    return data;
  } catch (error) {
    // Re-throw if it's already an Error with message
    if (error instanceof Error) {
      throw error;
    }
    // Handle unexpected errors (network, JSON parsing, etc.)
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Get property availability (Dashboard endpoint - uses GET)
 */
export const fetchPropertyAvailability = async (
  propertyId: number,
  from: string,
  to: string
): Promise<{ availableSlots: AvailabilitySlot[] }> => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams({
    from,
    to,
  });

  const response = await fetch(
    `${API_BASE}/vapi/properties/${propertyId}/availability?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch availability" }));
    throw new Error(error.detail || "Failed to fetch availability");
  }

  return await response.json();
};

/**
 * Validate tour request (VAPI endpoint - uses POST with property_name)
 * This is for VAPI to validate a specific time slot request
 */
export const validateTourRequest = async (
  propertyName: string,
  requestedStartAt: string,
  requestedEndAt: string
): Promise<{
  isAvailable: boolean;
  canBook: boolean;
  propertyId?: number;
  propertyName?: string;
  requestedSlot?: { startAt: string; endAt: string };
  suggestedSlots?: Array<{ startAt: string; endAt: string }>;
  assignedUser?: { userId: number; userType: string; name: string };
  timezone?: string;
  reason?: string;
  message?: string;
}> => {
  // Note: This endpoint doesn't require auth (VAPI calls it)
  const response = await fetch(`${API_BASE}/vapi/properties/validate-tour-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      property_name: propertyName,
      requested_start_at: requestedStartAt,
      requested_end_at: requestedEndAt,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to validate tour request" }));
    throw new Error(error.detail || "Failed to validate tour request");
  }

  return await response.json();
};

/**
 * Get property availability by property name (VAPI endpoint - uses POST)
 * Alternative to validateTourRequest - returns all available slots
 */
export const fetchPropertyAvailabilityByName = async (
  propertyName: string,
  fromDate?: string,
  toDate?: string
): Promise<{
  propertyId: number;
  assignedUser: { userId: number; userType: string; name: string };
  timezone: string;
  availableSlots: AvailabilitySlot[];
}> => {
  // Note: This endpoint doesn't require auth (VAPI calls it)
  const response = await fetch(`${API_BASE}/vapi/properties/availability`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      property_name: propertyName,
      from_date: fromDate,
      to_date: toDate,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch availability" }));
    throw new Error(error.detail || "Failed to fetch availability");
  }

  return await response.json();
};

/**
 * Get bookings by visitor (VAPI endpoint - uses POST)
 */
export const getBookingsByVisitor = async (
  visitorPhone?: string,
  visitorName?: string,
  status?: string
): Promise<{
  visitorPhone?: string;
  visitorName?: string;
  bookings: Booking[];
}> => {
  // Note: This endpoint doesn't require auth (VAPI calls it)
  const response = await fetch(`${API_BASE}/vapi/bookings/by-visitor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      visitor_phone: visitorPhone,
      visitor_name: visitorName,
      status: status,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to get bookings" }));
    throw new Error(error.detail || "Failed to get bookings");
  }

  return await response.json();
};

/**
 * Cancel booking by visitor (VAPI endpoint - uses POST)
 */
export const cancelBookingByVisitor = async (
  visitorPhone: string,
  visitorName?: string,
  propertyName?: string,
  reason?: string
): Promise<{
  message: string;
  cancelledBookings: Array<{ bookingId: number; status: string; propertyId: number }>;
}> => {
  // Note: This endpoint doesn't require auth (VAPI calls it)
  const response = await fetch(`${API_BASE}/vapi/bookings/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      visitor_phone: visitorPhone,
      visitor_name: visitorName,
      property_name: propertyName,
      reason: reason,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to cancel booking" }));
    throw new Error(error.detail || "Failed to cancel booking");
  }

  return await response.json();
};

/**
 * Search properties for booking
 */
export const searchProperties = async (query: string): Promise<any[]> => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams({ q: query, limit: "10" });

  const response = await fetch(`${API_BASE}/api/search/properties?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to search properties" }));
    throw new Error(error.detail || "Failed to search properties");
  }

  const data = await response.json();
  return data.properties || [];
};

/**
 * Assign property to realtor
 */
export const assignProperty = async (
  propertyId: number,
  toUserId: number,
  toUserType: "property_manager" | "realtor",
  reason?: string
): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE}/api/properties/${propertyId}/assign`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to_user_id: toUserId,
      to_user_type: toUserType,
      reason,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to assign property" }));
    throw new Error(error.detail || "Failed to assign property");
  }

  return await response.json();
};

/**
 * Convert API day format (0=Monday, 6=Sunday) to JS format (0=Sunday, 6=Saturday)
 * API: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
 * JS:  0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
 */
const convertApiDaysToJs = (apiDays: number[]): number[] => {
  return apiDays.map(day => (day === 6) ? 0 : day + 1);
};

/**
 * Convert JS day format (0=Sunday, 6=Saturday) to API format (0=Monday, 6=Sunday)
 * JS:  0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
 * API: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
 */
const convertJsDaysToApi = (jsDays: number[]): number[] => {
  return jsDays.map(day => (day === 0) ? 6 : day - 1).sort();
};

/**
 * Fetch calendar preferences for a user
 * API: GET /api/users/{user_id}/calendar-preferences?user_type={user_type}
 * Response: { timezone, defaultSlotLengthMins, workingHours: { start, end }, working_days? }
 * Note: API uses 0=Monday, 6=Sunday format for working_days
 */
export const fetchCalendarPreferences = async (
  userId: number,
  userType: string
): Promise<{
  start_time: string;
  end_time: string;
  timezone: string;
  slot_length: number;
  working_days: number[];
}> => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  // Check cache first (cache for 10 minutes for preferences - they don't change often)
  const cacheKey = getCacheKey(`/api/users/${userId}/calendar-preferences`, { userType });
  const cached = getCachedData<{
    start_time: string;
    end_time: string;
    timezone: string;
    slot_length: number;
    working_days: number[];
  }>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/users/${userId}/calendar-preferences?user_type=${userType}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      
      // According to documentation, API response format is:
      // { timezone, defaultSlotLengthMins, workingHours: { start, end }, working_days? }
      // working_days is at top level: [0, 1, 2, 3, 4] where 0=Monday, 6=Sunday
      
      // Handle new API response format (documentation format)
      if (data.workingHours || data.preferences?.workingHours) {
        const prefs = data.preferences || data;
        // working_days is at top level in API response: [0, 1, 2, 3, 4] (0=Monday, 6=Sunday)
        const apiWorkingDays = data.working_days || prefs.working_days;
        
        const result = {
          start_time: prefs.workingHours?.start || data.workingHours?.start || "09:00",
          end_time: prefs.workingHours?.end || data.workingHours?.end || "17:00",
          timezone: prefs.timezone || data.timezone || "America/New_York",
          slot_length: prefs.defaultSlotLengthMins || data.defaultSlotLengthMins || 30,
          working_days: apiWorkingDays ? convertApiDaysToJs(apiWorkingDays) : [1, 2, 3, 4, 5], // Convert API format (0=Mon) to JS format (0=Sun)
        };
        
        // Cache for 10 minutes
        setCachedData(cacheKey, result, 10 * 60 * 1000);
        return result;
      }
      
      // Fallback: Handle legacy format if API returns it (for backward compatibility)
      if (data.start_time && data.end_time) {
        const apiWorkingDays = data.working_days;
        const prefs = {
          start_time: data.start_time,
          end_time: data.end_time,
          timezone: data.timezone || "America/New_York",
          slot_length: data.slot_length || data.defaultSlotLengthMins || 30,
          working_days: apiWorkingDays ? convertApiDaysToJs(apiWorkingDays) : [1, 2, 3, 4, 5], // Convert API format to JS format
        };
        // Cache for 10 minutes
        setCachedData(cacheKey, prefs, 10 * 60 * 1000);
        return prefs;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch calendar preferences from API:", e);
  }

  // Return defaults if API fails
  const defaults = {
    start_time: "09:00",
    end_time: "17:00",
    timezone: "America/New_York",
    slot_length: 30,
    working_days: [1, 2, 3, 4, 5],
  };
  // Cache defaults for shorter time (1 minute) in case API is temporarily down
  setCachedData(cacheKey, defaults, 1 * 60 * 1000);
  return defaults;
};

/**
 * Update calendar preferences for a user
 * API: PATCH /api/users/{user_id}/calendar-preferences?user_type={user_type}
 * Request: { timezone?, default_slot_length_mins?, working_hours_start?, working_hours_end?, working_days? }
 * All fields are optional - only send what you want to update
 * Note: API uses 0=Monday, 6=Sunday format for working_days
 */
export const updateCalendarPreferences = async (
  userId: number,
  userType: string,
  preferences: {
    start_time: string;
    end_time: string;
    timezone: string;
    slot_length: number;
    working_days?: number[]; // JS format: 0=Sunday, 1=Monday, ..., 6=Saturday
  }
): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  // Convert internal format to API format
  const requestBody: {
    timezone?: string;
    default_slot_length_mins?: number;
    working_hours_start?: string;
    working_hours_end?: string;
    working_days?: number[]; // API format: 0=Monday, 1=Tuesday, ..., 6=Sunday
  } = {};

  if (preferences.timezone) {
    requestBody.timezone = preferences.timezone;
  }
  if (preferences.slot_length) {
    requestBody.default_slot_length_mins = preferences.slot_length;
  }
  if (preferences.start_time) {
    requestBody.working_hours_start = preferences.start_time;
  }
  if (preferences.end_time) {
    requestBody.working_hours_end = preferences.end_time;
  }
  if (preferences.working_days && preferences.working_days.length > 0) {
    // Convert JS format (0=Sunday) to API format (0=Monday)
    requestBody.working_days = convertJsDaysToApi(preferences.working_days);
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/users/${userId}/calendar-preferences?user_type=${userType}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Failed to update calendar preferences" }));
      const errorMessage = extractErrorMessage(errorData);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Clear cache after update
    clearCacheForEndpoint(`/api/users/${userId}/calendar-preferences`, { userType });
    
    // According to documentation, API response format is:
    // { message, preferences: { timezone, defaultSlotLengthMins, workingHours: { start, end }, working_days? } }
    // OR: { timezone, defaultSlotLengthMins, workingHours: { start, end }, working_days? } (top level)
    
    // Convert API response format back to internal format
    const prefs = data.preferences || data;
    // working_days is at top level in API response: [0, 1, 2, 3, 4] (0=Monday, 6=Sunday)
    const apiWorkingDays = data.working_days || prefs.working_days;
    
    const convertedPreferences = {
      start_time: prefs.workingHours?.start || preferences.start_time,
      end_time: prefs.workingHours?.end || preferences.end_time,
      timezone: prefs.timezone || preferences.timezone,
      slot_length: prefs.defaultSlotLengthMins || preferences.slot_length,
      working_days: apiWorkingDays ? convertApiDaysToJs(apiWorkingDays) : (preferences.working_days || [1, 2, 3, 4, 5]), // Convert API format to JS format
    };
    
    return {
      ...data,
      preferences: convertedPreferences,
    };
  } catch (error: any) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(errorMessage);
  }
};

/**
 * Fetch unavailable slots for a user
 */
export const fetchUnavailableSlots = async (
  userId: number,
  userType: string,
  fromDate?: string,
  toDate?: string
): Promise<Array<{
  id: number;
  startAt: string;
  endAt: string;
  slotType: string;
  isFullDay: boolean;
  reason?: string;
  notes?: string;
}>> => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams();
  if (fromDate) params.append("from_date", fromDate);
  if (toDate) params.append("to_date", toDate);

  // Check cache first (cache for 5 minutes for availability slots - they don't change frequently)
  // Use a consistent cache key whether dates are provided or not
  const cacheKey = getCacheKey(`/api/users/${userId}/availability`, { fromDate: fromDate || 'all', toDate: toDate || 'all' });
  const cached = getCachedData<Array<{
    id: number;
    startAt: string;
    endAt: string;
    slotType: string;
    isFullDay: boolean;
    reason?: string;
    notes?: string;
  }>>(cacheKey);
  if (cached) {
    console.log(`Using cached unavailable slots: ${cached.length} slots`);
    return cached;
  }

  const endpoints = [
    `${API_BASE}/api/users/${userId}/availability?${params}`,
    `${API_BASE}/api/users/${userId}/unavailable-slots?${params}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Raw response from ${endpoint}:`, data);
        
        // Handle different response formats - check if data itself is an array
        let slots;
        if (Array.isArray(data)) {
          slots = data;
        } else if (data.unavailableSlots) {
          slots = data.unavailableSlots;
        } else if (data.slots) {
          slots = data.slots;
        } else if (data.availabilitySlots) {
          slots = data.availabilitySlots;
        } else if (data.data && Array.isArray(data.data)) {
          slots = data.data;
        } else {
          slots = [];
        }
        
        // Ensure slots is an array
        const slotsArray = Array.isArray(slots) ? slots : [];
        
        console.log(`Processed ${slotsArray.length} unavailable slots from ${endpoint}`, slotsArray);
        
        // Cache the result for 5 minutes (increased from 2 minutes to reduce API calls)
        setCachedData(cacheKey, slotsArray, 5 * 60 * 1000);
        
        return slotsArray;
      } else {
        // Handle 422 and 404 gracefully - these are expected for some endpoints
        if (response.status === 422 || response.status === 404) {
          // These are valid responses - endpoint might not support the request format or doesn't exist
          // Continue to next endpoint or return empty array
          continue;
        }
        console.warn(`Response not OK from ${endpoint}:`, response.status, response.statusText);
      }
    } catch (e) {
      console.warn(`Error fetching from ${endpoint}:`, e);
      continue;
    }
  }

  // Cache empty result for 30 seconds to avoid repeated failed requests
  setCachedData(cacheKey, [], 30 * 1000);
  return [];
};

/**
 * Add unavailable slot (block time)
 */
export const addUnavailableSlot = async (
  userId: number,
  userType: string,
  slot: {
    start_at: string;
    end_at: string;
    slot_type: "unavailable" | "busy" | "personal" | "holiday" | "off_day";
    is_full_day?: boolean;
    reason?: string;
    notes?: string;
  }
): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE}/api/users/${userId}/availability`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_type: userType,
      ...slot,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to add unavailable slot" }));
    throw new Error(error.detail || "Failed to add unavailable slot");
  }

  return await response.json();
};

/**
 * Remove unavailable slot
 */
/**
 * Remove/delete an availability slot (blocked time slot)
 * API: DELETE /api/users/{user_id}/availability/{slot_id}?user_type={user_type}
 * According to documentation: Users can only delete their own availability slots
 */
export const removeUnavailableSlot = async (
  userId: number,
  slotId: number,
  userType: string
): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  // Include user_type query parameter as per documentation
  const response = await fetch(
    `${API_BASE}/api/users/${userId}/availability/${slotId}?user_type=${userType}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to remove unavailable slot" }));
    const errorMessage = extractErrorMessage(error);
    throw new Error(errorMessage || "Failed to remove unavailable slot");
  }

  const data = await response.json();
  
  // Clear cache after mutation
  clearCacheForEndpoint(`/api/users/${userId}/availability`);
  clearCacheForEndpoint(`/api/users/${userId}/calendar-events`);
  
  return data;
};

/**
 * Create manual booking (from dashboard - auto-approved)
 */
export const createManualBooking = async (
  booking: {
    property_id: number;
    visitor_name: string;
    visitor_phone: string;
    visitor_email?: string;
    start_at: string;
    end_at: string;
    timezone?: string;
    notes?: string;
  }
): Promise<{
  bookingId: number;
  status: string;
  propertyId: number;
  visitorName: string;
  startAt: string;
  endAt: string;
  message: string;
}> => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE}/api/bookings/manual`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...booking,
      timezone: booking.timezone || "America/New_York",
    }),
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: "Failed to create booking" };
    }
    
    const errorMessage = extractErrorMessage(errorData) || "Failed to create booking";
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  // Clear bookings cache after creating a new booking
  const cacheKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('api_cache_') && key.includes('/bookings')
  );
  cacheKeys.forEach(key => localStorage.removeItem(key));
  // Also clear calendar events cache
  const calendarCacheKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('api_cache_') && key.includes('/calendar-events')
  );
  calendarCacheKeys.forEach(key => localStorage.removeItem(key));
  
  return data;
};

/**
 * Get all calendar events (bookings + availability slots)
 * API: GET /api/users/{user_id}/calendar-events?from_date={ISO_DATE}&to_date={ISO_DATE}
 * Response includes bookings with callRecord information if available
 */
export const fetchCalendarEvents = async (
  userId: number,
  fromDate: string,
  toDate: string
): Promise<{
  userId: number;
  userType: string;
  fromDate: string;
  toDate: string;
  events: Array<{
    id: string;
    type: "booking" | "availability_slot";
    bookingId?: number;
    slotId?: number;
    propertyId?: number;
    propertyAddress?: string;
    visitorName?: string;
    visitorPhone?: string;
    startAt: string;
    endAt: string;
    status?: string;
    slotType?: string;
    isFullDay?: boolean;
    callRecord?: {
      vapiCallId?: string;
      callTranscript?: string;
      callRecordingUrl?: string;
    };
  }>;
  bookings: any[];
  availabilitySlots: any[];
  total: number;
}> => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams({
    from_date: fromDate,
    to_date: toDate,
  });

  // Check cache first (cache for 2 minutes for calendar events - increased from 1 minute)
  const cacheKey = getCacheKey(`/api/users/${userId}/calendar-events`, { fromDate, toDate });
  const cached = getCachedData<{
    userId: number;
    userType: string;
    fromDate: string;
    toDate: string;
    events: any[];
    bookings: Booking[];
    availabilitySlots: any[];
    total: number;
  }>(cacheKey);
  if (cached) {
    console.log(`Using cached calendar events: ${cached.availabilitySlots?.length || 0} slots, ${cached.bookings?.length || 0} bookings`);
    return cached;
  }

  const response = await fetch(`${API_BASE}/api/users/${userId}/calendar-events?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch calendar events" }));
    const errorMessage = extractErrorMessage(error);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  // Cache the result for 2 minutes (increased from 1 minute to reduce API calls)
  setCachedData(cacheKey, data, 2 * 60 * 1000);
  
  return data;
};

/**
 * Get properties for dropdown (for manual booking creation)
 */
export const fetchPropertiesForAssignment = async (userId?: number): Promise<Array<{
  id: number;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  listing_status: string;
}>> => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  // Try to get userId from parameter or localStorage
  let targetUserId = userId;
  if (!targetUserId) {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        targetUserId = user.id || user.user_id || 0;
      } catch (e) {
        // Ignore
      }
    }
  }

  if (!targetUserId) {
    throw new Error("User ID is required");
  }

  const response = await fetch(`${API_BASE}/api/users/${targetUserId}/properties`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch properties" }));
    throw new Error(error.detail || "Failed to fetch properties");
  }

  const data = await response.json();
  return data.properties || [];
};

