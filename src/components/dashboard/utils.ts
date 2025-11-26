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
 * Format date for display
 */
export const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format time for display
 */
export const formatTime = (dateString: string | Date): string => {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Format date and time for display
 */
export const formatDateTime = (dateString: string | Date): string => {
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
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

  const response = await fetch(`${API_BASE}/api/users/${userId}/bookings?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch bookings" }));
    throw new Error(error.detail || "Failed to fetch bookings");
  }

  const data = await response.json();
  return data.bookings || [];
};

/**
 * Get booking details
 */
export const fetchBookingDetail = async (bookingId: number): Promise<Booking> => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/approve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ approver_id: approverId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to approve booking" }));
    throw new Error(error.detail || "Failed to approve booking");
  }

  return await response.json();
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
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/deny`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ approver_id: approverId, reason }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to deny booking" }));
    throw new Error(error.detail || "Failed to deny booking");
  }

  return await response.json();
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
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/reschedule`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ proposed_slots: proposedSlots, reason }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to reschedule booking" }));
    throw new Error(error.detail || "Failed to reschedule booking");
  }

  return await response.json();
};

/**
 * Cancel booking
 */
export const cancelBooking = async (
  bookingId: number,
  reason?: string
): Promise<Booking> => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to cancel booking" }));
    throw new Error(error.detail || "Failed to cancel booking");
  }

  return await response.json();
};

/**
 * Get property availability
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

