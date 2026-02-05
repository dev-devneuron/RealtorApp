/**
 * ProtectedRoute Component
 * 
 * A higher-order component that protects routes requiring authentication.
 * Checks for an access token in localStorage and redirects unauthenticated
 * users to the sign-in page.
 * 
 * @param {React.ReactNode} children - The child components to render if authenticated
 * @returns {JSX.Element} Either the protected children or a redirect to sign-in
 * 
 * @example
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 */

import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Check for authentication token in localStorage
  const token = localStorage.getItem("access_token");

  // If no token exists, redirect to sign-in page
  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
