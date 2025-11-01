import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, MapPin, Bed, Bath, Ruler, TrendingUp, Calendar, Eye, Music, Phone, Users, UserPlus, Settings, Building2, CheckSquare, Square, CalendarDays, User, ListChecks, RefreshCw, Mail, Calendar as CalendarIcon, Info, X, AlertTriangle, Edit2, Trash2, CheckCircle2 } from "lucide-react";
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


  // Basic SEO for SPA route
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


  // // Placeholder properties (capacity up to 100)
  // const properties = useMemo(() => (
  //   Array.from({ length: 100 }, (_, i) => ({
  //     id: i + 1,
  //     title: `Premium Residence #${i + 1}`,
  //     price: 350000 + (i * 1250),
  //     location: i % 3 === 0 ? "Downtown" : i % 3 === 1 ? "Uptown" : "Waterfront",
  //     beds: (i % 5) + 1,
  //     baths: (i % 3) + 1,
  //     sqft: 800 + (i * 15),
  //     type: i % 2 === 0 ? "For Sale" : "For Rent",
  //     featured: i % 7 === 0,
  //     image: `/images/properties/property-${(i % 6) + 1}.jpg`,
  //   }))
  // ), []);


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

  

  return (
    <main className="min-h-screen dynamic-gradient">
      {/* Enhanced Header - Clear & User-Friendly */}
      <motion.header 
        className="relative overflow-hidden bg-gradient-to-br from-navy via-navy/95 to-navy/90 border-b border-white/10"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-6 pt-8 pb-8">
          <motion.div 
            className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-4 flex-1">
              <motion.div 
                className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/20"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Home className="h-7 w-7 text-gold" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-3xl lg:text-4xl font-bold text-white mb-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {userType === "property_manager" ? "Property Manager" : "My"} Dashboard
                </motion.h1>
                <motion.p 
                  className="text-white/80 text-sm lg:text-base"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  {userType === "property_manager" 
                    ? "Welcome back! Manage your properties and team from here."
                    : "Welcome back! View your assigned properties and bookings."
                  }
                </motion.p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-2 lg:gap-3"
            >
              <Button 
                asChild 
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 backdrop-blur-sm"
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
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 backdrop-blur-sm"
                size="sm"
              >
                <Link to="/uploadpage">
                  <Building2 className="h-4 w-4 mr-2" />
                  Upload
                </Link>
              </Button>
              <Button 
                onClick={handleBuyNumber} 
                disabled={loading} 
                className="bg-gold hover:bg-gold/90 text-navy font-semibold shadow-lg hover:shadow-xl transition-all"
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
          </motion.div>
          {myNumber && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="mt-4 pt-4 border-t border-white/10"
            >
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="h-4 w-4 text-gold" />
                <span className="text-sm">Your Phone Number: <span className="font-semibold text-gold">{myNumber}</span></span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Enhanced Stats Cards */}
      <motion.section 
        className="container mx-auto px-6 -mt-6 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {userType === "property_manager" ? (
            <>
              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-accent/30"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Realtors</p>
                    <motion.p 
                      className="text-3xl font-bold text-navy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" as const }}
                    >
                      {realtors.length}
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">Active team members</p>
                  </div>
                  <motion.div 
                    className="p-4 bg-blue-50 rounded-xl"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                  >
                    <Users className="h-7 w-7 text-blue-600" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-accent/30"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Properties</p>
                    <motion.p 
                      className="text-3xl font-bold text-navy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.0, type: "spring" as const }}
                    >
                      {apartments.length}
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">In your portfolio</p>
                  </div>
                  <motion.div 
                    className="p-4 bg-amber-50 rounded-xl"
                    whileHover={{ rotate: -15, scale: 1.1 }}
                  >
                    <TrendingUp className="h-7 w-7 text-amber-600" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-accent/30"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Active Bookings</p>
                    <motion.p 
                      className="text-3xl font-bold text-navy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" as const }}
                    >
                      {bookings.length}
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">Scheduled viewings</p>
                  </div>
                  <motion.div 
                    className="p-4 bg-green-50 rounded-xl"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                  >
                    <Calendar className="h-7 w-7 text-green-600" />
                  </motion.div>
                </div>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-accent/30"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">My Properties</p>
                    <motion.p 
                      className="text-3xl font-bold text-navy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" as const }}
                    >
                      {apartments.length}
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">Assigned to you</p>
                  </div>
                  <motion.div 
                    className="p-4 bg-blue-50 rounded-xl"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                  >
                    <TrendingUp className="h-7 w-7 text-blue-600" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-accent/30"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">My Bookings</p>
                    <motion.p 
                      className="text-3xl font-bold text-navy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.0, type: "spring" as const }}
                    >
                      {bookings.length}
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">Scheduled viewings</p>
                  </div>
                  <motion.div 
                    className="p-4 bg-green-50 rounded-xl"
                    whileHover={{ rotate: -15, scale: 1.1 }}
                  >
                    <Calendar className="h-7 w-7 text-green-600" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-accent/30"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Property Views</p>
                    <motion.p 
                      className="text-3xl font-bold text-navy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" as const }}
                    >
                      1,247
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">Total views this month</p>
                  </div>
                  <motion.div 
                    className="p-4 bg-purple-50 rounded-xl"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                  >
                    <Eye className="h-7 w-7 text-purple-600" />
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </motion.section>

      {/* Content */}
      <section className="container mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Tabs defaultValue={userType === "property_manager" ? "realtors" : "properties"} className="w-full">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <TabsList className="mb-8 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-1.5 shadow-md">
                {userType === "property_manager" && (
                  <TabsTrigger 
                    value="realtors" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-4 py-2 font-medium transition-all"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Realtors
                  </TabsTrigger>
                )}
                {userType === "property_manager" && (
                  <>
                    <TabsTrigger 
                      value="assign-properties" 
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-4 py-2 font-medium transition-all"
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Assign Properties
                    </TabsTrigger>
                    <TabsTrigger 
                      value="view-assignments" 
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-4 py-2 font-medium transition-all"
                    >
                      <ListChecks className="h-4 w-4 mr-2" />
                      View Assignments
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger 
                  value="properties" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-4 py-2 font-medium transition-all"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Properties
                </TabsTrigger>
                <TabsTrigger 
                  value="bookings" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-4 py-2 font-medium transition-all"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Bookings
                </TabsTrigger>
                <TabsTrigger 
                  value="conversations" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-4 py-2 font-medium transition-all"
                >
                  <Music className="h-4 w-4 mr-2" />
                  Conversations
                </TabsTrigger>
                <TabsTrigger 
                  value="chats" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-4 py-2 font-medium transition-all"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Chats
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
                  <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-navy text-2xl flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-600 rounded-lg text-white">
                              <Users className="h-5 w-5" />
                            </div>
                            Manage Realtors
                          </CardTitle>
                          <p className="text-sm text-gray-600 ml-14">
                            Add and manage your realtor team members. Create accounts for realtors so they can access their assigned properties.
                          </p>
                        </div>
                        <Button 
                          onClick={() => setShowAddRealtor(!showAddRealtor)}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add New Realtor
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {showAddRealtor && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6 p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50"
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <UserPlus className="h-5 w-5 text-blue-600" />
                            <h3 className="text-xl font-bold text-navy">Add New Realtor to Your Team</h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">Fill in the details below to create a new realtor account. They'll receive login credentials.</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="text-sm font-semibold text-gray-700 mb-2 block">Full Name</label>
                              <input
                                type="text"
                                value={newRealtor.name}
                                onChange={(e) => setNewRealtor({...newRealtor, name: e.target.value})}
                                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                placeholder="John Doe"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-700 mb-2 block">Email Address</label>
                              <input
                                type="email"
                                value={newRealtor.email}
                                onChange={(e) => setNewRealtor({...newRealtor, email: e.target.value})}
                                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                placeholder="john.doe@company.com"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-700 mb-2 block">Temporary Password</label>
                              <input
                                type="password"
                                value={newRealtor.password}
                                onChange={(e) => setNewRealtor({...newRealtor, password: e.target.value})}
                                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                placeholder="Choose a secure password"
                              />
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button 
                              onClick={addRealtor} 
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Create Realtor Account
                            </Button>
                            <Button 
                              onClick={() => setShowAddRealtor(false)}
                              variant="outline"
                              className="border-gray-300 hover:bg-gray-50"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {loadingRealtors ? (
                        <p className="text-muted-foreground">Loading realtors...</p>
                      ) : realtors.length === 0 ? (
                        <p className="text-muted-foreground">No realtors found. Add your first realtor above.</p>
                      ) : (
                        <div className="overflow-hidden rounded-xl border-2 border-gray-200 bg-white">
                          <Table>
                            <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                              <TableRow className="border-b-2 border-gray-200">
                                <TableHead className="font-bold text-gray-700 py-4">Name</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4">Email</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4">Status</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {realtors.map((realtor, idx) => (
                                <motion.tr
                                  key={realtor.id || idx}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                                  className="hover:bg-blue-50 transition-all duration-200 group border-b border-gray-100"
                                >
                                  <TableCell className="font-semibold text-gray-900 py-4 group-hover:text-blue-700 transition-colors">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-blue-600" />
                                      {realtor.name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-gray-700 py-4">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-gray-400" />
                                      {realtor.email}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <Badge
                                      variant={realtor.status === "active" ? "default" : "secondary"}
                                      className={
                                        realtor.status === "active"
                                          ? "bg-green-100 text-green-800 border-green-300 font-semibold"
                                          : "bg-gray-100 text-gray-800 border-gray-300 font-semibold"
                                      }
                                    >
                                      {realtor.status || "Active"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="outline" className="border-gray-300 hover:bg-blue-50 hover:border-blue-400">
                                        <Settings className="h-4 w-4 mr-1" />
                                        Settings
                                      </Button>
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
                  <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl border-b border-gray-200">
                      <CardTitle className="text-navy text-2xl flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-600 rounded-lg text-white">
                          <CheckSquare className="h-5 w-5" />
                        </div>
                        Assign Properties to Realtors
                      </CardTitle>
                      <p className="text-sm text-gray-600 ml-14">
                        Select properties and assign them to a realtor. Assigned properties will appear on the realtor's dashboard.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Realtor Selection */}
                      <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-600" />
                          <label className="text-base font-semibold text-navy">Select Realtor to Assign Properties:</label>
                        </div>
                        <select 
                          value={selectedRealtor || ''} 
                          onChange={(e) => setSelectedRealtor(e.target.value ? Number(e.target.value) : null)}
                          className="w-full md:w-96 p-4 border-2 border-gray-300 rounded-xl bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium transition-all"
                        >
                          <option value="">👉 Choose a realtor from the list...</option>
                          {realtors.map(realtor => (
                            <option key={realtor.id} value={realtor.id}>
                              {realtor.name} - {realtor.email}
                            </option>
                          ))}
                        </select>
                        {selectedRealtor && (
                          <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">
                              Selected: {realtors.find(r => r.id === selectedRealtor)?.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Properties Section */}
                      <div className="space-y-4">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-navy">
                                Available Properties ({selectedProperties.length} selected)
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Properties you own that haven't been assigned to realtors yet
                              </p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button 
                                onClick={handleSelectAll}
                                variant="outline"
                                size="sm"
                                className="bg-accent/10 hover:bg-accent/20"
                              >
                                {selectedProperties.length === availablePropertiesForAssignment.length ? 'Deselect All' : 'Select All'}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Enhanced Bulk Selection Buttons */}
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                              Quick Selection Tools:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button 
                                onClick={() => handleBulkSelect(10, true)}
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-blue-50 hover:border-blue-400 text-blue-700 font-medium border-blue-300"
                              >
                                First 10
                              </Button>
                              <Button 
                                onClick={() => handleBulkSelect(20, true)}
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-blue-50 hover:border-blue-400 text-blue-700 font-medium border-blue-300"
                              >
                                First 20
                              </Button>
                              <Button 
                                onClick={() => handleBulkSelect(50, true)}
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-blue-50 hover:border-blue-400 text-blue-700 font-medium border-blue-300"
                              >
                                First 50
                              </Button>
                              <div className="w-px bg-gray-300 mx-1"></div>
                              <Button 
                                onClick={() => handleBulkSelect(10, false)}
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-amber-50 hover:border-amber-400 text-amber-700 font-medium border-amber-300"
                              >
                                Last 10
                              </Button>
                              <Button 
                                onClick={() => handleBulkSelect(20, false)}
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-amber-50 hover:border-amber-400 text-amber-700 font-medium border-amber-300"
                              >
                                Last 20
                              </Button>
                              <Button 
                                onClick={() => handleBulkSelect(50, false)}
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-amber-50 hover:border-amber-400 text-amber-700 font-medium border-amber-300"
                              >
                                Last 50
                              </Button>
                            </div>
                          </div>
                        </div>

                        {loadingAssignmentProperties ? (
                          <p className="text-muted-foreground py-8 text-center">Loading properties...</p>
                        ) : availablePropertiesForAssignment.length === 0 ? (
                          <div className="py-8 text-center border rounded-lg bg-muted/30">
                            <p className="text-muted-foreground">
                              No properties available to assign. All properties may already be assigned to realtors.
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {availablePropertiesForAssignment.map((property, idx) => {
                              const meta = getPropertyMetadata(property);
                              return (
                                <motion.div
                                  key={property.id || idx}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                                  whileHover={{ y: -4 }}
                                >
                                  <Card 
                                    className={`cursor-pointer transition-all duration-300 rounded-xl ${
                                      selectedProperties.includes(property.id) 
                                        ? 'border-blue-500 border-3 bg-blue-50 shadow-lg scale-[1.02]' 
                                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                                    }`}
                                    onClick={() => handlePropertyToggle(property.id)}
                                  >
                                    <div className="flex items-start p-5 gap-4">
                                      <div className="flex-shrink-0 mt-1">
                                        <input
                                          type="checkbox"
                                          checked={selectedProperties.includes(property.id)}
                                          onChange={() => handlePropertyToggle(property.id)}
                                          className="h-5 w-5 cursor-pointer accent-blue-600 rounded border-2 border-gray-300 checked:bg-blue-600"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0 space-y-3">
                                        <div>
                                          <h4 className="font-bold text-lg text-navy truncate mb-1">
                                            {meta.address || `Property #${property.id}`}
                                          </h4>
                                          {meta.listing_id && (
                                            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-fit">
                                              <Info className="h-3 w-3" />
                                              MLS: {meta.listing_id}
                                            </div>
                                          )}
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <p className="text-2xl font-bold text-blue-600">
                                              ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                            </p>
                                            {meta.listing_status && (
                                              <Badge 
                                                variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                                                className={`text-xs ${
                                                  meta.listing_status === 'Available' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                              >
                                                {meta.listing_status}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex flex-wrap gap-3 text-sm font-medium text-gray-700">
                                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                              <Bed className="h-4 w-4 text-blue-600" /> {meta.bedrooms || 0} Beds
                                            </span>
                                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                              <Bath className="h-4 w-4 text-blue-600" /> {meta.bathrooms || 0} Baths
                                            </span>
                                            {meta.square_feet && (
                                              <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                                <Square className="h-4 w-4 text-blue-600" /> {meta.square_feet} sqft
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {meta.property_type && (
                                              <Badge variant="outline" className="text-xs font-semibold border-blue-300 text-blue-700">
                                                {meta.property_type}
                                              </Badge>
                                            )}
                                          </div>
                                          {meta.features && meta.features.length > 0 && (
                                            <div className="pt-2 border-t border-gray-200">
                                              <p className="text-xs font-semibold text-gray-600 mb-2">Key Features:</p>
                                              <div className="flex flex-wrap gap-1.5">
                                                {meta.features.slice(0, 3).map((feature: string, fIdx: number) => (
                                                  <Badge key={fIdx} variant="outline" className="text-xs bg-green-50 border-green-300 text-green-700">
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
                                            <div className="pt-2 border-t border-gray-200">
                                              <p className="text-xs font-semibold text-gray-600 mb-1">Agent:</p>
                                              <p className="text-sm font-medium text-gray-800 truncate">
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
                      <div className="pt-6 border-t-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              {selectedProperties.length > 0 && selectedRealtor ? (
                                <span className="flex items-center gap-2 text-green-700">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Ready to assign <strong>{selectedProperties.length}</strong> {selectedProperties.length === 1 ? 'property' : 'properties'} to {realtors.find(r => r.id === selectedRealtor)?.name}
                                </span>
                              ) : (
                                <span className="text-gray-600">
                                  {!selectedRealtor && selectedProperties.length > 0 
                                    ? "⚠️ Please select a realtor to assign properties"
                                    : selectedRealtor && selectedProperties.length === 0
                                    ? "⚠️ Please select at least one property to assign"
                                    : "👉 Select a realtor and properties to begin"}
                                </span>
                              )}
                            </p>
                          </div>
                          <Button 
                            onClick={assignProperties} 
                            disabled={assigningProperties || !selectedRealtor || selectedProperties.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* View Assignments - Property Manager Only */}
            {userType === "property_manager" && (
              <TabsContent value="view-assignments">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-navy text-2xl flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-600 rounded-lg text-white">
                              <ListChecks className="h-5 w-5" />
                            </div>
                            Property Assignments Overview
                          </CardTitle>
                          <p className="text-sm text-gray-600 ml-14">
                            See which properties are assigned to which realtors, and manage unassigned properties
                          </p>
                        </div>
                        <Button 
                          onClick={() => { fetchAssignments(); fetchPropertiesForAssignment(); }}
                          variant="outline"
                          size="sm"
                          className="bg-white hover:bg-gray-50 border-gray-300"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Data
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingAssignments ? (
                        <p className="text-muted-foreground py-8 text-center">Loading assignments...</p>
                      ) : !assignmentsData ? (
                        <p className="text-muted-foreground py-8 text-center">No assignment data available</p>
                      ) : (
                        <div className="space-y-8">
                          {/* Enhanced Summary Cards */}
                          {assignmentsData.summary && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Card className="p-6 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Properties</p>
                                    <p className="text-3xl font-bold text-navy">
                                      {assignmentsData.summary.total_properties || 0}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">All properties</p>
                                  </div>
                                  <div className="p-3 bg-blue-50 rounded-lg">
                                    <Building2 className="h-6 w-6 text-blue-600" />
                                  </div>
                                </div>
                              </Card>
                              <Card className="p-6 bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-xl hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Unassigned</p>
                                    <p className="text-3xl font-bold text-amber-600">
                                      {assignmentsData.summary.unassigned_count || 0}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Need assignment</p>
                                  </div>
                                  <div className="p-3 bg-amber-50 rounded-lg">
                                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                                  </div>
                                </div>
                              </Card>
                              <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Assigned</p>
                                    <p className="text-3xl font-bold text-green-600">
                                      {assignmentsData.summary.assigned_count || 0}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">To realtors</p>
                                  </div>
                                  <div className="p-3 bg-green-50 rounded-lg">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                  </div>
                                </div>
                              </Card>
                            </div>
                          )}

                          {/* Unassigned Properties */}
                          {assignmentsData.unassigned_properties && assignmentsData.unassigned_properties.length > 0 && (
                            <div className="bg-amber-50/30 rounded-xl p-6 border border-amber-200">
                              <h3 className="text-xl font-bold text-navy mb-6 flex items-center gap-3">
                                <div className="p-2 bg-amber-500 rounded-lg text-white">
                                  <AlertTriangle className="h-5 w-5" />
                                </div>
                                Unassigned Properties
                                <Badge className="bg-amber-500 text-white text-base px-3 py-1">
                                  {assignmentsData.unassigned_properties.length}
                                </Badge>
                              </h3>
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {assignmentsData.unassigned_properties.map((property: any, idx: number) => {
                                  const meta = getPropertyMetadata(property);
                                  return (
                                    <Card key={property.id || idx} className="bg-white hover:shadow-xl transition-all duration-300 border border-gray-200 rounded-xl hover:border-amber-300">
                                      <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                          <CardTitle className="text-sm text-navy">
                                            {meta.address || `Property #${property.id}`}
                                          </CardTitle>
                                          <Badge variant="outline" className="bg-yellow-50">Unassigned</Badge>
                                        </div>
                                        {meta.listing_id && (
                                          <p className="text-xs text-muted-foreground mt-1">MLS: {meta.listing_id}</p>
                                        )}
                                      </CardHeader>
                                      <CardContent className="space-y-3 text-sm">
                                        <p className="font-semibold text-gold text-lg">
                                          ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                        </p>
                                        <div className="flex flex-wrap gap-2 text-muted-foreground">
                                          <span><Bed className="h-3 w-3 inline" /> {meta.bedrooms || 0}</span>
                                          <span><Bath className="h-3 w-3 inline" /> {meta.bathrooms || 0}</span>
                                          {meta.square_feet && <span><Square className="h-3 w-3 inline" /> {meta.square_feet} sqft</span>}
                                        </div>
                                        {meta.property_type && <Badge variant="outline" className="text-xs">{meta.property_type}</Badge>}
                                        
                                        {/* Status Update */}
                                        <div className="flex items-center gap-2 pt-2 border-t">
                                          <span className="text-xs font-medium text-muted-foreground">Status:</span>
                                          <Select 
                                            value={meta.listing_status || 'Available'} 
                                            onValueChange={(value) => handleUpdatePropertyStatus(property.id, value)}
                                          >
                                            <SelectTrigger className="h-8 text-xs flex-1">
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

                                        {/* Agent Section with Remove */}
                                        {meta.agent && (
                                          <div className="pt-2 border-t">
                                            <div className="flex items-start justify-between mb-2">
                                              <p className="text-xs font-semibold text-muted-foreground">Agent:</p>
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                                                    <X className="h-3 w-3" />
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>Remove Agent?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                      Are you sure you want to remove {meta.agent.name} from this property? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction 
                                                      onClick={() => handleRemoveAgent(property.id)}
                                                      className="bg-red-600 hover:bg-red-700"
                                                    >
                                                      Remove Agent
                                                    </AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            </div>
                                            <div className="space-y-1 text-xs">
                                              <p className="font-medium">{meta.agent.name}</p>
                                              {meta.agent.email && (
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                  <Mail className="h-3 w-3" />
                                                  <span className="truncate">{meta.agent.email}</span>
                                                </div>
                                              )}
                                              {meta.agent.phone && (
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                  <Phone className="h-3 w-3" />
                                                  <span>{meta.agent.phone}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {meta.features && meta.features.length > 0 && (
                                          <div className="flex flex-wrap gap-1 pt-2 border-t">
                                            {meta.features.slice(0, 2).map((f: string, i: number) => (
                                              <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                                            ))}
                                            {meta.features.length > 2 && <span className="text-xs text-muted-foreground">+{meta.features.length - 2}</span>}
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
                            <div className="bg-green-50/30 rounded-xl p-6 border border-green-200">
                              <h3 className="text-xl font-bold text-navy mb-6 flex items-center gap-3">
                                <div className="p-2 bg-green-600 rounded-lg text-white">
                                  <Users className="h-5 w-5" />
                                </div>
                                Assigned Properties by Realtor
                              </h3>
                              {Object.values(assignmentsData.assigned_properties).map((realtorGroup: any) => (
                                <Card key={realtorGroup.realtor_id} className="mb-6 bg-white shadow-md border border-gray-200 rounded-xl">
                                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <CardTitle className="text-navy text-xl flex items-center gap-2">
                                          <User className="h-5 w-5 text-green-600" />
                                          {realtorGroup.realtor_name}
                                        </CardTitle>
                                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                          <Mail className="h-3 w-3" />
                                          {realtorGroup.realtor_email}
                                        </p>
                                      </div>
                                      <Badge className="bg-green-600 text-white text-base px-4 py-2 shadow-md">
                                        {realtorGroup.count} {realtorGroup.count === 1 ? 'Property' : 'Properties'}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                      {realtorGroup.properties.map((property: any, idx: number) => {
                                        const meta = getPropertyMetadata(property);
                                        return (
                                          <Card key={property.id || idx} className="bg-white hover:shadow-xl transition-all duration-300 border border-gray-200 rounded-xl hover:border-green-300">
                                            <CardHeader className="pb-2">
                                              <CardTitle className="text-sm text-navy">
                                                {meta.address || `Property #${property.id}`}
                                              </CardTitle>
                                              {meta.listing_id && (
                                                <p className="text-xs text-muted-foreground mt-1">MLS: {meta.listing_id}</p>
                                              )}
                                            </CardHeader>
                                            <CardContent className="space-y-3 text-sm">
                                              <div className="flex items-center justify-between">
                                                <p className="font-semibold text-gold text-lg">
                                                  ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                                </p>
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                                                      <Trash2 className="h-3 w-3 mr-1" />
                                                      Unassign
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>Unassign Property?</AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                        Are you sure you want to unassign this property from {realtorGroup.realtor_name}? The property will become available for reassignment.
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                      <AlertDialogAction 
                                                        onClick={() => handleUnassignProperties([property.id])}
                                                        className="bg-red-600 hover:bg-red-700"
                                                      >
                                                        Unassign Property
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                              </div>
                                              <div className="flex flex-wrap gap-2 text-muted-foreground">
                                                <span><Bed className="h-3 w-3 inline" /> {meta.bedrooms || 0}</span>
                                                <span><Bath className="h-3 w-3 inline" /> {meta.bathrooms || 0}</span>
                                                {meta.square_feet && <span><Square className="h-3 w-3 inline" /> {meta.square_feet} sqft</span>}
                                              </div>
                                              {meta.property_type && <Badge variant="outline" className="text-xs">{meta.property_type}</Badge>}
                                              
                                              {/* Status Update */}
                                              <div className="flex items-center gap-2 pt-2 border-t">
                                                <span className="text-xs font-medium text-muted-foreground">Status:</span>
                                                <Select 
                                                  value={meta.listing_status || 'Available'} 
                                                  onValueChange={(value) => handleUpdatePropertyStatus(property.id, value)}
                                                >
                                                  <SelectTrigger className="h-8 text-xs flex-1">
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

                                              {/* Agent Section with Remove */}
                                              {meta.agent && (
                                                <div className="pt-2 border-t">
                                                  <div className="flex items-start justify-between mb-2">
                                                    <p className="text-xs font-semibold text-muted-foreground">Agent:</p>
                                                    <AlertDialog>
                                                      <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                                                          <X className="h-3 w-3" />
                                                        </Button>
                                                      </AlertDialogTrigger>
                                                      <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                          <AlertDialogTitle>Remove Agent?</AlertDialogTitle>
                                                          <AlertDialogDescription>
                                                            Are you sure you want to remove {meta.agent.name} from this property? This action cannot be undone.
                                                          </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                          <AlertDialogAction 
                                                            onClick={() => handleRemoveAgent(property.id)}
                                                            className="bg-red-600 hover:bg-red-700"
                                                          >
                                                            Remove Agent
                                                          </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                      </AlertDialogContent>
                                                    </AlertDialog>
                                                  </div>
                                                  <div className="space-y-1 text-xs">
                                                    <p className="font-medium">{meta.agent.name}</p>
                                                    {meta.agent.email && (
                                                      <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Mail className="h-3 w-3" />
                                                        <span className="truncate">{meta.agent.email}</span>
                                                      </div>
                                                    )}
                                                    {meta.agent.phone && (
                                                      <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{meta.agent.phone}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                              {meta.features && meta.features.length > 0 && (
                                                <div className="flex flex-wrap gap-1 pt-2 border-t">
                                                  {meta.features.slice(0, 2).map((f: string, i: number) => (
                                                    <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                                                  ))}
                                                  {meta.features.length > 2 && <span className="text-xs text-muted-foreground">+{meta.features.length - 2}</span>}
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
      <p className="text-muted-foreground">Loading apartments...</p>
    ) : apartments.length === 0 ? (
      <p className="text-muted-foreground">No apartments found.</p>
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
          <Card className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden h-full border border-gray-200 hover:border-blue-400">
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
              <motion.img
                src={meta.image_url || "/images/properties/default.jpg"}
                alt={`Property at ${meta.address}`}
                loading="lazy"
                className="h-full w-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {meta.listing_status && (
                <div className="absolute top-3 right-3">
                  <Badge 
                    variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                    className={`text-xs font-semibold shadow-md ${
                      meta.listing_status === 'Available' 
                        ? 'bg-green-500 text-white' 
                        : meta.listing_status === 'Sold' || meta.listing_status === 'Rented'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-600 text-white'
                    }`}
                  >
                    {meta.listing_status}
                  </Badge>
                </div>
              )}
            </div>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-navy text-lg font-bold group-hover:text-blue-600 transition-colors line-clamp-2">
                {meta.address || `Property #${apt.id}`}
              </CardTitle>
              {meta.listing_id && (
                <div className="flex items-center gap-1 mt-1">
                  <Info className="h-3 w-3 text-blue-600" />
                  <p className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">MLS: {meta.listing_id}</p>
                </div>
              )}
            </CardHeader>
              <CardContent className="space-y-3">
                {/* Price */}
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="text-xl font-bold text-gold">
                    ${meta.price ? meta.price.toLocaleString() : "N/A"}
                  </div>
                  {meta.listing_status && (
                    <Badge 
                      variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {meta.listing_status}
                    </Badge>
                  )}
                </div>

                {/* Basic Specs */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Bed className="h-4 w-4" /> {meta.bedrooms || 0}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Bath className="h-4 w-4" /> {meta.bathrooms || 0}
                  </div>
                  {meta.square_feet && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Square className="h-4 w-4" /> {meta.square_feet}
                    </div>
                  )}
                </div>

                {/* Property Details Grid */}
                <div className="space-y-2 pt-2 border-t">
                  {meta.property_type && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline" className="text-xs">
                        {meta.property_type}
                      </Badge>
                    </div>
                  )}
                  
                  {meta.year_built && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Year Built:</span>
                      <span className="font-medium">{meta.year_built}</span>
                    </div>
                  )}

                  {meta.lot_size_sqft && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Lot Size:</span>
                      <span className="font-medium">{meta.lot_size_sqft.toLocaleString()} sqft</span>
                    </div>
                  )}

                  {meta.days_on_market !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Days on Market:</span>
                      <span className="font-medium">{meta.days_on_market}</span>
                    </div>
                  )}

                  {meta.listing_date && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" /> Listed:
                      </span>
                      <span className="font-medium">{new Date(meta.listing_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                {meta.features && meta.features.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {meta.features.map((feature: string, fIdx: number) => (
                        <Badge key={fIdx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agent Information */}
                {meta.agent && (
                  <div className="pt-2 border-t space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Agent:</p>
                    <div className="space-y-1 text-xs">
                      <p className="font-medium">{meta.agent.name}</p>
                      {meta.agent.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{meta.agent.email}</span>
                        </div>
                      )}
                      {meta.agent.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{meta.agent.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Assignment Status (for PM) */}
                {userType === "property_manager" && (
                  <div className="pt-2 border-t">
                    {meta.is_assigned && meta.assigned_to_realtor_name ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Assigned to:</span>
                        <Badge className="bg-green-600 text-xs">
                          {meta.assigned_to_realtor_name}
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-xs">
                        Unassigned
                      </Badge>
                    )}
                  </div>
                )}

                {/* Description (truncated) */}
                {meta.description && (
                  <div className="pt-2 border-t">
                    <div className="flex items-start gap-1">
                      <Info className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <p className="text-xs text-muted-foreground line-clamp-2">
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
    <Card className="glass-card">
      <CardHeader>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <CardTitle className="text-navy text-xl">Your Bookings</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            All your active and past bookings are listed below.
          </p>
        </motion.div>
      </CardHeader>
      <CardContent>
        {loadingBookings ? (
          <p className="text-muted-foreground">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p className="text-muted-foreground">No bookings found.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Booking ID</TableHead>
                  <TableHead className="font-semibold">Property</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Time</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b, idx) => (
                  <motion.tr
                    key={b.id || idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="hover:bg-accent/5 transition-all duration-200 group"
                  >
                    <TableCell className="font-medium group-hover:text-accent transition-colors">
                      {b.id}
                    </TableCell>
                    <TableCell>{b.property || b.property_name || b.address}</TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell>{b.time}</TableCell>
                    <TableCell>
                      <Badge
                        variant={b.status === "Confirmed" ? "default" : "secondary"}
                        className={
                          b.status === "Confirmed"
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                        }
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

            <TabsContent value="conversations">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-navy text-xl flex items-center gap-2">
          <Music className="h-5 w-5 text-accent" />
          Conversations (Call Recordings)
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Listen to your recorded calls with leads and clients.
        </p>
      </CardHeader>
      <CardContent>
        {loadingRecordings ? (
          <p className="text-muted-foreground">Loading recordings...</p>
        ) : recordings.length === 0 ? (
          <p className="text-muted-foreground">No recordings available.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Call</TableHead>
                  <TableHead className="font-semibold">Recording</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordings.map((rec, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="hover:bg-accent/5 transition-all duration-200 group"
                  >
                    <TableCell className="font-medium group-hover:text-accent transition-colors">
                      Call #{idx + 1}
                    </TableCell>
                    <TableCell>
                      <audio controls className="w-full">
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
           <TabsContent value="chats">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-navy text-xl flex items-center gap-2">
          <Phone className="h-5 w-5 text-accent" />
          Customer Chats
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          View conversations with your clients in a chat-style layout.
        </p>
      </CardHeader>
      <CardContent>
        {loadingChats ? (
          <p className="text-muted-foreground">Loading chats...</p>
        ) : Object.keys(chats).length === 0 ? (
          <p className="text-muted-foreground">No chats available.</p>
        ) : (
          <div className="flex flex-col items-center gap-6 overflow-x-hidden">
            {Object.entries(chats).map(([customer, messages]: any, idx) => (
              <div
                key={idx}
                className="border rounded-xl p-4 glass-card w-full max-w-[650px] mx-auto"
              >
                <h3 className="text-lg font-semibold text-navy mb-3 text-center">
                  Chat with {customer}
                </h3>
                <div className="h-64 overflow-y-auto space-y-3 pr-2">
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
                        className={`px-4 py-2 rounded-2xl max-w-[70%] text-sm shadow ${
                          msg.sender === "realtor"
                            ? "bg-accent text-accent-foreground rounded-br-none"
                            : "bg-muted text-navy rounded-bl-none"
                        }`}
                      >
                        {msg.message}
                        <div className="text-[10px] opacity-70 mt-1">
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
