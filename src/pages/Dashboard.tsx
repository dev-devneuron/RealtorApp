/**
 * Dashboard Page Component
 * 
 * Main dashboard component for Property Managers and Realtors. Provides comprehensive
 * management interfaces for:
 * - Property listings and details
 * - Realtor management (Property Managers only)
 * - Property assignments to realtors
 * - Phone number requests and assignments
 * - Bookings and appointments
 * - Chat and call recordings
 * - User profile information
 * 
 * Features role-based UI rendering based on user type (property_manager vs realtor).
 * Includes pagination, filtering, search, and CRUD operations for all entities.
 * 
 * @module pages/Dashboard
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Home, MapPin, Bed, Bath, Ruler, TrendingUp, Calendar, Eye, Music, Phone, Users, UserPlus, Settings, Building2, CheckSquare, Square, CalendarDays, User, ListChecks, RefreshCw, Mail, Calendar as CalendarIcon, Info, X, AlertTriangle, Edit2, Trash2, CheckCircle2, Star, Filter, Search, Download, Upload, MoreHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, LogOut, Unlink, PhoneForwarded, PhoneOff, ShieldCheck, Sun, Moon, Play, Pause, FileText, Clock, PhoneIncoming, PhoneOutgoing, PhoneMissed, Volume2, Copy, Check, ArrowUp, ArrowDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PropertiesTab, BookingsTab, ChatsTab, AssignPropertiesTab, ViewAssignmentsTab, PhoneNumbersTab, CallForwardingTab, RealtorsTab, MaintenanceRequestsTab, TenantsTab, MaintenanceRequestDetailModal, MaintenanceRequestUpdateModal, PropertyDetailModal, PropertyUpdateModal, CallRecordDetailModal, TenantAddModal, TenantEditModal, PhoneNumberRequestDialog, getPropertyMetadata, formatPhoneNumber, formatCallDuration } from "@/components/dashboard";
import { API_BASE } from "@/components/dashboard/constants";

/**
 * Dashboard Component
 * 
 * Main dashboard component that renders different interfaces based on user type.
 * Property Managers see additional management features for realtors and phone numbers.
 */
