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

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, MapPin, Bed, Bath, Ruler, TrendingUp, Calendar, Eye, Music, Phone, Users, UserPlus, Settings, Building2, CheckSquare, Square, CalendarDays, User, ListChecks, RefreshCw, Mail, Calendar as CalendarIcon, Info, X, AlertTriangle, Edit2, Trash2, CheckCircle2, Star, Filter, Search, Download, Upload, MoreHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, LogOut, Unlink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// Backend API base URL
const API_BASE = "https://leasing-copilot-mvp.onrender.com";

/**
 * Helper function to parse and extract metadata from property objects
 * 
 * Handles properties that may have metadata stored as JSON strings or objects.
 * Provides safe fallbacks for all fields and ensures consistent data structure.
 * 
 * @param property - Property object that may contain listing_metadata
 * @returns Normalized property object with all metadata fields extracted
 */
const getPropertyMetadata = (property: any) => {
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
  if (typeof metadata === 'string') {
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
  const [userType, setUserType] = useState<string | null>(null);
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
  // Recordings and Media State
  // ============================================================================
  const [recordings, setRecordings] = useState<{ url: string }[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  
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
  const fetchUserInfo = async () => {
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
        console.log("✅ Found valid user name in localStorage:", storedUserName);
        setUserName(storedUserName);
        if (storedUserGender) {
          setUserGender(storedUserGender);
        }
        // Still try API to get better name if available, but don't return early
      } else {
        console.log("⚠️ No valid user name in localStorage, attempting to fetch from API");
      }

      // If not in localStorage, try to fetch from API
      try {
        // Try different possible endpoints
        const endpoints = storedUserType === "property_manager" 
          ? [
              `${API_BASE}/property-manager/me`,
              `${API_BASE}/property-manager/profile`,
              `${API_BASE}/property-manager/info`
            ]
          : [
              `${API_BASE}/realtor/me`,
              `${API_BASE}/realtor/profile`,
              `${API_BASE}/realtor/info`
            ];

        let nameFound = false;
        for (const endpoint of endpoints) {
          try {
            const res = await fetch(endpoint, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
              const data = await res.json();
              console.log("API response from", endpoint, ":", data);
              const name = data.name || data.user?.name || data.property_manager?.name || data.realtor?.name || data.email?.split('@')[0] || null;
              const gender = data.gender || data.user?.gender || data.property_manager?.gender || data.realtor?.gender || null;
              
              if (name && name.trim() !== "") {
                console.log("Setting user name:", name);
                setUserName(name);
                localStorage.setItem("user_name", name);
                nameFound = true;
                
                if (gender) {
                  setUserGender(gender);
                  localStorage.setItem("user_gender", gender);
                }
                break;
              } else {
                console.log("No valid name found in response");
              }
            }
          } catch (endpointErr) {
            // Try next endpoint
            continue;
          }
        }

        // If still no name found, try alternative methods
        if (!nameFound) {
          console.log("⚠️ Could not find user name in standard endpoints, trying alternative methods");
          
          // For property managers, we might need to get it from a different endpoint
          // Or check if we can get email and extract username from it
          const storedEmail = localStorage.getItem("user_email");
          if (storedEmail && storedEmail.includes('@')) {
            const emailName = storedEmail.split('@')[0];
            // Clean and capitalize
            const cleanedName = emailName.replace(/[._0-9]/g, '');
            const formattedName = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);
            console.log("✅ Using email-derived name:", formattedName);
            setUserName(formattedName);
            localStorage.setItem("user_name", formattedName);
          } else {
            // Ensure we always have something
            if (!localStorage.getItem("user_name") || localStorage.getItem("user_name") === "User") {
              console.log("⚠️ Setting default name 'User'");
              setUserName("User");
              localStorage.setItem("user_name", "User");
            }
          }
        }
      } catch (err) {
        console.error("Could not fetch user info:", err);
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

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
    console.log("🔍 Checking localStorage for user_name:", storedUserName);
    
    if (storedUserName && storedUserName.trim() !== "") {
      console.log("✅ Found user_name in localStorage:", storedUserName);
      setUserName(storedUserName);
    } else {
      console.log("⚠️ No user_name found in localStorage. Attempting to derive one...");
      
      // Try to get from email
      const storedEmail = localStorage.getItem("user_email");
      if (storedEmail && storedEmail.includes('@')) {
        const emailName = storedEmail.split('@')[0];
        const cleanedName = emailName.replace(/[._0-9]/g, '');
        const formattedName = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);
        console.log("✅ Derived name from stored email:", formattedName);
        setUserName(formattedName);
        localStorage.setItem("user_name", formattedName);
      } else {
        // Set a default
        console.log("⚠️ No email found either. Setting default name 'User'");
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

    // Trigger staggered animations after component mount
    setTimeout(() => setAnimateCards(true), 300);
    
    // Fetch user information
    fetchUserInfo();
    fetchNumber();
    fetchApartments();
    fetchRecordings();
    fetchBookings();
    fetchChats(); 

    // If property manager, fetch realtors and phone numbers
    if (storedUserType === "property_manager") {
      fetchRealtors();
      fetchPropertiesForAssignment();
      fetchAssignments();
      fetchPhoneNumberRequests();
      fetchPurchasedPhoneNumbers();
    }
  }, []);

  // All your existing API functions remain exactly the same
  const fetchNumber = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        return;
      }

      const res = await fetch(`${API_BASE}/my-number`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // If 404 or error, user doesn't have a number assigned yet - this is normal
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 404 || errorData.detail?.includes("haven't purchased")) {
          setMyNumber(null);
          return;
        }
        throw new Error("Failed to fetch number");
      }

      const data = await res.json();
      console.log("Fetched number:", data);
      setMyNumber(data.twilio_number || null);
    } catch (err: any) {
      console.error("Error fetching number:", err);
      // Don't show error toast - not having a number is a valid state
      setMyNumber(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch bookings");

      const data = await res.json();

      setBookings(Array.isArray(data) ? data : data.bookings || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load bookings");
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchApartments = async () => {
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

      if (!res.ok) throw new Error("Failed to fetch apartments");

      const data = await res.json();
      console.log("Fetched apartments:", data);

      // since backend returns raw array
      setApartments(Array.isArray(data) ? data : data.apartments || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load apartments");
    } finally {
      setLoadingApartments(false);
    }
  };

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

  const fetchChats = async () => {
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
      console.error(err);
      toast.error("Could not load chats");
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchRealtors = async () => {
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

      if (!res.ok) throw new Error("Failed to fetch realtors");

      const data = await res.json();
      setRealtors(data.realtors || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load realtors");
    } finally {
      setLoadingRealtors(false);
    }
  };

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
      
      console.log("🔄 Updating property:", {
        propertyId,
        apiUrl,
        payload: updatePayload,
        payloadKeys: Object.keys(updatePayload)
      });

      const res = await fetch(apiUrl, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updatePayload),
      });

      console.log("📡 API Response:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries())
      });

      if (!res.ok) {
        let errorData: any = {};
        try {
          const errorText = await res.text();
          console.error("❌ Error response body:", errorText);
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch (parseError) {
          console.error("❌ Failed to parse error response:", parseError);
        }
        
        const errorMessage = errorData.detail || errorData.message || errorData.error || `HTTP ${res.status}: ${res.statusText}`;
        console.error("❌ Update failed:", {
          status: res.status,
          statusText: res.statusText,
          errorData,
          errorMessage
        });
        throw new Error(errorMessage);
      }

      let data: any = {};
      try {
        const responseText = await res.text();
        data = responseText ? JSON.parse(responseText) : {};
        console.log("✅ Update successful:", data);
      } catch (parseError) {
        console.warn("⚠️ Response is not JSON, treating as success");
      }

      toast.success(data.message || "Property updated successfully!");
      setShowPropertyUpdateModal(false);
      
      // Use the returned property object from API response for immediate UI update
      if (data.property) {
        console.log("📦 Using API response property:", data.property);
        setSelectedPropertyForDetail(data.property);
        setShowPropertyDetailModal(true);
      }
      
      // Refresh all data in background
      Promise.all([
        fetchApartments(),
        fetchAssignments(),
        fetchPropertiesForAssignment()
      ]).catch(err => {
        console.error("Background refresh error:", err);
      });
    } catch (err: any) {
      console.error("❌ handleUpdateProperty error:", err);
      const errorMessage = err.message || "Could not update property";
      toast.error(errorMessage);
      
      // Log detailed error for debugging
      if (err.message) {
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
      }
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
      console.log("Number purchased:", data);
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
        throw new Error(`Server error: ${text || response.statusText}`);
      }

      // Check if response was successful
      if (response.ok) {
        // Success - data is already parsed
        console.log("Success:", data);
        console.log("Message:", data.message); // This will show the actual message
        
        // Display the message properly (should be a string according to API docs)
        toast.success(data.message || "Phone number unassigned successfully!");
        
        // Log additional info for debugging
        if (data.phone_number) {
          console.log("Unassigned phone number:", data.phone_number);
        }
        if (data.purchased_phone_number_id) {
          console.log("Purchased phone number ID:", data.purchased_phone_number_id);
        }
        
        // Refresh the phone numbers list to show updated status
        fetchPurchasedPhoneNumbers();
        
        // Refresh current user's number in case it was unassigned from them
        fetchNumber();
        
        // Return the parsed data
        return data;
      } else {
        // Error response - data.detail contains the error message (not data.message)
        const errorMessage = data.detail || data.message || "Unknown error";
        console.error("Error response:", data);
        toast.error(`Error: ${errorMessage}`); // Show the actual error message
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      // Handle network errors or other exceptions
      console.error("Fetch error:", error);
      
      // If error is already a string or has a message, use it
      const errorMessage = error.message || String(error);
      
      // Don't show [object Object] - check if it's an object
      if (typeof error === 'object' && error !== null && !error.message) {
        toast.error("Failed to unassign phone number. Please check the console for details.");
        console.error("Full error object:", error);
      } else {
        toast.error(`Failed to unassign phone number: ${errorMessage}`);
      }
      
      throw error;
    } finally {
      setAssigningPhone(false);
    }
  };

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
                className="bg-white hover:bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300 font-medium transition-all shadow-sm rounded-xl"
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
                className="bg-white hover:bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300 font-medium transition-all shadow-sm rounded-xl"
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
                  className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl"
                  size="sm"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Request a Phone Number
                </Button>
              )}
              <Button 
                onClick={handleSignOut}
                variant="outline"
                className="bg-white hover:bg-red-50 text-red-600 border-red-300 hover:border-red-400 font-medium transition-all shadow-sm rounded-xl"
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
              <div className="flex items-center gap-3 bg-amber-50/80 rounded-xl p-3 border border-amber-200">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {userType === "property_manager" ? (
            <>
              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-amber-100 hover:border-amber-200 group"
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
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: 15 }}
                  >
                    <Users className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-amber-100 hover:border-amber-200 group"
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
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: -15 }}
                  >
                    <Building2 className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-amber-100 hover:border-amber-200 group"
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
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: 15 }}
                  >
                    <Calendar className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-amber-100 hover:border-amber-200 group"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">Performance</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.4, type: "spring" as const }}
                    >
                      98%
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">Success rate</p>
                  </div>
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: -15 }}
                  >
                    <TrendingUp className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-amber-100 hover:border-amber-200 group"
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
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: 15 }}
                  >
                    <Building2 className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-amber-100 hover:border-amber-200 group"
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
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: -15 }}
                  >
                    <Calendar className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-amber-100 hover:border-amber-200 group"
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
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: 15 }}
                  >
                    <Eye className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-amber-100 hover:border-amber-200 group"
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
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: -15 }}
                  >
                    <CheckCircle2 className="h-6 w-6 text-white" />
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Enhanced Tabs Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mb-8"
            >
              <TabsList className="bg-white border border-amber-200 rounded-2xl p-2 shadow-lg inline-flex w-full overflow-x-auto overflow-y-hidden scrollbar-hide">
                {userType === "property_manager" && (
                  <>
                    <TabsTrigger 
                      value="realtors" 
                      className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-3 sm:px-4 py-2 sm:py-3 font-semibold transition-all text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Realtors
                    </TabsTrigger>
                    <TabsTrigger 
                      value="assign-properties" 
                      className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-3 sm:px-4 py-2 sm:py-3 font-semibold transition-all text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Assign Properties
                    </TabsTrigger>
                    <TabsTrigger 
                      value="view-assignments" 
                      className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-3 sm:px-4 py-2 sm:py-3 font-semibold transition-all text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                    >
                      <ListChecks className="h-4 w-4 mr-2" />
                      View Assignments
                    </TabsTrigger>
                    <TabsTrigger 
                      value="phone-numbers" 
                      className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-3 sm:px-4 py-2 sm:py-3 font-semibold transition-all text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Phone Numbers
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger 
                  value="properties" 
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-4 py-3 font-semibold transition-all text-sm"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Properties
                </TabsTrigger>
                <TabsTrigger 
                  value="bookings" 
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-4 py-3 font-semibold transition-all text-sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Bookings
                </TabsTrigger>
                <TabsTrigger 
                  value="conversations" 
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-4 py-3 font-semibold transition-all text-sm"
                >
                  <Music className="h-4 w-4 mr-2" />
                  Conversations
                </TabsTrigger>
                <TabsTrigger 
                  value="chats" 
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-4 py-3 font-semibold transition-all text-sm"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Calls
                </TabsTrigger>
              </TabsList>
            </motion.div>

            {/* Realtors Management - Property Manager Only */}
            {userType === "property_manager" && (
              <TabsContent value="realtors">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-8">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex-1">
                          <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
                            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                              <Users className="h-6 w-6 text-white" />
                            </div>
                            Manage Realtors
                          </CardTitle>
                          <p className="text-gray-600 text-lg">
                            Add and manage your realtor team members. Create accounts for realtors so they can access their assigned properties.
                          </p>
                        </div>
                        <Button 
                          onClick={() => setShowAddRealtor(!showAddRealtor)}
                          className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl px-6 py-3"
                        >
                          <UserPlus className="h-5 w-5 mr-2" />
                          Add New Realtor
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      {showAddRealtor && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <UserPlus className="h-6 w-6 text-amber-600" />
                            <h3 className="text-xl font-bold text-gray-900">Add New Realtor to Your Team</h3>
                          </div>
                          <p className="text-gray-600 mb-6">Fill in the details below to create a new realtor account. They'll receive login credentials.</p>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            <div>
                              <label className="text-sm font-semibold text-gray-700 mb-3 block">Full Name</label>
                              <input
                                type="text"
                                value={newRealtor.name}
                                onChange={(e) => setNewRealtor({...newRealtor, name: e.target.value})}
                                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                                placeholder="John Doe"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-700 mb-3 block">Email Address</label>
                              <input
                                type="email"
                                value={newRealtor.email}
                                onChange={(e) => setNewRealtor({...newRealtor, email: e.target.value})}
                                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                                placeholder="john.doe@company.com"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-700 mb-3 block">Temporary Password</label>
                              <input
                                type="password"
                                value={newRealtor.password}
                                onChange={(e) => setNewRealtor({...newRealtor, password: e.target.value})}
                                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                                placeholder="Choose a secure password"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <Button 
                              onClick={addRealtor} 
                              className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl px-8 py-4 rounded-xl"
                            >
                              <CheckCircle2 className="h-5 w-5 mr-2" />
                              Create Realtor Account
                            </Button>
                            <Button 
                              onClick={() => setShowAddRealtor(false)}
                              variant="outline"
                              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-xl"
                            >
                              <X className="h-5 w-5 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {loadingRealtors ? (
                        <div className="text-center py-12">
                          <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium">Loading realtors...</p>
                        </div>
                      ) : realtors.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium text-lg">No realtors found. Add your first realtor above.</p>
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                          <Table>
                            <TableHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50">
                              <TableRow className="border-b border-amber-200">
                                <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Name</TableHead>
                                <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Email</TableHead>
                                <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Contact Number</TableHead>
                                <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {realtors.map((realtor, idx) => (
                                <motion.tr
                                  key={realtor.id || idx}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                                  className="hover:bg-amber-50/50 transition-all duration-200 group border-b border-gray-100"
                                >
                                  <TableCell className="font-semibold text-gray-900 py-5 px-6">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-amber-100 rounded-lg">
                                        <User className="h-5 w-5 text-amber-600" />
                                      </div>
                                      {realtor.name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-gray-600 py-5 px-6">
                                    <div className="flex items-center gap-3">
                                      <Mail className="h-4 w-4 text-gray-400" />
                                      <span className="truncate">{realtor.email}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-gray-600 py-5 px-6">
                                    <div className="flex items-center gap-3">
                                      <Phone className="h-4 w-4 text-gray-400" />
                                      <span className="truncate">{realtor.contact || "N/A"}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-5 px-6">
                                    <div className="flex gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => handleEditRealtor(realtor)}
                                        className="bg-white hover:bg-amber-50 text-amber-600 border-amber-300 hover:border-amber-400 font-medium transition-all rounded-lg"
                                      >
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit
                                      </Button>
                                      <Dialog open={showEditRealtor && editingRealtor?.id === realtor.id} onOpenChange={(open) => {
                                        if (!open) {
                                          setShowEditRealtor(false);
                                          setEditingRealtor(null);
                                          setEditRealtorForm({ name: "", email: "", password: "", contact: "" });
                                        }
                                      }}>
                                        <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
                                          <DialogHeader className="p-6 pb-4 border-b border-gray-200">
                                            <DialogTitle className="text-gray-900 font-bold text-2xl flex items-center gap-3">
                                              <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                                                <Edit2 className="h-5 w-5 text-white" />
                                              </div>
                                              Edit Realtor: {editingRealtor?.name}
                                            </DialogTitle>
                                            <DialogDescription className="text-gray-600 mt-2 text-base">
                                              Update the realtor's information. Leave password blank if you don't want to change it.
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="p-6 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              <div>
                                                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                                                  Full Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                  type="text"
                                                  value={editRealtorForm.name}
                                                  onChange={(e) => setEditRealtorForm({...editRealtorForm, name: e.target.value})}
                                                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                                                  placeholder="John Doe"
                                                  required
                                                />
                                              </div>
                                              <div>
                                                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                                                  Email Address <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                  type="email"
                                                  value={editRealtorForm.email}
                                                  onChange={(e) => setEditRealtorForm({...editRealtorForm, email: e.target.value})}
                                                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                                                  placeholder="john.doe@company.com"
                                                  required
                                                />
                                              </div>
                                              <div>
                                                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                                                  Contact Number
                                                </label>
                                                <input
                                                  type="tel"
                                                  value={editRealtorForm.contact}
                                                  onChange={(e) => setEditRealtorForm({...editRealtorForm, contact: e.target.value})}
                                                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                                                  placeholder="555-0123"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                                                  New Password
                                                </label>
                                                <input
                                                  type="password"
                                                  value={editRealtorForm.password}
                                                  onChange={(e) => setEditRealtorForm({...editRealtorForm, password: e.target.value})}
                                                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                                                  placeholder="Leave blank to keep current password"
                                                />
                                                <p className="text-xs text-gray-500 mt-2">Leave blank if you don't want to change the password</p>
                                              </div>
                                            </div>
                                          </div>
                                          <DialogFooter className="p-6 pt-0 border-t border-gray-200">
                                            <Button 
                                              onClick={() => {
                                                setShowEditRealtor(false);
                                                setEditingRealtor(null);
                                                setEditRealtorForm({ name: "", email: "", password: "", contact: "" });
                                              }}
                                              variant="outline"
                                              className="border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl px-6 py-3"
                                              disabled={updatingRealtor}
                                            >
                                              <X className="h-4 w-4 mr-2" />
                                              Cancel
                                            </Button>
                                            <Button 
                                              onClick={updateRealtor}
                                              disabled={updatingRealtor || !editRealtorForm.name || !editRealtorForm.email}
                                              className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl px-6 py-3"
                                            >
                                              {updatingRealtor ? (
                                                <>
                                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                  Updating...
                                                </>
                                              ) : (
                                                <>
                                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                                  Update Realtor
                                                </>
                                              )}
                                            </Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="bg-white hover:bg-red-50 text-red-600 border-red-300 hover:border-red-500 font-medium transition-all rounded-lg"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl">
                                          <AlertDialogHeader className="p-6">
                                            <AlertDialogTitle className="text-gray-900 font-bold text-2xl">Delete Realtor: {realtor.name}?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-gray-600 mt-4 space-y-3 text-lg">
                                              <p className="font-semibold text-gray-900">This will:</p>
                                              <ul className="list-disc list-inside space-y-2 text-base ml-2">
                                                <li>Move all their properties back to you (unassigned)</li>
                                                <li>Unassign all their bookings</li>
                                                <li>Delete their sources and rule chunks</li>
                                                <li>Remove them from the system</li>
                                              </ul>
                                              <p className="mt-6 font-bold text-red-600 text-lg">⚠️ This action CANNOT be undone!</p>
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter className="p-6 pt-0">
                                            <AlertDialogCancel className="border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl px-6 py-3">
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction 
                                              onClick={() => handleDeleteRealtor(realtor.id, realtor.name)}
                                              className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl px-6 py-3"
                                            >
                                              Delete Realtor
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </TableCell>
                                </motion.tr>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            )}

            {/* Property Assignment - Property Manager Only */}
            {userType === "property_manager" && (
              <TabsContent value="assign-properties">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-8">
                      <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                          <CheckSquare className="h-6 w-6 text-white" />
                        </div>
                        Assign Properties to Realtors
                      </CardTitle>
                      <p className="text-gray-600 text-lg">
                        Select properties and assign them to a realtor. Assigned properties will appear on the realtor's dashboard.
                      </p>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      {/* Realtor Selection */}
                      <div className="space-y-4 bg-amber-50 p-6 rounded-2xl border border-amber-200">
                        <div className="flex items-center gap-3">
                          <User className="h-6 w-6 text-amber-600" />
                          <label className="text-xl font-semibold text-gray-900">Select Realtor to Assign Properties:</label>
                        </div>
                        <select 
                          value={selectedRealtor || ''} 
                          onChange={(e) => setSelectedRealtor(e.target.value ? Number(e.target.value) : null)}
                          className="w-full p-4 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg font-medium transition-all"
                        >
                          <option value="">Choose a realtor from the list...</option>
                          {realtors.map(realtor => (
                            <option key={realtor.id} value={realtor.id}>
                              {realtor.name} - {realtor.email}
                            </option>
                          ))}
                        </select>
                        {selectedRealtor && (
                          <div className="flex items-center gap-3 bg-green-50 p-4 rounded-xl border border-green-200">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-700 text-lg">
                              Selected: {realtors.find(r => r.id === selectedRealtor)?.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Properties Section */}
                      <div className="space-y-6">
                        <div className="flex flex-col gap-6">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900">
                                Available Properties <span className="text-amber-600">({selectedProperties.length} selected)</span>
                              </h3>
                              <p className="text-gray-600 text-lg">
                                Properties you own that haven't been assigned to realtors yet
                              </p>
                            </div>
                            <div className="flex gap-3 flex-wrap items-center">
                              <Button 
                                onClick={handleSelectAll}
                                variant="outline"
                                size="lg"
                                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-amber-300 font-medium transition-all rounded-xl"
                              >
                                {Array.isArray(paginatedProperties) && paginatedProperties.length > 0 && paginatedProperties.every((p: any) => p?.id && selectedProperties.includes(p.id)) ? 'Deselect Page' : 'Select Page'}
                              </Button>
                              <Button 
                                onClick={handleSelectAllProperties}
                                variant="outline"
                                size="lg"
                                className="bg-white hover:bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400 font-medium transition-all rounded-xl"
                              >
                                {Array.isArray(availablePropertiesForAssignment) && selectedProperties.length === availablePropertiesForAssignment.length ? 'Deselect All' : 'Select All Properties'}
                              </Button>
                              <div className="flex items-center gap-2 ml-auto">
                                <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Items per page:</label>
                                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                                  <SelectTrigger className="w-24 bg-white border-gray-300 rounded-xl">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="12">12</SelectItem>
                                    <SelectItem value="24">24</SelectItem>
                                    <SelectItem value="48">48</SelectItem>
                                    <SelectItem value="96">96</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                          
                          {/* Enhanced Bulk Selection Buttons */}
                          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                            <p className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-3">
                              <CheckSquare className="h-5 w-5 text-amber-600" />
                              Quick Selection Tools:
                            </p>
                            <div className="flex flex-wrap gap-3">
                              {[10, 20, 50].map((count) => (
                                <Button 
                                  key={count}
                                  onClick={() => handleBulkSelect(count, true)}
                                  variant="outline"
                                  size="lg"
                                  className="bg-white hover:bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400 font-medium transition-all rounded-xl"
                                >
                                  First {count}
                                </Button>
                              ))}
                              <div className="w-px bg-amber-300 mx-2"></div>
                              {[10, 20, 50].map((count) => (
                                <Button 
                                  key={count}
                                  onClick={() => handleBulkSelect(count, false)}
                                  variant="outline"
                                  size="lg"
                                  className="bg-white hover:bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400 font-medium transition-all rounded-xl"
                                >
                                  Last {count}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {loadingAssignmentProperties ? (
                          <div className="text-center py-12">
                            <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium text-lg">Loading properties...</p>
                          </div>
                        ) : !Array.isArray(availablePropertiesForAssignment) || availablePropertiesForAssignment.length === 0 ? (
                          <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl">
                            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium text-lg">
                              No properties available to assign. All properties may already be assigned to realtors.
                            </p>
                          </div>
                        ) : (
                          <>
                          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {Array.isArray(paginatedProperties) && paginatedProperties.map((property, idx) => {
                              if (!property) return null;
                              const meta = getPropertyMetadata(property);
                              return (
                                <motion.div
                                  key={property.id || idx}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                                  whileHover={{ y: -8 }}
                                >
                                  <Card 
                                    className={`transition-all duration-300 rounded-2xl bg-white border-2 overflow-hidden ${
                                      selectedProperties.includes(property.id) 
                                        ? 'border-amber-500 bg-amber-50 shadow-xl' 
                                        : 'border-gray-200 hover:border-amber-300 hover:shadow-lg'
                                    }`}
                                  >
                                    <div className="flex items-start p-4 sm:p-5 gap-3 sm:gap-4">
                                      <div className="flex-shrink-0 mt-1" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={selectedProperties.includes(property.id)}
                                          onChange={() => handlePropertyToggle(property.id)}
                                          className="h-5 w-5 sm:h-6 sm:w-6 cursor-pointer accent-amber-500 rounded-lg border-gray-300"
                                        />
                                      </div>
                                      <div 
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => handleOpenPropertyDetail(property)}
                                      >
                                        <div className="space-y-3">
                                        <div>
                                            <h4 className="font-bold text-base sm:text-lg text-gray-900 truncate mb-1">
                                                  {meta.address || `Property #${property.id}`}
                                                </h4>
                                          {meta.listing_id && (
                                              <p className="text-xs sm:text-sm text-amber-600 font-medium">MLS: {meta.listing_id}</p>
                                          )}
                                        </div>
                                          <div className="flex items-center justify-between flex-wrap gap-2">
                                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                              ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                            </p>
                                            {meta.listing_status && (
                                              <Badge 
                                                variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                                                className={`text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-lg ${
                                                  meta.listing_status === 'Available' 
                                                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' 
                                                    : 'bg-gray-200 text-gray-700'
                                                }`}
                                              >
                                                {meta.listing_status}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex flex-wrap gap-2 text-xs sm:text-sm font-medium">
                                            <span className="flex items-center gap-1 sm:gap-2 bg-gray-50 border border-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-gray-700">
                                              <Bed className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" /> {meta.bedrooms || 0} Beds
                                            </span>
                                            <span className="flex items-center gap-1 sm:gap-2 bg-gray-50 border border-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-gray-700">
                                              <Bath className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" /> {meta.bathrooms || 0} Baths
                                            </span>
                                            {meta.square_feet && (
                                              <span className="flex items-center gap-1 sm:gap-2 bg-gray-50 border border-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-gray-700">
                                                <Square className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" /> {meta.square_feet} sqft
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs sm:text-sm text-amber-600 font-medium pt-2 border-t border-gray-200">
                                            Click to view details →
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                </motion.div>
                              );
                            })}
                          </div>
                          
                          {/* Modern Pagination Component */}
                          {totalPages > 1 && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4 }}
                              className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 bg-gradient-to-r from-amber-50 to-white p-6 rounded-2xl border border-amber-200"
                            >
                              {/* Page Info */}
                              <div className="flex items-center gap-2 text-gray-700">
                                <span className="text-sm font-medium">
                                  Showing <span className="font-bold text-amber-600">{startIndex + 1}</span> to{' '}
                                  <span className="font-bold text-amber-600">
                                    {Math.min(endIndex, Array.isArray(availablePropertiesForAssignment) ? availablePropertiesForAssignment.length : 0)}
                                  </span>{' '}
                                  of <span className="font-bold text-amber-600">{Array.isArray(availablePropertiesForAssignment) ? availablePropertiesForAssignment.length : 0}</span> properties
                                </span>
                              </div>

                              {/* Pagination Controls */}
                              <div className="flex items-center gap-2">
                                {/* First Page Button */}
                                <Button
                                  onClick={() => goToPage(1)}
                                  disabled={currentPage === 1}
                                  variant="outline"
                                  size="sm"
                                  className="bg-white hover:bg-amber-50 text-gray-700 border-gray-300 hover:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xl"
                                >
                                  <ChevronsLeft className="h-4 w-4" />
                                </Button>

                                {/* Previous Page Button */}
                                <Button
                                  onClick={() => goToPage(currentPage - 1)}
                                  disabled={currentPage === 1}
                                  variant="outline"
                                  size="sm"
                                  className="bg-white hover:bg-amber-50 text-gray-700 border-gray-300 hover:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xl"
                                >
                                  <ChevronLeft className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Prev</span>
                                </Button>

                                {/* Page Numbers */}
                                <div className="flex items-center gap-1">
                                  {getPageNumbers().map((page, idx) => {
                                    if (page === '...') {
                                      return (
                                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 font-semibold">
                                          ...
                                        </span>
                                      );
                                    }
                                    const pageNum = page as number;
                                    return (
                                      <Button
                                        key={pageNum}
                                        onClick={() => goToPage(pageNum)}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        className={`min-w-[40px] transition-all rounded-xl ${
                                          currentPage === pageNum
                                            ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-500 shadow-lg scale-105 font-bold'
                                            : 'bg-white hover:bg-amber-50 text-gray-700 border-gray-300 hover:border-amber-400 font-medium'
                                        }`}
                                      >
                                        {pageNum}
                                      </Button>
                                    );
                                  })}
                                </div>

                                {/* Next Page Button */}
                                <Button
                                  onClick={() => goToPage(currentPage + 1)}
                                  disabled={currentPage === totalPages}
                                  variant="outline"
                                  size="sm"
                                  className="bg-white hover:bg-amber-50 text-gray-700 border-gray-300 hover:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xl"
                                >
                                  <span className="hidden sm:inline">Next</span>
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>

                                {/* Last Page Button */}
                                <Button
                                  onClick={() => goToPage(totalPages)}
                                  disabled={currentPage === totalPages}
                                  variant="outline"
                                  size="sm"
                                  className="bg-white hover:bg-amber-50 text-gray-700 border-gray-300 hover:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xl"
                                >
                                  <ChevronsRight className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Page Jump (Optional - for larger datasets) */}
                              {totalPages > 10 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600 font-medium">Go to:</span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={totalPages}
                                    value={pageJumpValue || currentPage}
                                    onChange={(e) => setPageJumpValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const page = parseInt(pageJumpValue || currentPage.toString());
                                        if (!isNaN(page) && page >= 1 && page <= totalPages) {
                                          goToPage(page);
                                        } else {
                                          setPageJumpValue("");
                                        }
                                      }
                                    }}
                                    onBlur={() => setPageJumpValue("")}
                                    className="w-20 p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 text-center font-medium"
                                    placeholder="Page"
                                  />
                          </div>
                              )}
                            </motion.div>
                          )}
                          </>
                        )}
                      </div>

                      {/* Assign Button Section */}
                      <div className="pt-6 border-t border-gray-200 bg-amber-50 p-6 rounded-2xl border border-amber-200">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                          <div className="flex-1">
                            <p className="text-lg font-medium text-gray-700">
                              {selectedProperties.length > 0 && selectedRealtor ? (
                                <span className="flex items-center gap-3">
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  Ready to assign <strong className="text-amber-600 text-xl">{selectedProperties.length}</strong> {selectedProperties.length === 1 ? 'property' : 'properties'} to <strong className="text-amber-600 text-xl">{realtors.find(r => r.id === selectedRealtor)?.name}</strong>
                                </span>
                              ) : (
                                <span className="text-gray-600 text-lg">
                                  {!selectedRealtor && selectedProperties.length > 0 
                                    ? "⚠️ Please select a realtor to assign properties"
                                    : selectedRealtor && selectedProperties.length === 0
                                    ? "⚠️ Please select at least one property to assign"
                                    : "Select a realtor and properties to begin"}
                                </span>
                              )}
                            </p>
                          </div>
                          <Button 
                            onClick={assignProperties} 
                            disabled={assigningProperties || !selectedRealtor || selectedProperties.length === 0}
                            className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl w-full lg:w-auto"
                            size="lg"
                          >
                            {assigningProperties ? (
                              <>
                                <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                                Assigning...
                              </>
                            ) : (
                              <>
                                <CheckSquare className="h-5 w-5 mr-3" />
                                Assign {selectedProperties.length} {selectedProperties.length === 1 ? 'Property' : 'Properties'}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            )}

            {/* View Assignments - Property Manager Only */}
            {userType === "property_manager" && (
              <TabsContent value="view-assignments">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-8">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex-1">
                          <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
                            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                              <ListChecks className="h-6 w-6 text-white" />
                            </div>
                            Property Assignments Overview
                          </CardTitle>
                          <p className="text-gray-600 text-lg">
                            See which properties are assigned to which realtors, and manage unassigned properties
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Filter Dropdown */}
                          {assignmentsData && assignmentsData.assigned_properties && Object.keys(assignmentsData.assigned_properties).length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="outline"
                                  size="lg"
                                  className="bg-white hover:bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400 font-medium transition-all rounded-xl"
                                >
                                  <Filter className="h-5 w-5 mr-2" />
                                  Filter by Realtor
                                  {selectedRealtorFilters.size > 0 && (
                                    <Badge className="ml-2 bg-gradient-to-br from-amber-500 to-amber-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                      {selectedRealtorFilters.size}
                                    </Badge>
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent 
                                align="end" 
                                className="w-80 bg-white border border-amber-200 shadow-2xl rounded-2xl p-0 overflow-hidden"
                              >
                                {/* Fixed Header */}
                                <div className="sticky top-0 bg-white z-10 p-4 pb-3 border-b border-amber-200">
                                  <DropdownMenuLabel className="text-gray-900 font-bold text-lg mb-0 px-0">
                                    Filter Assignments
                                  </DropdownMenuLabel>
                                </div>
                                
                                {/* Scrollable Content */}
                                <div className="max-h-[400px] overflow-y-auto overflow-x-hidden px-4 py-2 custom-scrollbar">
                                  {/* Select All / Deselect All */}
                                  <div className="flex gap-2 mb-3">
                                    <Button
                                      onClick={handleSelectAllRealtors}
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300 font-medium rounded-xl text-xs py-2"
                                    >
                                      Select All
                                    </Button>
                                    <Button
                                      onClick={handleDeselectAllRealtors}
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300 font-medium rounded-xl text-xs py-2"
                                    >
                                      Clear All
                                    </Button>
                                  </div>
                                  
                                  <DropdownMenuSeparator className="bg-amber-200 my-2" />
                                  
                                  {/* Unassigned Properties Option */}
                                  <DropdownMenuCheckboxItem
                                    checked={selectedRealtorFilters.has('unassigned')}
                                    onCheckedChange={() => handleRealtorFilterToggle('unassigned')}
                                    className="px-2 py-2 rounded-xl hover:bg-amber-50 focus:bg-amber-50 cursor-pointer transition-all mb-1.5"
                                  >
                                    <div className="flex items-center gap-2.5 w-full">
                                      <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0">
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">Unassigned Properties</p>
                                        <p className="text-xs text-gray-500">
                                          {assignmentsData.unassigned_properties?.length || 0} properties
                                        </p>
                                      </div>
                                    </div>
                                  </DropdownMenuCheckboxItem>
                                  
                                  <DropdownMenuSeparator className="bg-amber-200 my-2" />
                                  
                                  {/* Realtor Options */}
                                  {Object.values(assignmentsData.assigned_properties || {}).map((realtorGroup: any) => (
                                    <DropdownMenuCheckboxItem
                                      key={realtorGroup.realtor_id}
                                      checked={selectedRealtorFilters.has(realtorGroup.realtor_id)}
                                      onCheckedChange={() => handleRealtorFilterToggle(realtorGroup.realtor_id)}
                                      className="px-2 py-2 rounded-xl hover:bg-amber-50 focus:bg-amber-50 cursor-pointer transition-all mb-1.5"
                                    >
                                      <div className="flex items-center gap-2.5 w-full">
                                        <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0">
                                          <User className="h-3.5 w-3.5 text-amber-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-gray-900 text-sm truncate">{realtorGroup.realtor_name}</p>
                                          <p className="text-xs text-gray-500 truncate">{realtorGroup.realtor_email}</p>
                                          <p className="text-xs font-medium text-amber-600 mt-0.5">
                                            {realtorGroup.count} {realtorGroup.count === 1 ? 'property' : 'properties'}
                                          </p>
                                        </div>
                                      </div>
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          
                        <Button 
                          onClick={() => { fetchAssignments(); fetchPropertiesForAssignment(); }}
                          variant="outline"
                          size="lg"
                          className="bg-white hover:bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400 font-medium transition-all rounded-xl"
                        >
                          <RefreshCw className="h-5 w-5 mr-2" />
                          Refresh Data
                        </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      {loadingAssignments ? (
                        <div className="text-center py-12">
                          <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium text-lg">Loading assignments...</p>
                        </div>
                      ) : !assignmentsData ? (
                        <div className="text-center py-12">
                          <ListChecks className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium text-lg">No assignment data available</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {/* Enhanced Summary Cards */}
                          {assignmentsData.summary && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                              <Card className="bg-white p-6 border border-amber-100 rounded-2xl hover:shadow-lg transition-all hover:border-amber-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-amber-600 mb-2 uppercase tracking-wide">Total Properties</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                      {assignmentsData.summary.total_properties || 0}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">All properties</p>
                                  </div>
                                  <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                                    <Building2 className="h-6 w-6 text-white" />
                                  </div>
                                </div>
                              </Card>
                              <Card className="bg-white p-6 border border-amber-100 rounded-2xl hover:shadow-lg transition-all hover:border-amber-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-amber-600 mb-2 uppercase tracking-wide">Unassigned</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                      {assignmentsData.summary.unassigned_count || 0}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">Need assignment</p>
                                  </div>
                                  <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                                    <AlertTriangle className="h-6 w-6 text-white" />
                                  </div>
                                </div>
                              </Card>
                              <Card className="bg-white p-6 border border-amber-100 rounded-2xl hover:shadow-lg transition-all hover:border-amber-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-amber-600 mb-2 uppercase tracking-wide">Assigned</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                      {assignmentsData.summary.assigned_count || 0}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">To realtors</p>
                                  </div>
                                  <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                                    <CheckCircle2 className="h-6 w-6 text-white" />
                                  </div>
                                </div>
                              </Card>
                            </div>
                          )}

                          {/* Unassigned Properties */}
                          {assignmentsData.unassigned_properties && assignmentsData.unassigned_properties.length > 0 && selectedRealtorFilters.has('unassigned') && (
                            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-4 flex-wrap">
                                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                                  <AlertTriangle className="h-6 w-6 text-white" />
                                </div>
                                Unassigned Properties
                                <Badge className="bg-gradient-to-br from-amber-500 to-amber-600 text-white text-lg px-4 py-2 font-bold">
                                  {assignmentsData.unassigned_properties.length}
                                </Badge>
                              </h3>
                              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {Array.isArray(assignmentsData.unassigned_properties) && assignmentsData.unassigned_properties.map((property: any, idx: number) => {
                                  if (!property) return null;
                                  const meta = getPropertyMetadata(property);
                                  return (
                                    <Card 
                                      key={property.id || idx} 
                                      className="bg-white hover:shadow-lg transition-all duration-300 border border-amber-200 rounded-2xl hover:border-amber-300 overflow-hidden cursor-pointer"
                                      onClick={() => handleOpenPropertyDetail(property)}
                                    >
                                      <CardHeader className="pb-4 p-4 sm:p-6">
                                        <div className="flex items-start justify-between gap-3">
                                          <CardTitle className="text-base sm:text-lg font-bold text-gray-900">
                                            {meta.address || `Property #${property.id}`}
                                          </CardTitle>
                                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-semibold text-xs sm:text-sm">Unassigned</Badge>
                                        </div>
                                        {meta.listing_id && (
                                          <div className="flex items-center gap-2 mt-2 sm:mt-3">
                                            <Info className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                                            <p className="text-amber-600 bg-amber-50 px-2 sm:px-3 py-1 rounded-lg border border-amber-200 font-semibold text-xs sm:text-sm">MLS: {meta.listing_id}</p>
                                          </div>
                                        )}
                                      </CardHeader>
                                      <CardContent className="space-y-3 sm:space-y-4 text-sm p-4 sm:p-6 pt-0">
                                        <div className="flex items-center justify-between">
                                          <p className="font-bold text-amber-600 text-lg sm:text-xl">
                                          ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                        </p>
                                          {meta.listing_status && (
                                            <Badge 
                                              variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                                              className={`text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-lg ${
                                                meta.listing_status === 'Available' 
                                                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' 
                                                  : 'bg-gray-200 text-gray-700'
                                              }`}
                                            >
                                              {meta.listing_status}
                                            </Badge>
                                          )}
                                                </div>
                                        <div className="flex flex-wrap gap-2 font-semibold text-xs sm:text-sm">
                                          <span className="border border-amber-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-amber-50 text-amber-700"><Bed className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" /> {meta.bedrooms || 0}</span>
                                          <span className="border border-amber-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-amber-50 text-amber-700"><Bath className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" /> {meta.bathrooms || 0}</span>
                                          {meta.square_feet && <span className="border border-amber-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-amber-50 text-amber-700"><Square className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" /> {meta.square_feet} sqft</span>}
                                            </div>
                                        {meta.property_type && <Badge variant="outline" className="text-xs sm:text-sm font-medium border-amber-300 bg-amber-50 text-amber-700">{meta.property_type}</Badge>}
                                        <p className="text-xs sm:text-sm text-amber-600 font-medium pt-2 border-t border-amber-200">
                                          Click to view details →
                                        </p>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Assigned Properties by Realtor */}
                          {filteredAssignedProperties && (
                            <div className="bg-white rounded-2xl p-6 border border-amber-200">
                              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                                  <Users className="h-6 w-6 text-white" />
                                </div>
                                Assigned Properties by Realtor
                                  {selectedRealtorFilters.size > 0 && selectedRealtorFilters.size < (assignmentsData?.assigned_properties ? Object.keys(assignmentsData.assigned_properties).length + 1 : 1) && (
                                    <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-sm font-semibold">
                                      Filtered ({selectedRealtorFilters.size} {selectedRealtorFilters.size === 1 ? 'filter' : 'filters'})
                                    </Badge>
                                  )}
                              </h3>
                                {Object.values(filteredAssignedProperties).map((realtorGroup: any) => (
                                <Card key={realtorGroup.realtor_id} className="mb-8 bg-white shadow-lg border border-amber-200 rounded-2xl overflow-hidden">
                                  <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-t-2xl border-b border-amber-200 p-6">
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                      <div className="flex-1">
                                        <CardTitle className="text-gray-900 text-xl font-bold flex items-center gap-3">
                                          <div className="p-2 bg-amber-100 rounded-lg">
                                            <User className="h-5 w-5 text-amber-600" />
                                          </div>
                                          {realtorGroup.realtor_name}
                                        </CardTitle>
                                        <p className="text-gray-600 mt-2 flex items-center gap-2">
                                          <Mail className="h-4 w-4 text-amber-600" />
                                          {realtorGroup.realtor_email}
                                        </p>
                                      </div>
                                      <Badge className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-2 border-amber-400 text-lg px-4 py-2 font-bold">
                                        {realtorGroup.count} {realtorGroup.count === 1 ? 'Property' : 'Properties'}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-6">
                                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                      {Array.isArray(realtorGroup.properties) && realtorGroup.properties.map((property: any, idx: number) => {
                                        if (!property) return null;
                                        const meta = getPropertyMetadata(property);
                                        return (
                                          <Card 
                                            key={property.id || idx} 
                                            className="bg-white hover:shadow-lg transition-all duration-300 border border-amber-200 rounded-2xl hover:border-amber-300 overflow-hidden cursor-pointer"
                                            onClick={() => handleOpenPropertyDetail(property)}
                                          >
                                            <CardHeader className="pb-4 p-4 sm:p-6">
                                              <CardTitle className="text-base sm:text-lg font-bold text-gray-900">
                                                {meta.address || `Property #${property.id}`}
                                              </CardTitle>
                                              {meta.listing_id && (
                                                <div className="flex items-center gap-2 mt-2 sm:mt-3">
                                                  <Info className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                                                  <p className="text-amber-600 bg-amber-50 px-2 sm:px-3 py-1 rounded-lg border border-amber-200 font-semibold text-xs sm:text-sm">MLS: {meta.listing_id}</p>
                                                </div>
                                              )}
                                            </CardHeader>
                                            <CardContent className="space-y-3 sm:space-y-4 text-sm p-4 sm:p-6 pt-0">
                                              <div className="flex items-center justify-between">
                                                <p className="font-bold text-amber-600 text-lg sm:text-xl">
                                                  ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                                </p>
                                                {meta.listing_status && (
                                                  <Badge 
                                                    variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                                                    className={`text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-lg ${
                                                      meta.listing_status === 'Available' 
                                                        ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' 
                                                        : 'bg-gray-200 text-gray-700'
                                                    }`}
                                                  >
                                                    {meta.listing_status}
                                                  </Badge>
                                                )}
                                                      </div>
                                              <div className="flex flex-wrap gap-2 font-semibold text-xs sm:text-sm">
                                                <span className="border border-amber-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-amber-50 text-amber-700"><Bed className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" /> {meta.bedrooms || 0}</span>
                                                <span className="border border-amber-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-amber-50 text-amber-700"><Bath className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" /> {meta.bathrooms || 0}</span>
                                                {meta.square_feet && <span className="border border-amber-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-amber-50 text-amber-700"><Square className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" /> {meta.square_feet} sqft</span>}
                                                  </div>
                                              {meta.property_type && <Badge variant="outline" className="text-xs sm:text-sm font-medium border-amber-300 bg-amber-50 text-amber-700">{meta.property_type}</Badge>}
                                              <p className="text-xs sm:text-sm text-amber-600 font-medium pt-2 border-t border-amber-200">
                                                Click to view details →
                                              </p>
                                            </CardContent>
                                          </Card>
                                        );
                                      })}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            )}

            {/* Phone Numbers Management - Property Manager Only */}
            {userType === "property_manager" && (
              <TabsContent value="phone-numbers">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-6"
                >
                  {/* Current Phone Number Display */}
                  <Card className="bg-gradient-to-br from-amber-50 to-white shadow-xl border border-amber-200 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 sm:p-8">
                      <CardTitle className="text-white text-2xl font-bold flex items-center gap-4 mb-2">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Phone className="h-6 w-6 text-white" />
                        </div>
                        Your Current Phone Number
                      </CardTitle>
                      <p className="text-amber-50 text-lg">
                        This is the phone number currently assigned to your account
                      </p>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8">
                      {myNumber && myNumber.trim() !== '' ? (
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                              <CheckCircle2 className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <p className="text-gray-600 text-sm font-medium mb-1">Assigned Number</p>
                              <p className="text-3xl font-bold text-gray-900">{myNumber}</p>
                            </div>
                          </div>
                          <Badge className="bg-gradient-to-br from-green-500 to-green-600 text-white text-lg px-4 py-2 font-semibold">
                            Active
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-4 bg-gray-200 rounded-xl">
                              <Phone className="h-8 w-8 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-gray-600 text-sm font-medium mb-1">No Number Assigned</p>
                              <p className="text-xl font-semibold text-gray-500">Request a phone number to get started</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Request Phone Number Section */}
                  <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-6 sm:p-8">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex-1">
                          <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
                            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                              <Phone className="h-6 w-6 text-white" />
                            </div>
                            Request New Phone Number
                          </CardTitle>
                          <p className="text-gray-600 text-lg">
                            Request a new phone number. A new number will be available in your portal within 24 hours.
                          </p>
                        </div>
                        <Button 
                          onClick={() => setShowRequestPhoneDialog(true)}
                          className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl px-6 py-3"
                        >
                          <Phone className="h-5 w-5 mr-2" />
                          Request
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8">
                      {/* Phone Number Requests List */}
                      {loadingPhoneRequests ? (
                        <div className="text-center py-8">
                          <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium">Loading requests...</p>
                        </div>
                      ) : phoneNumberRequests.length === 0 ? (
                        <div className="text-center py-8 bg-amber-50 rounded-xl border border-amber-200">
                          <Phone className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium text-lg">No phone number requests yet</p>
                          <p className="text-gray-500 text-sm mt-2">Click "Request" to submit your first request</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Requests</h3>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {phoneNumberRequests.map((request: any) => (
                              <Card key={request.request_id} className="bg-white border border-amber-200 rounded-xl hover:shadow-lg transition-all">
                                <CardContent className="p-5">
                                  <div className="flex items-start justify-between mb-3">
                                    <Badge 
                                      className={`text-sm font-semibold px-3 py-1 ${
                                        request.status === 'fulfilled' 
                                          ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                                          : request.status === 'pending'
                                          ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                                          : 'bg-gray-200 text-gray-700'
                                      }`}
                                    >
                                      {request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'NA'}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {request.requested_at ? new Date(request.requested_at).toLocaleDateString() : 'NA'}
                                    </span>
                                  </div>
                                  {request.country_code && (
                                    <p className="text-sm text-gray-600 mb-2">
                                      <span className="font-semibold">Country Code:</span> {request.country_code}
                                    </p>
                                  )}
                                  {request.area_code && (
                                    <p className="text-sm text-gray-600 mb-2">
                                      <span className="font-semibold">Area Code:</span> {request.area_code}
                                    </p>
                                  )}
                                  <p className="text-sm text-gray-600 mb-2">
                                    <span className="font-semibold">Notes:</span> {request.notes || 'NA'}
                                  </p>
                                  {request.fulfilled_at && (
                                    <p className="text-xs text-green-600 font-medium mt-2">
                                      Fulfilled: {new Date(request.fulfilled_at).toLocaleDateString()}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Purchased Phone Numbers & Assignment Section */}
                  <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-6 sm:p-8">
                      <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                          <CheckSquare className="h-6 w-6 text-white" />
                        </div>
                        Manage Phone Numbers
                      </CardTitle>
                      <p className="text-gray-600 text-lg">
                        Assign purchased phone numbers to yourself or your realtors
                      </p>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8">
                      {loadingPurchasedNumbers ? (
                        <div className="text-center py-8">
                          <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium">Loading phone numbers...</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Available Numbers */}
                          {availablePhoneNumbers.length > 0 && (
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="p-2 bg-green-100 rounded-lg">
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                </div>
                                Available for Assignment ({availablePhoneNumbers.length || 0})
                              </h3>
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {availablePhoneNumbers.map((number: any) => (
                                  <Card key={number.purchased_phone_number_id} className="bg-green-50 border-2 border-green-200 rounded-xl hover:shadow-lg transition-all">
                                    <CardContent className="p-5">
                                      <div className="flex items-center justify-between mb-4">
                                        <p className="text-2xl font-bold text-gray-900">{number.phone_number || 'NA'}</p>
                                        <Badge className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                                          Available
                                        </Badge>
                                      </div>
                                      <div className="space-y-3">
                                        <Button
                                          onClick={() => handleAssignPhoneNumber(number.purchased_phone_number_id, "property_manager")}
                                          disabled={assigningPhone}
                                          className="w-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl"
                                        >
                                          {assigningPhone ? (
                                            <>
                                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                              Assigning...
                                            </>
                                          ) : (
                                            <>
                                              <User className="h-4 w-4 mr-2" />
                                              Assign to Me
                                            </>
                                          )}
                                        </Button>
                                        <div className="flex gap-2">
                                          <Select
                                            value={selectedRealtorForPhone[number.purchased_phone_number_id]?.toString() || ""}
                                            onValueChange={(value) => setSelectedRealtorForPhone({
                                              ...selectedRealtorForPhone,
                                              [number.purchased_phone_number_id]: Number(value)
                                            })}
                                          >
                                            <SelectTrigger className="flex-1 bg-white border-amber-300 rounded-xl">
                                              <SelectValue placeholder="Select Realtor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {realtors.map((realtor) => (
                                                <SelectItem key={realtor.id} value={realtor.id.toString()}>
                                                  {realtor.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <Button
                                            onClick={() => {
                                              const realtorId = selectedRealtorForPhone[number.purchased_phone_number_id];
                                              if (realtorId) {
                                                handleAssignPhoneNumber(number.purchased_phone_number_id, "realtor", realtorId);
                                              }
                                            }}
                                            disabled={assigningPhone || !selectedRealtorForPhone[number.purchased_phone_number_id]}
                                            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl"
                                          >
                                            {assigningPhone ? (
                                              <RefreshCw className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <Users className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Assigned Numbers */}
                          {purchasedPhoneNumbers.filter((n: any) => n.status === 'assigned').length > 0 && (
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                </div>
                                Assigned Numbers ({purchasedPhoneNumbers.filter((n: any) => n.status === 'assigned').length || 0})
                              </h3>
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {purchasedPhoneNumbers
                                  .filter((n: any) => n.status === 'assigned')
                                  .map((number: any) => (
                                    <Card key={number.purchased_phone_number_id} className="bg-blue-50 border-2 border-blue-200 rounded-xl">
                                      <CardContent className="p-5">
                                        <div className="flex items-center justify-between mb-3">
                                          <p className="text-2xl font-bold text-gray-900">{number.phone_number || 'NA'}</p>
                                          <Badge className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                            Assigned
                                          </Badge>
                                        </div>
                                        <div className="space-y-3 text-sm">
                                          <div className="space-y-2">
                                            <p className="text-gray-600">
                                              <span className="font-semibold">Assigned to:</span>{' '}
                                              {number.assigned_to_type === 'property_manager' ? (
                                                <span className="font-semibold text-amber-700">Property Manager (You)</span>
                                              ) : number.assigned_to_type === 'realtor' && number.assigned_to_id ? (
                                                <span className="font-semibold text-blue-700">
                                                  {realtors.find(r => r.id === number.assigned_to_id)?.name || `Realtor #${number.assigned_to_id}`}
                                                </span>
                                              ) : (
                                                <span className="text-gray-500">NA</span>
                                              )}
                                            </p>
                                            {number.assigned_to_type === 'realtor' && number.assigned_to_id && (
                                              <p className="text-gray-500 text-xs">
                                                {realtors.find(r => r.id === number.assigned_to_id)?.email || 'NA'}
                                              </p>
                                            )}
                                            <p className="text-xs text-gray-500">
                                              Assigned: {number.assigned_at ? new Date(number.assigned_at).toLocaleDateString() : 'NA'}
                                            </p>
                                          </div>
                                          <Button
                                            onClick={() => handleUnassignPhoneNumber(number.purchased_phone_number_id)}
                                            disabled={assigningPhone}
                                            variant="outline"
                                            className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-semibold rounded-xl"
                                          >
                                            {assigningPhone ? (
                                              <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                Unassigning...
                                              </>
                                            ) : (
                                              <>
                                                <Unlink className="h-4 w-4 mr-2" />
                                                Unassign
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* All Numbers Empty State */}
                          {availablePhoneNumbers.length === 0 && purchasedPhoneNumbers.filter((n: any) => n.status === 'assigned').length === 0 && (
                            <div className="text-center py-12 bg-amber-50 rounded-xl border border-amber-200">
                              <Phone className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                              <p className="text-gray-600 font-medium text-xl mb-2">No phone numbers available</p>
                              <p className="text-gray-500 text-sm">Request a phone number to get started</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            )}

            {/* Properties Grid */}
            <TabsContent value="properties">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-6"
              >
                <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-gray-900 text-xl sm:text-2xl font-bold flex items-center gap-4 mb-2">
                          <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                          Properties
                        </CardTitle>
                        <p className="text-gray-600 text-sm sm:text-lg">
                          {apartments.length > 0 
                            ? `Viewing ${apartments.length} propert${apartments.length !== 1 ? "ies" : "y"}`
                            : "No properties available"}
                        </p>
                      </div>
                      <Button
                        onClick={fetchApartments}
                        disabled={loadingApartments}
                        className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl px-4 sm:px-6 py-2 sm:py-3"
                      >
                        <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${loadingApartments ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
              <motion.div 
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {loadingApartments ? (
                  <div className="col-span-full text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium text-lg">Loading apartments...</p>
                  </div>
                ) : apartments.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium text-lg">No apartments found.</p>
                  </div>
                ) : (
                  Array.isArray(apartments) && apartments.map((apt, idx) => {
                    if (!apt) return null;
                    const meta = getPropertyMetadata(apt);
                    return (
                      <motion.div
                        key={apt.id || idx}
                        variants={itemVariants}
                        whileHover={{ 
                          y: -8,
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card 
                          className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden h-full border border-amber-100 hover:border-amber-200 cursor-pointer"
                          onClick={() => handleOpenPropertyDetail(apt)}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-gray-200 rounded-t-2xl">
                            <motion.img
                              src={meta.image_url || "/images/properties/default.jpg"}
                              alt={`Property at ${meta.address}`}
                              loading="lazy"
                              className="h-full w-full object-cover"
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.5 }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            {meta.listing_status && (
                              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
                                <Badge 
                                  variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                                  className={`text-xs sm:text-sm font-bold border-2 ${
                                    meta.listing_status === 'Available' 
                                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-400' 
                                      : meta.listing_status === 'Sold' || meta.listing_status === 'Rented'
                                      ? 'bg-white/90 text-gray-900 border-gray-300'
                                      : 'bg-white/90 text-gray-900 border-gray-300'
                                  }`}
                                >
                                  {meta.listing_status}
                                </Badge>
                              </div>
                            )}
                          </div>
                          <CardHeader className="pb-4 pt-4 sm:pt-6 px-4 sm:px-6">
                            <CardTitle className="text-gray-900 text-lg sm:text-xl font-bold group-hover:text-amber-700 transition-colors line-clamp-1">
                              {meta.address || `Property #${apt.id}`}
                            </CardTitle>
                            {meta.listing_id && (
                              <div className="flex items-center gap-2 mt-2 sm:mt-3">
                                <Info className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                                <p className="text-amber-600 bg-amber-50 px-2 sm:px-3 py-1 rounded-lg border border-amber-200 font-semibold text-xs sm:text-sm">MLS: {meta.listing_id}</p>
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                            {/* Price */}
                            <div className="flex items-center justify-between border-b border-amber-200 pb-3 sm:pb-4">
                              <div className="text-xl sm:text-2xl font-bold text-amber-600">
                                ${meta.price ? meta.price.toLocaleString() : "N/A"}
                              </div>
                            </div>

                            {/* Basic Specs */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
                              <div className="flex items-center gap-1 sm:gap-2 text-gray-700 bg-amber-50 border border-amber-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                                <Bed className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" /> <span>{meta.bedrooms || 0}</span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2 text-gray-700 bg-amber-50 border border-amber-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                                <Bath className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" /> <span>{meta.bathrooms || 0}</span>
                              </div>
                              {meta.square_feet ? (
                                <div className="flex items-center gap-1 sm:gap-2 text-gray-700 bg-amber-50 border border-amber-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                                  <Square className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" /> <span className="truncate">{meta.square_feet}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 sm:gap-2 text-gray-700 bg-amber-50 border border-amber-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                                  <Square className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" /> <span>-</span>
                                </div>
                              )}
                            </div>

                            {meta.property_type && (
                              <Badge variant="outline" className="text-xs sm:text-sm font-medium border-amber-300 bg-amber-50 text-amber-700 w-full justify-center py-1.5 sm:py-2">
                                {meta.property_type}
                              </Badge>
                            )}

                            {/* Assignment Status (for PM) */}
                            {userType === "property_manager" && (
                              <div className="pt-2 sm:pt-3 border-t border-gray-200">
                                {meta.is_assigned && meta.assigned_to_realtor_name ? (
                                  <div className="flex items-center justify-between text-xs sm:text-sm bg-amber-50 rounded-lg p-2 sm:p-3 border border-amber-200">
                                    <span className="text-amber-700 font-medium">Assigned to:</span>
                                    <Badge className="bg-gradient-to-br from-amber-500 to-amber-600 text-white text-xs sm:text-sm font-semibold">
                                      {meta.assigned_to_realtor_name}
                                    </Badge>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs sm:text-sm font-medium w-full justify-center py-1.5 sm:py-2">
                                    Unassigned
                                  </Badge>
                                )}
                              </div>
                            )}

                            <p className="text-xs sm:text-sm text-amber-600 font-medium pt-2 border-t border-amber-200 text-center">
                              Click to view details →
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </TabsContent>

            {/* Bookings Table */}
            <TabsContent value="bookings">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-8">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        Your Bookings
                      </CardTitle>
                      <p className="text-gray-600 text-lg">
                        All your active and past bookings are listed below.
                      </p>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="p-8">
                    {loadingBookings ? (
                      <div className="text-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium text-lg">Loading bookings...</p>
                      </div>
                    ) : bookings.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium text-lg">No bookings found.</p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                        <Table>
                          <TableHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50">
                            <TableRow className="border-b border-amber-200">
                              <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Booking ID</TableHead>
                              <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Property</TableHead>
                              <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Date</TableHead>
                              <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Time</TableHead>
                              <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bookings.map((b, idx) => (
                              <motion.tr
                                key={b.id || idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                className="hover:bg-amber-50/50 transition-all duration-200 group border-b border-gray-100"
                              >
                                <TableCell className="font-semibold text-gray-900 py-5 px-6 group-hover:text-amber-700 transition-colors">
                                  {b.id}
                                </TableCell>
                                <TableCell className="text-gray-600 py-5 px-6">{b.property || b.property_name || b.address}</TableCell>
                                <TableCell className="text-gray-600 py-5 px-6">{b.date}</TableCell>
                                <TableCell className="text-gray-600 py-5 px-6">{b.time}</TableCell>
                                <TableCell className="py-5 px-6">
                                  <Badge
                                    variant={b.status === "Confirmed" ? "default" : "secondary"}
                                    className={`font-bold ${
                                      b.status === "Confirmed"
                                        ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                                        : "bg-gray-200 text-gray-700"
                                    }`}
                                  >
                                    {b.status}
                                  </Badge>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Conversations */}
            <TabsContent value="conversations">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-8">
                    <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
                      <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                        <Music className="h-6 w-6 text-white" />
                      </div>
                      Conversations (Call Recordings)
                    </CardTitle>
                    <p className="text-gray-600 text-lg">
                      Listen to your recorded calls with leads and clients.
                    </p>
                  </CardHeader>
                  <CardContent className="p-8">
                    {loadingRecordings ? (
                      <div className="text-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium text-lg">Loading recordings...</p>
                      </div>
                    ) : recordings.length === 0 ? (
                      <div className="text-center py-12">
                        <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium text-lg">No recordings available.</p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                        <Table>
                          <TableHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50">
                            <TableRow className="border-b border-amber-200">
                              <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Call</TableHead>
                              <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Recording</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recordings.map((rec, idx) => (
                              <motion.tr
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                className="hover:bg-amber-50/50 transition-all duration-200 group border-b border-gray-100"
                              >
                                <TableCell className="font-semibold text-gray-900 py-5 px-6 group-hover:text-amber-700 transition-colors">
                                  Call #{idx + 1}
                                </TableCell>
                                <TableCell className="py-5 px-6">
                                  <audio controls className="w-full max-w-md">
                                    <source src={rec.url} type="audio/mpeg" />
                                    Your browser does not support the audio element.
                                  </audio>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Chats */}
            <TabsContent value="chats">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-8">
                    <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
                      <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                        <Phone className="h-6 w-6 text-white" />
                      </div>
                      Customer Chats
                    </CardTitle>
                    <p className="text-gray-600 text-lg">
                      View conversations with your clients in a chat-style layout.
                    </p>
                  </CardHeader>
                  <CardContent className="p-8">
                    {loadingChats ? (
                      <div className="text-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium text-lg">Loading chats...</p>
                      </div>
                    ) : Object.keys(chats).length === 0 ? (
                      <div className="text-center py-12">
                        <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium text-lg">No chats available.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-8 overflow-x-hidden">
                        {Object.entries(chats).map(([customer, messages]: any, idx) => (
                          <div
                            key={idx}
                            className="border border-amber-200 rounded-2xl p-6 bg-white shadow-lg w-full max-w-4xl mx-auto"
                          >
                            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center border-b border-amber-200 pb-4">
                              Chat with {customer}
                            </h3>
                            <div className="h-96 overflow-y-auto space-y-4 pr-4">
                              {messages.map((msg: any, i: number) => (
                                <div
                                  key={i}
                                  className={`flex ${
                                    msg.sender === "realtor"
                                      ? "justify-end"
                                      : "justify-start"
                                  }`}
                                >
                                  <div
                                    className={`px-6 py-4 rounded-2xl max-w-[70%] text-lg shadow-md border ${
                                      msg.sender === "realtor"
                                        ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-400 rounded-br-none"
                                        : "bg-white text-gray-900 border-amber-200 rounded-bl-none"
                                    }`}
                                  >
                                    <p className="font-medium">{msg.message}</p>
                                    <div className="text-sm text-amber-600/80 mt-2 font-semibold">
                                      {msg.timestamp
                                        ? new Date(msg.timestamp).toLocaleString()
                                        : ""}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </section>

      {/* Property Detail Modal */}
      <Dialog open={showPropertyDetailModal} onOpenChange={setShowPropertyDetailModal}>
        <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-6xl max-h-[95vh] p-0 overflow-hidden flex flex-col [&>button]:h-10 [&>button]:w-10 [&>button]:right-3 [&>button]:top-3 [&>button]:z-50 [&>button]:bg-white [&>button]:rounded-full [&>button]:shadow-lg [&>button]:border [&>button]:border-gray-300 [&>button]:hover:bg-amber-50 [&>button]:hover:border-amber-400 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:p-0 [&>button>svg]:h-5 [&>button>svg]:w-5 [&>button>svg]:text-gray-700 [&>button>svg]:hover:text-amber-600">
          {selectedPropertyForDetail && (() => {
            const meta = getPropertyMetadata(selectedPropertyForDetail);
            return (
              <div className="flex flex-col lg:flex-row h-full max-h-[95vh] overflow-hidden">
                {/* Image Section */}
                <div className="w-full lg:w-1/2 bg-gray-100 rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none overflow-hidden order-2 lg:order-1 flex-shrink-0">
                  <div className="relative aspect-[4/3] lg:h-full lg:min-h-[600px] max-h-[400px] lg:max-h-none flex items-center justify-center bg-gray-100">
                    <img
                      src={meta.image_url || "/images/properties/default.jpg"}
                      alt={meta.address || `Property #${selectedPropertyForDetail.id}`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    {meta.listing_status && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge 
                          variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                          className={`text-sm sm:text-base font-bold border-2 ${
                            meta.listing_status === 'Available' 
                              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-400' 
                              : 'bg-white/90 text-gray-900 border-gray-300'
                          }`}
                        >
                          {meta.listing_status}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-y-auto overflow-x-hidden order-1 lg:order-2 flex-1 min-h-0">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-gray-200">
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                        {meta.address || `Property #${selectedPropertyForDetail.id}`}
                      </DialogTitle>
                      {meta.listing_id && (
                        <p className="text-xs sm:text-sm lg:text-base text-amber-600 font-semibold">MLS: {meta.listing_id}</p>
                      )}
                    </div>
                    {userType === "property_manager" && (
                      <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                        <Button
                          onClick={() => {
                            handleOpenPropertyUpdate(selectedPropertyForDetail);
                            setShowPropertyDetailModal(false);
                          }}
                          variant="outline"
                          size="sm"
                          className="bg-white hover:bg-amber-50 text-amber-600 border-amber-300 hover:border-amber-400 font-medium transition-all rounded-xl flex-1 sm:flex-none"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          <span className="text-xs sm:text-sm">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white hover:bg-red-50 text-red-600 border-red-300 hover:border-red-400 font-medium transition-all rounded-xl flex-1 sm:flex-none"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              <span className="text-xs sm:text-sm">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl">
                            <AlertDialogHeader className="p-6">
                              <AlertDialogTitle className="text-gray-900 font-bold text-2xl">Delete Property?</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600 text-lg mt-4">
                                Are you sure you want to delete <span className="font-semibold text-amber-600">{meta.address || `Property #${selectedPropertyForDetail.id}`}</span>? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="p-6 pt-0">
                              <AlertDialogCancel className="border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl px-6 py-3">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleDeleteProperty}
                                disabled={deletingProperty}
                                className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl px-6 py-3"
                              >
                                {deletingProperty ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Property
                                  </>
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 sm:p-6 border border-amber-200">
                    <p className="text-3xl sm:text-4xl font-bold text-amber-600 mb-2">
                      ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                    </p>
                    {meta.property_type && (
                      <Badge variant="outline" className="text-sm font-medium border-amber-300 bg-white text-amber-700 mt-2">
                        {meta.property_type}
                      </Badge>
                    )}
                  </div>

                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Bed className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                        <span className="text-xs sm:text-sm text-gray-600 font-medium">Bedrooms</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">{meta.bedrooms || 0}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Bath className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                        <span className="text-xs sm:text-sm text-gray-600 font-medium">Bathrooms</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">{meta.bathrooms || 0}</p>
                    </div>
                    {meta.square_feet && (
                      <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Square className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                          <span className="text-xs sm:text-sm text-gray-600 font-medium">Square Feet</span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-gray-900">{meta.square_feet.toLocaleString()}</p>
                      </div>
                    )}
                    {meta.lot_size_sqft && (
                      <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Ruler className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                          <span className="text-xs sm:text-sm text-gray-600 font-medium">Lot Size</span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-gray-900">{meta.lot_size_sqft.toLocaleString()} sqft</p>
                      </div>
                    )}
                    {meta.year_built && (
                      <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                        <div className="flex items-center gap-2 mb-1">
                          <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                          <span className="text-xs sm:text-sm text-gray-600 font-medium">Year Built</span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-gray-900">{meta.year_built}</p>
                      </div>
                    )}
                    {meta.days_on_market !== undefined && (
                      <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                          <span className="text-xs sm:text-sm text-gray-600 font-medium">Days on Market</span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-gray-900">{meta.days_on_market}</p>
                      </div>
                    )}
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-4">
                    {meta.listing_date && (
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <span className="text-sm sm:text-base text-gray-600 font-medium">Listing Date:</span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">{new Date(meta.listing_date).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Features */}
                    {meta.features && meta.features.length > 0 && (
                      <div className="bg-amber-50 rounded-xl p-4 sm:p-6 border border-amber-200">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Features</h3>
                        <div className="flex flex-wrap gap-2">
                          {meta.features.map((feature: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs sm:text-sm font-medium border-amber-300 bg-white text-amber-700 px-3 py-1.5">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {meta.description && (
                      <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Description</h3>
                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{meta.description}</p>
                      </div>
                    )}

                    {/* Assignment Status (for PM) */}
                    {userType === "property_manager" && (
                      <div className="bg-amber-50 rounded-xl p-4 sm:p-6 border border-amber-200">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Assignment Status</h3>
                        {meta.is_assigned && meta.assigned_to_realtor_name ? (
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-amber-600" />
                            <div>
                              <p className="text-sm text-gray-600 font-medium">Assigned to:</p>
                              <p className="text-base sm:text-lg font-bold text-amber-700">{meta.assigned_to_realtor_name}</p>
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-white text-amber-700 border-amber-300 text-sm font-medium px-4 py-2">
                            Unassigned
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Property Update Modal */}
      <Dialog open={showPropertyUpdateModal} onOpenChange={setShowPropertyUpdateModal}>
        <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-4 border-b border-gray-200">
            <DialogTitle className="text-gray-900 font-bold text-2xl flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                <Edit2 className="h-5 w-5 text-white" />
              </div>
              Update Property
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2 text-base">
              Update the property details below. All fields are optional.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Address</label>
                <input
                  type="text"
                  value={propertyUpdateForm.address || ""}
                  onChange={(e) => setPropertyUpdateForm({...propertyUpdateForm, address: e.target.value})}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Price</label>
                <input
                  type="number"
                  value={propertyUpdateForm.price || ""}
                  onChange={(e) => setPropertyUpdateForm({...propertyUpdateForm, price: e.target.value})}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                  placeholder="2500"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Bedrooms</label>
                <input
                  type="number"
                  value={propertyUpdateForm.bedrooms || ""}
                  onChange={(e) => setPropertyUpdateForm({...propertyUpdateForm, bedrooms: e.target.value})}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                  placeholder="3"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Bathrooms</label>
                <input
                  type="number"
                  step="0.5"
                  value={propertyUpdateForm.bathrooms || ""}
                  onChange={(e) => setPropertyUpdateForm({...propertyUpdateForm, bathrooms: e.target.value})}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                  placeholder="2.5"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Square Feet</label>
                <input
                  type="number"
                  value={propertyUpdateForm.square_feet || ""}
                  onChange={(e) => setPropertyUpdateForm({...propertyUpdateForm, square_feet: e.target.value})}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                  placeholder="1200"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Lot Size (sqft)</label>
                <input
                  type="number"
                  value={propertyUpdateForm.lot_size_sqft || ""}
                  onChange={(e) => setPropertyUpdateForm({...propertyUpdateForm, lot_size_sqft: e.target.value})}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Year Built</label>
                <input
                  type="number"
                  value={propertyUpdateForm.year_built || ""}
                  onChange={(e) => setPropertyUpdateForm({...propertyUpdateForm, year_built: e.target.value})}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                  placeholder="2020"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Property Type</label>
                <input
                  type="text"
                  value={propertyUpdateForm.property_type || ""}
                  onChange={(e) => setPropertyUpdateForm({...propertyUpdateForm, property_type: e.target.value})}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                  placeholder="Apartment"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Listing Status</label>
                <Select 
                  value={propertyUpdateForm.listing_status || "Available"} 
                  onValueChange={(value) => setPropertyUpdateForm({...propertyUpdateForm, listing_status: value})}
                >
                  <SelectTrigger className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl bg-white text-gray-900 text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="For Sale">For Sale</SelectItem>
                    <SelectItem value="For Rent">For Rent</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                    <SelectItem value="Rented">Rented</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Days on Market</label>
                <input
                  type="number"
                  value={propertyUpdateForm.days_on_market || ""}
                  onChange={(e) => setPropertyUpdateForm({...propertyUpdateForm, days_on_market: e.target.value})}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Listing Date</label>
                <input
                  type="date"
                  value={propertyUpdateForm.listing_date || ""}
                  onChange={(e) => setPropertyUpdateForm({...propertyUpdateForm, listing_date: e.target.value})}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Listing ID (MLS)</label>
                <input
                  type="text"
                  value={propertyUpdateForm.listing_id || ""}
                  onChange={(e) => setPropertyUpdateForm({...propertyUpdateForm, listing_id: e.target.value})}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                  placeholder="MLS000123"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Image URL</label>
                <input
                  type="url"
                  value={propertyUpdateForm.image_url || ""}
                  onChange={(e) => setPropertyUpdateForm({...propertyUpdateForm, image_url: e.target.value})}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Features (comma-separated)</label>
                <input
                  type="text"
                  value={propertyUpdateForm.features || ""}
                  onChange={(e) => setPropertyUpdateForm({...propertyUpdateForm, features: e.target.value})}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                  placeholder="Pool, Gym, Parking, Elevator"
                />
                <p className="text-xs text-gray-500 mt-2">Separate multiple features with commas</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Description</label>
                <textarea
                  value={propertyUpdateForm.description || ""}
                  onChange={(e) => setPropertyUpdateForm({...propertyUpdateForm, description: e.target.value})}
                  rows={4}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base resize-none"
                  placeholder="Beautiful property description..."
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 border-t border-gray-200">
            <Button 
              onClick={() => {
                setShowPropertyUpdateModal(false);
                setPropertyUpdateForm({});
              }}
              variant="outline"
              className="border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl px-6 py-3"
              disabled={updatingProperty}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProperty}
              disabled={updatingProperty}
              className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl px-6 py-3"
            >
              {updatingProperty ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Update Property
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Phone Number Dialog */}
      <Dialog open={showRequestPhoneDialog} onOpenChange={setShowRequestPhoneDialog}>
        <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-6 sm:p-8 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-white flex-shrink-0">
            <DialogTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                <Phone className="h-6 w-6 text-white" />
              </div>
              Request New Phone Number
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2 text-base">
              Submit a request for a new phone number. A new number will be available in your portal within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Country Code (Optional)
                </label>
                <input
                  type="text"
                  value={phoneRequestForm.country_code}
                  onChange={(e) => setPhoneRequestForm({...phoneRequestForm, country_code: e.target.value})}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                  placeholder="e.g., +1, +44, +61"
                  maxLength={5}
                />
                <p className="text-xs text-gray-500 mt-2">Enter country code with or without + (e.g., +1, 1, +44)</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Preferred Area Code (Optional)
                </label>
                <input
                  type="text"
                  value={phoneRequestForm.area_code}
                  onChange={(e) => setPhoneRequestForm({...phoneRequestForm, area_code: e.target.value})}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                  placeholder="e.g., 412, 415, 206"
                  maxLength={3}
                  pattern="[0-9]{3}"
                />
                <p className="text-xs text-gray-500 mt-2">Enter a 3-digit area code if you have a preference</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">
                Additional Notes (Optional)
              </label>
              <textarea
                value={phoneRequestForm.notes}
                onChange={(e) => setPhoneRequestForm({...phoneRequestForm, notes: e.target.value})}
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all min-h-[100px] resize-y"
                placeholder="Any additional information about your phone number request..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-2">{phoneRequestForm.notes.length}/500 characters</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold text-gray-900 mb-1">What happens next?</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Your request will be submitted to the tech team</li>
                    <li>A new phone number will be purchased and configured</li>
                    <li>The number will appear in your portal within 24 hours</li>
                    <li>You can then assign it to yourself or your realtors</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 sm:p-8 pt-0 border-t border-gray-200 flex-shrink-0">
            <Button 
              onClick={() => {
                setShowRequestPhoneDialog(false);
                setPhoneRequestForm({ country_code: "", area_code: "", notes: "" });
              }}
              variant="outline"
              className="border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl px-6 py-3"
              disabled={requestingPhone}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleRequestPhoneNumber}
              disabled={requestingPhone}
              className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl px-6 py-3"
            >
              {requestingPhone ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Dashboard;