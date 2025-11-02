import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, MapPin, Bed, Bath, Ruler, TrendingUp, Calendar, Eye, Music, Phone, Users, UserPlus, Settings, Building2, CheckSquare, Square, CalendarDays, User, ListChecks, RefreshCw, Mail, Calendar as CalendarIcon, Info, X, AlertTriangle, Edit2, Trash2, CheckCircle2, Star, Filter, Search, Download, Upload, MoreHorizontal } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
const API_BASE = "https://leasing-copilot-mvp.onrender.com";

// Helper function to parse and extract metadata from property
const getPropertyMetadata = (property: any) => {
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [animateCards, setAnimateCards] = useState(false);
  const [loading, setLoading] = useState(false)
  const [myNumber, setMyNumber] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<{ url: string }[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [apartments, setApartments] = useState<any[]>([]);
  const [loadingApartments, setLoadingApartments] = useState(false);
  const [chats, setChats] = useState<any>({});
  const [loadingChats, setLoadingChats] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [realtors, setRealtors] = useState<any[]>([]);
  const [loadingRealtors, setLoadingRealtors] = useState(false);
  const [showAddRealtor, setShowAddRealtor] = useState(false);
  const [newRealtor, setNewRealtor] = useState({ name: "", email: "", password: "" });
  // Property assignment state
  const [availablePropertiesForAssignment, setAvailablePropertiesForAssignment] = useState<any[]>([]);
  const [loadingAssignmentProperties, setLoadingAssignmentProperties] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [selectedRealtor, setSelectedRealtor] = useState<number | null>(null);
  const [assigningProperties, setAssigningProperties] = useState(false);
  // Assignments view state
  const [assignmentsData, setAssignmentsData] = useState<any>(null);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  // Expanded features state for property listings
  const [expandedFeatures, setExpandedFeatures] = useState<{ [key: number]: boolean }>({});
  // User information state
  const [userName, setUserName] = useState<string | null>(null);
  const [userGender, setUserGender] = useState<string | null>(null);

  // Fetch current user information
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
      
      if (storedUserName && storedUserName.trim() !== "") {
        console.log("Found user name in localStorage:", storedUserName);
        setUserName(storedUserName);
        if (storedUserGender) {
          setUserGender(storedUserGender);
        }
        return;
      } else {
        console.log("No user name in localStorage, attempting to fetch from API");
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
          console.log("Could not find user name in standard endpoints, trying alternative methods");
          
          // For property managers, we might need to get it from a different endpoint
          // Or check if we can get email and extract username from it
          const storedEmail = localStorage.getItem("user_email");
          if (storedEmail && storedEmail.includes('@')) {
            const emailName = storedEmail.split('@')[0];
            // Capitalize first letter
            const formattedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
            console.log("Using email-derived name:", formattedName);
            setUserName(formattedName);
            localStorage.setItem("user_name", formattedName);
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

    // Check localStorage first and set immediately for faster display
    const storedUserName = localStorage.getItem("user_name");
    if (storedUserName && storedUserName.trim() !== "") {
      console.log("Setting userName from localStorage immediately:", storedUserName);
      setUserName(storedUserName);
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

    // If property manager, fetch realtors
    if (storedUserType === "property_manager") {
      fetchRealtors();
      fetchPropertiesForAssignment();
      fetchAssignments();
    }
  }, []);

  // All your existing API functions remain exactly the same
  const fetchNumber = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/my-number`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch number");

      const data = await res.json();
      console.log("Fetched number:", data);
      setMyNumber(data.twilio_number || null);
    } catch (err: any) {
      console.error(err);
      toast.error("Could not load your number");
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

  const handleSelectAll = () => {
    if (selectedProperties.length === availablePropertiesForAssignment.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(availablePropertiesForAssignment.map((p: any) => p.id));
    }
  };

  const handleBulkSelect = (count: number, fromStart: boolean = true) => {
    const sorted = [...availablePropertiesForAssignment];
    const toSelect = fromStart 
      ? sorted.slice(0, count).map((p: any) => p.id)
      : sorted.slice(-count).map((p: any) => p.id);
    
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
    } catch (err) {
      console.error(err);
      toast.error("Could not load assignments");
    } finally {
      setLoadingAssignments(false);
    }
  };

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

  const handleRemoveAgent = async (propertyId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      const res = await fetch(`${API_BASE}/properties/${propertyId}/agent`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ agent: null }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Failed to remove agent");
      }

      const data = await res.json();
      toast.success(data.message || "Agent removed successfully");
      
      // Refresh data
      fetchAssignments();
      fetchApartments();
    } catch (err: any) {
      console.error("Remove agent failed:", err);
      toast.error(err.message || "Failed to remove agent");
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
                {userType === "property_manager" && (
                  <motion.h1 
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-amber-600 to-amber-800 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    Property Manager Dashboard
                  </motion.h1>
                )}
                <motion.div 
                  className="mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  {userName 
                    ? (() => {
                        // Extract first name only
                        const firstName = userName.split(' ')[0];
                        return (
                          <>
                            <p className="text-amber-600 text-2xl sm:text-3xl font-extrabold mb-1">
                              Welcome back <span className="text-amber-800">{firstName}</span>!
                            </p>
                            <p className="text-amber-600/80 text-sm">
                              {userType === "property_manager" 
                                ? "Manage your properties and team from here."
                                : "View your assigned properties and bookings."}
                            </p>
                          </>
                        );
                      })()
                    : (
                      <>
                        <p className="text-amber-600 text-2xl sm:text-3xl font-extrabold mb-1">
                          Welcome back!
                        </p>
                        <p className="text-amber-600/80 text-sm">
                          {userType === "property_manager" 
                            ? "Manage your properties and team from here."
                            : "View your assigned properties and bookings."}
                        </p>
                      </>
                    )
                  }
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
              <Button 
                onClick={handleBuyNumber} 
                disabled={loading} 
                className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl"
                size="sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Get Phone Number
                  </>
                )}
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
          <Tabs defaultValue={userType === "property_manager" ? "realtors" : "properties"} className="w-full">
            {/* Enhanced Tabs Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mb-8"
            >
              <TabsList className="bg-white border border-amber-200 rounded-2xl p-2 shadow-lg inline-flex min-w-full overflow-x-auto overflow-y-hidden">
                {userType === "property_manager" && (
                  <>
                    <TabsTrigger 
                      value="realtors" 
                      className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-4 py-3 font-semibold transition-all text-sm"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Realtors
                    </TabsTrigger>
                    <TabsTrigger 
                      value="assign-properties" 
                      className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-4 py-3 font-semibold transition-all text-sm"
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Assign Properties
                    </TabsTrigger>
                    <TabsTrigger 
                      value="view-assignments" 
                      className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-4 py-3 font-semibold transition-all text-sm"
                    >
                      <ListChecks className="h-4 w-4 mr-2" />
                      View Assignments
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
                                <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Status</TableHead>
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
                                  <TableCell className="py-5 px-6">
                                    <Badge
                                      variant={realtor.status === "active" ? "default" : "secondary"}
                                      className={
                                        realtor.status === "active"
                                          ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white font-semibold px-3 py-1 rounded-lg"
                                          : "bg-gray-200 text-gray-700 font-semibold px-3 py-1 rounded-lg"
                                      }
                                    >
                                      {realtor.status || "Active"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-5 px-6">
                                    <div className="flex gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={handleSettingsClick}
                                        className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-amber-300 font-medium transition-all rounded-lg"
                                      >
                                        <Settings className="h-4 w-4 mr-2" />
                                        Settings
                                      </Button>
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
                            <div className="flex gap-3 flex-wrap">
                              <Button 
                                onClick={handleSelectAll}
                                variant="outline"
                                size="lg"
                                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-amber-300 font-medium transition-all rounded-xl"
                              >
                                {selectedProperties.length === availablePropertiesForAssignment.length ? 'Deselect All' : 'Select All'}
                              </Button>
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
                        ) : availablePropertiesForAssignment.length === 0 ? (
                          <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl">
                            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium text-lg">
                              No properties available to assign. All properties may already be assigned to realtors.
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {availablePropertiesForAssignment.map((property, idx) => {
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
                                    className={`cursor-pointer transition-all duration-300 rounded-2xl bg-white border-2 overflow-hidden ${
                                      selectedProperties.includes(property.id) 
                                        ? 'border-amber-500 bg-amber-50 shadow-xl scale-105' 
                                        : 'border-gray-200 hover:border-amber-300 hover:shadow-lg'
                                    }`}
                                    onClick={() => handlePropertyToggle(property.id)}
                                  >
                                    <div className="flex items-start p-5 gap-4">
                                      <div className="flex-shrink-0 mt-1">
                                        <input
                                          type="checkbox"
                                          checked={selectedProperties.includes(property.id)}
                                          onChange={() => handlePropertyToggle(property.id)}
                                          className="h-6 w-6 cursor-pointer accent-amber-500 rounded-lg border-gray-300"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0 space-y-4">
                                        <div>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <h4 className="font-bold text-lg text-gray-900 truncate mb-2">
                                                  {meta.address || `Property #${property.id}`}
                                                </h4>
                                              </TooltipTrigger>
                                              <TooltipContent className="max-w-md">
                                                <p className="font-medium">{meta.address || `Property #${property.id}`}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                          {meta.listing_id && (
                                            <div className="flex items-center gap-2 mt-3">
                                              <Info className="h-4 w-4 text-amber-600" />
                                              <p className="text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 font-semibold text-sm">MLS: {meta.listing_id}</p>
                                            </div>
                                          )}
                                        </div>
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between">
                                            <p className="text-2xl font-bold text-gray-900">
                                              ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                            </p>
                                            {meta.listing_status && (
                                              <Badge 
                                                variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                                                className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                                                  meta.listing_status === 'Available' 
                                                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' 
                                                    : 'bg-gray-200 text-gray-700'
                                                }`}
                                              >
                                                {meta.listing_status}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex flex-wrap gap-2 text-sm font-medium">
                                            <span className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-gray-700">
                                              <Bed className="h-4 w-4 text-amber-600" /> {meta.bedrooms || 0} Beds
                                            </span>
                                            <span className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-gray-700">
                                              <Bath className="h-4 w-4 text-amber-600" /> {meta.bathrooms || 0} Baths
                                            </span>
                                            {meta.square_feet && (
                                              <span className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-gray-700">
                                                <Square className="h-4 w-4 text-amber-600" /> {meta.square_feet} sqft
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {meta.property_type && (
                                              <Badge variant="outline" className="text-sm font-medium border-amber-300 bg-amber-50 text-amber-700">
                                                {meta.property_type}
                                              </Badge>
                                            )}
                                          </div>
                                          {meta.features && meta.features.length > 0 && (
                                            <div className="pt-3 border-t border-gray-200">
                                              <p className="text-sm font-semibold text-gray-600 mb-2">Key Features:</p>
                                              <div className="flex flex-wrap gap-2">
                                                {meta.features.slice(0, 3).map((feature: string, fIdx: number) => (
                                                  <Badge key={fIdx} variant="outline" className="text-xs bg-amber-50 border-amber-300 text-amber-700 font-medium">
                                                    {feature}
                                                  </Badge>
                                                ))}
                                                {meta.features.length > 3 && (
                                                  <span className="text-xs text-gray-500 font-medium">+{meta.features.length - 3} more</span>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                          {meta.agent && (
                                            <div className="pt-3 border-t border-gray-200">
                                              <p className="text-sm font-semibold text-gray-600 mb-2">Agent:</p>
                                              <p className="text-sm font-semibold text-gray-900 truncate">
                                                {meta.agent.name}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                </motion.div>
                              );
                            })}
                          </div>
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
                          {assignmentsData.unassigned_properties && assignmentsData.unassigned_properties.length > 0 && (
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
                                {assignmentsData.unassigned_properties.map((property: any, idx: number) => {
                                  const meta = getPropertyMetadata(property);
                                  return (
                                    <Card key={property.id || idx} className="bg-white hover:shadow-lg transition-all duration-300 border border-amber-200 rounded-2xl hover:border-amber-300 overflow-hidden">
                                      <CardHeader className="pb-4 p-6">
                                        <div className="flex items-start justify-between gap-3">
                                          <CardTitle className="text-lg font-bold text-gray-900">
                                            {meta.address || `Property #${property.id}`}
                                          </CardTitle>
                                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-semibold">Unassigned</Badge>
                                        </div>
                                        {meta.listing_id && (
                                          <div className="flex items-center gap-2 mt-3">
                                            <Info className="h-4 w-4 text-amber-600" />
                                            <p className="text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 font-semibold text-sm">MLS: {meta.listing_id}</p>
                                          </div>
                                        )}
                                      </CardHeader>
                                      <CardContent className="space-y-4 text-sm p-6 pt-0">
                                        <p className="font-bold text-amber-600 text-xl">
                                          ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                        </p>
                                        <div className="flex flex-wrap gap-2 font-semibold">
                                          <span className="border border-amber-300 px-3 py-2 rounded-lg bg-amber-50 text-amber-700"><Bed className="h-4 w-4 inline mr-1" /> {meta.bedrooms || 0}</span>
                                          <span className="border border-amber-300 px-3 py-2 rounded-lg bg-amber-50 text-amber-700"><Bath className="h-4 w-4 inline mr-1" /> {meta.bathrooms || 0}</span>
                                          {meta.square_feet && <span className="border border-amber-300 px-3 py-2 rounded-lg bg-amber-50 text-amber-700"><Square className="h-4 w-4 inline mr-1" /> {meta.square_feet} sqft</span>}
                                        </div>
                                        {meta.property_type && <Badge variant="outline" className="text-sm font-medium border-amber-300 bg-amber-50 text-amber-700">{meta.property_type}</Badge>}
                                        
                                        {/* Status Update */}
                                        <div className="flex items-center gap-3 pt-4 border-t border-amber-200">
                                          <span className="text-sm font-semibold text-gray-700">Status:</span>
                                          <Select 
                                            value={meta.listing_status || 'Available'} 
                                            onValueChange={(value) => handleUpdatePropertyStatus(property.id, value)}
                                          >
                                            <SelectTrigger className="h-9 text-sm flex-1 bg-white border-amber-300 hover:border-amber-400 focus:ring-amber-500">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border border-amber-300">
                                              <SelectItem value="Available" className="text-gray-700 focus:bg-amber-50 focus:text-amber-700">Available</SelectItem>
                                              <SelectItem value="For Sale" className="text-gray-700 focus:bg-amber-50 focus:text-amber-700">For Sale</SelectItem>
                                              <SelectItem value="For Rent" className="text-gray-700 focus:bg-amber-50 focus:text-amber-700">For Rent</SelectItem>
                                              <SelectItem value="Sold" className="text-gray-700 focus:bg-amber-50 focus:text-amber-700">Sold</SelectItem>
                                              <SelectItem value="Rented" className="text-gray-700 focus:bg-amber-50 focus:text-amber-700">Rented</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {/* Agent Section with Remove */}
                                        {meta.agent && (
                                          <div className="pt-4 border-t border-amber-200 space-y-3 bg-amber-50 rounded-lg p-4 border border-amber-200">
                                            <div className="flex items-start justify-between mb-2">
                                              <p className="text-sm font-semibold text-amber-700 uppercase tracking-wider">Agent:</p>
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 border border-red-300 hover:border-red-400 rounded-lg">
                                                    <X className="h-4 w-4" />
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl">
                                                  <AlertDialogHeader className="p-6">
                                                    <AlertDialogTitle className="text-gray-900 font-bold text-2xl">Remove Agent?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-gray-600 text-lg">
                                                      Are you sure you want to remove <span className="font-semibold text-amber-600">{meta.agent.name}</span> from this property? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter className="p-6 pt-0">
                                                    <AlertDialogCancel className="border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl px-6 py-3">
                                                      Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction 
                                                      onClick={() => handleRemoveAgent(property.id)}
                                                      className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl px-6 py-3"
                                                    >
                                                      Remove Agent
                                                    </AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                              <p className="font-bold text-gray-900">{meta.agent.name}</p>
                                              {meta.agent.email && (
                                                <div className="flex items-center gap-2 text-gray-600 font-medium">
                                                  <Mail className="h-4 w-4 text-amber-600" />
                                                  <span className="truncate">{meta.agent.email}</span>
                                                </div>
                                              )}
                                              {meta.agent.phone && (
                                                <div className="flex items-center gap-2 text-gray-600 font-medium">
                                                  <Phone className="h-4 w-4 text-amber-600" />
                                                  <span>{meta.agent.phone}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {meta.features && meta.features.length > 0 && (
                                          <div className="flex flex-wrap gap-2 pt-4 border-t border-amber-200">
                                            {meta.features.slice(0, 2).map((f: string, i: number) => (
                                              <Badge key={i} variant="outline" className="text-xs font-medium border-amber-300 bg-amber-50 text-amber-700">{f}</Badge>
                                            ))}
                                            {meta.features.length > 2 && <span className="text-xs text-gray-500 font-medium">+{meta.features.length - 2}</span>}
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Assigned Properties by Realtor */}
                          {assignmentsData.assigned_properties && Object.keys(assignmentsData.assigned_properties).length > 0 && (
                            <div className="bg-white rounded-2xl p-6 border border-amber-200">
                              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                                  <Users className="h-6 w-6 text-white" />
                                </div>
                                Assigned Properties by Realtor
                              </h3>
                              {Object.values(assignmentsData.assigned_properties).map((realtorGroup: any) => (
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
                                      {realtorGroup.properties.map((property: any, idx: number) => {
                                        const meta = getPropertyMetadata(property);
                                        return (
                                          <Card key={property.id || idx} className="bg-white hover:shadow-lg transition-all duration-300 border border-amber-200 rounded-2xl hover:border-amber-300 overflow-hidden">
                                            <CardHeader className="pb-4 p-6">
                                              <CardTitle className="text-lg font-bold text-gray-900">
                                                {meta.address || `Property #${property.id}`}
                                              </CardTitle>
                                              {meta.listing_id && (
                                                <div className="flex items-center gap-2 mt-3">
                                                  <Info className="h-4 w-4 text-amber-600" />
                                                  <p className="text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 font-semibold text-sm">MLS: {meta.listing_id}</p>
                                                </div>
                                              )}
                                            </CardHeader>
                                            <CardContent className="space-y-4 text-sm p-6 pt-0">
                                              <div className="flex items-center justify-between gap-3">
                                                <p className="font-bold text-amber-600 text-xl">
                                                  ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                                </p>
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-9 px-3 bg-red-50 hover:bg-red-100 text-red-600 border-red-300 hover:border-red-400 font-semibold transition-all rounded-lg">
                                                      <Trash2 className="h-4 w-4 mr-1" />
                                                      Unassign
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl">
                                                    <AlertDialogHeader className="p-6">
                                                      <AlertDialogTitle className="text-gray-900 font-bold text-2xl">Unassign Property?</AlertDialogTitle>
                                                      <AlertDialogDescription className="text-gray-600 text-lg">
                                                        Are you sure you want to unassign this property from <span className="font-semibold text-amber-600">{realtorGroup.realtor_name}</span>? The property will become available for reassignment.
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="p-6 pt-0">
                                                      <AlertDialogCancel className="border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl px-6 py-3">Cancel</AlertDialogCancel>
                                                      <AlertDialogAction 
                                                        onClick={() => handleUnassignProperties([property.id])}
                                                        className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl px-6 py-3"
                                                      >
                                                        Unassign Property
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                              </div>
                                              <div className="flex flex-wrap gap-2 font-semibold">
                                                <span className="border border-amber-300 px-3 py-2 rounded-lg bg-amber-50 text-amber-700"><Bed className="h-4 w-4 inline mr-1" /> {meta.bedrooms || 0}</span>
                                                <span className="border border-amber-300 px-3 py-2 rounded-lg bg-amber-50 text-amber-700"><Bath className="h-4 w-4 inline mr-1" /> {meta.bathrooms || 0}</span>
                                                {meta.square_feet && <span className="border border-amber-300 px-3 py-2 rounded-lg bg-amber-50 text-amber-700"><Square className="h-4 w-4 inline mr-1" /> {meta.square_feet} sqft</span>}
                                              </div>
                                              {meta.property_type && <Badge variant="outline" className="text-sm font-medium border-amber-300 bg-amber-50 text-amber-700">{meta.property_type}</Badge>}
                                              
                                              {/* Status Update */}
                                              <div className="flex items-center gap-3 pt-4 border-t border-amber-200">
                                                <span className="text-sm font-semibold text-gray-700">Status:</span>
                                                <Select 
                                                  value={meta.listing_status || 'Available'} 
                                                  onValueChange={(value) => handleUpdatePropertyStatus(property.id, value)}
                                                >
                                                  <SelectTrigger className="h-9 text-sm flex-1 bg-white border-amber-300 hover:border-amber-400 focus:ring-amber-500">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-white border border-amber-300">
                                                    <SelectItem value="Available" className="text-gray-700 focus:bg-amber-50 focus:text-amber-700">Available</SelectItem>
                                                    <SelectItem value="For Sale" className="text-gray-700 focus:bg-amber-50 focus:text-amber-700">For Sale</SelectItem>
                                                    <SelectItem value="For Rent" className="text-gray-700 focus:bg-amber-50 focus:text-amber-700">For Rent</SelectItem>
                                                    <SelectItem value="Sold" className="text-gray-700 focus:bg-amber-50 focus:text-amber-700">Sold</SelectItem>
                                                    <SelectItem value="Rented" className="text-gray-700 focus:bg-amber-50 focus:text-amber-700">Rented</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>

                                              {/* Agent Section with Remove */}
                                              {meta.agent && (
                                                <div className="pt-4 border-t border-amber-200 space-y-3 bg-amber-50 rounded-lg p-4 border border-amber-200">
                                                  <div className="flex items-start justify-between mb-2">
                                                    <p className="text-sm font-semibold text-amber-700 uppercase tracking-wider">Agent:</p>
                                                    <AlertDialog>
                                                      <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 border border-red-300 hover:border-red-400 rounded-lg">
                                                          <X className="h-4 w-4" />
                                                        </Button>
                                                      </AlertDialogTrigger>
                                                      <AlertDialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl">
                                                        <AlertDialogHeader className="p-6">
                                                          <AlertDialogTitle className="text-gray-900 font-bold text-2xl">Remove Agent?</AlertDialogTitle>
                                                          <AlertDialogDescription className="text-gray-600 text-lg">
                                                            Are you sure you want to remove <span className="font-semibold text-amber-600">{meta.agent.name}</span> from this property? This action cannot be undone.
                                                          </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="p-6 pt-0">
                                                          <AlertDialogCancel className="border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl px-6 py-3">
                                                            Cancel
                                                          </AlertDialogCancel>
                                                          <AlertDialogAction 
                                                            onClick={() => handleRemoveAgent(property.id)}
                                                            className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl px-6 py-3"
                                                          >
                                                            Remove Agent
                                                          </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                      </AlertDialogContent>
                                                    </AlertDialog>
                                                  </div>
                                                  <div className="space-y-2 text-sm">
                                                    <p className="font-bold text-gray-900">{meta.agent.name}</p>
                                                    {meta.agent.email && (
                                                      <div className="flex items-center gap-2 text-gray-600 font-medium">
                                                        <Mail className="h-4 w-4 text-amber-600" />
                                                        <span className="truncate">{meta.agent.email}</span>
                                                      </div>
                                                    )}
                                                    {meta.agent.phone && (
                                                      <div className="flex items-center gap-2 text-gray-600 font-medium">
                                                        <Phone className="h-4 w-4 text-amber-600" />
                                                        <span>{meta.agent.phone}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                              {meta.features && meta.features.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-4 border-t border-amber-200">
                                                  {meta.features.slice(0, 2).map((f: string, i: number) => (
                                                    <Badge key={i} variant="outline" className="text-xs font-medium border-amber-300 bg-amber-50 text-amber-700">{f}</Badge>
                                                  ))}
                                                  {meta.features.length > 2 && <span className="text-xs text-gray-500 font-medium">+{meta.features.length - 2}</span>}
                                                </div>
                                              )}
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

            {/* Properties Grid */}
            <TabsContent value="properties">
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
                  apartments.map((apt, idx) => {
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
                        <Card className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden h-full border border-amber-100 hover:border-amber-200">
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
                              <div className="absolute top-4 right-4 z-10">
                                <Badge 
                                  variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                                  className={`text-sm font-bold border-2 ${
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
                          <CardHeader className="pb-4 pt-6 px-6">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <CardTitle className="text-gray-900 text-xl font-bold group-hover:text-amber-700 transition-colors line-clamp-1">
                                    {meta.address || `Property #${apt.id}`}
                                  </CardTitle>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md">
                                  <p className="font-medium">{meta.address || `Property #${apt.id}`}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {meta.listing_id && (
                              <div className="flex items-center gap-2 mt-3">
                                <Info className="h-4 w-4 text-amber-600" />
                                <p className="text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 font-semibold text-sm">MLS: {meta.listing_id}</p>
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-4 p-6 pt-0">
                            {/* Price */}
                            <div className="flex items-center justify-between border-b border-amber-200 pb-4">
                              <div className="text-2xl font-bold text-amber-600">
                                ${meta.price ? meta.price.toLocaleString() : "N/A"}
                              </div>
                            </div>

                            {/* Basic Specs */}
                            <div className="grid grid-cols-3 gap-3 text-sm font-semibold">
                              <div className="flex items-center gap-2 text-gray-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg hover:bg-amber-100 hover:border-amber-300 transition-all">
                                <Bed className="h-4 w-4 text-amber-600" /> <span>{meta.bedrooms || 0}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg hover:bg-amber-100 hover:border-amber-300 transition-all">
                                <Bath className="h-4 w-4 text-amber-600" /> <span>{meta.bathrooms || 0}</span>
                              </div>
                              {meta.square_feet && (
                                <div className="flex items-center gap-2 text-gray-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg hover:bg-amber-100 hover:border-amber-300 transition-all">
                                  <Square className="h-4 w-4 text-amber-600" /> <span>{meta.square_feet}</span>
                                </div>
                              )}
                            </div>

                            {/* Property Details Grid */}
                            <div className="space-y-3 pt-4 border-t border-gray-200">
                              {meta.property_type && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 font-medium">Type:</span>
                                  <Badge variant="outline" className="text-sm font-medium border-amber-300 bg-amber-50 text-amber-700">
                                    {meta.property_type}
                                  </Badge>
                                </div>
                              )}
                              
                              {meta.year_built && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 font-medium">Year Built:</span>
                                  <span className="font-semibold text-gray-900">{meta.year_built}</span>
                                </div>
                              )}

                              {meta.lot_size_sqft && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 font-medium">Lot Size:</span>
                                  <span className="font-semibold text-gray-900">{meta.lot_size_sqft.toLocaleString()} sqft</span>
                                </div>
                              )}

                              {meta.days_on_market !== undefined && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 font-medium">Days on Market:</span>
                                  <span className="font-semibold text-gray-900">{meta.days_on_market}</span>
                                </div>
                              )}

                              {meta.listing_date && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 font-medium flex items-center gap-1">
                                    <CalendarIcon className="h-4 w-4" /> Listed:
                                  </span>
                                  <span className="font-semibold text-gray-900">{new Date(meta.listing_date).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>

                            {/* Features */}
                            {meta.features && meta.features.length > 0 && (
                              <div className="pt-4 border-t border-gray-200">
                                <p className="text-sm font-semibold text-gray-600 mb-3">Features:</p>
                                <div className="flex flex-wrap gap-2">
                                  {(expandedFeatures[apt.id] ? meta.features : meta.features.slice(0, 4)).map((feature: string, fIdx: number) => (
                                    <Badge key={fIdx} variant="outline" className="text-xs font-medium border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400 transition-all">
                                      {feature}
                                    </Badge>
                                  ))}
                                  {meta.features.length > 4 && (
                                    <button
                                      onClick={() => setExpandedFeatures(prev => ({ ...prev, [apt.id]: !prev[apt.id] }))}
                                      className="text-xs text-amber-600 font-medium hover:text-amber-700 hover:underline transition-colors cursor-pointer"
                                    >
                                      {expandedFeatures[apt.id] ? 'Show less' : `+${meta.features.length - 4} more`}
                                    </button>
                                  )}
                                </div>
                                {expandedFeatures[apt.id] && (
                                  <div className="mt-3 pt-3 border-t border-amber-200">
                                    <p className="text-xs font-semibold text-amber-700 mb-2">Property: {meta.address || `Property #${apt.id}`}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Agent Information */}
                            {meta.agent && (
                              <div className="pt-4 border-t border-gray-200 space-y-2 bg-amber-50 rounded-lg p-4 border border-amber-200">
                                <p className="text-sm font-semibold text-amber-700">Agent:</p>
                                <div className="space-y-2 text-sm">
                                  <p className="font-semibold text-gray-900">{meta.agent.name}</p>
                                  {meta.agent.email && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Mail className="h-4 w-4 text-amber-600" />
                                      <span className="truncate">{meta.agent.email}</span>
                                    </div>
                                  )}
                                  {meta.agent.phone && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Phone className="h-4 w-4 text-amber-600" />
                                      <span>{meta.agent.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Assignment Status (for PM) */}
                            {userType === "property_manager" && (
                              <div className="pt-4 border-t border-gray-200">
                                {meta.is_assigned && meta.assigned_to_realtor_name ? (
                                  <div className="flex items-center justify-between text-sm bg-amber-50 rounded-lg p-3 border border-amber-200">
                                    <span className="text-amber-700 font-medium">Assigned to:</span>
                                    <Badge className="bg-gradient-to-br from-amber-500 to-amber-600 text-white text-sm font-semibold">
                                      {meta.assigned_to_realtor_name}
                                    </Badge>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-sm font-medium w-full justify-center py-2">
                                    Unassigned
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Description (truncated) */}
                            {meta.description && (
                              <div className="pt-4 border-t border-gray-200 bg-amber-50 rounded-lg p-4 border border-amber-200">
                                <div className="flex items-start gap-3">
                                  <Info className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                                  <p className="text-sm text-gray-600 line-clamp-2 font-medium">
                                    {meta.description}
                                  </p>
                                </div>
                              </div>
                            )}
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
    </main>
  );
};

export default Dashboard;