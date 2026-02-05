/**
 * Main Application Component
 * 
 * This is the root component that sets up the application's routing,
 * global providers (React Query, Tooltips, Toasts), and defines all
 * application routes. Protected routes are wrapped with the ProtectedRoute
 * component to ensure authentication.
 * 
 * @module App
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Page components - Lazy loaded for code splitting and better performance
import { lazy, Suspense } from "react";

const Index = lazy(() => import("./pages/Index"));
const Properties = lazy(() => import("./pages/Properties"));
const About = lazy(() => import("./pages/About"));
const Signup = lazy(() => import("./pages/Signup"));
const SignIn = lazy(() => import("./pages/SignIn"));
const BookDemo = lazy(() => import("./pages/BookDemo"));
const Upload = lazy(() => import("./pages/UploadPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ConfirmationPage = lazy(() => import("./pages/ConfirmationPage"));
const PropertyDetails = lazy(() => import("./pages/PropertyDetails"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

// Initialize React Query client with aggressive caching for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection (formerly cacheTime)
      // Enable request deduplication - multiple components requesting same data will share one request
      structuralSharing: true,
    },
  },
});

/**
 * App Component
 * 
 * Main application component that wraps the entire app with necessary providers
 * and defines all routes. The route order matters - more specific routes should
 * come before catch-all routes.
 */
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Toast notification providers */}
        <Toaster />
        <Sonner />
        
        <BrowserRouter>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-blue-50">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent mb-4"></div>
                <p className="text-gray-600 font-medium">Loading...</p>
              </div>
            </div>
          }>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/book-demo" element={<BookDemo />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/confirmation" element={<ConfirmationPage />} />
              
              {/* Protected Routes - Require Authentication */}
              <Route
                path="/properties"
                element={
                  <ProtectedRoute>
                    <Properties />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/properties/:id"
                element={
                  <ProtectedRoute>
                    <PropertyDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/uploadpage"
                element={
                  <ProtectedRoute>
                    <Upload />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route for 404 errors - Must be last */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
