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

