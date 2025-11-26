/**
 * API Utilities
 * 
 * Centralized API call handling with token expiration management
 */

/**
 * Handle API response errors, including token expiration
 */
export const handleApiResponse = async (response: Response): Promise<void> => {
  // Handle token expiration (401)
  if (response.status === 401) {
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
    throw new Error("Token expired. Redirecting to login...");
  }
};

/**
 * Enhanced fetch with automatic token expiration handling
 */
export const apiFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem("access_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle token expiration
  await handleApiResponse(response);

  return response;
};

