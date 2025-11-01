import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, MapPin, Bed, Bath, Ruler, TrendingUp, Calendar, Eye, Music, Phone, Users, UserPlus, Settings, Building2, CheckSquare, Square, CalendarDays, User, ListChecks, RefreshCw, Mail, Calendar as CalendarIcon, Info, X, AlertTriangle, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
const API_BASE = "https://leasing-copilot-mvp.onrender.com"; // API is kept alive

// Helper function to parse and extract metadata from property (KEEPING LOGIC ALIVE)
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

// Custom Tailwind Class Definitions for Clarity
// I will assume you have defined `bg-gold`, `hover:bg-yellow-500`, `border-gold`, `text-gold`
// to be equivalent to a strong yellow-golden color (e.g., #FFD700 or #FDD017).

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


  // *** API/FETCH FUNCTIONS ARE KEPT ALIVE AND UNCHANGED ***
  useEffect(() => {
    // Get user type from localStorage
    const storedUserType = localStorage.getItem("user_type");
    setUserType(storedUserType);

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
    
    // Refresh data
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
    }catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to buy number");
    } finally {
      setLoading(false);
    }
  }


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
    // Main Container with Light Background
    <main className="min-h-screen bg-gray-50 antialiased relative">
      {/* Professional Black/Gold Header */}
      <motion.header 
        className="sticky top-0 z-20 bg-black shadow-2xl border-b-4 border-gold"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.div 
            className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
              <motion.div 
                className="bg-gold p-3 sm:p-4 rounded-xl shadow-[0_0_25px_rgba(255,215,0,0.6)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Home className="h-6 w-6 sm:h-7 sm:w-7 text-black" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-1 tracking-tight truncate"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {userType === "property_manager" ? "Property Manager" : "Realtor"} Dashboard
                </motion.h1>
                <motion.p 
                  className="text-gray-400 text-xs sm:text-sm lg:text-base"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  {userType === "property_manager" 
                    ? "Command center for team and portfolio oversight."
                    : "Your assigned properties, bookings, and conversations."
                  }
                </motion.p>
              </div>
            </div>
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto mt-2 lg:mt-0"
            >
              <Button 
                asChild 
                variant="outline"
                className="bg-white hover:bg-gray-100 text-black border-2 border-black hover:border-gold font-bold transition-all shadow-md hover:shadow-lg hover:text-gold"
                size="sm"
              >
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline"
                className="bg-white hover:bg-gray-100 text-black border-2 border-black hover:border-gold font-bold transition-all shadow-md hover:shadow-lg hover:text-gold"
                size="sm"
              >
                <Link to="/uploadpage">
                  <Building2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Upload</span>
                </Link>
              </Button>
              <Button 
                onClick={handleBuyNumber} 
                disabled={loading} 
                className="bg-gold hover:bg-yellow-500 text-black font-black shadow-lg hover:shadow-xl transition-all border border-black/50"
                size="sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Processing...</span>
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Get Phone Number</span>
                    <span className="sm:hidden">Phone</span>
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
          {/* Phone Number Display */}
          {myNumber && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="mt-4 pt-3 border-t border-gold/50"
            >
              <div className="flex items-center gap-2 text-gold">
                <CheckCircle2 className="h-4 w-4 text-gold" />
                <span className="text-sm font-semibold">Your Phone Number: <span className="font-extrabold text-white bg-gold/10 px-2 py-0.5 rounded-md border border-gold/50">{myNumber}</span></span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Professional Stats Cards */}
      <motion.section 
        className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {userType === "property_manager" ? (
            <>
              {/* PM Card: Realtors */}
              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border-2 border-black hover:border-gold"
                whileHover={{ y: -6 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-gray-500 mb-2 uppercase tracking-widest">Total Realtors</p>
                    <motion.p 
                      className="text-4xl font-extrabold text-black"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" as const }}
                    >
                      {realtors.length}
                    </motion.p>
                    <p className="text-xs text-gray-400 mt-1 font-semibold">Active team members</p>
                  </div>
                  <motion.div 
                    className="p-4 bg-gold rounded-full ml-3 shadow-[0_0_20px_rgba(255,215,0,0.4)] border border-black"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <Users className="h-6 w-6 text-black" />
                  </motion.div>
                </div>
              </motion.div>

              {/* PM Card: Properties */}
              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border-2 border-black hover:border-gold"
                whileHover={{ y: -6 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-gray-500 mb-2 uppercase tracking-widest">Total Properties</p>
                    <motion.p 
                      className="text-4xl font-extrabold text-black"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.0, type: "spring" as const }}
                    >
                      {apartments.length}
                    </motion.p>
                    <p className="text-xs text-gray-400 mt-1 font-semibold">In your portfolio</p>
                  </div>
                  <motion.div 
                    className="p-4 bg-gold rounded-full ml-3 shadow-[0_0_20px_rgba(255,215,0,0.4)] border border-black"
                    whileHover={{ rotate: -10, scale: 1.1 }}
                  >
                    <Building2 className="h-6 w-6 text-black" />
                  </motion.div>
                </div>
              </motion.div>

              {/* PM Card: Bookings */}
              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border-2 border-black hover:border-gold sm:col-span-2 lg:col-span-1"
                whileHover={{ y: -6 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-gray-500 mb-2 uppercase tracking-widest">Active Bookings</p>
                    <motion.p 
                      className="text-4xl font-extrabold text-black"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" as const }}
                    >
                      {bookings.length}
                    </motion.p>
                    <p className="text-xs text-gray-400 mt-1 font-semibold">Scheduled viewings</p>
                  </div>
                  <motion.div 
                    className="p-4 bg-gold rounded-full ml-3 shadow-[0_0_20px_rgba(255,215,0,0.4)] border border-black"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <Calendar className="h-6 w-6 text-black" />
                  </motion.div>
                </div>
              </motion.div>
            </>
          ) : (
            // Realtor Cards (Enhanced)
            <>
              {/* Realtor Card: My Properties */}
              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border-2 border-black hover:border-gold"
                whileHover={{ y: -6 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-gray-500 mb-2 uppercase tracking-widest">My Properties</p>
                    <motion.p 
                      className="text-4xl font-extrabold text-black"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" as const }}
                    >
                      {apartments.length}
                    </motion.p>
                    <p className="text-xs text-gray-400 mt-1 font-semibold">Assigned to you</p>
                  </div>
                  <motion.div 
                    className="p-4 bg-black rounded-full ml-3 border border-gold"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <Building2 className="h-6 w-6 text-gold" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Realtor Card: My Bookings */}
              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border-2 border-black hover:border-gold"
                whileHover={{ y: -6 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-gray-500 mb-2 uppercase tracking-widest">My Bookings</p>
                    <motion.p 
                      className="text-4xl font-extrabold text-black"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.0, type: "spring" as const }}
                    >
                      {bookings.length}
                    </motion.p>
                    <p className="text-xs text-gray-400 mt-1 font-semibold">Scheduled viewings</p>
                  </div>
                  <motion.div 
                    className="p-4 bg-black rounded-full ml-3 border border-gold"
                    whileHover={{ rotate: -10, scale: 1.1 }}
                  >
                    <Calendar className="h-6 w-6 text-gold" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Realtor Card: Property Views */}
              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border-2 border-black hover:border-gold sm:col-span-2 lg:col-span-1"
                whileHover={{ y: -6 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-gray-500 mb-2 uppercase tracking-widest">Property Views</p>
                    <motion.p 
                      className="text-4xl font-extrabold text-black"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" as const }}
                    >
                      1,247
                    </motion.p>
                    <p className="text-xs text-gray-400 mt-1 font-semibold">Total views this month</p>
                  </div>
                  <motion.div 
                    className="p-4 bg-black rounded-full ml-3 border border-gold"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <Eye className="h-6 w-6 text-gold" />
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </motion.section>
      
      <hr className="border-t-2 border-gold/50 mx-auto container"/>

      {/* Content Tabs */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Tabs defaultValue={userType === "property_manager" ? "realtors" : "properties"} className="w-full">
            {/* Tabs List (Horizontal Scrollable on Mobile) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="overflow-x-auto mb-8"
            >
              <TabsList className="bg-black/90 border-2 border-gold rounded-full p-1.5 shadow-xl inline-flex min-w-full sm:min-w-0 flex-wrap sm:flex-nowrap gap-1">
                {userType === "property_manager" && (
                  <>
                    <TabsTrigger 
                      value="realtors" 
                      className="data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-xl data-[state=active]:shadow-gold/40 rounded-full px-4 py-2 font-black transition-all text-sm sm:text-base text-white hover:text-gold"
                    >
                      <Users className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="whitespace-nowrap">Realtors</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="assign-properties" 
                      className="data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-xl data-[state=active]:shadow-gold/40 rounded-full px-4 py-2 font-black transition-all text-sm sm:text-base text-white hover:text-gold"
                    >
                      <CheckSquare className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="whitespace-nowrap hidden sm:inline">Assign Properties</span>
                      <span className="whitespace-nowrap sm:hidden">Assign</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="view-assignments" 
                      className="data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-xl data-[state=active]:shadow-gold/40 rounded-full px-4 py-2 font-black transition-all text-sm sm:text-base text-white hover:text-gold"
                    >
                      <ListChecks className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="whitespace-nowrap hidden sm:inline">View Assignments</span>
                      <span className="whitespace-nowrap sm:hidden">Assignments</span>
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger 
                  value="properties" 
                  className="data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-xl data-[state=active]:shadow-gold/40 rounded-full px-4 py-2 font-black transition-all text-sm sm:text-base text-white hover:text-gold"
                >
                  <Building2 className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="whitespace-nowrap">Properties</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="bookings" 
                  className="data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-xl data-[state=active]:shadow-gold/40 rounded-full px-4 py-2 font-black transition-all text-sm sm:text-base text-white hover:text-gold"
                >
                  <Calendar className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="whitespace-nowrap">Bookings</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="conversations" 
                  className="data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-xl data-[state=active]:shadow-gold/40 rounded-full px-4 py-2 font-black transition-all text-sm sm:text-base text-white hover:text-gold"
                >
                  <Music className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="whitespace-nowrap hidden lg:inline">Conversations</span>
                  <span className="whitespace-nowrap lg:hidden">Recordings</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="chats" 
                  className="data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-xl data-[state=active]:shadow-gold/40 rounded-full px-4 py-2 font-black transition-all text-sm sm:text-base text-white hover:text-gold"
                >
                  <Mail className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="whitespace-nowrap">Chats</span>
                </TabsTrigger>
              </TabsList>
            </motion.div>

            {/* --- Realtor Management (PM Only) --- */}
            {userType === "property_manager" && (
              <TabsContent value="realtors">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Card className="bg-white shadow-2xl border-2 border-black rounded-xl">
                    <CardHeader className="bg-black/95 rounded-t-[10px] border-b-2 border-gold p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-white text-xl sm:text-2xl font-extrabold flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gold rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                              <Users className="h-5 w-5 text-black" />
                            </div>
                            Manage Realtors
                          </CardTitle>
                          <p className="text-sm text-gray-400 ml-0 sm:ml-[44px] mt-2 sm:mt-0">
                            Add and manage your realtor team members.
                          </p>
                        </div>
                        <Button 
                          onClick={() => setShowAddRealtor(!showAddRealtor)}
                          className="bg-gold hover:bg-yellow-500 text-black font-black shadow-lg hover:shadow-xl transition-all w-full sm:w-auto border-2 border-black/50"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add New Realtor
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      {showAddRealtor && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-8 p-4 sm:p-6 bg-gray-100 border-2 border-black rounded-xl shadow-inner"
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <UserPlus className="h-5 w-5 text-gold" />
                            <h3 className="text-xl font-extrabold text-black">Add New Realtor Account</h3>
                          </div>
                          <p className="text-sm text-gray-700 mb-4">Fill in the details to create a new realtor account.</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="text-sm font-semibold text-black mb-1 block">Full Name</label>
                              <input
                                type="text"
                                value={newRealtor.name}
                                onChange={(e) => setNewRealtor({...newRealtor, name: e.target.value})}
                                className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-gold/50 focus:border-gold bg-white text-black font-semibold transition-all"
                                placeholder="John Doe"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-black mb-1 block">Email Address</label>
                              <input
                                type="email"
                                value={newRealtor.email}
                                onChange={(e) => setNewRealtor({...newRealtor, email: e.target.value})}
                                className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-gold/50 focus:border-gold bg-white text-black font-semibold transition-all"
                                placeholder="john.doe@company.com"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-black mb-1 block">Temporary Password</label>
                              <input
                                type="password"
                                value={newRealtor.password}
                                onChange={(e) => setNewRealtor({...newRealtor, password: e.target.value})}
                                className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-gold/50 focus:border-gold bg-white text-black font-semibold transition-all"
                                placeholder="Secure password"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button 
                              onClick={addRealtor} 
                              className="bg-gold hover:bg-yellow-500 text-black font-black shadow-md hover:shadow-lg px-6 border-2 border-black/50"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Create Realtor Account
                            </Button>
                            <Button 
                              onClick={() => setShowAddRealtor(false)}
                              variant="outline"
                              className="border-2 border-black hover:bg-black/10 text-black font-bold"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {loadingRealtors ? (
                        <p className="text-black font-semibold text-center py-8">Loading realtors...</p>
                      ) : realtors.length === 0 ? (
                        <p className="text-gray-700 font-semibold text-center py-8">No realtors found. Add your first realtor above.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border-2 border-black bg-white shadow-xl">
                          <Table>
                            <TableHeader className="bg-black">
                              <TableRow className="border-b-2 border-gold">
                                <TableHead className="font-extrabold text-white py-3 sm:py-4 px-2 sm:px-4">Name</TableHead>
                                <TableHead className="font-extrabold text-white py-3 sm:py-4 px-2 sm:px-4">Email</TableHead>
                                <TableHead className="font-extrabold text-white py-3 sm:py-4 px-2 sm:px-4">Status</TableHead>
                                <TableHead className="font-extrabold text-white py-3 sm:py-4 px-2 sm:px-4">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {realtors.map((realtor, idx) => (
                                <motion.tr
                                  key={realtor.id || idx}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                                  className="hover:bg-gold/10 transition-all duration-200 group border-b border-black/10"
                                >
                                  <TableCell className="font-semibold text-black py-3 sm:py-4 px-2 sm:px-4">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-gold" />
                                      {realtor.name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-black/70 py-3 sm:py-4 px-2 sm:px-4">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-gray-500" />
                                      <span className="truncate max-w-[200px] sm:max-w-none">{realtor.email}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                                    <Badge
                                      variant={realtor.status === "active" ? "default" : "secondary"}
                                      className={
                                        realtor.status === "active"
                                          ? "bg-gold text-black font-bold border-2 border-black shadow-md"
                                          : "bg-gray-200 text-black font-bold border-2 border-black"
                                      }
                                    >
                                      {realtor.status || "Active"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                                    <div className="flex gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={handleSettingsClick}
                                        className="bg-white hover:bg-gold/10 text-black border-2 border-black hover:border-gold font-medium transition-all"
                                      >
                                        <Settings className="h-4 w-4 mr-1" />
                                        <span className="hidden sm:inline">Settings</span>
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="bg-white hover:bg-red-50 text-red-600 border-2 border-red-400 hover:border-red-600 font-medium transition-all"
                                          >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            <span className="hidden sm:inline">Delete</span>
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-white border-2 border-black shadow-2xl rounded-xl">
                                          <AlertDialogHeader>
                                            <AlertDialogTitle className="text-black font-extrabold text-xl flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-red-600" /> Delete Realtor: {realtor.name}?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-gray-700 mt-4 space-y-2">
                                              <p className="font-bold text-black">This permanent action will:</p>
                                              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                                                <li>Move all their properties back to you (unassigned)</li>
                                                <li>Unassign all their bookings</li>
                                                <li>Delete their sources and rule chunks</li>
                                                <li>Remove them from the system</li>
                                              </ul>
                                              <p className="mt-4 font-black text-red-600 text-base">⚠️ This action CANNOT be undone!</p>
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel className="border-2 border-black hover:bg-gray-100 text-black font-semibold">
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction 
                                              onClick={() => handleDeleteRealtor(realtor.id, realtor.name)}
                                              className="bg-red-600 hover:bg-red-700 text-white font-black shadow-lg"
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

            {/* --- Property Assignment (PM Only) --- */}
            {userType === "property_manager" && (
              <TabsContent value="assign-properties">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Card className="bg-white shadow-2xl border-2 border-black rounded-xl">
                    <CardHeader className="bg-black/95 rounded-t-[10px] border-b-2 border-gold p-4 sm:p-6">
                      <CardTitle className="text-white text-xl sm:text-2xl font-extrabold flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gold rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                          <CheckSquare className="h-5 w-5 text-black" />
                        </div>
                        Assign Properties to Realtors
                      </CardTitle>
                      <p className="text-sm text-gray-400 ml-0 sm:ml-[44px] mt-2 sm:mt-0">
                        Select properties you own and assign them to a team realtor.
                      </p>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-8 p-4 sm:p-6">
                      {/* Realtor Selection */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="space-y-4 bg-gray-100 p-4 sm:p-6 rounded-xl border-2 border-black"
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-6 w-6 text-gold" />
                          <label className="text-lg sm:text-xl font-extrabold text-black">Select Realtor:</label>
                        </div>
                        <select 
                          value={selectedRealtor || ''} 
                          onChange={(e) => setSelectedRealtor(e.target.value ? Number(e.target.value) : null)}
                          className="w-full p-3 sm:p-4 border-2 border-black rounded-lg bg-white text-black focus:outline-none focus:ring-4 focus:ring-gold/50 focus:border-gold text-base font-semibold transition-all shadow-md"
                        >
                          <option value="" className="font-semibold text-gray-500">Choose a realtor from the list...</option>
                          {realtors.map(realtor => (
                            <option key={realtor.id} value={realtor.id} className="font-semibold">
                              {realtor.name} - {realtor.email}
                            </option>
                          ))}
                        </select>
                        {selectedRealtor && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-2 bg-gold/10 p-3 rounded-lg border-2 border-gold font-bold"
                          >
                            <CheckCircle2 className="h-5 w-5 text-gold" />
                            <span className="text-black">
                              Selected: {realtors.find(r => r.id === selectedRealtor)?.name}
                            </span>
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Properties Section */}
                      <div className="space-y-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                              <h3 className="text-xl font-extrabold text-black">
                                Available Properties <Badge className="bg-gold text-black border border-black shadow-md">({selectedProperties.length} selected)</Badge>
                              </h3>
                              <p className="text-sm text-gray-700 mt-1">
                                Properties you own that are currently unassigned.
                              </p>
                            </div>
                            <Button 
                              onClick={handleSelectAll}
                              variant="outline"
                              size="sm"
                              className="bg-white hover:bg-gold/10 text-black border-2 border-black hover:border-gold font-bold transition-all w-full sm:w-auto"
                            >
                              <ListChecks className="h-4 w-4 mr-2" />
                              {selectedProperties.length === availablePropertiesForAssignment.length ? 'Deselect All' : 'Select All'}
                            </Button>
                          </div>
                        </div>

                        {/* Loading/Empty State */}
                        {loadingAssignmentProperties ? (
                          <p className="text-black font-semibold py-8 text-center">Loading properties...</p>
                        ) : availablePropertiesForAssignment.length === 0 ? (
                          <div className="py-8 text-center bg-gray-100 border-2 border-black rounded-xl shadow-inner">
                            <p className="text-gray-700 font-semibold">
                              No properties available to assign. All properties may already be assigned or you need to upload new ones.
                            </p>
                          </div>
                        ) : (
                          // Properties Grid
                          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {availablePropertiesForAssignment.map((property, idx) => {
                              const meta = getPropertyMetadata(property);
                              const isSelected = selectedProperties.includes(property.id);
                              return (
                                <motion.div
                                  key={property.id || idx}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                                  whileHover={{ y: -4, boxShadow: isSelected ? '0 10px 25px -3px rgba(255, 215, 0, 0.4)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                  onClick={() => handlePropertyToggle(property.id)}
                                >
                                  <Card 
                                    className={`cursor-pointer transition-all duration-300 rounded-xl bg-white border-2 overflow-hidden h-full shadow-md ${
                                      isSelected 
                                        ? 'border-gold bg-yellow-50 shadow-lg scale-[1.02] ring-4 ring-gold/20' 
                                        : 'border-black hover:border-gold hover:shadow-xl'
                                    }`}
                                  >
                                    <div className="flex items-start p-4 sm:p-5 gap-4">
                                      <div className="flex-shrink-0 mt-1">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => handlePropertyToggle(property.id)}
                                          className={`h-5 w-5 cursor-pointer accent-gold rounded border-2 ${isSelected ? 'border-black bg-gold' : 'border-black bg-white'}`}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0 space-y-2">
                                        <div>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <h4 className="font-extrabold text-base sm:text-lg text-black truncate mb-1">
                                                  {meta.address || `Property #${property.id}`}
                                                </h4>
                                              </TooltipTrigger>
                                              <TooltipContent className="max-w-md bg-black text-white border-gold">
                                                <p className="font-bold">{meta.address || `Property #${property.id}`}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                          <p className="text-xl sm:text-2xl font-black text-gold">
                                            ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                          </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-sm font-semibold pt-1 border-t border-gray-200">
                                          <Badge variant="outline" className="flex items-center gap-1.5 bg-gray-100 border-black text-black">
                                            <Bed className="h-4 w-4 text-gold" /> {meta.bedrooms || 0} Beds
                                          </Badge>
                                          <Badge variant="outline" className="flex items-center gap-1.5 bg-gray-100 border-black text-black">
                                            <Bath className="h-4 w-4 text-gold" /> {meta.bathrooms || 0} Baths
                                          </Badge>
                                          {meta.square_feet && (
                                            <Badge variant="outline" className="flex items-center gap-1.5 bg-gray-100 border-black text-black">
                                              <Square className="h-4 w-4 text-gold" /> {meta.square_feet} sqft
                                            </Badge>
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
                      <div className="pt-6 border-t-2 border-black/10 bg-black/95 p-6 rounded-xl border-2 border-gold shadow-xl">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm sm:text-base font-semibold text-white mb-2">
                              {selectedProperties.length > 0 && selectedRealtor ? (
                                <span className="flex items-center gap-2 text-gold font-extrabold">
                                  <CheckCircle2 className="h-5 w-5 text-gold" />
                                  Ready to assign <strong className="text-white">{selectedProperties.length}</strong> {selectedProperties.length === 1 ? 'property' : 'properties'} to <strong className="text-white">{realtors.find(r => r.id === selectedRealtor)?.name}</strong>
                                </span>
                              ) : (
                                <span className="text-gray-400 font-medium">
                                  {!selectedRealtor && selectedProperties.length > 0 
                                    ? <span className="text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Please select a realtor.</span>
                                    : selectedRealtor && selectedProperties.length === 0
                                    ? <span className="text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Please select at least one property.</span>
                                    : "Select a realtor and properties above to enable assignment."}
                                </span>
                              )}
                            </p>
                          </div>
                          <Button 
                            onClick={assignProperties} 
                            disabled={assigningProperties || !selectedRealtor || selectedProperties.length === 0}
                            className="bg-gold hover:bg-yellow-500 text-black font-black px-8 py-3 text-base sm:text-lg shadow-2xl hover:shadow-gold/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto border-2 border-black"
                            size="lg"
                          >
                            {assigningProperties ? (
                              <>
                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                Assigning...
                              </>
                            ) : (
                              <>
                                <CheckSquare className="h-5 w-5 mr-2" />
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

            {/* --- View Assignments (PM Only) --- */}
            {userType === "property_manager" && (
              <TabsContent value="view-assignments">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Card className="bg-white shadow-2xl border-2 border-black rounded-xl">
                    <CardHeader className="bg-black/95 rounded-t-[10px] border-b-2 border-gold p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-white text-xl sm:text-2xl font-extrabold flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gold rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                              <ListChecks className="h-5 w-5 text-black" />
                            </div>
                            Property Assignments Overview
                          </CardTitle>
                          <p className="text-sm text-gray-400 ml-0 sm:ml-[44px] mt-2 sm:mt-0">
                            Monitor which properties are assigned to which realtors.
                          </p>
                        </div>
                        <Button 
                          onClick={() => { fetchAssignments(); fetchPropertiesForAssignment(); }}
                          variant="outline"
                          size="sm"
                          className="bg-white hover:bg-gold/10 text-black border-2 border-black hover:border-gold font-bold transition-all w-full sm:w-auto"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Data
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      {loadingAssignments ? (
                        <p className="text-black font-semibold py-8 text-center">Loading assignments...</p>
                      ) : !assignmentsData ? (
                        <p className="text-gray-700 font-semibold py-8 text-center">No assignment data available.</p>
                      ) : (
                        <div className="space-y-8">
                          {/* Summary Cards with better styling */}
                          {assignmentsData.summary && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                              <Card className="bg-black text-white p-5 border-2 border-gold rounded-xl shadow-xl hover:shadow-gold/50 transition-all">
                                <p className="text-sm font-extrabold text-gold mb-1 uppercase tracking-widest">Total Properties</p>
                                <p className="text-3xl font-extrabold">{assignmentsData.summary.total_properties || 0}</p>
                              </Card>
                              <Card className="bg-white text-black p-5 border-2 border-black rounded-xl shadow-md hover:border-gold transition-all">
                                <p className="text-sm font-extrabold text-gray-500 mb-1 uppercase tracking-widest">Unassigned</p>
                                <p className="text-3xl font-extrabold text-red-600">{assignmentsData.summary.unassigned_count || 0}</p>
                              </Card>
                              <Card className="bg-gold text-black p-5 border-2 border-black rounded-xl shadow-xl hover:shadow-black/50 transition-all">
                                <p className="text-sm font-extrabold text-black mb-1 uppercase tracking-widest">Assigned</p>
                                <p className="text-3xl font-extrabold">{assignmentsData.summary.assigned_count || 0}</p>
                              </Card>
                            </div>
                          )}

                          {/* Unassigned Properties - Highlighting action required */}
                          {assignmentsData.unassigned_properties && assignmentsData.unassigned_properties.length > 0 && (
                            <div className="bg-red-50 p-6 rounded-2xl border-4 border-red-500 shadow-xl">
                              <h3 className="text-xl sm:text-2xl font-extrabold text-red-700 mb-4 flex items-center gap-3">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                                Critical: Unassigned Properties <Badge className="bg-red-600 text-white font-black">{assignmentsData.unassigned_properties.length}</Badge>
                              </h3>
                              <p className="text-sm text-gray-700 mb-4">These properties need to be assigned to a realtor to ensure lead coverage.</p>
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {assignmentsData.unassigned_properties.map((property: any, idx: number) => {
                                  const meta = getPropertyMetadata(property);
                                  return (
                                    <Card key={property.id || idx} className="bg-white p-4 border-2 border-red-500/50 rounded-lg shadow-lg">
                                      <p className="font-bold text-black truncate">{meta.address || `Property #${property.id}`}</p>
                                      <p className="text-gold font-extrabold text-lg">${meta.price ? meta.price.toLocaleString() : 'N/A'}</p>
                                      <Badge className="bg-red-500 text-white font-semibold mt-2">Unassigned</Badge>
                                    </Card>
                                  );
                                })}
                              </div>
                              <Button
                                onClick={() => document.querySelector(`[data-state="active"]`)?.parentElement?.querySelector('[value="assign-properties"]')?.click()}
                                className="mt-6 bg-red-600 hover:bg-red-700 text-white font-black w-full sm:w-auto"
                              >
                                Go to Assign Properties Tab
                              </Button>
                            </div>
                          )}

                          {/* Assigned Properties by Realtor - Collapsible Groups for Clarity */}
                          {assignmentsData.assigned_properties && Object.keys(assignmentsData.assigned_properties).length > 0 && (
                            <div className="space-y-6">
                              <h3 className="text-xl sm:text-2xl font-extrabold text-black flex items-center gap-3">
                                <Users className="h-6 w-6 text-gold" />
                                Assigned Properties by Realtor
                              </h3>
                              {Object.values(assignmentsData.assigned_properties).map((realtorGroup: any) => (
                                <details key={realtorGroup.realtor_id} className="group open:pb-4 border-2 border-black rounded-xl shadow-lg transition-all duration-300">
                                  <summary className="flex items-center justify-between p-4 sm:p-6 bg-black text-white cursor-pointer rounded-t-[10px] group-open:rounded-b-none border-b-2 border-gold hover:bg-black/80 transition-all">
                                    <div className="flex items-center gap-4">
                                      <User className="h-6 w-6 text-gold flex-shrink-0" />
                                      <div>
                                        <span className="text-lg sm:text-xl font-extrabold">{realtorGroup.realtor_name}</span>
                                        <p className="text-sm text-gray-400">{realtorGroup.realtor_email}</p>
                                      </div>
                                    </div>
                                    <Badge className="bg-gold text-black font-black text-sm px-4 py-2 border-2 border-black/50 shadow-md">
                                      {realtorGroup.count} Properties <span className="text-gray-700 group-open:hidden ml-2">&#9660;</span><span className="text-gray-700 group-open:inline ml-2">&#9650;</span>
                                    </Badge>
                                  </summary>
                                  <div className="p-4 sm:p-6 bg-white rounded-b-xl border-t border-gray-200">
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                      {realtorGroup.properties.map((property: any, idx: number) => {
                                        const meta = getPropertyMetadata(property);
                                        return (
                                          <Card key={property.id || idx} className="bg-white p-4 border border-black/20 rounded-lg shadow-md hover:border-gold transition-all">
                                            <p className="font-bold text-black truncate mb-1">{meta.address || `Property #${property.id}`}</p>
                                            <p className="text-gold font-extrabold text-lg">${meta.price ? meta.price.toLocaleString() : 'N/A'}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              <Badge className="bg-black text-gold font-semibold text-xs">{meta.listing_status || 'Available'}</Badge>
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button variant="outline" size="xs" className="h-6 px-2 bg-red-50 text-red-600 border border-red-400 hover:bg-red-100">
                                                    <Trash2 className="h-3 w-3 mr-1" /> Unassign
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-white border-2 border-black shadow-2xl rounded-xl">
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-black font-extrabold text-xl flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-red-600" /> Confirm Unassign</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-gray-700">
                                                      Are you sure you want to unassign <span className="font-semibold text-black">{meta.address || `Property #${property.id}`}</span> from <span className="font-semibold text-black">{realtorGroup.realtor_name}</span>? It will become unassigned and appear in the 'Assign Properties' tab.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel className="border-2 border-black hover:bg-gray-100 text-black font-semibold">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction 
                                                      onClick={() => handleUnassignProperties([property.id])}
                                                      className="bg-gold hover:bg-yellow-500 text-black font-black shadow-md"
                                                    >
                                                      Unassign Property
                                                    </AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            </div>
                                          </Card>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </details>
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

            {/* --- Properties Grid (Realtor/PM) --- */}
            <TabsContent value="properties">
              <motion.div 
                className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {loadingApartments ? (
                  <p className="text-black font-semibold text-center py-10 sm:col-span-full">Loading properties...</p>
                ) : apartments.length === 0 ? (
                  <p className="text-black/70 font-semibold text-center py-10 sm:col-span-full">No properties found. Check your assignments or upload new properties.</p>
                ) : (
                  apartments.map((apt, idx) => {
                    const meta = getPropertyMetadata(apt);
                    return (
                      <motion.div
                        key={apt.id || idx}
                        variants={itemVariants}
                        whileHover={{ 
                          y: -8,
                          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.2)',
                          transition: { duration: 0.3 }
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card className="relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden h-full border-2 border-black hover:border-gold">
                          <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 rounded-t-[10px]">
                            <motion.img
                              src={meta.image_url || "/images/properties/default.jpg"}
                              alt={`Property at ${meta.address}`}
                              loading="lazy"
                              className="h-full w-full object-cover transition-all duration-500 transform group-hover:scale-110"
                            />
                            {/* Gradient Overlay for Text Visibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                            {meta.listing_status && (
                              <div className="absolute top-3 right-3 z-10">
                                <Badge 
                                  className={`text-xs font-black border-2 border-black shadow-lg ${
                                    meta.listing_status === 'Available' 
                                      ? 'bg-gold text-black' 
                                      : 'bg-white text-black'
                                  }`}
                                >
                                  {meta.listing_status}
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <CardContent className="relative z-10 space-y-4 p-4 sm:p-5">
                            {/* Title & Price */}
                            <div className="pb-3 border-b border-gray-200">
                              <CardTitle className="text-black text-xl font-extrabold truncate mb-1">
                                {meta.address || `Property #${apt.id}`}
                              </CardTitle>
                              <div className="text-3xl font-black text-gold">
                                ${meta.price ? meta.price.toLocaleString() : "N/A"}
                              </div>
                            </div>

                            {/* Key Specs */}
                            <div className="grid grid-cols-3 gap-3 text-sm font-bold text-black/90">
                              <div className="flex items-center gap-1.5 bg-gray-100 border border-black/20 p-2 rounded-lg">
                                <Bed className="h-4 w-4 text-gold" /> <span className="text-black">{meta.bedrooms || 0}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-gray-100 border border-black/20 p-2 rounded-lg">
                                <Bath className="h-4 w-4 text-gold" /> <span className="text-black">{meta.bathrooms || 0}</span>
                              </div>
                              {meta.square_feet && (
                                <div className="flex items-center gap-1.5 bg-gray-100 border border-black/20 p-2 rounded-lg">
                                  <Square className="h-4 w-4 text-gold" /> <span className="text-black">{meta.square_feet}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Features and Agent */}
                            <div className="space-y-3 pt-2 border-t border-gray-200">
                                {meta.agent && (
                                    <div className="bg-gray-100 rounded-lg p-2 border border-black/20">
                                        <p className="text-xs font-semibold text-gray-600 mb-1">Assigned Agent:</p>
                                        <p className="font-bold text-black text-sm">{meta.agent.name}</p>
                                    </div>
                                )}
                                {meta.features && meta.features.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-1">Key Features:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {meta.features.slice(0, 3).map((feature: string, fIdx: number) => (
                                                <Badge key={fIdx} variant="outline" className="text-xs font-medium border-gold/50 bg-gold/10 text-black">
                                                    {feature}
                                                </Badge>
                                            ))}
                                            {meta.features.length > 3 && <span className="text-xs text-gray-500 font-medium">+{meta.features.length - 3}</span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <Button className="w-full bg-black hover:bg-gray-800 text-gold font-black border-2 border-gold shadow-lg transition-all mt-3">
                                <Eye className="h-4 w-4 mr-2" /> View Details
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </TabsContent>

            {/* --- Bookings Table --- */}
            <TabsContent value="bookings">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-white border-2 border-black rounded-xl shadow-2xl">
                  <CardHeader className="bg-black/95 rounded-t-[10px] border-b-2 border-gold p-4 sm:p-6">
                    <CardTitle className="text-white text-xl sm:text-2xl font-extrabold flex items-center gap-3">
                      <div className="p-2 bg-gold rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                        <Calendar className="h-5 w-5 text-black" />
                      </div>
                      Your Bookings
                    </CardTitle>
                    <p className="text-sm text-gray-400 mt-2 ml-[44px]">
                      All your active and past property viewings.
                    </p>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {loadingBookings ? (
                      <p className="text-black font-semibold text-center py-8">Loading bookings...</p>
                    ) : bookings.length === 0 ? (
                      <p className="text-gray-700 font-semibold text-center py-8">No bookings found.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border-2 border-black bg-white shadow-lg">
                        <Table>
                          <TableHeader className="bg-gold">
                            <TableRow className="border-b-2 border-black">
                              <TableHead className="font-extrabold text-black py-3 sm:py-4 px-2 sm:px-4">Booking ID</TableHead>
                              <TableHead className="font-extrabold text-black py-3 sm:py-4 px-2 sm:px-4">Property</TableHead>
                              <TableHead className="font-extrabold text-black py-3 sm:py-4 px-2 sm:px-4">Date</TableHead>
                              <TableHead className="font-extrabold text-black py-3 sm:py-4 px-2 sm:px-4">Time</TableHead>
                              <TableHead className="font-extrabold text-black py-3 sm:py-4 px-2 sm:px-4">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bookings.map((b, idx) => (
                              <motion.tr
                                key={b.id || idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                className="hover:bg-gold/20 transition-all duration-200 group border-b border-black/10 last:border-b-0"
                              >
                                <TableCell className="font-extrabold text-black py-3 sm:py-4 px-2 sm:px-4">
                                  {b.id}
                                </TableCell>
                                <TableCell className="text-black/90 py-3 sm:py-4 px-2 sm:px-4 font-semibold">{b.property || b.property_name || b.address}</TableCell>
                                <TableCell className="text-black/90 py-3 sm:py-4 px-2 sm:px-4 font-semibold">
                                    <div className="flex items-center gap-1"><CalendarDays className="h-4 w-4 text-black/50" />{b.date}</div>
                                </TableCell>
                                <TableCell className="text-black/90 py-3 sm:py-4 px-2 sm:px-4 font-semibold">{b.time}</TableCell>
                                <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                                  <Badge
                                    className={`font-black border-2 border-black/50 shadow-md ${
                                      b.status === "Confirmed"
                                        ? "bg-black text-gold"
                                        : "bg-gray-200 text-black"
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

            {/* --- Conversations (Recordings) --- */}
            <TabsContent value="conversations">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-white border-2 border-black rounded-xl shadow-2xl">
                  <CardHeader className="bg-black/95 rounded-t-[10px] border-b-2 border-gold p-4 sm:p-6">
                    <CardTitle className="text-white text-xl sm:text-2xl font-extrabold flex items-center gap-3">
                      <div className="p-2 bg-gold rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                        <Music className="h-5 w-5 text-black" />
                      </div>
                      Call Recordings (Conversations)
                    </CardTitle>
                    <p className="text-sm text-gray-400 mt-2 ml-[44px]">
                      Listen to your recorded calls with leads and clients.
                    </p>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {loadingRecordings ? (
                      <p className="text-black font-semibold text-center py-8">Loading recordings...</p>
                    ) : recordings.length === 0 ? (
                      <p className="text-gray-700 font-semibold text-center py-8">No recordings available.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border-2 border-black bg-white shadow-lg">
                        <Table>
                          <TableHeader className="bg-gold">
                            <TableRow className="border-b-2 border-black">
                              <TableHead className="font-extrabold text-black py-3 sm:py-4 px-2 sm:px-4 w-[30%]">Call</TableHead>
                              <TableHead className="font-extrabold text-black py-3 sm:py-4 px-2 sm:px-4 w-[70%]">Recording</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recordings.map((rec, idx) => (
                              <motion.tr
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                className="hover:bg-gold/20 transition-all duration-200 group border-b border-black/10 last:border-b-0"
                              >
                                <TableCell className="font-extrabold text-black py-3 sm:py-4 px-2 sm:px-4">
                                  Call #{idx + 1}
                                </TableCell>
                                <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                                  <audio controls className="w-full h-8 bg-black rounded-full">
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

            {/* --- Chats --- */}
            <TabsContent value="chats">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-white border-2 border-black rounded-xl shadow-2xl">
                  <CardHeader className="bg-black/95 rounded-t-[10px] border-b-2 border-gold p-4 sm:p-6">
                    <CardTitle className="text-white text-xl sm:text-2xl font-extrabold flex items-center gap-3">
                      <div className="p-2 bg-gold rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                        <Mail className="h-5 w-5 text-black" />
                      </div>
                      Customer Chats History
                    </CardTitle>
                    <p className="text-sm text-gray-400 mt-2 ml-[44px]">
                      View and track your SMS/chat conversations with clients.
                    </p>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {loadingChats ? (
                      <p className="text-black font-semibold text-center py-8">Loading chats...</p>
                    ) : Object.keys(chats).length === 0 ? (
                      <p className="text-gray-700 font-semibold text-center py-8">No chats available.</p>
                    ) : (
                      <div className="flex flex-col items-center gap-8 overflow-x-hidden">
                        {Object.entries(chats).map(([customer, messages]: any, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="border-4 border-black rounded-2xl p-4 sm:p-6 bg-gray-50 shadow-2xl w-full max-w-[700px] mx-auto transition-all hover:border-gold"
                          >
                            <h3 className="text-lg sm:text-xl font-extrabold text-black mb-4 text-center border-b-2 border-gold pb-3">
                              <span className="bg-gold text-black px-3 py-1 rounded-full shadow-md mr-2 font-black">CHAT</span> with {customer}
                            </h3>
                            <div className="h-64 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gold scrollbar-track-gray-200">
                              {messages.map((msg: any, i: number) => (
                                <div
                                  key={i}
                                  className={`flex ${
                                    msg.sender === "realtor"
                                      ? "justify-end"
                                      : "justify-start"
                                  }`}
                                >
                                  <motion.div
                                    initial={{ opacity: 0, x: msg.sender === "realtor" ? 50 : -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ type: "spring", stiffness: 100, damping: 12, delay: i * 0.05 }}
                                    className={`px-4 py-2 rounded-2xl max-w-[75%] text-sm shadow-xl border-2 ${
                                      msg.sender === "realtor"
                                        ? "bg-gold text-black border-black rounded-br-sm"
                                        : "bg-white text-black border-black rounded-bl-sm"
                                    }`}
                                  >
                                    <p className="font-medium">{msg.message}</p>
                                    <div className={`text-[10px] mt-1 font-bold ${msg.sender === "realtor" ? "text-black/60" : "text-gray-500"}`}>
                                      {msg.timestamp
                                        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(msg.timestamp).toLocaleDateString()
                                        : "N/A"}
                                    </div>
                                  </motion.div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
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