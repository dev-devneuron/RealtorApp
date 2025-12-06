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

// Page components
import Index from "./pages/Index";
import Properties from "./pages/Properties";
import About from "./pages/About";
import Signup from "./pages/Signup";
import SignIn from "./pages/SignIn";
import BookDemo from "./pages/BookDemo";
import Upload from "./pages/UploadPage";
import Dashboard from "./pages/Dashboard";
import ConfirmationPage from "./pages/ConfirmationPage";
import PropertyDetails from "./pages/PropertyDetails";
import NotFound from "./pages/NotFound";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

// Initialize React Query client for data fetching and caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
