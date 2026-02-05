/**
 * Authentication Utilities
 * 
 * Handles token expiration, refresh, and redirects
 */

/**
 * Check if response indicates token expiration
 */
export const isTokenExpired = (response: Response): boolean => {
  return response.status === 401;
};

/**
 * Handle token expiration - clear storage and redirect to login
 */
export const handleTokenExpiration = (): void => {
  // Clear all authentication data
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("realtor_id");
  localStorage.removeItem("property_manager_id");
  localStorage.removeItem("user_type");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_gender");
  localStorage.removeItem("auth_link");
  
  // Redirect to sign in page
  window.location.href = "/signin";
};

/**
 * Enhanced fetch with automatic token expiration handling
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem("access_token");
  
  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle token expiration
  if (isTokenExpired(response)) {
    handleTokenExpiration();
    throw new Error("Token expired. Please sign in again.");
  }

  return response;
};