const Dashboard = () => {
  const navigate = useNavigate();
  
  // ============================================================================
  // UI State Management
  // ============================================================================
  const [animateCards, setAnimateCards] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("properties");
  
  // ============================================================================
  // User Information State
  // ============================================================================
  const [userType, setUserType] = useState<string | null>(null); // Determines which role-specific UI chunks render
  const [userName, setUserName] = useState<string | null>(null);
  const [userGender, setUserGender] = useState<string | null>(null);
  
  // ============================================================================
  // Phone Number State (Property Manager only)
  // ============================================================================
  const [myNumber, setMyNumber] = useState<string | null>(null);
  const [phoneNumberRequests, setPhoneNumberRequests] = useState<any[]>([]);
  const [loadingPhoneRequests, setLoadingPhoneRequests] = useState(false);
  const [purchasedPhoneNumbers, setPurchasedPhoneNumbers] = useState<any[]>([]);
  const [availablePhoneNumbers, setAvailablePhoneNumbers] = useState<any[]>([]);
  const [loadingPurchasedNumbers, setLoadingPurchasedNumbers] = useState(false);
  const [showRequestPhoneDialog, setShowRequestPhoneDialog] = useState(false);
  const [requestingPhone, setRequestingPhone] = useState(false);
  const [phoneRequestForm, setPhoneRequestForm] = useState({ country_code: "", area_code: "", notes: "" });
  const [assigningPhone, setAssigningPhone] = useState(false);
  const [selectedPhoneForAssignment, setSelectedPhoneForAssignment] = useState<number | null>(null);
  const [selectedRealtorForPhone, setSelectedRealtorForPhone] = useState<{ [key: number]: number }>({});

  // ============================================================================
  // Call Forwarding State (Property Managers & Realtors)
  // ============================================================================
  const [callForwardingState, setCallForwardingState] = useState<any | null>(null);
  const [loadingCallForwarding, setLoadingCallForwarding] = useState(false);
  const [updatingCallForwarding, setUpdatingCallForwarding] = useState(false);
  const [forwardingTarget, setForwardingTarget] = useState<string>("self");
  const [forwardingNotes, setForwardingNotes] = useState("");
  const [forwardingFailureReason, setForwardingFailureReason] = useState("");
  const [forwardingCarriers, setForwardingCarriers] = useState<string[]>([]);
  const [carrierDetails, setCarrierDetails] = useState<any[]>([]);
  const [showCarrierSelection, setShowCarrierSelection] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<string>("");
  const forwardingState = callForwardingState?.forwarding_state || {};
  const forwardingCodes = callForwardingState?.forwarding_codes || null;
  const businessForwardingEnabled = Boolean(forwardingState?.business_forwarding_enabled);
  const afterHoursEnabled = Boolean(forwardingState?.after_hours_enabled);
  const forwardingFailure = forwardingState?.forwarding_failure_reason;
  const lastAfterHoursUpdate = forwardingState?.last_after_hours_update;
  const currentCarrier = forwardingState?.carrier || forwardingCodes?.carrier || null;
  const supports25SecondForwarding = forwardingCodes?.supports_25_second_forwarding ?? true;
  const carrierType = forwardingCodes?.carrier_type || "gsm";

  /**
   * Derives the currently selected realtor ID for call forwarding management
   * Returns undefined when managing the currently authenticated user
   */
  const getSelectedForwardingRealtorId = () => {
    if (!forwardingTarget || forwardingTarget === "self") {
      return undefined;
    }

    if (forwardingTarget.startsWith("realtor-")) {
      const id = Number(forwardingTarget.replace("realtor-", ""));
      return Number.isNaN(id) ? undefined : id;
    }

    const parsed = Number(forwardingTarget);
    return Number.isNaN(parsed) ? undefined : parsed;
  };
  
  // ============================================================================
  // Recordings and Media State
  // ============================================================================
  const [recordings, setRecordings] = useState<{ url: string }[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  
  // ============================================================================
  // Call Records & Transcripts State
  // ============================================================================
  const [callRecords, setCallRecords] = useState<any[]>([]);
  const [loadingCallRecords, setLoadingCallRecords] = useState(false);
  const [callRecordsTotal, setCallRecordsTotal] = useState(0);
  const [callRecordsLimit] = useState(20);
  const [callRecordsOffset, setCallRecordsOffset] = useState(0);
  const [selectedCallRecord, setSelectedCallRecord] = useState<any | null>(null);
  const [showCallRecordDetail, setShowCallRecordDetail] = useState(false);
  const [callRecordSearch, setCallRecordSearch] = useState("");
  const [callRecordFilterStatus, setCallRecordFilterStatus] = useState<string>("all");
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [deletingCallRecord, setDeletingCallRecord] = useState(false);
  
  // ============================================================================
  // Bookings State
  // ============================================================================
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  
  // ============================================================================
  // Properties State
  // ============================================================================
  const [apartments, setApartments] = useState<any[]>([]);
  const [loadingApartments, setLoadingApartments] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<{ [key: number]: boolean }>({});
  const [selectedPropertyForDetail, setSelectedPropertyForDetail] = useState<any>(null);
  const [showPropertyDetailModal, setShowPropertyDetailModal] = useState(false);
  const [showPropertyUpdateModal, setShowPropertyUpdateModal] = useState(false);
  const [updatingProperty, setUpdatingProperty] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState(false);
  const [propertyUpdateForm, setPropertyUpdateForm] = useState<any>({});
  
  // ============================================================================
  // Chats State
  // ============================================================================
  const [chats, setChats] = useState<any>({});
  const [loadingChats, setLoadingChats] = useState(false);
  
  // ============================================================================
  // Realtor Management State (Property Manager only)
  // ============================================================================
  const [realtors, setRealtors] = useState<any[]>([]);
  const [loadingRealtors, setLoadingRealtors] = useState(false);
  const [showAddRealtor, setShowAddRealtor] = useState(false);
  const [newRealtor, setNewRealtor] = useState({ name: "", email: "", password: "" });
  const [showEditRealtor, setShowEditRealtor] = useState(false);
  const [editingRealtor, setEditingRealtor] = useState<any>(null);
  const [editRealtorForm, setEditRealtorForm] = useState({ name: "", email: "", password: "", contact: "" });
  const [updatingRealtor, setUpdatingRealtor] = useState(false);
  
  // ============================================================================
  // Property Assignment State (Property Manager only)
  // ============================================================================
  const [availablePropertiesForAssignment, setAvailablePropertiesForAssignment] = useState<any[]>([]);
  const [loadingAssignmentProperties, setLoadingAssignmentProperties] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [selectedRealtor, setSelectedRealtor] = useState<number | null>(null);
  const [assigningProperties, setAssigningProperties] = useState(false);
  const [assignmentsData, setAssignmentsData] = useState<any>(null);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [selectedRealtorFilters, setSelectedRealtorFilters] = useState<Set<number | string>>(new Set());
  
  // ============================================================================
  // Maintenance Requests State
  // ============================================================================
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [loadingMaintenanceRequests, setLoadingMaintenanceRequests] = useState(false);
  const [maintenanceRequestsTotal, setMaintenanceRequestsTotal] = useState(0);
  const [maintenanceRequestsLimit] = useState(50);
  const [maintenanceRequestsOffset, setMaintenanceRequestsOffset] = useState(0);
  const [maintenanceRequestFilterStatus, setMaintenanceRequestFilterStatus] = useState<string>("all");
  const [maintenanceRequestFilterProperty, setMaintenanceRequestFilterProperty] = useState<string>("all");
  const [maintenanceRequestFilterPriority, setMaintenanceRequestFilterPriority] = useState<string>("all");
  const [maintenanceRequestFilterCategory, setMaintenanceRequestFilterCategory] = useState<string>("all");
  const [maintenanceRequestSortBy, setMaintenanceRequestSortBy] = useState<string>("submitted_at");
  const [maintenanceRequestSortOrder, setMaintenanceRequestSortOrder] = useState<"asc" | "desc">("desc");
  const [showCallTranscript, setShowCallTranscript] = useState(false);
  const [selectedMaintenanceRequest, setSelectedMaintenanceRequest] = useState<any | null>(null);
  const [showMaintenanceRequestDetail, setShowMaintenanceRequestDetail] = useState(false);
  const [showMaintenanceRequestUpdate, setShowMaintenanceRequestUpdate] = useState(false);
  const [updatingMaintenanceRequest, setUpdatingMaintenanceRequest] = useState(false);
  const [deletingMaintenanceRequest, setDeletingMaintenanceRequest] = useState(false);
  const [maintenanceRequestUpdateForm, setMaintenanceRequestUpdateForm] = useState<any>({});

  // ============================================================================
  // Tenants State
  // ============================================================================
  const [tenants, setTenants] = useState<any[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    property_id: "",
    phone_number: "",
    email: "",
    realtor_id: "",
    unit_number: "",
    lease_start_date: "",
    lease_end_date: "",
    notes: ""
  });
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [showEditTenant, setShowEditTenant] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [editTenantForm, setEditTenantForm] = useState<any>({});
  const [updatingTenant, setUpdatingTenant] = useState(false);
  const [tenantFilterProperty, setTenantFilterProperty] = useState<string>("all");
  const [tenantFilterActive, setTenantFilterActive] = useState<string>("all");
  
  // ============================================================================
  // Pagination State
  // ============================================================================
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [pageJumpValue, setPageJumpValue] = useState("");

  // ============================================================================
  // API Functions - User Information
  // ============================================================================
  
  /**
   * Fetches current user information from the API
   * 
   * Attempts to retrieve user name and gender from multiple possible endpoints.
   * Falls back to localStorage if API calls fail. Updates user state and stores
   * information in localStorage for future use.
   */
  const fetchUserInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const storedUserType = localStorage.getItem("user_type");
      if (!token) {
        return;
      }

      // Try to get from localStorage first (stored during login)
      const storedUserName = localStorage.getItem("user_name");
      const storedUserGender = localStorage.getItem("user_gender");
      
      if (storedUserName && storedUserName.trim() !== "" && storedUserName !== "User") {
        setUserName(storedUserName);
        if (storedUserGender) {
          setUserGender(storedUserGender);
        }
        // Still try API to get better name if available, but don't return early
      }

      // If not in localStorage, try to fetch from API
      try {
        // Try documented /user-profile endpoint first, then fallback to others
        const endpoints = [
          `${API_BASE}/user-profile`,  // Documented endpoint - prioritize this
          ...(storedUserType === "property_manager" 
            ? [
                `${API_BASE}/property-manager/profile`,
                `${API_BASE}/property-manager/info`
              ]
            : [
                `${API_BASE}/realtor/profile`,
                `${API_BASE}/realtor/info`
              ])
        ];

        let nameFound = false;
        for (const endpoint of endpoints) {
          try {
            const res = await fetch(endpoint, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
              const data = await res.json();
              
              // Handle /user-profile response structure: { user: { name, email, ... } }
              // Also handle other possible response structures
              const name = data.user?.name || data.name || data.property_manager?.name || data.realtor?.name || data.email?.split('@')[0] || null;
              const gender = data.user?.gender || data.gender || data.property_manager?.gender || data.realtor?.gender || null;
              
              if (name && name.trim() !== "") {
                setUserName(name);
                localStorage.setItem("user_name", name);
                nameFound = true;
                
                if (gender) {
                  setUserGender(gender);
                  localStorage.setItem("user_gender", gender);
                }
                break;
              }
            }
          } catch (endpointErr) {
            // Try next endpoint
            continue;
          }
        }

        // If still no name found, try alternative methods
        if (!nameFound) {
          // For property managers, we might need to get it from a different endpoint
          // Or check if we can get email and extract username from it
          const storedEmail = localStorage.getItem("user_email");
          if (storedEmail && storedEmail.includes('@')) {
            const emailName = storedEmail.split('@')[0];
            // Clean and capitalize
            const cleanedName = emailName.replace(/[._0-9]/g, '');
            const formattedName = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);
            setUserName(formattedName);
            localStorage.setItem("user_name", formattedName);
          } else {
            // Ensure we always have something
            if (!localStorage.getItem("user_name") || localStorage.getItem("user_name") === "User") {
              setUserName("User");
              localStorage.setItem("user_name", "User");
            }
          }
        }
      } catch (err) {
        // Silently handle error - user name will fall back to default
      }
    } catch (err) {
      // Error handled silently
    }
  }, []);

  // Basic SEO for SPA route
  useEffect(() => {
    // Get user type from localStorage
    const storedUserType = localStorage.getItem("user_type");
    setUserType(storedUserType);
    // Set initial active tab based on user type
    if (storedUserType === "property_manager") {
      setActiveTab("realtors");
    } else {
      setActiveTab("properties");
    }

    // ALWAYS ensure we have a user name - check localStorage first and set immediately
    const storedUserName = localStorage.getItem("user_name");
    
    if (storedUserName && storedUserName.trim() !== "") {
      setUserName(storedUserName);
    } else {
      // Try to get from email
      const storedEmail = localStorage.getItem("user_email");
      if (storedEmail && storedEmail.includes('@')) {
        const emailName = storedEmail.split('@')[0];
        const cleanedName = emailName.replace(/[._0-9]/g, '');
        const formattedName = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);
        setUserName(formattedName);
        localStorage.setItem("user_name", formattedName);
      } else {
        // Set a default
        setUserName("User");
        localStorage.setItem("user_name", "User");
      }
    }

    const title = storedUserType === "property_manager" ? "Property Manager Dashboard | Leasap" : "Dashboard | Leasap";
    const description = storedUserType === "property_manager" 
      ? "Property manager dashboard to manage realtors and properties."
      : "Personalized real estate dashboard with your properties and bookings.";
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);

    // Trigger staggered animations after component mount (reduced delay for faster perceived performance)
    setTimeout(() => setAnimateCards(true), 100);
    
    // Fetch critical user information immediately
    fetchUserInfo();
    fetchNumber();

    // Fetch initial data for default tab (defer non-critical)
    if (storedUserType === "property_manager") {
      // Only fetch what's needed for the initial tab (realtors)
      fetchRealtors();
      // Defer other data fetching until tabs are accessed
      setTimeout(() => {
      fetchPropertiesForAssignment();
      fetchAssignments();
      fetchPhoneNumberRequests();
      fetchPurchasedPhoneNumbers();
        fetchTenants(); // Load tenants for stats card
      }, 500);
    }
    
    // Fetch properties and bookings (visible on default tab for realtors)
    fetchApartments();
    fetchBookings();
    
    // Defer non-critical data
    setTimeout(() => {
      fetchChats();
    fetchForwardingCarriers();
    }, 800);
  }, []);

  // Refresh forwarding controls whenever auth role changes or PM selects a different realtor target
  useEffect(() => {
    if (!userType) {
      return;
    }

    setForwardingNotes("");
    setForwardingFailureReason("");
    const realtorId = getSelectedForwardingRealtorId();
    fetchCallForwardingState(realtorId);
  }, [userType, forwardingTarget]);

  // Fetch maintenance requests when the maintenance tab is active
  useEffect(() => {
    if (activeTab === "maintenance-requests") {
      fetchMaintenanceRequests(maintenanceRequestFilterStatus !== "all" ? maintenanceRequestFilterStatus : undefined);
    }
  }, [activeTab, maintenanceRequestFilterStatus, maintenanceRequestFilterProperty, maintenanceRequestFilterPriority, maintenanceRequestFilterCategory, maintenanceRequestSortBy, maintenanceRequestSortOrder]);

  // Fetch tenants when the tenants tab is active
  useEffect(() => {
    if (activeTab === "tenants") {
      fetchTenants(tenantFilterProperty !== "all" ? tenantFilterProperty : undefined, tenantFilterActive !== "all" ? tenantFilterActive : undefined);
    }
  }, [activeTab, tenantFilterProperty, tenantFilterActive]);

  // Fetch call records when the calls tab is active
  useEffect(() => {
    if (activeTab === "chats") {
      fetchCallRecords(callRecordsLimit, callRecordsOffset);
    }
  }, [activeTab, callRecordsOffset]);

  // All your existing API functions remain exactly the same
  /**
   * Fetches the current user's assigned Twilio bot number
   * 
   * The backend automatically finds assigned bot numbers by:
   * 1. Checking the user's `purchased_phone_number_id` field
   * 2. Searching `purchased_phone_numbers` for entries where `assigned_to_type`/`assigned_to_id` matches the user
   * 3. For PMs only: Auto-promoting the oldest unassigned number from their inventory if none is explicitly assigned
   * 
   * If no number is found (404), this is a valid state - the user simply hasn't been assigned a number yet.
   * The backend handles case-insensitive matching for `assigned_to_type` variations.
   */
  // Helper function to handle token expiration
  const handleTokenExpiration = useCallback(() => {
    toast.error("Session expired. Please sign in again.");
    localStorage.clear();
    setTimeout(() => {
      window.location.href = "/signin";
    }, 1500);
  }, []);

  const fetchNumber = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        return;
      }

      const res = await fetch(`${API_BASE}/my-number`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle token expiration
      if (res.status === 401) {
        handleTokenExpiration();
        return;
      }

      if (!res.ok) {
        // If 404, user doesn't have a number assigned yet - this is normal
        // The backend will auto-promote numbers for PMs on first load if available
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 404 || errorData.detail?.includes("haven't purchased") || errorData.detail?.includes("No number assigned")) {
          setMyNumber(null);
          return;
        }
        // For other errors, don't show toast (not having a number is valid)
        setMyNumber(null);
        return;
      }

      const data = await res.json();
      // Backend returns twilio_number from purchased_phone_numbers (official callbot pool)
      // This is always the bot number we provisioned, never a legacy/historical value
      setMyNumber(data.twilio_number || null);
    } catch (err: any) {
      // Don't show error toast - not having a number is a valid state
      // The backend handles auto-promotion and case-insensitive matching transparently
      setMyNumber(null);
    } finally {
      setLoading(false);
    }
  }, [handleTokenExpiration]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoadingBookings(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        // Redirect to login if no token
        setTimeout(() => {
          window.location.href = "/signin";
        }, 1000);
        return;
      }

      // Get user ID from localStorage
      const storedUserType = localStorage.getItem("user_type");
      const userId = storedUserType === "property_manager" 
        ? localStorage.getItem("property_manager_id")
        : localStorage.getItem("realtor_id");

      if (!userId) {
        toast.error("User ID not found");
        return;
      }

      // Ensure userId is a number (API expects integer)
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        console.error("Invalid user ID format:", userId);
        toast.error("Invalid user ID");
        return;
      }

      // Ensure token is valid and properly formatted
      if (!token || token.trim() === "") {
        console.error("Token is empty or invalid");
        toast.error("Authentication token is missing");
        handleTokenExpiration();
        return;
      }

      // Prepare headers with explicit Authorization header
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.trim()}`,
      };

      // Debug logging (remove in production)
      console.log("Fetching bookings for user:", userIdNum);
      console.log("Authorization header present:", !!headers.Authorization);
      console.log("Token length:", token.length);

      // Use the new booking API endpoint
      const res = await fetch(`${API_BASE}/api/users/${userIdNum}/bookings`, {
        method: "GET",
        headers: headers,
      });

      // Handle token expiration
      if (res.status === 401) {
        handleTokenExpiration();
        return;
      }

      if (!res.ok) {
        let errorData: any = {};
        try {
          errorData = await res.json();
        } catch {
          // If response is not JSON, use status text
          errorData = { detail: res.statusText || "Failed to fetch bookings" };
        }
        
        // Extract error message properly (handle both string and object)
        let errorMessage = "Failed to fetch bookings";
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = typeof errorData.message === 'string'
            ? errorData.message
            : JSON.stringify(errorData.message);
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string'
            ? errorData.error
            : JSON.stringify(errorData.error);
        }
        
        // Handle 422 validation errors
        if (res.status === 422) {
          console.error("Validation error (422):", errorData);
          console.warn("Error message:", errorMessage);
          // Still try to set empty array to prevent UI errors
          setBookings([]);
          // Don't show error toast for validation errors - might be expected (e.g., user has no bookings yet)
          return;
        }
        
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      // Only show error if it's not a token expiration (already handled)
      if (!err.message?.includes("expired") && !err.message?.includes("401")) {
        toast.error(err.message || "Could not load bookings");
      }
    } finally {
      setLoadingBookings(false);
    }
  }, [handleTokenExpiration]);

  const fetchApartments = useCallback(async () => {
    try {
      setLoadingApartments(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/apartments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle token expiration
      if (res.status === 401) {
        handleTokenExpiration();
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch apartments");

      const data = await res.json();

      // since backend returns raw array
      setApartments(Array.isArray(data) ? data : data.apartments || []);
    } catch (err: any) {
      if (!err.message?.includes("expired") && !err.message?.includes("401")) {
        toast.error("Could not load apartments");
      }
    } finally {
      setLoadingApartments(false);
    }
  }, [handleTokenExpiration]);

  const fetchRecordings = async () => {
    try {
      setLoadingRecordings(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/recordings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch recordings");

      const data = await res.json();
      setRecordings(data.recordings || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load recordings");
    } finally {
      setLoadingRecordings(false);
    }
  };

  const fetchChats = useCallback(async () => {
    try {
      setLoadingChats(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/chat-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch chats");

      const data = await res.json();
      // FIX: unwrap .chats
      setChats(data.chats || {});
    } catch (err) {
      toast.error("Could not load chats");
    } finally {
      setLoadingChats(false);
    }
  }, []);

  // ============================================================================
  // Call Records & Transcripts API Functions
  // ============================================================================

  /**
   * Fetches call records with pagination and filtering
   */
  const fetchCallRecords = async (limit?: number, offset?: number) => {
    try {
      setLoadingCallRecords(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const params = new URLSearchParams();
      const limitValue = limit !== undefined ? limit : callRecordsLimit;
      const offsetValue = offset !== undefined ? offset : callRecordsOffset;
      params.append("limit", limitValue.toString());
      params.append("offset", offsetValue.toString());

      const res = await fetch(`${API_BASE}/call-records?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle token expiration
      if (res.status === 401) {
        handleTokenExpiration();
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Failed to fetch call records");
      }

      const data = await res.json();
      const records = Array.isArray(data.call_records) ? data.call_records : [];
      setCallRecords(records.map((record) => sanitizeCallRecord(record)));
      setCallRecordsTotal(data.total || 0);
    } catch (err: any) {
      console.error("Error fetching call records:", err);
      toast.error(err.message || "Could not load call records");
    } finally {
      setLoadingCallRecords(false);
    }
  };

  /**
   * Fetches detailed information for a specific call record
   * IMPORTANT: Uses call_id (not id) as per API documentation
   */
  const fetchCallRecordDetail = async (callId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      // URL encode the call_id in case it contains special characters
      const encodedCallId = encodeURIComponent(callId);

      const res = await fetch(`${API_BASE}/call-records/${encodedCallId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Failed to fetch call record details");
      }

      const data = await res.json();
      return sanitizeCallRecord(data);
    } catch (err: any) {
      console.error("Error fetching call record detail:", err);
      toast.error(err.message || "Could not load call record details");
      throw err;
    }
  };

  /**
   * Opens the call record detail modal and fetches full details
   */
  const handleViewCallRecord = async (callRecord: any) => {
    try {
      setSelectedCallRecord(sanitizeCallRecord(callRecord));
      setShowCallRecordDetail(true);
      setCopiedTranscript(false); // Reset copy state when opening modal
      
      // Fetch full details if we don't have the transcript
      // IMPORTANT: Use call_id (not id) for API calls
      if (!callRecord.transcript || callRecord.transcript.trim() === "") {
        const callIdToUse = callRecord.call_id || callRecord.id;
        if (callIdToUse) {
          const detail = await fetchCallRecordDetail(callIdToUse);
        setSelectedCallRecord(detail);
        }
      }
    } catch (err) {
      console.error("Error viewing call record:", err);
    }
  };

  /**
   * Extracts only the conversational parts of the transcript plus summary
   */
  type TranscriptSegment = {
    speaker: "user" | "bot" | "summary" | "other";
    content: string;
  };

  const normalizeSpeaker = (rawSpeaker: string): TranscriptSegment["speaker"] => {
    const speaker = rawSpeaker.toLowerCase();
    if (speaker.includes("user") || speaker.includes("customer") || speaker.includes("caller")) {
      return "user";
    }
    if (
      speaker.includes("bot") ||
      speaker.includes("ai") ||
      speaker.includes("assistant") ||
      speaker.includes("agent")
    ) {
      return "bot";
    }
    if (speaker.includes("summary")) {
      return "summary";
    }
    return "other";
  };

  const extractTranscriptData = (transcript?: string | null) => {
    if (!transcript || typeof transcript !== "string") {
      return {
        conversationSegments: [] as TranscriptSegment[],
        summarySegments: [] as TranscriptSegment[],
        cleanedTranscript: transcript,
      };
    }

    const lines = transcript.split(/\r?\n/);
    const segments: TranscriptSegment[] = [];
    let currentSegment: TranscriptSegment | null = null;
    const speakerRegex = /^(bot|user|summary|ai|assistant|agent|customer|caller)\s*:\s*(.*)$/i;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const match = line.match(speakerRegex);
      if (match) {
        const speaker = normalizeSpeaker(match[1]);
        const content = (match[2] || "").trim();
        currentSegment = { speaker, content };
        segments.push(currentSegment);
      } else if (currentSegment) {
        currentSegment.content = currentSegment.content
          ? `${currentSegment.content}\n${line}`
          : line;
      }
    }

    if (segments.length === 0) {
      return {
        conversationSegments: [],
        summarySegments: [],
        cleanedTranscript: transcript,
      };
    }

    const conversationSegments = segments.filter((segment) => segment.speaker !== "summary");
    const summarySegments = segments.filter((segment) => segment.speaker === "summary");

    const cleanedTranscript = segments
      .map((segment) => {
        const speakerLabel =
          segment.speaker.charAt(0).toUpperCase() + segment.speaker.slice(1).toLowerCase();
        return `${speakerLabel}: ${segment.content}`;
      })
      .join("\n\n");

    return {
      conversationSegments,
      summarySegments,
      cleanedTranscript,
    };
  };

  const sanitizeCallRecord = (record: any) => {
    if (!record || typeof record !== "object") {
      return record;
    }

    const transcriptData = extractTranscriptData(record.transcript);

    return {
      ...record,
      transcript: transcriptData.cleanedTranscript,
      transcript_segments: transcriptData.conversationSegments,
      transcript_summary: transcriptData.summarySegments
        .map((segment) => segment.content)
        .join("\n\n"),
    };
  };


  /**
   * Downloads a recording file
   */
  const handleDownloadRecording = (recordingUrl: string, callId: string) => {
    try {
      const link = document.createElement("a");
      link.href = recordingUrl;
      link.download = `call-${callId}.mp3`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    } catch (err) {
      console.error("Error downloading recording:", err);
      toast.error("Failed to download recording");
    }
  };

  /**
   * Copies transcript to clipboard
   */
  const formatSegmentsAsText = (segments?: TranscriptSegment[]) => {
    if (!segments || segments.length === 0) {
      return "";
    }
    return segments
      .map((segment) => {
        const speakerLabel =
          segment.speaker === "user"
            ? "User"
            : segment.speaker === "bot"
            ? "AI"
            : segment.speaker === "summary"
            ? "Summary"
            : "Note";
        return `${speakerLabel}: ${segment.content}`;
      })
      .join("\n\n");
  };

  const handleCopyTranscript = async (
    transcript?: string | null,
    segments?: TranscriptSegment[]
  ) => {
    try {
      const textToCopy = transcript && transcript.trim().length > 0
        ? transcript
        : formatSegmentsAsText(segments);
      if (!textToCopy) {
        throw new Error("No transcript available to copy");
      }
      await navigator.clipboard.writeText(textToCopy);
      setCopiedTranscript(true);
      toast.success("Transcript copied to clipboard");
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch (err) {
      console.error("Error copying transcript:", err);
      toast.error("Failed to copy transcript");
    }
  };

  /**
   * Deletes or redacts a call record
   */
  const handleDeleteCallRecord = async (callId: string, hardDelete = false) => {
    try {
      setDeletingCallRecord(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      // IMPORTANT: URL encode the call_id in case it contains special characters
      const encodedCallId = encodeURIComponent(callId);

      const res = await fetch(
        `${API_BASE}/call-records/${encodedCallId}?hard_delete=${hardDelete ? "true" : "false"}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Always parse JSON response - even for errors
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        const text = await res.text();
        throw new Error(`Server error: ${text || res.statusText}`);
      }

      if (!res.ok) {
        // Error response - data.detail contains the error message
        const errorMessage = data.detail || data.message || "Failed to delete call record";
        throw new Error(errorMessage);
      }

      // Success
      toast.success(data.message || (hardDelete ? "Call record deleted" : "Transcript removed"));
      await fetchCallRecords();

      if (hardDelete) {
        setShowCallRecordDetail(false);
        setSelectedCallRecord(null);
      } else {
        // Soft delete - update the record to remove transcript/recording
        setSelectedCallRecord((prev) => {
          if (!prev) return prev;
          // Check by call_id if available, otherwise by id
          const matches = prev.call_id ? prev.call_id === callId : prev.id === callId;
          if (!matches) return prev;
          return {
            ...prev,
            transcript: "",
            transcript_segments: [],
            transcript_summary: "",
            recording_url: null,
            live_transcript_chunks: [],
          };
        });
      }
    } catch (err: any) {
      console.error("Error deleting call record:", err);
      const errorMessage = err.message || String(err);
      toast.error(errorMessage);
      throw err;
    } finally {
      setDeletingCallRecord(false);
    }
  };

  // ============================================================================
  // API Functions - Maintenance Requests
  // ============================================================================

  const fetchMaintenanceRequests = async (status?: string, limit?: number, offset?: number) => {
    try {
      setLoadingMaintenanceRequests(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      // Fetch with status filter only (API supports this)
      const params = new URLSearchParams();
      if (status && status !== "all") params.append("status", status);
      // Fetch more items to allow client-side filtering
      params.append("limit", "100");
      params.append("offset", "0");

      const res = await fetch(`${API_BASE}/maintenance-requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle token expiration
      if (res.status === 401) {
        handleTokenExpiration();
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch maintenance requests");

      const data = await res.json();
      // API returns array directly, not wrapped in object
      let requests = Array.isArray(data) ? data : (data.maintenance_requests || []);
      
      // Client-side filtering
      if (maintenanceRequestFilterProperty !== "all") {
        requests = requests.filter((req: any) => 
          req.property_id === Number(maintenanceRequestFilterProperty) ||
          req.property?.id === Number(maintenanceRequestFilterProperty)
        );
      }
      
      if (maintenanceRequestFilterPriority !== "all") {
        requests = requests.filter((req: any) => req.priority === maintenanceRequestFilterPriority);
      }
      
      if (maintenanceRequestFilterCategory !== "all") {
        requests = requests.filter((req: any) => req.category === maintenanceRequestFilterCategory);
      }
      
      // Client-side sorting
      requests.sort((a: any, b: any) => {
        let aValue: any;
        let bValue: any;
        
        switch (maintenanceRequestSortBy) {
          case "submitted_at":
            aValue = new Date(a.submitted_at || 0).getTime();
            bValue = new Date(b.submitted_at || 0).getTime();
            break;
          case "priority":
            const priorityOrder: { [key: string]: number } = { urgent: 4, high: 3, normal: 2, low: 1 };
            aValue = priorityOrder[a.priority] || 0;
            bValue = priorityOrder[b.priority] || 0;
            break;
          case "status":
            const statusOrder: { [key: string]: number } = { pending: 1, in_progress: 2, completed: 3, cancelled: 4 };
            aValue = statusOrder[a.status] || 0;
            bValue = statusOrder[b.status] || 0;
            break;
          default:
            aValue = a[maintenanceRequestSortBy] || "";
            bValue = b[maintenanceRequestSortBy] || "";
        }
        
        if (maintenanceRequestSortOrder === "asc") {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
      
      // Apply pagination
      const total = requests.length;
      const start = offset || maintenanceRequestsOffset;
      const end = start + (limit || maintenanceRequestsLimit);
      const paginatedRequests = requests.slice(start, end);
      
      setMaintenanceRequests(paginatedRequests);
      setMaintenanceRequestsTotal(total);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not load maintenance requests");
    } finally {
      setLoadingMaintenanceRequests(false);
    }
  };

  const fetchMaintenanceRequestDetail = async (requestId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/maintenance-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch maintenance request details");

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not load maintenance request details");
      throw err;
    }
  };

  const updateMaintenanceRequest = async (requestId: number, updateData: any) => {
    try {
      setUpdatingMaintenanceRequest(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/maintenance-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || errorData.message || "Failed to update maintenance request");
      }

      const data = await res.json();
      toast.success(data.message || "Maintenance request updated successfully");
      
      // Refresh the list
      await fetchMaintenanceRequests(maintenanceRequestFilterStatus !== "all" ? maintenanceRequestFilterStatus : undefined);
      
      // Update detail view if open
      if (selectedMaintenanceRequest && selectedMaintenanceRequest.maintenance_request_id === requestId) {
        const updated = await fetchMaintenanceRequestDetail(requestId);
        setSelectedMaintenanceRequest(updated);
      }
      
      return data;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not update maintenance request");
      throw err;
    } finally {
      setUpdatingMaintenanceRequest(false);
    }
  };

  const deleteMaintenanceRequest = async (requestId: number) => {
    try {
      setDeletingMaintenanceRequest(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/maintenance-requests/${requestId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || errorData.message || "Failed to delete maintenance request");
      }

      const data = await res.json();
      toast.success(data.message || "Maintenance request deleted successfully");
      
      // Refresh the list
      await fetchMaintenanceRequests(maintenanceRequestFilterStatus !== "all" ? maintenanceRequestFilterStatus : undefined);
      
      // Close detail modal if it was open for this request
      if (selectedMaintenanceRequest && selectedMaintenanceRequest.maintenance_request_id === requestId) {
        setShowMaintenanceRequestDetail(false);
        setSelectedMaintenanceRequest(null);
      }
      
      return data;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not delete maintenance request");
      throw err;
    } finally {
      setDeletingMaintenanceRequest(false);
    }
  };

  // ============================================================================
  // API Functions - Tenants
  // ============================================================================

  const fetchTenants = async (propertyId?: string, isActive?: string) => {
    try {
      setLoadingTenants(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const params = new URLSearchParams();
      if (propertyId && propertyId !== "all") params.append("property_id", propertyId);
      if (isActive && isActive !== "all") params.append("is_active", isActive === "active" ? "true" : "false");

      const res = await fetch(`${API_BASE}/tenants?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle token expiration
      if (res.status === 401) {
        handleTokenExpiration();
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch tenants");

      const data = await res.json();
      // API returns array directly, not wrapped in object
      const tenantsList = Array.isArray(data) ? data : (data.tenants || []);
      setTenants(tenantsList);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not load tenants");
    } finally {
      setLoadingTenants(false);
    }
  };

  const createTenant = async () => {
    try {
      setCreatingTenant(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      // Prepare request body - only include non-empty fields
      const requestBody: any = {
        name: newTenant.name,
        property_id: Number(newTenant.property_id),
      };

      if (newTenant.phone_number) requestBody.phone_number = newTenant.phone_number;
      if (newTenant.email) requestBody.email = newTenant.email;
      if (newTenant.realtor_id && newTenant.realtor_id !== "none") {
        requestBody.realtor_id = Number(newTenant.realtor_id);
      }
      if (newTenant.unit_number) requestBody.unit_number = newTenant.unit_number;
      if (newTenant.lease_start_date) requestBody.lease_start_date = newTenant.lease_start_date;
      if (newTenant.lease_end_date) requestBody.lease_end_date = newTenant.lease_end_date;
      if (newTenant.notes) requestBody.notes = newTenant.notes;

      const res = await fetch(`${API_BASE}/tenants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || errorData.message || "Failed to create tenant");
      }

      const data = await res.json();
      toast.success(data.message || "Tenant created successfully");
      
      // Reset form
      setNewTenant({
        name: "",
        property_id: "",
        phone_number: "",
        email: "",
        realtor_id: "",
        unit_number: "",
        lease_start_date: "",
        lease_end_date: "",
        notes: ""
      });
      setShowAddTenant(false);
      
      // Refresh tenants and properties lists
      await fetchTenants(tenantFilterProperty !== "all" ? tenantFilterProperty : undefined, tenantFilterActive !== "all" ? tenantFilterActive : undefined);
      await fetchApartments();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not create tenant");
    } finally {
      setCreatingTenant(false);
    }
  };

  const handleEditTenant = (tenant: any) => {
    setEditingTenant(tenant);
    setEditTenantForm({
      name: tenant.name || "",
      phone_number: tenant.phone_number || "",
      email: tenant.email || "",
      unit_number: tenant.unit_number || "",
      lease_start_date: tenant.lease_start_date || "",
      lease_end_date: tenant.lease_end_date || "",
      is_active: tenant.is_active !== false,
      notes: tenant.notes || "",
    });
    setShowEditTenant(true);
  };

  const updateTenant = async () => {
    if (!editingTenant) return;

    setUpdatingTenant(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      // Prepare request body - only include changed fields
      const requestBody: any = {};
      if (editTenantForm.name !== editingTenant.name) requestBody.name = editTenantForm.name;
      if (editTenantForm.phone_number !== editingTenant.phone_number) requestBody.phone_number = editTenantForm.phone_number;
      if (editTenantForm.email !== editingTenant.email) requestBody.email = editTenantForm.email;
      if (editTenantForm.unit_number !== editingTenant.unit_number) requestBody.unit_number = editTenantForm.unit_number;
      if (editTenantForm.lease_start_date !== editingTenant.lease_start_date) requestBody.lease_start_date = editTenantForm.lease_start_date;
      if (editTenantForm.lease_end_date !== editingTenant.lease_end_date) requestBody.lease_end_date = editTenantForm.lease_end_date;
      if (editTenantForm.is_active !== editingTenant.is_active) requestBody.is_active = editTenantForm.is_active;
      if (editTenantForm.notes !== editingTenant.notes) requestBody.notes = editTenantForm.notes;

      if (Object.keys(requestBody).length === 0) {
        toast.info("No changes to save");
        return;
      }

      const res = await fetch(`${API_BASE}/tenants/${editingTenant.tenant_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || errorData.message || "Failed to update tenant");
      }

      const data = await res.json();
      toast.success(data.message || "Tenant updated successfully");
      setShowEditTenant(false);
      setEditingTenant(null);
      
      // Refresh tenants and properties lists
      await fetchTenants(tenantFilterProperty !== "all" ? tenantFilterProperty : undefined, tenantFilterActive !== "all" ? tenantFilterActive : undefined);
      await fetchApartments();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not update tenant");
    } finally {
      setUpdatingTenant(false);
    }
  };

  // ============================================================================
  // API Functions - Realtor Management
  // ============================================================================

  const fetchRealtors = useCallback(async () => {
    try {
      setLoadingRealtors(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/property-manager/realtors`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle token expiration
      if (res.status === 401) {
        handleTokenExpiration();
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch realtors");

      const data = await res.json();
      setRealtors(data.realtors || []);
    } catch (err) {
      toast.error("Could not load realtors");
    } finally {
      setLoadingRealtors(false);
    }
  }, []);

  const addRealtor = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/property-manager/add-realtor`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newRealtor),
      });

      if (!res.ok) throw new Error("Failed to add realtor");

      toast.success("Realtor added successfully!");
      setNewRealtor({ name: "", email: "", password: "" });
      setShowAddRealtor(false);
      fetchRealtors();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not add realtor");
    }
  };

  const handleEditRealtor = (realtor: any) => {
    setEditingRealtor(realtor);
    setEditRealtorForm({
      name: realtor.name || "",
      email: realtor.email || "",
      password: "",
      contact: realtor.contact || "",
    });
    setShowEditRealtor(true);
  };

  const updateRealtor = async () => {
    if (!editingRealtor) return;

    setUpdatingRealtor(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      // Build update payload - only include fields that have values
      const updatePayload: any = {};
      if (editRealtorForm.name && editRealtorForm.name !== editingRealtor.name) {
        updatePayload.name = editRealtorForm.name;
      }
      if (editRealtorForm.email && editRealtorForm.email !== editingRealtor.email) {
        updatePayload.email = editRealtorForm.email;
      }
      if (editRealtorForm.contact && editRealtorForm.contact !== editingRealtor.contact) {
        updatePayload.contact = editRealtorForm.contact;
      }
      if (editRealtorForm.password && editRealtorForm.password.trim() !== "") {
        updatePayload.password = editRealtorForm.password;
      }

      // Don't send request if nothing changed
      if (Object.keys(updatePayload).length === 0) {
        toast.info("No changes to save");
        setShowEditRealtor(false);
        setUpdatingRealtor(false);
        return;
      }

      const res = await fetch(`${API_BASE}/property-manager/realtors/${editingRealtor.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Failed to update realtor");
      }

      const data = await res.json();
      toast.success("Realtor updated successfully!");
      setShowEditRealtor(false);
      setEditingRealtor(null);
      setEditRealtorForm({ name: "", email: "", password: "", contact: "" });
      fetchRealtors();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not update realtor");
    } finally {
      setUpdatingRealtor(false);
    }
  };

  const fetchPropertiesForAssignment = async () => {
    try {
      setLoadingAssignmentProperties(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/apartments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle token expiration
      if (res.status === 401) {
        handleTokenExpiration();
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch properties");

      const data = await res.json();
      const allProperties = Array.isArray(data) ? data : data.apartments || [];
      
      // Filter to only show PM's own properties (not already assigned to realtors)
      const pmProperties = allProperties.filter(
        (prop: any) => prop.owner_type === "property_manager"
      );
      
      setAvailablePropertiesForAssignment(pmProperties);
    } catch (err) {
      console.error(err);
      toast.error("Could not load properties for assignment");
    } finally {
      setLoadingAssignmentProperties(false);
    }
  };

  const assignProperties = async () => {
    if (!selectedRealtor || selectedProperties.length === 0) {
      toast.error("Please select a realtor and at least one property");
      return;
    }

    setAssigningProperties(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/property-manager/assign-properties`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          realtor_id: selectedRealtor,
          property_ids: selectedProperties
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Failed to assign properties");
      }

      const data = await res.json();
      toast.success(data.message || `Successfully assigned ${selectedProperties.length} properties`);
      
      // Refresh properties list (assigned ones will no longer show)
      fetchPropertiesForAssignment();
      fetchApartments(); // Also refresh the main apartments list
      fetchAssignments(); // Refresh assignments view
      setSelectedProperties([]);
      setSelectedRealtor(null);
    } catch (err: any) {
      console.error("Assignment failed:", err);
      toast.error(err.message || "Failed to assign properties");
    } finally {
      setAssigningProperties(false);
    }
  };

  const handlePropertyToggle = (propertyId: number) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  // Pagination calculations
  const totalPages = Math.ceil((availablePropertiesForAssignment?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = useMemo(() => {
    if (!Array.isArray(availablePropertiesForAssignment) || availablePropertiesForAssignment.length === 0) {
      return [];
    }
    return availablePropertiesForAssignment.slice(startIndex, endIndex);
  }, [availablePropertiesForAssignment, startIndex, endIndex]);

  // Reset to page 1 when items per page changes or properties change
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, Array.isArray(availablePropertiesForAssignment) ? availablePropertiesForAssignment.length : 0]);

  const handleSelectAll = () => {
    // Select all properties on current page
    if (!Array.isArray(paginatedProperties) || paginatedProperties.length === 0) return;
    const currentPageIds = paginatedProperties.map((p: any) => p?.id).filter(id => id !== undefined);
    const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedProperties.includes(id));
    
    if (allCurrentPageSelected) {
      // Deselect all on current page
      setSelectedProperties(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      // Select all on current page
      setSelectedProperties(prev => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  const handleSelectAllProperties = () => {
    // Select all properties across all pages
    if (!Array.isArray(availablePropertiesForAssignment) || availablePropertiesForAssignment.length === 0) return;
    if (selectedProperties.length === availablePropertiesForAssignment.length) {
      setSelectedProperties([]);
    } else {
      const allIds = availablePropertiesForAssignment.map((p: any) => p?.id).filter(id => id !== undefined);
      setSelectedProperties(allIds);
    }
  };

  const handleBulkSelect = (count: number, fromStart: boolean = true) => {
    if (!Array.isArray(availablePropertiesForAssignment) || availablePropertiesForAssignment.length === 0) return;
    const sorted = [...availablePropertiesForAssignment];
    const toSelect = fromStart 
      ? sorted.slice(0, count).map((p: any) => p?.id).filter(id => id !== undefined)
      : sorted.slice(-count).map((p: any) => p?.id).filter(id => id !== undefined);
    
    setSelectedProperties(prev => {
      // Toggle: if all are already selected, deselect; otherwise add them
      const allSelected = toSelect.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !toSelect.includes(id));
      } else {
        return [...new Set([...prev, ...toSelect])];
      }
    });
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setPageJumpValue("");
      // Scroll to top of properties section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  const fetchAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/property-manager/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle token expiration
      if (res.status === 401) {
        handleTokenExpiration();
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch assignments");

      const data = await res.json();
      setAssignmentsData(data);
      
      // Initialize filters to show all realtors and unassigned by default
      if (data && data.assigned_properties) {
        const allRealtorIds = Object.keys(data.assigned_properties).map(id => Number(id));
        const initialFilters = new Set([...allRealtorIds, 'unassigned']);
        setSelectedRealtorFilters(initialFilters);
      } else {
        setSelectedRealtorFilters(new Set(['unassigned']));
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load assignments");
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleRealtorFilterToggle = (realtorId: number | string) => {
    setSelectedRealtorFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(realtorId)) {
        newSet.delete(realtorId);
      } else {
        newSet.add(realtorId);
      }
      return newSet;
    });
  };

  const handleSelectAllRealtors = () => {
    if (!assignmentsData) return;
    
    const allRealtorIds = assignmentsData.assigned_properties 
      ? Object.keys(assignmentsData.assigned_properties).map(id => Number(id))
      : [];
    const allFilters = new Set([...allRealtorIds, 'unassigned']);
    setSelectedRealtorFilters(allFilters);
  };

  const handleDeselectAllRealtors = () => {
    setSelectedRealtorFilters(new Set());
  };

  const getFilteredAssignedProperties = () => {
    if (!assignmentsData || !assignmentsData.assigned_properties) return {};
    
    // If no filters selected, show all assigned properties
    if (selectedRealtorFilters.size === 0) {
      return assignmentsData.assigned_properties;
    }
    
    const filtered: any = {};
    Object.keys(assignmentsData.assigned_properties).forEach(key => {
      const realtorId = Number(key);
      if (selectedRealtorFilters.has(realtorId)) {
        filtered[key] = assignmentsData.assigned_properties[key];
      }
    });
    
    return filtered;
  };

  // Memoize filtered assigned properties to avoid using useMemo inside JSX
  const filteredAssignedProperties = useMemo(() => {
    const filtered = getFilteredAssignedProperties();
    if (Object.keys(filtered).length === 0) return null;
    return filtered;
  }, [assignmentsData, selectedRealtorFilters]);

  const handleUnassignProperties = async (propertyIds: number[]) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/property-manager/unassign-properties`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ property_ids: propertyIds }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Failed to unassign properties");
      }

      const data = await res.json();
      toast.success(data.message || `Successfully unassigned ${propertyIds.length} properties`);
      
      // Refresh data
      fetchAssignments();
      fetchPropertiesForAssignment();
      fetchApartments();
    } catch (err: any) {
      console.error("Unassignment failed:", err);
      toast.error(err.message || "Failed to unassign properties");
    }
  };

  const handleUpdatePropertyStatus = async (propertyId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/properties/${propertyId}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ listing_status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Failed to update status");
      }

      const data = await res.json();
      toast.success(data.message || "Property status updated successfully");
      
      // Update local state immediately for better UX
      setApartments(prevApartments => 
        prevApartments.map(apt => {
          if (apt.id === propertyId) {
            const updatedApt = { ...apt, listing_status: newStatus };
            // Also update listing_metadata if it exists
            if (apt.listing_metadata) {
              try {
                const metadata = typeof apt.listing_metadata === 'string' 
                  ? JSON.parse(apt.listing_metadata) 
                  : apt.listing_metadata;
                metadata.listing_status = newStatus;
                updatedApt.listing_metadata = typeof apt.listing_metadata === 'string'
                  ? JSON.stringify(metadata)
                  : metadata;
              } catch (e) {
                // If parsing fails, just keep the direct update
              }
            }
            return updatedApt;
          }
          return apt;
        })
      );
      
      // Update assignments data if it exists
      if (assignmentsData) {
        const updatedAssignmentsData = JSON.parse(JSON.stringify(assignmentsData));
        
        const updatePropertyInObject = (prop: any) => {
          if (prop.id === propertyId) {
            const updated = { ...prop, listing_status: newStatus };
            // Also update listing_metadata if it exists
            if (prop.listing_metadata) {
              try {
                const metadata = typeof prop.listing_metadata === 'string' 
                  ? JSON.parse(prop.listing_metadata) 
                  : prop.listing_metadata;
                metadata.listing_status = newStatus;
                updated.listing_metadata = typeof prop.listing_metadata === 'string'
                  ? JSON.stringify(metadata)
                  : metadata;
              } catch (e) {
                // If parsing fails, just keep the direct update
              }
            }
            return updated;
          }
          return prop;
        };
        
        if (updatedAssignmentsData.unassigned_properties) {
          updatedAssignmentsData.unassigned_properties = updatedAssignmentsData.unassigned_properties.map(updatePropertyInObject);
        }
        if (updatedAssignmentsData.assigned_properties) {
          Object.keys(updatedAssignmentsData.assigned_properties).forEach(key => {
            updatedAssignmentsData.assigned_properties[key].properties = 
              updatedAssignmentsData.assigned_properties[key].properties.map(updatePropertyInObject);
          });
        }
        setAssignmentsData(updatedAssignmentsData);
      }
      
      // Refresh data from server
      fetchAssignments();
      fetchApartments();
    } catch (err: any) {
      console.error("Status update failed:", err);
      toast.error(err.message || "Failed to update property status");
    }
  };

  const handleOpenPropertyDetail = (property: any) => {
    setSelectedPropertyForDetail(property);
    setShowPropertyDetailModal(true);
  };

  const handleOpenPropertyUpdate = (property: any) => {
    const meta = getPropertyMetadata(property);
    setPropertyUpdateForm({
      address: meta.address || "",
      price: meta.price || "",
      bedrooms: meta.bedrooms || "",
      bathrooms: meta.bathrooms || "",
      square_feet: meta.square_feet || "",
      lot_size_sqft: meta.lot_size_sqft || "",
      year_built: meta.year_built || "",
      property_type: meta.property_type || "",
      listing_status: meta.listing_status || "Available",
      days_on_market: meta.days_on_market || "",
      listing_date: meta.listing_date || "",
      listing_id: meta.listing_id || "",
      features: meta.features ? meta.features.join(", ") : "",
      description: meta.description || "",
      image_url: meta.image_url || "",
    });
    setShowPropertyUpdateModal(true);
  };

  const handleUpdateProperty = async () => {
    if (!selectedPropertyForDetail) {
      toast.error("No property selected for update");
      console.error("❌ handleUpdateProperty: selectedPropertyForDetail is null/undefined");
      return;
    }

    if (!selectedPropertyForDetail.id) {
      toast.error("Property ID is missing");
      console.error("❌ handleUpdateProperty: Property ID is missing", selectedPropertyForDetail);
      return;
    }

    setUpdatingProperty(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      // Build update payload - only include fields that have values
      const updatePayload: any = {};
      
      if (propertyUpdateForm.address && propertyUpdateForm.address.trim()) updatePayload.address = propertyUpdateForm.address.trim();
      if (propertyUpdateForm.price && propertyUpdateForm.price !== "") updatePayload.price = Number(propertyUpdateForm.price);
      if (propertyUpdateForm.bedrooms && propertyUpdateForm.bedrooms !== "") updatePayload.bedrooms = Number(propertyUpdateForm.bedrooms);
      if (propertyUpdateForm.bathrooms && propertyUpdateForm.bathrooms !== "") updatePayload.bathrooms = Number(propertyUpdateForm.bathrooms);
      if (propertyUpdateForm.square_feet && propertyUpdateForm.square_feet !== "") updatePayload.square_feet = Number(propertyUpdateForm.square_feet);
      if (propertyUpdateForm.lot_size_sqft && propertyUpdateForm.lot_size_sqft !== "") updatePayload.lot_size_sqft = Number(propertyUpdateForm.lot_size_sqft);
      if (propertyUpdateForm.year_built && propertyUpdateForm.year_built !== "") updatePayload.year_built = Number(propertyUpdateForm.year_built);
      if (propertyUpdateForm.property_type && propertyUpdateForm.property_type.trim()) updatePayload.property_type = propertyUpdateForm.property_type.trim();
      if (propertyUpdateForm.listing_status && propertyUpdateForm.listing_status.trim()) updatePayload.listing_status = propertyUpdateForm.listing_status.trim();
      if (propertyUpdateForm.days_on_market && propertyUpdateForm.days_on_market !== "") updatePayload.days_on_market = Number(propertyUpdateForm.days_on_market);
      if (propertyUpdateForm.listing_date && propertyUpdateForm.listing_date.trim()) updatePayload.listing_date = propertyUpdateForm.listing_date.trim();
      if (propertyUpdateForm.listing_id !== undefined) {
        if (propertyUpdateForm.listing_id && propertyUpdateForm.listing_id.trim()) {
          updatePayload.listing_id = propertyUpdateForm.listing_id.trim();
        }
      }
      if (propertyUpdateForm.features && propertyUpdateForm.features.trim()) {
        updatePayload.features = propertyUpdateForm.features.split(",").map((f: string) => f.trim()).filter((f: string) => f);
      }
      if (propertyUpdateForm.description && propertyUpdateForm.description.trim()) updatePayload.description = propertyUpdateForm.description.trim();
      if (propertyUpdateForm.image_url && propertyUpdateForm.image_url.trim()) updatePayload.image_url = propertyUpdateForm.image_url.trim();

      // Check if payload is empty
      if (Object.keys(updatePayload).length === 0) {
        toast.error("Please update at least one field");
        setUpdatingProperty(false);
        return;
      }

      const propertyId = selectedPropertyForDetail.id;
      const apiUrl = `${API_BASE}/properties/${propertyId}`;

      const res = await fetch(apiUrl, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        let errorData: any = {};
        try {
          const errorText = await res.text();
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch (parseError) {
          // Failed to parse error response, use default error message
        }
        
        const errorMessage = errorData.detail || errorData.message || errorData.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      let data: any = {};
      try {
        const responseText = await res.text();
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        // Response is not JSON, treat as success with empty data
      }

      toast.success(data.message || "Property updated successfully!");
      setShowPropertyUpdateModal(false);
      
      // Use the returned property object from API response for immediate UI update
      if (data.property) {
        setSelectedPropertyForDetail(data.property);
        setShowPropertyDetailModal(true);
      }
      
      // Refresh all data in background
      Promise.all([
        fetchApartments(),
        fetchAssignments(),
        fetchPropertiesForAssignment()
      ]).catch(() => {
        // Silently handle background refresh errors
      });
    } catch (err: any) {
      const errorMessage = err.message || "Could not update property";
      toast.error(errorMessage);
    } finally {
      setUpdatingProperty(false);
    }
  };

  const handleDeleteProperty = async () => {
    if (!selectedPropertyForDetail) return;

    setDeletingProperty(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/properties/${selectedPropertyForDetail.id}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Failed to delete property");
      }

      const data = await res.json();
      toast.success(data.message || "Property deleted successfully!");
      setShowPropertyDetailModal(false);
      setSelectedPropertyForDetail(null);
      
      // Refresh data
      fetchApartments();
      fetchAssignments();
      fetchPropertiesForAssignment();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not delete property");
    } finally {
      setDeletingProperty(false);
    }
  };

  const handleDeleteRealtor = async (realtorId: number, realtorName: string) => {
    const confirmMessage = `Are you sure you want to delete ${realtorName}?\n\n` +
      `This will:\n` +
      `- Move all their properties back to you (unassigned)\n` +
      `- Unassign all their bookings\n` +
      `- Delete their sources and rule chunks\n` +
      `- Remove them from the system\n\n` +
      `⚠️ This action CANNOT be undone!`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/property-manager/realtors/${realtorId}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Failed to delete realtor");
      }

      const data = await res.json();
      toast.success(
        `${data.message}\nProperties reassigned: ${data.summary?.properties_reassigned || 0}\nBookings unassigned: ${data.summary?.bookings_unassigned || 0}`
      );
      
      // Refresh data
      fetchRealtors();
      fetchAssignments();
      fetchPropertiesForAssignment();
      fetchApartments();
    } catch (err: any) {
      console.error("Delete realtor failed:", err);
      toast.error(err.message || "Failed to delete realtor");
    }
  };

  const handleBuyNumber = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token"); // you stored it like this
      if (!token) {
        toast.error("You must be signed in to buy a number.");
        navigate("/signin");
        return;
      }

      const res = await fetch(`${API_BASE}/buy-number`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ area_code: "412" }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setMyNumber(data.twilio_contact || data.twilio_number || null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to buy number");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // API Functions - Phone Number Management (Property Manager Only)
  // ============================================================================
  
  /**
   * Fetches all phone number requests made by the current Property Manager
   * 
   * Retrieves the list of phone number requests with their status (pending, fulfilled, etc.)
   * and updates the phoneNumberRequests state. Silently fails if the request fails
   * since this is optional data.
   */
  const fetchPhoneNumberRequests = async () => {
    try {
      setLoadingPhoneRequests(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        return;
      }

      const res = await fetch(`${API_BASE}/my-phone-number-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle token expiration
      if (res.status === 401) {
        handleTokenExpiration();
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch phone number requests");
      }

      const data = await res.json();
      setPhoneNumberRequests(data.requests || []);
    } catch (err: any) {
      console.error("Error fetching phone requests:", err);
      // Don't show error toast - this is optional data
    } finally {
      setLoadingPhoneRequests(false);
    }
  };

  /**
   * Fetches all purchased phone numbers available to the Property Manager
   * 
   * Retrieves both all purchased numbers and specifically those available for assignment.
   * Updates purchasedPhoneNumbers and availablePhoneNumbers state. Also fetches
   * the list of realtors for assignment purposes.
   */
  const fetchPurchasedPhoneNumbers = async () => {
    try {
      setLoadingPurchasedNumbers(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        return;
      }

      const res = await fetch(`${API_BASE}/purchased-phone-numbers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle token expiration
      if (res.status === 401) {
        handleTokenExpiration();
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch purchased phone numbers");
      }

      const data = await res.json();
      setPurchasedPhoneNumbers(data.purchased_numbers || []);
      setAvailablePhoneNumbers(data.available_for_assignment || []);
    } catch (err: any) {
      console.error("Error fetching purchased numbers:", err);
      toast.error("Could not load purchased phone numbers");
    } finally {
      setLoadingPurchasedNumbers(false);
    }
  };

  /**
   * Submits a new phone number request to the backend
   * 
   * Sends a request for a new phone number with optional country code, area code,
   * and notes. On success, closes the dialog, resets the form, and refreshes
   * the requests list.
   */
  const handleRequestPhoneNumber = async () => {
    try {
      setRequestingPhone(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/request-phone-number`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          country_code: phoneRequestForm.country_code || null,
          area_code: phoneRequestForm.area_code || null,
          notes: phoneRequestForm.notes || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to request phone number");
      }

      const data = await res.json();
      toast.success(data.message || "Phone number request submitted successfully!");
      setShowRequestPhoneDialog(false);
      setPhoneRequestForm({ country_code: "", area_code: "", notes: "" });
      fetchPhoneNumberRequests();
    } catch (err: any) {
      console.error("Error requesting phone number:", err);
      toast.error(err.message || "Failed to request phone number");
    } finally {
      setRequestingPhone(false);
    }
  };

  /**
   * Assigns a purchased phone number to a Property Manager or Realtor
   * 
   * @param purchasedPhoneNumberId - ID of the purchased phone number to assign
   * @param assignToType - Type of user to assign to: "property_manager" or "realtor"
   * @param assignToId - Optional realtor ID if assigning to a realtor
   * 
   * On success, refreshes the purchased numbers list and the current user's number.
   */
  const handleAssignPhoneNumber = async (purchasedPhoneNumberId: number, assignToType: "property_manager" | "realtor", assignToId?: number) => {
    try {
      setAssigningPhone(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const body: any = {
        purchased_phone_number_id: purchasedPhoneNumberId,
        assign_to_type: assignToType,
      };

      if (assignToType === "realtor" && assignToId) {
        body.assign_to_id = assignToId;
      }

      const res = await fetch(`${API_BASE}/assign-phone-number`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to assign phone number");
      }

      const data = await res.json();
      toast.success(data.message || "Phone number assigned successfully!");
      setSelectedPhoneForAssignment(null);
      setSelectedRealtorForPhone({});
      fetchPurchasedPhoneNumbers();
      fetchNumber(); // Refresh current user's number
    } catch (err: any) {
      console.error("Error assigning phone number:", err);
      toast.error(err.message || "Failed to assign phone number");
    } finally {
      setAssigningPhone(false);
    }
  };

  /**
   * Helper function to safely extract a string error message from various error formats
   * Prevents "[object Object]" by ensuring we always return a string
   */
  const extractErrorMessage = (error: any): string => {
    // If it's already a string, return it
    if (typeof error === 'string') {
      return error;
    }
    
    // If it's null or undefined, return default message
    if (!error) {
      return "An unknown error occurred";
    }
    
    // If it's an Error object with a message property
    if (error instanceof Error && error.message) {
      // Double-check the message is a string (not an object)
      if (typeof error.message === 'string') {
        return error.message;
      }
    }
    
    // If it's an object with a message property
    if (typeof error === 'object' && error !== null) {
      // Try detail first (FastAPI standard)
      if (error.detail) {
        if (typeof error.detail === 'string') {
          return error.detail;
        }
        // If detail is an object, try to stringify it safely
        if (typeof error.detail === 'object') {
          try {
            return JSON.stringify(error.detail);
          } catch {
            return "An error occurred (unable to parse error details)";
          }
        }
      }
      
      // Try message property
      if (error.message) {
        if (typeof error.message === 'string') {
          return error.message;
        }
        // If message is an object, try to stringify it
        if (typeof error.message === 'object') {
          try {
            return JSON.stringify(error.message);
          } catch {
            return "An error occurred (unable to parse error message)";
          }
        }
      }
      
      // Try error property
      if (error.error) {
        if (typeof error.error === 'string') {
          return error.error;
        }
      }
      
      // Last resort: try to stringify the whole object
      try {
        const stringified = JSON.stringify(error);
        // If it's just "{}", return a generic message
        if (stringified === '{}') {
          return "An unknown error occurred";
        }
        return stringified;
      } catch {
        return "An unknown error occurred (unable to parse error)";
      }
    }
    
    // Fallback
    return "An unknown error occurred";
  };

  /**
   * Unassigns a phone number, making it available for reassignment
   * 
   * @param purchasedPhoneNumberId - ID of the purchased phone number to unassign
   * 
   * Shows a confirmation dialog before unassigning. On success, refreshes the
   * purchased numbers list and the current user's number.
   * 
   * Important: Always parses the JSON response using await response.json() to
   * properly extract the message and other response data.
   */
  const handleUnassignPhoneNumber = async (purchasedPhoneNumberId: number) => {
    // Confirm action with user before proceeding
    if (!window.confirm("Are you sure you want to unassign this phone number? It will become available for reassignment.")) {
      return;
    }

    try {
      setAssigningPhone(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      // Send unassign request to backend
      const response = await fetch(`${API_BASE}/unassign-phone-number`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          purchased_phone_number_id: purchasedPhoneNumberId,
        }),
      });

      // IMPORTANT: Always parse JSON response - even for errors!
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If response is not JSON, handle it
        const text = await response.text();
        const errorMsg = extractErrorMessage(`Server error: ${text || response.statusText}`);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Check if response was successful
      if (!response.ok) {
        // Error response - FastAPI returns {detail: "error message"}
        // Use helper function to safely extract error message
        const errorMsg = extractErrorMessage(data);
        console.error("Error response:", data);
        console.error("Extracted error message:", errorMsg);
        toast.error(`Error: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Success - data is already parsed
      // Success response received
      
      // Safely extract success message - ensure it's a string
      let successMessage = "Phone number unassigned successfully!";
      if (data.message) {
        if (typeof data.message === 'string') {
          successMessage = data.message;
        } else {
          // If message is not a string, use default
        }
      }
      
      // Display the message properly (always a string)
      toast.success(successMessage);
      
      // Log additional info for debugging
      if (data.phone_number) {
      }
      if (data.purchased_phone_number_id) {
      }
      
      // Refresh the phone numbers list to show updated status
      fetchPurchasedPhoneNumbers();
      
      // Refresh current user's number in case it was unassigned from them
      fetchNumber();
      
      // Return the parsed data
      return data;
    } catch (error: any) {
      // Handle network errors or other exceptions
      // Use helper function to safely extract error message
      const errorMessage = extractErrorMessage(error);
      
      toast.error(`Failed to unassign phone number: ${errorMessage}`);
    } finally {
      setAssigningPhone(false);
    }
  };

  // ============================================================================
  // Call Forwarding Controls (Property Managers & Realtors)
  // ============================================================================

  /**
   * Fetches the call forwarding state for the authenticated user or a selected realtor
   * 
   * @param realtorId - Optional realtor ID (PMs only) to fetch forwarding state for a managed realtor.
   *                    Must belong to the authenticated PM.
   * 
   * The backend returns the Twilio bot number and forwarding flags. The bot number is derived
   * strictly from `purchased_phone_numbers` (the official callbot pool)—it never falls back to
   * whatever Twilio number was stored historically on the profile—so we can trust it's the bot
   * we provisioned.
   * 
   * The backend automatically finds assigned bot numbers by:
   * 1. Checking the user's `purchased_phone_number_id` field
   * 2. Searching `purchased_phone_numbers` for entries where `assigned_to_type`/`assigned_to_id` matches
   * 3. For PMs only: Auto-promoting the oldest unassigned number from their inventory if available
   * 
   * Case-insensitive matching handles variations in `assigned_to_type` (e.g., "Property Manager",
   * "property_manager", "PROPERTY_MANAGER").
   */
  const fetchCallForwardingState = async (realtorId?: number) => {
    try {
      setLoadingCallForwarding(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        return;
      }

      const params = new URLSearchParams();
      if (realtorId) {
        params.append("realtor_id", realtorId.toString());
      }

      const url = params.toString()
        ? `${API_BASE}/call-forwarding-state?${params.toString()}`
        : `${API_BASE}/call-forwarding-state`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle token expiration
      if (res.status === 401) {
        handleTokenExpiration();
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to load call forwarding state");
      }

      setCallForwardingState(data);
      if (data.twilio_number) {
        setMyNumber(data.twilio_number);
      }
      
      // IMPORTANT: Carrier selection should be FIRST step
      // Only show carrier selection if forwarding_state.carrier is null
      // Don't prompt if carrier is already set
      if (!data.forwarding_state?.carrier) {
        setShowCarrierSelection(true);
      } else {
        setShowCarrierSelection(false);
      }
    } catch (error: any) {
      console.error("Error fetching call forwarding state:", error);
      toast.error(error.message || "Unable to load call forwarding settings");
    } finally {
      setLoadingCallForwarding(false);
    }
  };

  /**
   * Loads the list of carriers the success team tests against for QA
   */
  const fetchForwardingCarriers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        return;
      }

      const res = await fetch(`${API_BASE}/call-forwarding-carriers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to load carrier list");
      }

      const data = await res.json();
      setForwardingCarriers(Array.isArray(data.carriers) ? data.carriers : []);
      setCarrierDetails(Array.isArray(data.carrier_details) ? data.carrier_details : []);
    } catch (error) {
      console.error("Error fetching carriers matrix:", error);
    }
  };

  /**
   * Returns the user's bot number formatted for dial codes (Twilio DID)
   * 
   * The backend derives this strictly from `purchased_phone_numbers` (the official callbot pool).
   * It never falls back to whatever Twilio number was stored historically on the profile,
   * so we can trust it's the bot we provisioned.
   * 
   * @returns The Twilio DID (E.164 format, e.g., "+18885551234") or empty string if not assigned
   */
  function getBotNumberForForwarding() {
    // Prefer the forwarding state's twilio_number (most up-to-date)
    if (callForwardingState?.twilio_number) {
      return callForwardingState.twilio_number;
    }
    // Fallback to myNumber (from GET /my-number, also from purchased_phone_numbers)
    if (myNumber) {
      return myNumber;
    }
    return "";
  }

  /**
   * Gets dial codes directly from backend-provided forwarding_codes
   * NEVER modify or construct codes - use exactly what backend provides
   * Backend provides complete codes with actual assigned number already embedded
   * Returns null if no number assigned, "app_only" for Google Fi, or the actual code
   */
  function getForwardingDialCode(mode: "business" | "business-disable" | "after-hours-on" | "after-hours-off"): string | null {
    if (!forwardingCodes) {
      return null;
    }

    // Use codes directly from backend - no modification
    switch (mode) {
      case "business":
        // Use forward_no_answer.activate directly - backend handles null/app_only/code
        return forwardingCodes.forward_no_answer?.activate ?? null;
      case "business-disable":
        // Use forward_no_answer.deactivate directly (e.g., ##61# for GSM)
        return forwardingCodes.forward_no_answer?.deactivate ?? null;
      case "after-hours-on":
        // Use forward_all.activate directly - backend handles null/app_only/code
        return forwardingCodes.forward_all?.activate ?? null;
      case "after-hours-off":
        // Use forward_all.deactivate directly
        return forwardingCodes.forward_all?.deactivate ?? null;
      default:
        return null;
    }
  }

  /**
   * Validates dial code (backend provides correct codes with actual number embedded)
   * Returns the code as-is - backend is responsible for correct formatting
   */
  const validateDialCode = (code: string | null): string | null => {
    if (!code) return null;
    
    // Handle special cases
    if (code === "app_only") return code;
    
    // Backend provides codes with actual number already embedded
    // Just trim and return - backend ensures correct format
    return code.trim();
  };

  /**
   * Opens the system dialer with the provided carrier-specific code
   * Backend provides complete codes with actual number already embedded
   */
  const openDialerWithCode = (code: string | null, mode: "business" | "after-hours-on" | "after-hours-off" = "after-hours-on") => {
    if (!code) {
      toast.error("Carrier code unavailable. Please assign a phone number first.");
      return;
    }

    // Handle special cases
    if (code === "app_only") {
      toast.info("Please configure forwarding in your carrier's app or website.");
      return;
    }

    // Validate the code (backend provides correct codes with actual number)
    const validatedCode = validateDialCode(code);
    
    if (!validatedCode) {
      toast.error("Invalid carrier code format. Please contact support.");
      console.error("Invalid code format:", code);
      return;
    }

    // Encode for tel: link
    // Backend provides codes in correct format (GSM: **21*+18885551234#, Verizon: *72 18885551234)
    // Preserve spaces for Verizon codes, encode * and # for all codes
    const encoded = validatedCode
      .replace(/\*/g, "%2A")
      .replace(/#/g, "%23")
      .replace(/ /g, "%20");
    
    // Log for debugging
    // Opening dialer with validated code
    
    window.location.href = `tel:${encoded}`;
  };

  /**
   * Sends PATCH requests to update the backing call forwarding state
   */
  const handleCallForwardingUpdate = async (
    payload: Record<string, any>,
    successMessage?: string
  ) => {
    try {
      setUpdatingCallForwarding(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const body: Record<string, any> = {
        ...payload,
      };

      const realtorId = getSelectedForwardingRealtorId();
      if (realtorId) {
        body.realtor_id = realtorId;
      }

      if (forwardingNotes.trim()) {
        body.notes = forwardingNotes.trim();
      }

      const res = await fetch(`${API_BASE}/call-forwarding-state`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        let errorMessage = data.detail || data.message || "Failed to update call forwarding";
        if (res.status === 429) {
          errorMessage = "You've toggled call forwarding too many times. Please wait a few minutes before trying again.";
        }
        throw new Error(errorMessage);
      }

      toast.success(successMessage || data.message || "Call forwarding updated");
      setForwardingFailureReason("");
      await fetchCallForwardingState(realtorId);
    } catch (error: any) {
      console.error("Call forwarding update failed:", error);
      toast.error(error.message || "Failed to update call forwarding");
    } finally {
      setUpdatingCallForwarding(false);
    }
  };

  /**
   * Launches the carrier dial code for business hours setup (one-time conditional forwarding)
   * Uses code directly from backend - no modification
   */
  const handleBusinessForwardingDial = () => {
    const code = getForwardingDialCode("business");
    
    // Check for null (no number assigned or not supported)
    if (!code) {
      toast.error("Carrier code unavailable. Please assign a phone number first.");
      return;
    }

    // Check for app_only (Google Fi)
    if (code === "app_only") {
      toast.info("Please configure forwarding in your carrier's app or website.");
      return;
    }

    // Use code directly from backend - it already has the actual number embedded
    toast.info(`Opening dialer with code: ${code}. Tap CALL, wait for confirmation beep (usually 3 beeps), then return here to confirm.`, {
      duration: 5000,
    });
    
    openDialerWithCode(code, "business");
  };

  /**
   * Confirms business hours forwarding inside Leasap after the carrier code succeeds
   */
  const handleBusinessForwardingConfirmation = async () => {
    await handleCallForwardingUpdate(
      {
        business_forwarding_enabled: true,
        confirmation_status: "success",
      },
      "Business hours forwarding confirmed"
    );
  };

  /**
   * Disables business hours forwarding (25-second forwarding)
   * Uses code directly from backend - no modification
   */
  const handleBusinessForwardingDisable = async () => {
    const code = getForwardingDialCode("business-disable");
    
    // Check for null (no number assigned)
    if (!code) {
      toast.error("Carrier code unavailable. Please assign a phone number first.");
      return;
    }

    // Check for app_only (Google Fi)
    if (code === "app_only") {
      toast.info("Please configure forwarding in your carrier's app or website.");
      return;
    }

    // Use code directly from backend - it already has the actual number embedded
    toast.info(`Opening dialer with code: ${code}. Tap CALL, wait for confirmation beep (usually 3 beeps), then return here to confirm.`, {
      duration: 5000,
    });
    
    openDialerWithCode(code, "business");
    
    // Update state after user confirms
    await handleCallForwardingUpdate(
      {
        business_forwarding_enabled: false,
        confirmation_status: "success",
      },
      "Business hours forwarding disabled"
    );
  };

  /**
   * Enables or disables after-hours mode while guiding the user through carrier codes
   * Uses code directly from backend - no modification
   */
  const handleAfterHoursToggle = async (nextEnabled: boolean) => {
    const code = getForwardingDialCode(nextEnabled ? "after-hours-on" : "after-hours-off");
    
    // Check for null (no number assigned)
    if (!code) {
      toast.error("Carrier code unavailable. Please assign a phone number first.");
      return;
    }

    // Check for app_only (Google Fi)
    if (code === "app_only") {
      toast.info("Please configure forwarding in your carrier's app or website.");
      return;
    }

    // Use code directly from backend - it already has the actual number embedded
    toast.info(`Opening dialer with code: ${code}. Tap CALL, wait for confirmation beep (usually 3 beeps), then return here to confirm.`, {
      duration: 5000,
    });
    
    openDialerWithCode(code, nextEnabled ? "after-hours-on" : "after-hours-off");
    
    // Update state after user confirms (they'll click confirm button after dialing)
    await handleCallForwardingUpdate(
      {
        after_hours_enabled: nextEnabled,
        confirmation_status: "success",
      },
      nextEnabled ? "After-hours mode enabled" : "After-hours mode disabled"
    );
  };

  /**
   * Reports carrier failures so the support team can follow up
   */
  const handleForwardingFailureReport = async () => {
    if (!forwardingFailureReason.trim()) {
      toast.error("Please describe what happened so our team can assist.");
      return;
    }

    await handleCallForwardingUpdate(
      {
        confirmation_status: "failure",
        failure_reason: forwardingFailureReason.trim(),
      },
      "Forwarding issue submitted to support"
    );
  };

  /**
   * Updates the user's carrier setting
   */
  const handleCarrierUpdate = async (carrier: string) => {
    try {
      await handleCallForwardingUpdate(
        { carrier: carrier },
        `Carrier set to ${carrier}`
      );
      setSelectedCarrier("");
      setShowCarrierSelection(false);
    } catch (error) {
      console.error("Failed to update carrier:", error);
    }
  };

  // Derived values for simplified rendering
  const botNumberDisplay = callForwardingState?.twilio_number || null;
  const hasBotNumber = Boolean(botNumberDisplay);
  // Backend provides codes with actual number embedded, or null if no number assigned, or "app_only" for Google Fi
  const businessDialCode = getForwardingDialCode("business");
  const businessDisableDialCode = getForwardingDialCode("business-disable");
  const afterHoursEnableDialCode = getForwardingDialCode("after-hours-on");
  const afterHoursDisableDialCode = getForwardingDialCode("after-hours-off");
  
  // Check if codes are app_only (Google Fi)
  const isAppOnly = afterHoursEnableDialCode === "app_only" || businessDialCode === "app_only";

  const handleSignOut = () => {
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
    
    // Show success message
    toast.success("Signed out successfully");
    
    // Redirect to home page
    navigate("/");
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const
      }
    }
  };

  const handleSettingsClick = () => {
    toast.info("Settings panel coming soon!", {
      description: "Configure your dashboard preferences and notifications here."
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/30 relative overflow-x-hidden">
      {/* Elegant Header */}
      <motion.header 
        className="relative bg-white/95 backdrop-blur-sm border-b border-amber-200/50 shadow-sm"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <motion.div 
                className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-2xl shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Home className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <motion.div 
                  className="mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  {(() => {
                    // ALWAYS ensure we have a name to display
                    const storedName = localStorage.getItem("user_name");
                    const nameToUse = userName || storedName || "User";
                    const displayName = nameToUse.trim() !== "" && nameToUse !== "User" ? nameToUse : "User";
                    
                    // Function to detect if we have first and last name
                    const detectFirstName = (fullName: string): string => {
                      // Strategy 1: Check if name has space (clear first/last separation)
                      const nameParts = fullName.trim().split(/\s+/);
                      if (nameParts.length > 1) {
                        // Has multiple parts - return first part as first name
                        return nameParts[0];
                      }
                      
                      // Strategy 2: Check for CamelCase (e.g., "JohnSmith", "SarahJohnson")
                      // Look for capital letter in the middle of the word
                      const camelCaseMatch = fullName.match(/^([A-Z][a-z]+)([A-Z][a-z]+)/);
                      if (camelCaseMatch && camelCaseMatch[1] && camelCaseMatch[2]) {
                        // Found clear CamelCase pattern - first part is likely first name
                        return camelCaseMatch[1];
                      }
                      
                      // Strategy 3: Try to detect common first names in combined lowercase names
                      // Only if we're confident it's a first name
                      const lowerName = fullName.toLowerCase();
                      
                      // Common first names that are commonly followed by last names
                      const commonFirstNames = [
                        'john', 'jane', 'mike', 'sarah', 'bob', 'tom', 'ann', 'dan', 'sam', 'ben',
                        'andrew', 'christian', 'alex', 'david', 'james', 'robert', 'william', 'michael',
                        'chris', 'jennifer', 'jessica', 'emily', 'emma', 'olivia', 'sophia', 'isabella',
                        'matthew', 'daniel', 'joshua', 'ryan', 'tyler', 'ethan', 'noah', 'mason',
                        'alexander', 'nicholas', 'christopher', 'joseph', 'anthony', 'mark', 'paul',
                        'steven', 'kevin', 'brian', 'edward', 'donald', 'richard', 'charles', 'kenneth'
                      ];
                      
                      // Check if beginning matches a common first name (only if name is longer than the first name)
                      for (const firstName of commonFirstNames) {
                        if (lowerName.startsWith(firstName) && lowerName.length > firstName.length + 2) {
                          // Found a match and there's enough remaining chars for a last name
                          return fullName.substring(0, firstName.length);
                        }
                      }
                      
                      // Strategy 4: If we can't confidently detect first/last, return full name
                      return fullName;
                    };
                    
                    // Detect first name or use full name if can't detect separation
                    let displayNameFinal = detectFirstName(displayName);
                    
                    // Ensure proper capitalization: first letter uppercase, rest lowercase
                    if (displayNameFinal.length > 0) {
                      // Capitalize first letter of each word if it has spaces
                      if (displayNameFinal.includes(' ')) {
                        displayNameFinal = displayNameFinal
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                          .join(' ');
                      } else {
                        displayNameFinal = displayNameFinal.charAt(0).toUpperCase() + displayNameFinal.slice(1).toLowerCase();
                      }
                    }
                    
                    // Always show the name - it will be at least "User" if nothing else
                    return (
                      <>
                        <p className="text-amber-600 text-2xl sm:text-3xl font-extrabold mb-1">
                          Welcome back <span className="text-amber-600">{displayNameFinal}</span>!
                        </p>
                        <p className="text-amber-600/80 text-sm">
                          {userType === "property_manager" 
                            ? "Manage your properties and team from here."
                            : "View your assigned properties and bookings."}
                        </p>
                      </>
                    );
                  })()}
                </motion.div>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3 w-full lg:w-auto"
            >
              <Button 
                asChild 
                variant="outline"
                className="bg-white hover:bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300 font-medium transition-all shadow-sm rounded-2xl"
                size="sm"
              >
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline"
                className="bg-white hover:bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300 font-medium transition-all shadow-sm rounded-2xl"
                size="sm"
              >
                <Link to="/uploadpage">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Link>
              </Button>
              {userType === "property_manager" && (
                <Button 
                  onClick={() => setActiveTab("phone-numbers")} 
                  className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all rounded-2xl"
                  size="sm"
                >
                  <Phone className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span className="hidden md:inline">Request a Phone Number</span>
                  <span className="md:hidden">Request Number</span>
                </Button>
              )}
              <Button 
                onClick={handleSignOut}
                variant="outline"
                className="bg-white hover:bg-red-50 text-red-600 border-red-300 hover:border-red-400 font-medium transition-all shadow-sm rounded-2xl"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </motion.div>
          </div>

          {myNumber && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="mt-4 pt-4 border-t border-amber-200/50"
            >
              <div className="flex items-center gap-3 bg-amber-50/80 rounded-2xl p-3 border border-amber-200">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">Your Phone Number</p>
                  <p className="text-lg font-bold text-amber-900">{myNumber}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Enhanced Stats Cards */}
      <motion.section 
        className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {userType === "property_manager" ? (
            <>
              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-5 md:p-6 border border-amber-100 hover:border-amber-200 group"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">Total Realtors</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" as const }}
                    >
                      {realtors.length}
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">Active team members</p>
                  </div>
                  <motion.div 
                    className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl group-hover:scale-110 transition-transform flex-shrink-0"
                    whileHover={{ rotate: 15 }}
                  >
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-5 md:p-6 border border-amber-100 hover:border-amber-200 group"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">Total Properties</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.0, type: "spring" as const }}
                    >
                      {apartments.length}
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">In your portfolio</p>
                  </div>
                  <motion.div 
                    className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl group-hover:scale-110 transition-transform flex-shrink-0"
                    whileHover={{ rotate: -15 }}
                  >
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-5 md:p-6 border border-amber-100 hover:border-amber-200 group"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">Active Bookings</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" as const }}
                    >
                      {bookings.length}
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">Scheduled viewings</p>
                  </div>
                  <motion.div 
                    className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl group-hover:scale-110 transition-transform flex-shrink-0"
                    whileHover={{ rotate: 15 }}
                  >
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-5 md:p-6 border border-amber-100 hover:border-amber-200 group"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">Total Tenants</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.4, type: "spring" as const }}
                    >
                      {tenants.length}
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">Active tenants</p>
                  </div>
                  <motion.div 
                    className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl group-hover:scale-110 transition-transform flex-shrink-0"
                    whileHover={{ rotate: -15 }}
                  >
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-5 md:p-6 border border-amber-100 hover:border-amber-200 group"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">My Properties</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" as const }}
                    >
                      {apartments.length}
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">Assigned to you</p>
                  </div>
                  <motion.div 
                    className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl group-hover:scale-110 transition-transform flex-shrink-0"
                    whileHover={{ rotate: 15 }}
                  >
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-5 md:p-6 border border-amber-100 hover:border-amber-200 group"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">My Bookings</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.0, type: "spring" as const }}
                    >
                      {bookings.length}
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">Scheduled viewings</p>
                  </div>
                  <motion.div 
                    className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl group-hover:scale-110 transition-transform flex-shrink-0"
                    whileHover={{ rotate: -15 }}
                  >
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-5 md:p-6 border border-amber-100 hover:border-amber-200 group"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">Property Views</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" as const }}
                    >
                      1,247
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">Total views this month</p>
                  </div>
                  <motion.div 
                    className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl group-hover:scale-110 transition-transform flex-shrink-0"
                    whileHover={{ rotate: 15 }}
                  >
                    <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-5 md:p-6 border border-amber-100 hover:border-amber-200 group"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">Response Rate</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.4, type: "spring" as const }}
                    >
                      95%
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">Client inquiries</p>
                  </div>
                  <motion.div 
                    className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl group-hover:scale-110 transition-transform flex-shrink-0"
                    whileHover={{ rotate: -15 }}
                  >
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </motion.section>

      {/* Main Content */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* Tabs automatically hide/show PM-only sections by checking userType before rendering TabsTrigger/TabsContent */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Enhanced Tabs Navigation */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-6 sm:mb-8 lg:mb-10"
            >
              <TabsList className="bg-gradient-to-br from-amber-50/90 via-white to-amber-50/70 border-2 border-amber-200/90 rounded-2xl shadow-xl backdrop-blur-sm w-full p-0 overflow-hidden relative z-50">
                {/* Scrollable tabs container with responsive scrollbar */}
                <div className="relative w-full overflow-x-auto overflow-y-hidden scroll-smooth
                  [scrollbar-width:thin]
                  [scrollbar-color:rgb(251_191_36_/_0.7)_transparent]
                  [&::-webkit-scrollbar]:h-[6px]
                  [&::-webkit-scrollbar]:w-[6px]
                  [&::-webkit-scrollbar-thumb]:rounded-full
                  [&::-webkit-scrollbar-thumb]:bg-amber-400/70
                  [&::-webkit-scrollbar-thumb]:hover:bg-amber-500/80
                  [&::-webkit-scrollbar-thumb]:active:bg-amber-600
                  [&::-webkit-scrollbar-track]:bg-transparent
                  [&::-webkit-scrollbar-track]:rounded-full
                  md:[&::-webkit-scrollbar]:h-[5px]
                  md:[&::-webkit-scrollbar]:w-[5px]
                  sm:[&::-webkit-scrollbar]:h-[4px]
                  sm:[&::-webkit-scrollbar]:w-[4px]">
                  <div className="flex gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-2.5 items-center 
                    min-h-[60px] sm:min-h-[64px] md:min-h-[68px] lg:min-h-[68px] xl:min-h-[68px] 
                    px-2 sm:px-3 md:px-4 lg:px-6 xl:px-6 2xl:px-8 
                    pt-3 pb-3 sm:pt-3.5 sm:pb-3.5 md:pt-4 md:pb-4 lg:pt-4 lg:pb-4 xl:pt-5 xl:pb-4">
                {userType === "property_manager" && (
                  <>
                    <TabsTrigger 
                      value="realtors" 
                      className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30 data-[state=active]:scale-[1.02] rounded-2xl px-3 sm:px-4 md:px-5 lg:px-5 xl:px-6 pt-2.5 pb-2.5 sm:pt-3 sm:pb-3 md:pt-3.5 md:pb-3.5 lg:pt-3.5 lg:pb-4 xl:pt-4.5 xl:pb-3 font-semibold transition-all duration-300 ease-out text-[11px] sm:text-xs md:text-sm lg:text-sm xl:text-sm whitespace-nowrap leading-tight flex-shrink-0 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] lg:min-h-[60px] xl:min-h-[62px] data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-amber-700 data-[state=inactive]:hover:bg-amber-50/90 data-[state=inactive]:hover:scale-[1.01] border-2 border-transparent data-[state=active]:border-amber-400/40 data-[state=active]:ring-2 data-[state=active]:ring-amber-300/30 relative group items-center justify-center flex"
                    >
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-4.5 lg:w-4.5 xl:h-4.5 xl:w-4.5 mr-1 sm:mr-1.5 md:mr-1.5 lg:mr-1.5 xl:mr-2 flex-shrink-0" />
                      <span className="hidden xs:inline">Realtors</span>
                      <span className="xs:hidden">Realtors</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="assign-properties" 
                      className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30 data-[state=active]:scale-[1.02] rounded-2xl px-3 sm:px-4 md:px-5 lg:px-5 xl:px-6 pt-2.5 pb-2.5 sm:pt-3 sm:pb-3 md:pt-3.5 md:pb-3.5 lg:pt-3.5 lg:pb-4 xl:pt-4.5 xl:pb-3 font-semibold transition-all duration-300 ease-out text-[11px] sm:text-xs md:text-sm lg:text-sm xl:text-sm whitespace-nowrap leading-tight flex-shrink-0 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] lg:min-h-[60px] xl:min-h-[62px] data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-amber-700 data-[state=inactive]:hover:bg-amber-50/90 data-[state=inactive]:hover:scale-[1.01] border-2 border-transparent data-[state=active]:border-amber-400/40 data-[state=active]:ring-2 data-[state=active]:ring-amber-300/30 relative group items-center justify-center flex"
                    >
                      <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-4.5 lg:w-4.5 xl:h-4.5 xl:w-4.5 mr-1 sm:mr-1.5 md:mr-1.5 lg:mr-1.5 xl:mr-2 flex-shrink-0" />
                      <span className="hidden lg:inline">Assign Properties</span>
                      <span className="lg:hidden hidden md:inline">Assign</span>
                      <span className="md:hidden">Assign</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="view-assignments" 
                      className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30 data-[state=active]:scale-[1.02] rounded-2xl px-3 sm:px-4 md:px-5 lg:px-5 xl:px-6 pt-2.5 pb-2.5 sm:pt-3 sm:pb-3 md:pt-3.5 md:pb-3.5 lg:pt-3.5 lg:pb-4 xl:pt-4.5 xl:pb-3 font-semibold transition-all duration-300 ease-out text-[11px] sm:text-xs md:text-sm lg:text-sm xl:text-sm whitespace-nowrap leading-tight flex-shrink-0 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] lg:min-h-[60px] xl:min-h-[62px] data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-amber-700 data-[state=inactive]:hover:bg-amber-50/90 data-[state=inactive]:hover:scale-[1.01] border-2 border-transparent data-[state=active]:border-amber-400/40 data-[state=active]:ring-2 data-[state=active]:ring-amber-300/30 relative group items-center justify-center flex"
                    >
                      <ListChecks className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-4.5 lg:w-4.5 xl:h-4.5 xl:w-4.5 mr-1 sm:mr-1.5 md:mr-1.5 lg:mr-1.5 xl:mr-2 flex-shrink-0" />
                      <span className="hidden xl:inline">View Assignments</span>
                      <span className="xl:hidden hidden lg:inline">Assignments</span>
                      <span className="lg:hidden hidden md:inline">View</span>
                      <span className="md:hidden">View</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="properties" 
                      className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30 data-[state=active]:scale-[1.02] rounded-2xl px-3 sm:px-4 md:px-5 lg:px-5 xl:px-6 pt-2.5 pb-2.5 sm:pt-3 sm:pb-3 md:pt-3.5 md:pb-3.5 lg:pt-3.5 lg:pb-4 xl:pt-4.5 xl:pb-3 font-semibold transition-all duration-300 ease-out text-[11px] sm:text-xs md:text-sm lg:text-sm xl:text-sm whitespace-nowrap leading-tight flex-shrink-0 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] lg:min-h-[60px] xl:min-h-[62px] data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-amber-700 data-[state=inactive]:hover:bg-amber-50/90 data-[state=inactive]:hover:scale-[1.01] border-2 border-transparent data-[state=active]:border-amber-400/40 data-[state=active]:ring-2 data-[state=active]:ring-amber-300/30 relative group items-center justify-center flex"
                    >
                      <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-4.5 lg:w-4.5 xl:h-4.5 xl:w-4.5 mr-1 sm:mr-1.5 md:mr-1.5 lg:mr-1.5 xl:mr-2 flex-shrink-0" />
                      <span>Properties</span>
                    </TabsTrigger>
                    {userType === "property_manager" && (
                      <TabsTrigger 
                        value="tenants" 
                        className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30 data-[state=active]:scale-[1.02] rounded-2xl px-3 sm:px-4 md:px-5 lg:px-5 xl:px-6 pt-2.5 pb-2.5 sm:pt-3 sm:pb-3 md:pt-3.5 md:pb-3.5 lg:pt-3.5 lg:pb-4 xl:pt-4.5 xl:pb-3 font-semibold transition-all duration-300 ease-out text-[11px] sm:text-xs md:text-sm lg:text-sm xl:text-sm whitespace-nowrap leading-tight flex-shrink-0 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] lg:min-h-[60px] xl:min-h-[62px] data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-amber-700 data-[state=inactive]:hover:bg-amber-50/90 data-[state=inactive]:hover:scale-[1.01] border-2 border-transparent data-[state=active]:border-amber-400/40 data-[state=active]:ring-2 data-[state=active]:ring-amber-300/30 relative group items-center justify-center flex"
                      >
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-4.5 lg:w-4.5 xl:h-4.5 xl:w-4.5 mr-1 sm:mr-1.5 md:mr-1.5 lg:mr-1.5 xl:mr-2 flex-shrink-0" />
                        <span>Tenants</span>
                      </TabsTrigger>
                    )}
                    <TabsTrigger 
                      value="phone-numbers" 
                      className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30 data-[state=active]:scale-[1.02] rounded-2xl px-3 sm:px-4 md:px-5 lg:px-5 xl:px-6 pt-2.5 pb-2.5 sm:pt-3 sm:pb-3 md:pt-3.5 md:pb-3.5 lg:pt-3.5 lg:pb-4 xl:pt-4.5 xl:pb-3 font-semibold transition-all duration-300 ease-out text-[11px] sm:text-xs md:text-sm lg:text-sm xl:text-sm whitespace-nowrap leading-tight flex-shrink-0 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] lg:min-h-[60px] xl:min-h-[62px] data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-amber-700 data-[state=inactive]:hover:bg-amber-50/90 data-[state=inactive]:hover:scale-[1.01] border-2 border-transparent data-[state=active]:border-amber-400/40 data-[state=active]:ring-2 data-[state=active]:ring-amber-300/30 relative group items-center justify-center flex"
                    >
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-4.5 lg:w-4.5 xl:h-4.5 xl:w-4.5 mr-1 sm:mr-1.5 md:mr-1.5 lg:mr-1.5 xl:mr-2 flex-shrink-0" />
                      <span className="hidden xl:inline">Phone Numbers</span>
                      <span className="xl:hidden hidden lg:inline">Numbers</span>
                      <span className="lg:hidden">Numbers</span>
                    </TabsTrigger>
                  </>
                )}
                {userType !== "property_manager" && (
                  <TabsTrigger 
                    value="properties" 
                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30 data-[state=active]:scale-[1.02] rounded-2xl px-3 sm:px-4 md:px-5 lg:px-5 xl:px-6 pt-2.5 pb-2.5 sm:pt-3 sm:pb-3 md:pt-3.5 md:pb-3.5 lg:pt-3.5 lg:pb-4 xl:pt-4.5 xl:pb-3 font-semibold transition-all duration-300 ease-out text-[11px] sm:text-xs md:text-sm lg:text-sm xl:text-sm whitespace-nowrap leading-tight flex-shrink-0 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] lg:min-h-[60px] xl:min-h-[62px] data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-amber-700 data-[state=inactive]:hover:bg-amber-50/90 data-[state=inactive]:hover:scale-[1.01] border-2 border-transparent data-[state=active]:border-amber-400/40 data-[state=active]:ring-2 data-[state=active]:ring-amber-300/30 relative group items-center justify-center flex"
                  >
                      <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-4.5 lg:w-4.5 xl:h-4.5 xl:w-4.5 mr-1 sm:mr-1.5 md:mr-1.5 lg:mr-1.5 xl:mr-2 flex-shrink-0" />
                    <span>Properties</span>
                  </TabsTrigger>
                )}
              <TabsTrigger 
                value="call-forwarding" 
                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30 data-[state=active]:scale-[1.02] rounded-2xl px-3 sm:px-4 md:px-5 lg:px-5 xl:px-6 pt-2.5 pb-2.5 sm:pt-3 sm:pb-3 md:pt-3.5 md:pb-3.5 lg:pt-3.5 lg:pb-4 xl:pt-4.5 xl:pb-3 font-semibold transition-all duration-300 ease-out text-[11px] sm:text-xs md:text-sm lg:text-sm xl:text-sm whitespace-nowrap leading-tight flex-shrink-0 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] lg:min-h-[60px] xl:min-h-[62px] data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-amber-700 data-[state=inactive]:hover:bg-amber-50/90 data-[state=inactive]:hover:scale-[1.01] border-2 border-transparent data-[state=active]:border-amber-400/40 data-[state=active]:ring-2 data-[state=active]:ring-amber-300/30 relative group items-center justify-center flex"
              >
                <PhoneForwarded className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-4.5 lg:w-4.5 xl:h-4.5 xl:w-4.5 mr-1 sm:mr-1.5 md:mr-1.5 lg:mr-1.5 xl:mr-2 flex-shrink-0" />
                <span className="hidden xl:inline">Call Forwarding</span>
                <span className="xl:hidden hidden lg:inline">Forwarding</span>
                <span className="lg:hidden hidden md:inline">Forward</span>
                <span className="md:hidden">Forward</span>
              </TabsTrigger>
                <TabsTrigger 
                  value="chats" 
                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30 data-[state=active]:scale-[1.02] rounded-2xl px-3 sm:px-4 md:px-5 lg:px-5 xl:px-6 pt-2.5 pb-2.5 sm:pt-3 sm:pb-3 md:pt-3.5 md:pb-3.5 lg:pt-3.5 lg:pb-4 xl:pt-4.5 xl:pb-3 font-semibold transition-all duration-300 ease-out text-[11px] sm:text-xs md:text-sm lg:text-sm xl:text-sm whitespace-nowrap leading-tight flex-shrink-0 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] lg:min-h-[60px] xl:min-h-[62px] data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-amber-700 data-[state=inactive]:hover:bg-amber-50/90 data-[state=inactive]:hover:scale-[1.01] border-2 border-transparent data-[state=active]:border-amber-400/40 data-[state=active]:ring-2 data-[state=active]:ring-amber-300/30 relative group items-center justify-center flex"
                >
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-4.5 lg:w-4.5 xl:h-4.5 xl:w-4.5 mr-1 sm:mr-1.5 md:mr-1.5 lg:mr-1.5 xl:mr-2 flex-shrink-0" />
                  <span className="hidden xl:inline">Call Records</span>
                  <span className="xl:hidden hidden lg:inline">Records</span>
                  <span className="lg:hidden hidden md:inline">Calls</span>
                  <span className="md:hidden">Calls</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="maintenance-requests" 
                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30 data-[state=active]:scale-[1.02] rounded-2xl px-3 sm:px-4 md:px-5 lg:px-5 xl:px-6 pt-2.5 pb-2.5 sm:pt-3 sm:pb-3 md:pt-3.5 md:pb-3.5 lg:pt-3.5 lg:pb-4 xl:pt-4.5 xl:pb-3 font-semibold transition-all duration-300 ease-out text-[11px] sm:text-xs md:text-sm lg:text-sm xl:text-sm whitespace-nowrap leading-tight flex-shrink-0 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] lg:min-h-[60px] xl:min-h-[62px] data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-amber-700 data-[state=inactive]:hover:bg-amber-50/90 data-[state=inactive]:hover:scale-[1.01] border-2 border-transparent data-[state=active]:border-amber-400/40 data-[state=active]:ring-2 data-[state=active]:ring-amber-300/30 relative group items-center justify-center flex"
                >
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-4.5 lg:w-4.5 xl:h-4.5 xl:w-4.5 mr-1 sm:mr-1.5 md:mr-1.5 lg:mr-1.5 xl:mr-2 flex-shrink-0" />
                  <span className="hidden xl:inline">Maintenance</span>
                  <span className="xl:hidden hidden lg:inline">Maintenance</span>
                  <span className="lg:hidden hidden md:inline">Maint.</span>
                  <span className="md:hidden">Maint.</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="bookings" 
                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30 data-[state=active]:scale-[1.02] rounded-2xl px-3 sm:px-4 md:px-5 lg:px-5 xl:px-6 pt-2.5 pb-2.5 sm:pt-3 sm:pb-3 md:pt-3.5 md:pb-3.5 lg:pt-3.5 lg:pb-4 xl:pt-4.5 xl:pb-3 font-semibold transition-all duration-300 ease-out text-[11px] sm:text-xs md:text-sm lg:text-sm xl:text-sm whitespace-nowrap leading-tight flex-shrink-0 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] lg:min-h-[60px] xl:min-h-[62px] data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-amber-700 data-[state=inactive]:hover:bg-amber-50/90 data-[state=inactive]:hover:scale-[1.01] border-2 border-transparent data-[state=active]:border-amber-400/40 data-[state=active]:ring-2 data-[state=active]:ring-amber-300/30 relative group items-center justify-center flex"
                >
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-4.5 lg:w-4.5 xl:h-4.5 xl:w-4.5 mr-1 sm:mr-1.5 md:mr-1.5 lg:mr-1.5 xl:mr-2 flex-shrink-0" />
                  <span>Bookings</span>
                </TabsTrigger>
                  </div>
                </div>
              </TabsList>
            </motion.div>

            {/* Realtors Management - Property Manager Only */}
            {userType === "property_manager" && (
              <TabsContent value="realtors">
                <RealtorsTab
                  realtors={realtors}
                  loadingRealtors={loadingRealtors}
                  showAddRealtor={showAddRealtor}
                  newRealtor={newRealtor}
                  showEditRealtor={showEditRealtor}
                  editingRealtor={editingRealtor}
                  editRealtorForm={editRealtorForm}
                  updatingRealtor={updatingRealtor}
                  onShowAddRealtorChange={setShowAddRealtor}
                  onNewRealtorChange={setNewRealtor}
                  onAddRealtor={addRealtor}
                  onEditRealtor={handleEditRealtor}
                  onEditRealtorFormChange={setEditRealtorForm}
                  onShowEditRealtorChange={setShowEditRealtor}
                  onEditingRealtorChange={setEditingRealtor}
                  onUpdateRealtor={updateRealtor}
                  onDeleteRealtor={handleDeleteRealtor}
                />
              </TabsContent>
            )}


            {/* Property Assignment - Property Manager Only */}
            {userType === "property_manager" && (
              <TabsContent value="assign-properties">
                <AssignPropertiesTab
                  realtors={realtors}
                  availablePropertiesForAssignment={availablePropertiesForAssignment}
                  loadingAssignmentProperties={loadingAssignmentProperties}
                  selectedRealtor={selectedRealtor}
                  selectedProperties={selectedProperties}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  pageJumpValue={pageJumpValue}
                  assigningProperties={assigningProperties}
                  onRealtorChange={setSelectedRealtor}
                  onPropertyToggle={handlePropertyToggle}
                  onSelectAll={handleSelectAll}
                  onSelectAllProperties={handleSelectAllProperties}
                  onBulkSelect={handleBulkSelect}
                  onAssign={assignProperties}
                  onPropertyClick={handleOpenPropertyDetail}
                  onItemsPerPageChange={setItemsPerPage}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                                          setPageJumpValue("");
                  }}
                  onPageJumpValueChange={setPageJumpValue}
                />
              </TabsContent>
            )}

            {/* View Assignments - Property Manager Only */}
            {userType === "property_manager" && (
              <TabsContent value="view-assignments">
                <ViewAssignmentsTab
                  assignmentsData={assignmentsData}
                  loadingAssignments={loadingAssignments}
                  selectedRealtorFilters={selectedRealtorFilters}
                  filteredAssignedProperties={filteredAssignedProperties}
                  onFilterToggle={handleRealtorFilterToggle}
                  onSelectAllFilters={handleSelectAllRealtors}
                  onDeselectAllFilters={handleDeselectAllRealtors}
                  onRefresh={() => {
                    fetchAssignments();
                    fetchPropertiesForAssignment();
                  }}
                  onPropertyClick={handleOpenPropertyDetail}
                />
              </TabsContent>
            )}

            {/* Call Forwarding Controls - Property Managers & Realtors */}
            {(userType === "property_manager" || userType === "realtor") && (
              <TabsContent value="call-forwarding">
                <CallForwardingTab
                  userType={userType}
                  loadingCallForwarding={loadingCallForwarding}
                  callForwardingState={callForwardingState}
                  hasBotNumber={hasBotNumber}
                  showCarrierSelection={showCarrierSelection}
                  currentCarrier={currentCarrier}
                  selectedCarrier={selectedCarrier}
                  forwardingCarriers={forwardingCarriers}
                  forwardingTarget={forwardingTarget}
                  businessForwardingEnabled={businessForwardingEnabled}
                  afterHoursEnabled={afterHoursEnabled}
                  supports25SecondForwarding={supports25SecondForwarding}
                  businessDialCode={businessDialCode}
                  businessDisableDialCode={businessDisableDialCode}
                  afterHoursEnableDialCode={afterHoursEnableDialCode}
                  afterHoursDisableDialCode={afterHoursDisableDialCode}
                  forwardingCodes={forwardingCodes}
                  isAppOnly={isAppOnly}
                  botNumberDisplay={botNumberDisplay}
                  lastAfterHoursUpdate={lastAfterHoursUpdate}
                  forwardingFailure={forwardingFailure}
                  forwardingNotes={forwardingNotes}
                  forwardingFailureReason={forwardingFailureReason}
                  carrierDetails={carrierDetails}
                  updatingCallForwarding={updatingCallForwarding}
                  realtors={realtors}
                  onForwardingTargetChange={setForwardingTarget}
                  onShowCarrierSelectionChange={setShowCarrierSelection}
                  onSelectedCarrierChange={setSelectedCarrier}
                  onCarrierUpdate={handleCarrierUpdate}
                  onBusinessForwardingDial={handleBusinessForwardingDial}
                  onBusinessForwardingConfirmation={handleBusinessForwardingConfirmation}
                  onBusinessForwardingDisable={handleBusinessForwardingDisable}
                  onAfterHoursToggle={handleAfterHoursToggle}
                  onForwardingFailureReport={handleForwardingFailureReport}
                  onForwardingNotesChange={setForwardingNotes}
                  onForwardingFailureReasonChange={setForwardingFailureReason}
                  onNavigateToPhoneNumbers={() => setActiveTab("phone-numbers")}
                />
              </TabsContent>
            )}

            {/* Phone Numbers Management - Property Manager Only */}
            {userType === "property_manager" && (
              <TabsContent value="phone-numbers">
                <PhoneNumbersTab
                  myNumber={myNumber}
                  phoneNumberRequests={phoneNumberRequests}
                  loadingPhoneRequests={loadingPhoneRequests}
                  purchasedPhoneNumbers={purchasedPhoneNumbers}
                  loadingPurchasedNumbers={loadingPurchasedNumbers}
                  availablePhoneNumbers={availablePhoneNumbers}
                  selectedRealtorForPhone={selectedRealtorForPhone}
                  assigningPhone={assigningPhone}
                  realtors={realtors}
                  onRequestPhone={() => setShowRequestPhoneDialog(true)}
                  onAssignPhoneNumber={handleAssignPhoneNumber}
                  onUnassignPhoneNumber={handleUnassignPhoneNumber}
                  onSelectedRealtorForPhoneChange={(phoneNumberId, realtorId) =>
                    setSelectedRealtorForPhone({
                                              ...selectedRealtorForPhone,
                      [phoneNumberId]: realtorId,
                    })
                  }
                  showRequestPhoneDialog={showRequestPhoneDialog}
                  setShowRequestPhoneDialog={setShowRequestPhoneDialog}
                  phoneRequestForm={phoneRequestForm}
                  setPhoneRequestForm={setPhoneRequestForm}
                  requestingPhone={requestingPhone}
                  onRequestPhoneNumber={handleRequestPhoneNumber}
                />
              </TabsContent>
            )}

            {/* Properties Grid */}
            <TabsContent value="properties">
              <PropertiesTab
                apartments={apartments}
                loadingApartments={loadingApartments}
                userType={userType}
                onRefresh={fetchApartments}
                onPropertyClick={handleOpenPropertyDetail}
                selectedPropertyForDetail={selectedPropertyForDetail}
                showPropertyDetailModal={showPropertyDetailModal}
                setShowPropertyDetailModal={setShowPropertyDetailModal}
                showPropertyUpdateModal={showPropertyUpdateModal}
                setShowPropertyUpdateModal={setShowPropertyUpdateModal}
                propertyUpdateForm={propertyUpdateForm}
                setPropertyUpdateForm={setPropertyUpdateForm}
                updatingProperty={updatingProperty}
                deletingProperty={deletingProperty}
                onUpdateProperty={handleUpdateProperty}
                onDeleteProperty={handleDeleteProperty}
                onAssignTenant={(property) => {
                  setNewTenant({
                    ...newTenant,
                    property_id: String(property.id)
                  });
                  setShowPropertyDetailModal(false);
                  setShowAddTenant(true);
                }}
                userId={userType === "property_manager" 
                  ? Number(localStorage.getItem("property_manager_id") || "0")
                  : Number(localStorage.getItem("realtor_id") || "0")}
              />
            </TabsContent>

            {/* Bookings Table */}
            <TabsContent value="bookings">
              <BookingsTab
                userId={userType === "property_manager" 
                  ? Number(localStorage.getItem("property_manager_id") || "0")
                  : Number(localStorage.getItem("realtor_id") || "0")}
                userType={userType || ""}
                bookings={bookings}
                loadingBookings={loadingBookings}
                onRefresh={fetchBookings}
                properties={apartments} // Pass apartments so realtors can check for assigned properties
              />
            </TabsContent>

            {/* Call Records */}
            <TabsContent value="chats">
              <ChatsTab
                userType={userType}
                callRecords={callRecords}
                loadingCallRecords={loadingCallRecords}
                callRecordsTotal={callRecordsTotal}
                callRecordsLimit={callRecordsLimit}
                callRecordsOffset={callRecordsOffset}
                callRecordSearch={callRecordSearch}
                callRecordFilterStatus={callRecordFilterStatus}
                playingRecordingId={playingRecordingId}
                onSearchChange={setCallRecordSearch}
                onFilterStatusChange={setCallRecordFilterStatus}
                onRefresh={() => fetchCallRecords(callRecordsLimit, callRecordsOffset)}
                onViewRecord={handleViewCallRecord}
                onPlayRecording={setPlayingRecordingId}
                onPagination={(offset) => {
                  setCallRecordsOffset(offset);
                  fetchCallRecords(callRecordsLimit, offset);
                }}
                selectedCallRecord={selectedCallRecord}
                showCallRecordDetail={showCallRecordDetail}
                setShowCallRecordDetail={setShowCallRecordDetail}
                deletingCallRecord={deletingCallRecord}
                onDeleteCallRecord={handleDeleteCallRecord}
              />
            </TabsContent>

            {/* Maintenance Requests */}
            <TabsContent value="maintenance-requests">
              <MaintenanceRequestsTab
                userType={userType}
                maintenanceRequests={maintenanceRequests}
                maintenanceRequestsTotal={maintenanceRequestsTotal}
                loadingMaintenanceRequests={loadingMaintenanceRequests}
                maintenanceRequestFilterStatus={maintenanceRequestFilterStatus}
                maintenanceRequestFilterProperty={maintenanceRequestFilterProperty}
                maintenanceRequestFilterPriority={maintenanceRequestFilterPriority}
                maintenanceRequestFilterCategory={maintenanceRequestFilterCategory}
                maintenanceRequestSortBy={maintenanceRequestSortBy}
                maintenanceRequestSortOrder={maintenanceRequestSortOrder}
                apartments={apartments}
                onFilterStatusChange={setMaintenanceRequestFilterStatus}
                onFilterPropertyChange={setMaintenanceRequestFilterProperty}
                onFilterPriorityChange={setMaintenanceRequestFilterPriority}
                onFilterCategoryChange={setMaintenanceRequestFilterCategory}
                onSortByChange={setMaintenanceRequestSortBy}
                onSortOrderChange={setMaintenanceRequestSortOrder}
                onRefresh={() => {
                  fetchMaintenanceRequests(
                    maintenanceRequestFilterStatus !== "all" ? maintenanceRequestFilterStatus : undefined
                  );
                }}
                onViewRequest={async (request) => {
                  const detail = await fetchMaintenanceRequestDetail(request.maintenance_request_id);
                  setSelectedMaintenanceRequest(detail);
                  setShowCallTranscript(false);
                  setShowMaintenanceRequestDetail(true);
                }}
                onEditRequest={async (request) => {
                  try {
                    // Close detail modal first
                    setShowMaintenanceRequestDetail(false);
                    
                    // Fetch full details to ensure we have all data
                    const detail = await fetchMaintenanceRequestDetail(request.maintenance_request_id);
                    
                    // Initialize form data FIRST - ensure it's a complete object
                    const formDataObj = {
                      status: detail.status || "pending",
                      priority: detail.priority || "normal",
                      assigned_to_realtor_id: detail.assigned_to_realtor_id || null,
                      pm_notes: detail.pm_notes || "",
                      resolution_notes: detail.resolution_notes || "",
                      category: detail.category || null,
                      location: detail.location || "",
                    };
                    
                    // Set the selected request FIRST
                    setSelectedMaintenanceRequest(detail);
                    
                    // Then set form data
                    setMaintenanceRequestUpdateForm(formDataObj);
                    
                    // Finally open the modal - use requestAnimationFrame for proper state update
                    requestAnimationFrame(() => {
                      setShowMaintenanceRequestUpdate(true);
                    });
                  } catch (err) {
                    console.error("Error fetching maintenance request detail:", err);
                    // If fetch fails, use the request data we have
                    const formDataObj = {
                      status: request.status || "pending",
                      priority: request.priority || "normal",
                      assigned_to_realtor_id: request.assigned_to_realtor_id || null,
                      pm_notes: request.pm_notes || "",
                      resolution_notes: request.resolution_notes || "",
                      category: request.category || null,
                      location: request.location || "",
                    };
                    
                    // Set the selected request FIRST
                    setSelectedMaintenanceRequest(request);
                    
                    // Then set form data
                    setMaintenanceRequestUpdateForm(formDataObj);
                    
                    // Finally open the modal
                    requestAnimationFrame(() => {
                      setShowMaintenanceRequestUpdate(true);
                    });
                  }
                }}
              />
            </TabsContent>

            {/* Tenants - Property Manager Only */}
            {userType === "property_manager" && (
              <TabsContent value="tenants">
                <TenantsTab
                  tenants={tenants}
                  loadingTenants={loadingTenants}
                  tenantFilterProperty={tenantFilterProperty}
                  tenantFilterActive={tenantFilterActive}
                  apartments={apartments}
                  onShowAddTenant={() => setShowAddTenant(true)}
                  onFilterPropertyChange={setTenantFilterProperty}
                  onFilterActiveChange={setTenantFilterActive}
                  onRefresh={() => fetchTenants(tenantFilterProperty !== "all" ? tenantFilterProperty : undefined, tenantFilterActive !== "all" ? tenantFilterActive : undefined)}
                  onEditTenant={handleEditTenant}
                  showAddTenant={showAddTenant}
                  setShowAddTenant={setShowAddTenant}
                  newTenant={newTenant}
                  setNewTenant={setNewTenant}
                  showEditTenant={showEditTenant}
                  setShowEditTenant={setShowEditTenant}
                  editingTenant={editingTenant}
                  editTenantForm={editTenantForm}
                  setEditTenantForm={setEditTenantForm}
                  creatingTenant={creatingTenant}
                  updatingTenant={updatingTenant}
                  realtors={realtors}
                  onCreateTenant={createTenant}
                  onUpdateTenant={updateTenant}
                />
              </TabsContent>
            )}
          </Tabs>
        </motion.div>
      </section>

      {/* Property Detail Modal */}
      <PropertyDetailModal
        open={showPropertyDetailModal}
        onOpenChange={setShowPropertyDetailModal}
        selectedProperty={selectedPropertyForDetail}
        userType={userType}
        deletingProperty={deletingProperty}
        onDelete={handleDeleteProperty}
        onEdit={() => {
          if (selectedPropertyForDetail) {
                            handleOpenPropertyUpdate(selectedPropertyForDetail);
          }
        }}
        onAssignTenant={() => {
          setNewTenant({
            ...newTenant,
            property_id: String(selectedPropertyForDetail?.id || "")
          });
                            setShowPropertyDetailModal(false);
          setShowAddTenant(true);
        }}
      />

      {/* Property Update Modal */}
      <PropertyUpdateModal
        open={showPropertyUpdateModal}
        onOpenChange={setShowPropertyUpdateModal}
        propertyUpdateForm={propertyUpdateForm}
        onFormChange={setPropertyUpdateForm}
        updatingProperty={updatingProperty}
        onUpdate={handleUpdateProperty}
        onCancel={() => {
                setShowPropertyUpdateModal(false);
                setPropertyUpdateForm({});
              }}
      />

      {/* Request Phone Number Dialog */}
      <PhoneNumberRequestDialog
        open={showRequestPhoneDialog}
        onOpenChange={setShowRequestPhoneDialog}
        phoneRequestForm={phoneRequestForm}
        onFormChange={setPhoneRequestForm}
        requestingPhone={requestingPhone}
        onSubmit={handleRequestPhoneNumber}
        onCancel={() => {
                setShowRequestPhoneDialog(false);
                setPhoneRequestForm({ country_code: "", area_code: "", notes: "" });
              }}
      />

      {/* Call Record Detail Modal */}
      <CallRecordDetailModal
        open={showCallRecordDetail}
        onOpenChange={(open) => {
          setShowCallRecordDetail(open);
          if (!open) {
            setSelectedCallRecord(null);
            setCopiedTranscript(false);
          }
        }}
        selectedCallRecord={selectedCallRecord}
        userType={userType}
        deletingCallRecord={deletingCallRecord}
        onDelete={(callRecordId, deleteAll) => handleDeleteCallRecord(callRecordId, deleteAll)}
        onClose={() => {
          setShowCallRecordDetail(false);
          setSelectedCallRecord(null);
          setCopiedTranscript(false);
        }}
      />

      {/* Add Tenant Modal */}
      <TenantAddModal
        open={showAddTenant}
        onOpenChange={setShowAddTenant}
        newTenant={newTenant}
        onFormChange={setNewTenant}
        apartments={apartments}
        realtors={realtors}
        creatingTenant={creatingTenant}
        onCreate={createTenant}
        onCancel={() => {
          setShowAddTenant(false);
          setNewTenant({
            name: "",
            property_id: "",
            phone_number: "",
            email: "",
            realtor_id: "",
            unit_number: "",
            lease_start_date: "",
            lease_end_date: "",
            notes: ""
          });
        }}
      />

      {/* Edit Tenant Modal */}
      <TenantEditModal
        open={showEditTenant}
        onOpenChange={setShowEditTenant}
        editingTenant={editingTenant}
        editTenantForm={editTenantForm}
        onFormChange={setEditTenantForm}
        updatingTenant={updatingTenant}
        onUpdate={updateTenant}
        onCancel={() => {
          setShowEditTenant(false);
          setEditingTenant(null);
        }}
      />

      {/* Maintenance Request Detail Modal */}
      <MaintenanceRequestDetailModal
        open={showMaintenanceRequestDetail}
        onOpenChange={(open) => {
          setShowMaintenanceRequestDetail(open);
          if (!open) {
            setShowCallTranscript(false);
          }
        }}
        selectedMaintenanceRequest={selectedMaintenanceRequest}
        userType={userType}
        deletingMaintenanceRequest={deletingMaintenanceRequest}
        onDelete={async (requestId) => {
          await deleteMaintenanceRequest(requestId);
        }}
        onEdit={() => {
          if (selectedMaintenanceRequest) {
            // Close detail modal first
            setShowMaintenanceRequestDetail(false);
            
            // Initialize form data - ensure it's a complete object
            const formDataObj = {
              status: selectedMaintenanceRequest.status || "pending",
              priority: selectedMaintenanceRequest.priority || "normal",
              assigned_to_realtor_id: selectedMaintenanceRequest.assigned_to_realtor_id || null,
              pm_notes: selectedMaintenanceRequest.pm_notes || "",
              resolution_notes: selectedMaintenanceRequest.resolution_notes || "",
              category: selectedMaintenanceRequest.category || null,
              location: selectedMaintenanceRequest.location || "",
            };
            
            // Set form data
            setMaintenanceRequestUpdateForm(formDataObj);
            
            // Then open the modal - use requestAnimationFrame for proper state update
            requestAnimationFrame(() => {
              setShowMaintenanceRequestUpdate(true);
            });
          }
        }}
        onRefresh={async () => {
          if (selectedMaintenanceRequest) {
            const updated = await fetchMaintenanceRequestDetail(selectedMaintenanceRequest.maintenance_request_id);
            setSelectedMaintenanceRequest(updated);
          }
        }}
      />

      {/* Maintenance Request Update Modal */}
      <MaintenanceRequestUpdateModal
        open={showMaintenanceRequestUpdate}
        onOpenChange={(open) => {
          if (!open) {
            setShowMaintenanceRequestUpdate(false);
            // If closing update modal and detail was open, reopen detail
            if (selectedMaintenanceRequest && showMaintenanceRequestDetail) {
              setTimeout(() => setShowMaintenanceRequestDetail(true), 100);
            }
          } else {
            setShowMaintenanceRequestUpdate(open);
          }
        }}
        selectedMaintenanceRequest={selectedMaintenanceRequest}
        userType={userType}
        realtors={realtors}
        updatingMaintenanceRequest={updatingMaintenanceRequest}
        formData={maintenanceRequestUpdateForm}
        onFormDataChange={setMaintenanceRequestUpdateForm}
        onUpdate={async (requestId, updateData) => {
          await updateMaintenanceRequest(requestId, updateData);
          // Refresh detail view if open
          if (selectedMaintenanceRequest && selectedMaintenanceRequest.maintenance_request_id === requestId) {
            const updated = await fetchMaintenanceRequestDetail(requestId);
            setSelectedMaintenanceRequest(updated);
            setShowMaintenanceRequestDetail(true);
          }
        }}
        onClose={() => {
          setShowMaintenanceRequestUpdate(false);
        }}
      />
    </main>
  );
};

export default Dashboard;