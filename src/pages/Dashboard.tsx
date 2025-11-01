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

  

  const handleSettingsClick = () => {
    toast.info("Settings panel coming soon!", {
      description: "Configure your dashboard preferences and notifications here."
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Futuristic Glassmorphism Header */}
      <motion.header 
        className="relative backdrop-blur-xl bg-gradient-to-r from-slate-800/80 via-slate-900/80 to-slate-800/80 border-b border-gold/30 shadow-[0_8px_32px_0_rgba(255,215,0,0.15)]"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-8 sm:pb-10 relative z-10">
          <motion.div 
            className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-4 sm:gap-5 flex-1">
              <motion.div 
                className="relative bg-gradient-to-br from-gold via-yellow-400 to-gold p-3 sm:p-4 rounded-2xl shadow-[0_0_30px_rgba(255,215,0,0.5)] group"
                whileHover={{ scale: 1.1, rotate: 5, boxShadow: "0 0 50px rgba(255,215,0,0.8)" }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                <Home className="h-6 w-6 sm:h-7 sm:w-7 text-slate-900 relative z-10" />
                <div className="absolute inset-0 bg-gold/50 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
              </motion.div>
              <div>
                <motion.h1 
                  className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-300 to-gold mb-2 tracking-tight"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  style={{ textShadow: '0 0 40px rgba(255,215,0,0.3)' }}
                >
                  {userType === "property_manager" ? "Property Manager" : "My"} Dashboard
                </motion.h1>
                <motion.p 
                  className="text-white/80 text-sm sm:text-base font-medium"
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
              className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto"
            >
              <Button 
                asChild 
                variant="outline"
                className="backdrop-blur-sm bg-white/10 hover:bg-gold/20 text-white border-gold/30 hover:border-gold font-semibold transition-all shadow-[0_4px_14px_0_rgba(255,215,0,0.15)] hover:shadow-[0_8px_20px_0_rgba(255,215,0,0.3)]"
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
                className="backdrop-blur-sm bg-white/10 hover:bg-gold/20 text-white border-gold/30 hover:border-gold font-semibold transition-all shadow-[0_4px_14px_0_rgba(255,215,0,0.15)] hover:shadow-[0_8px_20px_0_rgba(255,215,0,0.3)]"
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
                className="bg-gradient-to-r from-gold via-yellow-400 to-gold text-slate-900 font-black shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:shadow-[0_0_40px_rgba(255,215,0,0.7)] transition-all hover:scale-105"
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
          {myNumber && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="mt-6 pt-6 border-t border-gold/20 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5"></div>
              <div className="flex items-center gap-3 text-white relative z-10">
                <div className="p-1.5 bg-gradient-to-br from-gold to-yellow-400 rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                  <CheckCircle2 className="h-4 w-4 text-slate-900" />
                </div>
                <span className="text-sm font-medium">Your Phone Number: <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-300">{myNumber}</span></span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Futuristic Glassmorphism Stats Cards */}
      <motion.section 
        className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10 mb-8 sm:mb-10 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {userType === "property_manager" ? (
            <>
              <motion.div 
                variants={itemVariants} 
                className="relative group backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 rounded-2xl shadow-[0_8px_32px_0_rgba(255,215,0,0.15)] hover:shadow-[0_12px_40px_0_rgba(255,215,0,0.3)] transition-all duration-300 p-6 sm:p-7 border border-gold/20 hover:border-gold/50 overflow-hidden"
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-bold text-gold/80 mb-2 uppercase tracking-wider">Total Realtors</p>
                    <motion.p 
                      className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" as const }}
                    >
                      {realtors.length}
                    </motion.p>
                    <p className="text-xs text-white/50 mt-2 font-medium">Active team members</p>
                  </div>
                  <motion.div 
                    className="relative p-3 sm:p-4 bg-gradient-to-br from-gold via-yellow-400 to-gold rounded-xl ml-3 shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                    whileHover={{ rotate: 15, scale: 1.15, boxShadow: "0 0 30px rgba(255,215,0,0.6)" }}
                  >
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-slate-900 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="relative group backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 rounded-2xl shadow-[0_8px_32px_0_rgba(255,215,0,0.15)] hover:shadow-[0_12px_40px_0_rgba(255,215,0,0.3)] transition-all duration-300 p-6 sm:p-7 border border-gold/20 hover:border-gold/50 overflow-hidden"
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-bold text-gold/80 mb-2 uppercase tracking-wider">Total Properties</p>
                    <motion.p 
                      className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.0, type: "spring" as const }}
                    >
                      {apartments.length}
                    </motion.p>
                    <p className="text-xs text-white/50 mt-2 font-medium">In your portfolio</p>
                  </div>
                  <motion.div 
                    className="relative p-3 sm:p-4 bg-gradient-to-br from-gold via-yellow-400 to-gold rounded-xl ml-3 shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                    whileHover={{ rotate: -15, scale: 1.15, boxShadow: "0 0 30px rgba(255,215,0,0.6)" }}
                  >
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-slate-900 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="relative group backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 rounded-2xl shadow-[0_8px_32px_0_rgba(255,215,0,0.15)] hover:shadow-[0_12px_40px_0_rgba(255,215,0,0.3)] transition-all duration-300 p-6 sm:p-7 border border-gold/20 hover:border-gold/50 overflow-hidden sm:col-span-2 lg:col-span-1"
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-bold text-gold/80 mb-2 uppercase tracking-wider">Active Bookings</p>
                    <motion.p 
                      className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" as const }}
                    >
                      {bookings.length}
                    </motion.p>
                    <p className="text-xs text-white/50 mt-2 font-medium">Scheduled viewings</p>
                  </div>
                  <motion.div 
                    className="relative p-3 sm:p-4 bg-gradient-to-br from-gold via-yellow-400 to-gold rounded-xl ml-3 shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                    whileHover={{ rotate: 15, scale: 1.15, boxShadow: "0 0 30px rgba(255,215,0,0.6)" }}
                  >
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-slate-900 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                  </motion.div>
                </div>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div 
                variants={itemVariants} 
                className="relative group backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 rounded-2xl shadow-[0_8px_32px_0_rgba(255,215,0,0.15)] hover:shadow-[0_12px_40px_0_rgba(255,215,0,0.3)] transition-all duration-300 p-6 sm:p-7 border border-gold/20 hover:border-gold/50 overflow-hidden"
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-bold text-gold/80 mb-2 uppercase tracking-wider">My Properties</p>
                    <motion.p 
                      className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" as const }}
                    >
                      {apartments.length}
                    </motion.p>
                    <p className="text-xs text-white/50 mt-2 font-medium">Assigned to you</p>
                  </div>
                  <motion.div 
                    className="relative p-3 sm:p-4 bg-gradient-to-br from-gold via-yellow-400 to-gold rounded-xl ml-3 shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                    whileHover={{ rotate: 15, scale: 1.15, boxShadow: "0 0 30px rgba(255,215,0,0.6)" }}
                  >
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-slate-900 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="relative group backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 rounded-2xl shadow-[0_8px_32px_0_rgba(255,215,0,0.15)] hover:shadow-[0_12px_40px_0_rgba(255,215,0,0.3)] transition-all duration-300 p-6 sm:p-7 border border-gold/20 hover:border-gold/50 overflow-hidden"
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-bold text-gold/80 mb-2 uppercase tracking-wider">My Bookings</p>
                    <motion.p 
                      className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.0, type: "spring" as const }}
                    >
                      {bookings.length}
                    </motion.p>
                    <p className="text-xs text-white/50 mt-2 font-medium">Scheduled viewings</p>
                  </div>
                  <motion.div 
                    className="relative p-3 sm:p-4 bg-gradient-to-br from-gold via-yellow-400 to-gold rounded-xl ml-3 shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                    whileHover={{ rotate: -15, scale: 1.15, boxShadow: "0 0 30px rgba(255,215,0,0.6)" }}
                  >
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-slate-900 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="relative group backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 rounded-2xl shadow-[0_8px_32px_0_rgba(255,215,0,0.15)] hover:shadow-[0_12px_40px_0_rgba(255,215,0,0.3)] transition-all duration-300 p-6 sm:p-7 border border-gold/20 hover:border-gold/50 overflow-hidden sm:col-span-2 lg:col-span-1"
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-bold text-gold/80 mb-2 uppercase tracking-wider">Property Views</p>
                    <motion.p 
                      className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" as const }}
                    >
                      1,247
                    </motion.p>
                    <p className="text-xs text-white/50 mt-2 font-medium">Total views this month</p>
                  </div>
                  <motion.div 
                    className="relative p-3 sm:p-4 bg-gradient-to-br from-gold via-yellow-400 to-gold rounded-xl ml-3 shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                    whileHover={{ rotate: 15, scale: 1.15, boxShadow: "0 0 30px rgba(255,215,0,0.6)" }}
                  >
                    <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-slate-900 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </motion.section>

      {/* Content */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 lg:pb-16">
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
              className="overflow-x-auto"
            >
              <TabsList className="mb-6 sm:mb-8 backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 border border-gold/20 rounded-2xl p-1.5 sm:p-2 shadow-[0_8px_32px_0_rgba(255,215,0,0.15)] inline-flex min-w-full sm:min-w-0">
                {userType === "property_manager" && (
                  <TabsTrigger 
                    value="realtors" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold data-[state=active]:via-yellow-400 data-[state=active]:to-gold data-[state=active]:text-slate-900 data-[state=active]:shadow-[0_0_20px_rgba(255,215,0,0.5)] rounded-xl px-3 sm:px-5 py-2.5 font-black transition-all text-sm sm:text-base border data-[state=active]:border-gold/50 data-[state=inactive]:border-transparent hover:bg-gold/10 hover:border-gold/30 text-white"
                  >
                    <Users className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="whitespace-nowrap">Realtors</span>
                  </TabsTrigger>
                )}
                {userType === "property_manager" && (
                  <>
                    <TabsTrigger 
                      value="assign-properties" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold data-[state=active]:via-yellow-400 data-[state=active]:to-gold data-[state=active]:text-slate-900 data-[state=active]:shadow-[0_0_20px_rgba(255,215,0,0.5)] rounded-xl px-3 sm:px-5 py-2.5 font-black transition-all text-sm sm:text-base border data-[state=active]:border-gold/50 data-[state=inactive]:border-transparent hover:bg-gold/10 hover:border-gold/30 text-white"
                    >
                      <CheckSquare className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="whitespace-nowrap hidden sm:inline">Assign Properties</span>
                      <span className="whitespace-nowrap sm:hidden">Assign</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="view-assignments" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold data-[state=active]:via-yellow-400 data-[state=active]:to-gold data-[state=active]:text-slate-900 data-[state=active]:shadow-[0_0_20px_rgba(255,215,0,0.5)] rounded-xl px-3 sm:px-5 py-2.5 font-black transition-all text-sm sm:text-base border data-[state=active]:border-gold/50 data-[state=inactive]:border-transparent hover:bg-gold/10 hover:border-gold/30 text-white"
                    >
                      <ListChecks className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="whitespace-nowrap hidden sm:inline">View Assignments</span>
                      <span className="whitespace-nowrap sm:hidden">Assignments</span>
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger 
                  value="properties" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold data-[state=active]:via-yellow-400 data-[state=active]:to-gold data-[state=active]:text-slate-900 data-[state=active]:shadow-[0_0_20px_rgba(255,215,0,0.5)] rounded-xl px-3 sm:px-5 py-2.5 font-black transition-all text-sm sm:text-base border data-[state=active]:border-gold/50 data-[state=inactive]:border-transparent hover:bg-gold/10 hover:border-gold/30 text-white"
                >
                  <Building2 className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="whitespace-nowrap">Properties</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="bookings" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold data-[state=active]:via-yellow-400 data-[state=active]:to-gold data-[state=active]:text-slate-900 data-[state=active]:shadow-[0_0_20px_rgba(255,215,0,0.5)] rounded-xl px-3 sm:px-5 py-2.5 font-black transition-all text-sm sm:text-base border data-[state=active]:border-gold/50 data-[state=inactive]:border-transparent hover:bg-gold/10 hover:border-gold/30 text-white"
                >
                  <Calendar className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="whitespace-nowrap">Bookings</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="conversations" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold data-[state=active]:via-yellow-400 data-[state=active]:to-gold data-[state=active]:text-slate-900 data-[state=active]:shadow-[0_0_20px_rgba(255,215,0,0.5)] rounded-xl px-3 sm:px-5 py-2.5 font-black transition-all text-sm sm:text-base border data-[state=active]:border-gold/50 data-[state=inactive]:border-transparent hover:bg-gold/10 hover:border-gold/30 text-white"
                >
                  <Music className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="whitespace-nowrap hidden lg:inline">Conversations</span>
                  <span className="whitespace-nowrap lg:hidden">Chats</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="chats" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold data-[state=active]:via-yellow-400 data-[state=active]:to-gold data-[state=active]:text-slate-900 data-[state=active]:shadow-[0_0_20px_rgba(255,215,0,0.5)] rounded-xl px-3 sm:px-5 py-2.5 font-black transition-all text-sm sm:text-base border data-[state=active]:border-gold/50 data-[state=inactive]:border-transparent hover:bg-gold/10 hover:border-gold/30 text-white"
                >
                  <Phone className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="whitespace-nowrap">Calls</span>
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
                  <Card className="relative backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 shadow-[0_8px_32px_0_rgba(255,215,0,0.15)] border border-gold/20 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent"></div>
                    <CardHeader className="relative z-10 bg-gradient-to-r from-gold/10 via-gold/5 to-transparent rounded-t-2xl border-b border-gold/30 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-white text-xl sm:text-2xl font-black flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-gold via-yellow-400 to-gold rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                              <Users className="h-5 w-5 text-slate-900" />
                            </div>
                            Manage Realtors
                          </CardTitle>
                          <p className="text-sm text-white/80 ml-0 sm:ml-14 mt-2 sm:mt-0">
                            Add and manage your realtor team members. Create accounts for realtors so they can access their assigned properties.
                          </p>
                        </div>
                        <Button 
                          onClick={() => setShowAddRealtor(!showAddRealtor)}
                          className="bg-gradient-to-r from-gold via-yellow-400 to-gold text-slate-900 font-black shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:shadow-[0_0_40px_rgba(255,215,0,0.7)] transition-all hover:scale-105 w-full sm:w-auto"
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
                          className="mb-6 p-4 sm:p-6 backdrop-blur-xl bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 border border-gold/20 rounded-xl"
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <UserPlus className="h-5 w-5 text-gold" />
                            <h3 className="text-xl font-black text-white">Add New Realtor to Your Team</h3>
                          </div>
                          <p className="text-sm text-white/80 mb-4">Fill in the details below to create a new realtor account. They'll receive login credentials.</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="text-sm font-semibold text-gold/80 mb-2 block">Full Name</label>
                              <input
                                type="text"
                                value={newRealtor.name}
                                onChange={(e) => setNewRealtor({...newRealtor, name: e.target.value})}
                                className="w-full p-3 backdrop-blur-sm bg-white/10 border border-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-white placeholder-white/50"
                                placeholder="John Doe"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gold/80 mb-2 block">Email Address</label>
                              <input
                                type="email"
                                value={newRealtor.email}
                                onChange={(e) => setNewRealtor({...newRealtor, email: e.target.value})}
                                className="w-full p-3 backdrop-blur-sm bg-white/10 border border-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-white placeholder-white/50"
                                placeholder="john.doe@company.com"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gold/80 mb-2 block">Temporary Password</label>
                              <input
                                type="password"
                                value={newRealtor.password}
                                onChange={(e) => setNewRealtor({...newRealtor, password: e.target.value})}
                                className="w-full p-3 backdrop-blur-sm bg-white/10 border border-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-white placeholder-white/50"
                                placeholder="Choose a secure password"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button 
                              onClick={addRealtor} 
                              className="bg-gradient-to-r from-gold via-yellow-400 to-gold text-slate-900 font-black shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:shadow-[0_0_40px_rgba(255,215,0,0.7)] px-6"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Create Realtor Account
                            </Button>
                            <Button 
                              onClick={() => setShowAddRealtor(false)}
                              variant="outline"
                              className="backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white border-gold/30 hover:border-gold"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {loadingRealtors ? (
                        <p className="text-white/80 font-medium text-center py-8">Loading realtors...</p>
                      ) : realtors.length === 0 ? (
                        <p className="text-white/60 font-medium text-center py-8">No realtors found. Add your first realtor above.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-xl backdrop-blur-xl bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 border border-gold/20">
                          <Table>
                            <TableHeader className="bg-gradient-to-r from-gold/20 via-gold/10 to-transparent border-b border-gold/30">
                              <TableRow>
                                <TableHead className="font-black text-white py-3 sm:py-4 px-2 sm:px-4">Name</TableHead>
                                <TableHead className="font-black text-white py-3 sm:py-4 px-2 sm:px-4">Email</TableHead>
                                <TableHead className="font-black text-white py-3 sm:py-4 px-2 sm:px-4">Status</TableHead>
                                <TableHead className="font-black text-white py-3 sm:py-4 px-2 sm:px-4">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {realtors.map((realtor, idx) => (
                                <motion.tr
                                  key={realtor.id || idx}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                                  className="hover:bg-gold/10 transition-all duration-200 group border-b border-gold/10"
                                >
                                  <TableCell className="font-semibold text-white py-3 sm:py-4 px-2 sm:px-4 group-hover:text-gold transition-colors">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-gold" />
                                      {realtor.name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-white/70 py-3 sm:py-4 px-2 sm:px-4">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-gold/50" />
                                      <span className="truncate max-w-[200px] sm:max-w-none">{realtor.email}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                                    <Badge
                                      variant={realtor.status === "active" ? "default" : "secondary"}
                                      className={
                                        realtor.status === "active"
                                          ? "bg-gradient-to-r from-gold via-yellow-400 to-gold text-slate-900 border-2 border-gold/50 font-black shadow-[0_0_10px_rgba(255,215,0,0.3)]"
                                          : "bg-white/10 text-white border-2 border-gold/30 font-bold backdrop-blur-sm"
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
                                        className="backdrop-blur-sm bg-white/10 hover:bg-gold/20 text-white border-gold/30 hover:border-gold font-semibold transition-all shadow-[0_4px_14px_0_rgba(255,215,0,0.15)] hover:shadow-[0_8px_20px_0_rgba(255,215,0,0.3)]"
                                      >
                                        <Settings className="h-4 w-4 mr-1" />
                                        <span className="hidden sm:inline">Settings</span>
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="backdrop-blur-sm bg-red-500/20 hover:bg-red-500/30 text-white border-red-500/50 hover:border-red-500 font-semibold transition-all shadow-[0_4px_14px_0_rgba(239,68,68,0.15)] hover:shadow-[0_8px_20px_0_rgba(239,68,68,0.3)]"
                                          >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            <span className="hidden sm:inline">Delete</span>
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="backdrop-blur-xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 border border-gold/30 shadow-[0_8px_32px_0_rgba(255,215,0,0.15)]">
                                          <AlertDialogHeader>
                                            <AlertDialogTitle className="text-white font-black text-xl">Delete Realtor: {realtor.name}?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-white/80 mt-4 space-y-2">
                                              <p className="font-semibold text-gold">This will:</p>
                                              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                                                <li>Move all their properties back to you (unassigned)</li>
                                                <li>Unassign all their bookings</li>
                                                <li>Delete their sources and rule chunks</li>
                                                <li>Remove them from the system</li>
                                              </ul>
                                              <p className="mt-4 font-bold text-red-400">⚠️ This action CANNOT be undone!</p>
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel className="backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white border-gold/30 hover:border-gold">
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction 
                                              onClick={() => handleDeleteRealtor(realtor.id, realtor.name)}
                                              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.5)]"
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
                  <Card className="relative backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 shadow-[0_8px_32px_0_rgba(255,215,0,0.15)] border border-gold/20 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent"></div>
                    <CardHeader className="relative z-10 bg-gradient-to-r from-gold/10 via-gold/5 to-transparent rounded-t-2xl border-b border-gold/30 p-4 sm:p-6">
                      <CardTitle className="text-white text-xl sm:text-2xl font-black flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-gold via-yellow-400 to-gold rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                          <CheckSquare className="h-5 w-5 text-slate-900" />
                        </div>
                        Assign Properties to Realtors
                      </CardTitle>
                      <p className="text-sm text-white/80 ml-0 sm:ml-14 mt-2 sm:mt-0">
                        Select properties and assign them to a realtor. Assigned properties will appear on the realtor's dashboard.
                      </p>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-4 sm:space-y-6 p-4 sm:p-6">
                      {/* Realtor Selection */}
                      <div className="space-y-3 backdrop-blur-xl bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 p-4 sm:p-6 rounded-xl border border-gold/20">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-gold" />
                          <label className="text-base sm:text-lg font-black text-white">Select Realtor to Assign Properties:</label>
                        </div>
                        <select 
                          value={selectedRealtor || ''} 
                          onChange={(e) => setSelectedRealtor(e.target.value ? Number(e.target.value) : null)}
                          className="w-full p-3 sm:p-4 backdrop-blur-sm bg-white/10 border border-gold/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-base font-bold transition-all placeholder-white/50"
                        >
                          <option value="" className="bg-slate-900 text-white">Choose a realtor from the list...</option>
                          {realtors.map(realtor => (
                            <option key={realtor.id} value={realtor.id} className="bg-slate-900 text-white">
                              {realtor.name} - {realtor.email}
                            </option>
                          ))}
                        </select>
                        {selectedRealtor && (
                          <div className="flex items-center gap-2 text-white bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 border border-gold/50 p-3 rounded-lg backdrop-blur-sm">
                            <CheckCircle2 className="h-5 w-5 text-gold" />
                            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-400">
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
                              <h3 className="text-lg sm:text-xl font-black text-white">
                                Available Properties <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-400">({selectedProperties.length} selected)</span>
                              </h3>
                              <p className="text-sm text-white/70">
                                Properties you own that haven't been assigned to realtors yet
                              </p>
                            </div>
                            <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                              <Button 
                                onClick={handleSelectAll}
                                variant="outline"
                                size="sm"
                                className="backdrop-blur-sm bg-white/10 hover:bg-gold/20 text-white border-gold/30 hover:border-gold font-semibold transition-all shadow-[0_4px_14px_0_rgba(255,215,0,0.15)] hover:shadow-[0_8px_20px_0_rgba(255,215,0,0.3)] w-full sm:w-auto"
                              >
                                {selectedProperties.length === availablePropertiesForAssignment.length ? 'Deselect All' : 'Select All'}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Enhanced Bulk Selection Buttons */}
                          <div className="backdrop-blur-xl bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 p-4 sm:p-6 rounded-xl border border-gold/20">
                            <p className="text-sm sm:text-base font-black text-gold/80 mb-3 flex items-center gap-2">
                              <CheckSquare className="h-4 w-4 text-gold" />
                              Quick Selection Tools:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button 
                                onClick={() => handleBulkSelect(10, true)}
                                variant="outline"
                                size="sm"
                                className="backdrop-blur-sm bg-white/10 hover:bg-gold/20 text-white border-gold/30 hover:border-gold font-semibold transition-all shadow-[0_4px_14px_0_rgba(255,215,0,0.15)]"
                              >
                                First 10
                              </Button>
                              <Button 
                                onClick={() => handleBulkSelect(20, true)}
                                variant="outline"
                                size="sm"
                                className="backdrop-blur-sm bg-white/10 hover:bg-gold/20 text-white border-gold/30 hover:border-gold font-semibold transition-all shadow-[0_4px_14px_0_rgba(255,215,0,0.15)]"
                              >
                                First 20
                              </Button>
                              <Button 
                                onClick={() => handleBulkSelect(50, true)}
                                variant="outline"
                                size="sm"
                                className="backdrop-blur-sm bg-white/10 hover:bg-gold/20 text-white border-gold/30 hover:border-gold font-semibold transition-all shadow-[0_4px_14px_0_rgba(255,215,0,0.15)]"
                              >
                                First 50
                              </Button>
                              <div className="w-px bg-gold/30 mx-1"></div>
                              <Button 
                                onClick={() => handleBulkSelect(10, false)}
                                variant="outline"
                                size="sm"
                                className="backdrop-blur-sm bg-white/10 hover:bg-gold/20 text-white border-gold/30 hover:border-gold font-semibold transition-all shadow-[0_4px_14px_0_rgba(255,215,0,0.15)]"
                              >
                                Last 10
                              </Button>
                              <Button 
                                onClick={() => handleBulkSelect(20, false)}
                                variant="outline"
                                size="sm"
                                className="backdrop-blur-sm bg-white/10 hover:bg-gold/20 text-white border-gold/30 hover:border-gold font-semibold transition-all shadow-[0_4px_14px_0_rgba(255,215,0,0.15)]"
                              >
                                Last 20
                              </Button>
                              <Button 
                                onClick={() => handleBulkSelect(50, false)}
                                variant="outline"
                                size="sm"
                                className="backdrop-blur-sm bg-white/10 hover:bg-gold/20 text-white border-gold/30 hover:border-gold font-semibold transition-all shadow-[0_4px_14px_0_rgba(255,215,0,0.15)]"
                              >
                                Last 50
                              </Button>
                            </div>
                          </div>
                        </div>

                        {loadingAssignmentProperties ? (
                          <p className="text-white/80 font-medium py-8 text-center">Loading properties...</p>
                        ) : availablePropertiesForAssignment.length === 0 ? (
                          <div className="py-8 text-center backdrop-blur-xl bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 border border-gold/20 rounded-xl">
                            <p className="text-white/70 font-medium">
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
                                    className={`cursor-pointer transition-all duration-300 rounded-xl relative backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 border overflow-hidden ${
                                      selectedProperties.includes(property.id) 
                                        ? 'border-gold bg-gold/20 shadow-[0_12px_40px_0_rgba(255,215,0,0.4)] scale-[1.02]' 
                                        : 'border-gold/20 hover:border-gold/50 hover:shadow-[0_8px_32px_0_rgba(255,215,0,0.15)]'
                                    }`}
                                    onClick={() => handlePropertyToggle(property.id)}
                                  >
                                    <div className={`absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent ${selectedProperties.includes(property.id) ? 'opacity-100' : 'opacity-0'} transition-opacity`}></div>
                                    <div className="flex items-start p-4 sm:p-5 gap-3 sm:gap-4 relative z-10">
                                      <div className="flex-shrink-0 mt-1">
                                        <input
                                          type="checkbox"
                                          checked={selectedProperties.includes(property.id)}
                                          onChange={() => handlePropertyToggle(property.id)}
                                          className="h-5 w-5 cursor-pointer accent-gold rounded border-gold/30 checked:bg-gold checked:border-gold"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                                        <div>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <h4 className="font-black text-base sm:text-lg text-white truncate mb-1">
                                                  {meta.address || `Property #${property.id}`}
                                                </h4>
                                              </TooltipTrigger>
                                              <TooltipContent className="max-w-md">
                                                <p className="font-medium">{meta.address || `Property #${property.id}`}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                          {meta.listing_id && (
                                            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                                              <Info className="h-3 w-3 text-gold" />
                                              <p className="text-gold bg-gold/20 backdrop-blur-sm px-2 py-0.5 rounded-md border border-gold/30 font-black">MLS: {meta.listing_id}</p>
                                            </div>
                                          )}
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <p className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold">
                                              ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                            </p>
                                            {meta.listing_status && (
                                              <Badge 
                                                variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                                                className={`text-xs font-black border-2 border-gold/50 shadow-[0_0_10px_rgba(255,215,0,0.3)] backdrop-blur-sm ${
                                                  meta.listing_status === 'Available' 
                                                    ? 'bg-gradient-to-r from-gold via-yellow-400 to-gold text-slate-900' 
                                                    : 'bg-white/90 text-slate-900'
                                                }`}
                                              >
                                                {meta.listing_status}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex flex-wrap gap-2 text-sm font-bold">
                                            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-gold/30 px-2 py-1 rounded-md text-white">
                                              <Bed className="h-4 w-4 text-gold" /> {meta.bedrooms || 0} Beds
                                            </span>
                                            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-gold/30 px-2 py-1 rounded-md text-white">
                                              <Bath className="h-4 w-4 text-gold" /> {meta.bathrooms || 0} Baths
                                            </span>
                                            {meta.square_feet && (
                                              <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-gold/30 px-2 py-1 rounded-md text-white">
                                                <Square className="h-4 w-4 text-gold" /> {meta.square_feet} sqft
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {meta.property_type && (
                                              <Badge variant="outline" className="text-xs font-medium border-gold/30 bg-gold/10 text-white">
                                                {meta.property_type}
                                              </Badge>
                                            )}
                                          </div>
                                          {meta.features && meta.features.length > 0 && (
                                            <div className="pt-2 border-t border-gold/30">
                                              <p className="text-xs font-bold text-gold/80 mb-2">Key Features:</p>
                                              <div className="flex flex-wrap gap-1.5">
                                                {meta.features.slice(0, 3).map((feature: string, fIdx: number) => (
                                                  <Badge key={fIdx} variant="outline" className="text-xs bg-gold/10 border-gold/30 text-white font-medium">
                                                    {feature}
                                                  </Badge>
                                                ))}
                                                {meta.features.length > 3 && (
                                                  <span className="text-xs text-white/50 font-medium">+{meta.features.length - 3} more</span>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                          {meta.agent && (
                                            <div className="pt-2 border-t border-gold/30">
                                              <p className="text-xs font-bold text-gold/80 mb-1">Agent:</p>
                                              <p className="text-sm font-black text-white truncate">
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
                      <div className="pt-4 sm:pt-6 border-t border-gold/30 backdrop-blur-xl bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 p-4 sm:p-6 rounded-xl border border-gold/20">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm sm:text-base font-medium text-white/80 mb-1">
                              {selectedProperties.length > 0 && selectedRealtor ? (
                                <span className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-gold" />
                                  Ready to assign <strong className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-400">{selectedProperties.length}</strong> {selectedProperties.length === 1 ? 'property' : 'properties'} to <strong className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-400">{realtors.find(r => r.id === selectedRealtor)?.name}</strong>
                                </span>
                              ) : (
                                <span className="text-white/70">
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
                            className="bg-gradient-to-r from-gold via-yellow-400 to-gold text-slate-900 font-black px-6 sm:px-8 py-3 text-base sm:text-lg shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:shadow-[0_0_40px_rgba(255,215,0,0.7)] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full md:w-auto"
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
                  <Card className="relative backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 shadow-[0_8px_32px_0_rgba(255,215,0,0.15)] border border-gold/20 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent"></div>
                    <CardHeader className="relative z-10 bg-gradient-to-r from-gold/10 via-gold/5 to-transparent rounded-t-2xl border-b border-gold/30 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-white text-xl sm:text-2xl font-black flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-gold via-yellow-400 to-gold rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                              <ListChecks className="h-5 w-5 text-slate-900" />
                            </div>
                            Property Assignments Overview
                          </CardTitle>
                          <p className="text-sm text-white/80 ml-0 sm:ml-14 mt-2 sm:mt-0">
                            See which properties are assigned to which realtors, and manage unassigned properties
                          </p>
                        </div>
                        <Button 
                          onClick={() => { fetchAssignments(); fetchPropertiesForAssignment(); }}
                          variant="outline"
                          size="sm"
                          className="backdrop-blur-sm bg-white/10 hover:bg-gold/20 text-white border-gold/30 hover:border-gold font-semibold transition-all shadow-[0_4px_14px_0_rgba(255,215,0,0.15)] hover:shadow-[0_8px_20px_0_rgba(255,215,0,0.3)] w-full sm:w-auto"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Data
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 p-4 sm:p-6">
                      {loadingAssignments ? (
                        <p className="text-white/80 font-medium py-8 text-center">Loading assignments...</p>
                      ) : !assignmentsData ? (
                        <p className="text-white/60 font-medium py-8 text-center">No assignment data available</p>
                      ) : (
                        <div className="space-y-6 sm:space-y-8">
                          {/* Enhanced Summary Cards */}
                          {assignmentsData.summary && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                              <Card className="relative group backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 p-5 sm:p-6 border border-gold/20 rounded-xl hover:shadow-[0_12px_40px_0_rgba(255,215,0,0.3)] transition-all hover:border-gold/50 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10 flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs sm:text-sm font-bold text-gold/80 mb-2 uppercase tracking-wider">Total Properties</p>
                                    <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold">
                                      {assignmentsData.summary.total_properties || 0}
                                    </p>
                                    <p className="text-xs text-white/50 mt-2 font-medium">All properties</p>
                                  </div>
                                  <div className="p-3 sm:p-4 bg-gradient-to-br from-gold via-yellow-400 to-gold rounded-lg ml-3 shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-slate-900" />
                                  </div>
                                </div>
                              </Card>
                              <Card className="relative group backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 p-5 sm:p-6 border border-gold/20 rounded-xl hover:shadow-[0_12px_40px_0_rgba(255,215,0,0.3)] transition-all hover:border-gold/50 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10 flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs sm:text-sm font-bold text-gold/80 mb-2 uppercase tracking-wider">Unassigned</p>
                                    <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold">
                                      {assignmentsData.summary.unassigned_count || 0}
                                    </p>
                                    <p className="text-xs text-white/50 mt-2 font-medium">Need assignment</p>
                                  </div>
                                  <div className="p-3 sm:p-4 bg-gradient-to-br from-gold via-yellow-400 to-gold rounded-lg ml-3 shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-slate-900" />
                                  </div>
                                </div>
                              </Card>
                              <Card className="relative group backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 p-5 sm:p-6 border border-gold/20 rounded-xl hover:shadow-[0_12px_40px_0_rgba(255,215,0,0.3)] transition-all hover:border-gold/50 overflow-hidden sm:col-span-2 lg:col-span-1">
                                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10 flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs sm:text-sm font-bold text-gold/80 mb-2 uppercase tracking-wider">Assigned</p>
                                    <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold">
                                      {assignmentsData.summary.assigned_count || 0}
                                    </p>
                                    <p className="text-xs text-white/50 mt-2 font-medium">To realtors</p>
                                  </div>
                                  <div className="p-3 sm:p-4 bg-gradient-to-br from-gold via-yellow-400 to-gold rounded-lg ml-3 shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-slate-900" />
                                  </div>
                                </div>
                              </Card>
                            </div>
                          )}

                          {/* Unassigned Properties */}
                          {assignmentsData.unassigned_properties && assignmentsData.unassigned_properties.length > 0 && (
                            <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 rounded-2xl p-4 sm:p-6 border border-gold/20">
                              <h3 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold mb-4 sm:mb-6 flex items-center gap-3 flex-wrap">
                                <div className="p-2 bg-gradient-to-br from-gold via-yellow-400 to-gold rounded-lg shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                                  <AlertTriangle className="h-5 w-5 text-slate-900" />
                                </div>
                                Unassigned Properties
                                <Badge className="bg-gradient-to-r from-gold via-yellow-400 to-gold text-slate-900 text-sm sm:text-base px-3 py-1 font-black shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                                  {assignmentsData.unassigned_properties.length}
                                </Badge>
                              </h3>
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {assignmentsData.unassigned_properties.map((property: any, idx: number) => {
                                  const meta = getPropertyMetadata(property);
                                  return (
                                    <Card key={property.id || idx} className="relative backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 hover:shadow-[0_12px_40px_0_rgba(255,215,0,0.3)] transition-all duration-300 border border-gold/20 rounded-xl hover:border-gold/50 overflow-hidden">
                                      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                      <CardHeader className="relative z-10 pb-2 p-3 sm:p-4">
                                        <div className="flex items-start justify-between gap-2">
                                          <CardTitle className="text-sm sm:text-base font-black text-white">
                                            {meta.address || `Property #${property.id}`}
                                          </CardTitle>
                                          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-400/50 font-semibold whitespace-nowrap backdrop-blur-sm">Unassigned</Badge>
                                        </div>
                                        {meta.listing_id && (
                                          <div className="flex items-center gap-1.5 mt-2">
                                            <Info className="h-3 w-3 text-gold" />
                                            <p className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-400 bg-gold/20 backdrop-blur-sm px-2 py-0.5 rounded-md border border-gold/30">MLS: {meta.listing_id}</p>
                                          </div>
                                        )}
                                      </CardHeader>
                                      <CardContent className="relative z-10 space-y-3 text-sm p-3 sm:p-4">
                                        <p className="font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold text-lg sm:text-xl">
                                          ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                        </p>
                                        <div className="flex flex-wrap gap-2 font-bold">
                                          <span className="border border-gold/30 px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm text-white"><Bed className="h-3 w-3 inline mr-1 text-gold" /> {meta.bedrooms || 0}</span>
                                          <span className="border border-gold/30 px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm text-white"><Bath className="h-3 w-3 inline mr-1 text-gold" /> {meta.bathrooms || 0}</span>
                                          {meta.square_feet && <span className="border border-gold/30 px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm text-white"><Square className="h-3 w-3 inline mr-1 text-gold" /> {meta.square_feet} sqft</span>}
                                        </div>
                                        {meta.property_type && <Badge variant="outline" className="text-xs font-medium border-gold/30 bg-gold/10 text-white">{meta.property_type}</Badge>}
                                        
                                        {/* Status Update */}
                                        <div className="flex items-center gap-2 pt-2 border-t border-gold/30">
                                          <span className="text-xs font-bold text-gold/80">Status:</span>
                                          <Select 
                                            value={meta.listing_status || 'Available'} 
                                            onValueChange={(value) => handleUpdatePropertyStatus(property.id, value)}
                                          >
                                            <SelectTrigger className="h-8 text-xs flex-1 backdrop-blur-sm bg-white/10 text-white border-gold/30 hover:border-gold focus:ring-gold">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="backdrop-blur-xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 border border-gold/30">
                                              <SelectItem value="Available" className="text-white focus:bg-gold/20 focus:text-gold">Available</SelectItem>
                                              <SelectItem value="For Sale" className="text-white focus:bg-gold/20 focus:text-gold">For Sale</SelectItem>
                                              <SelectItem value="For Rent" className="text-white focus:bg-gold/20 focus:text-gold">For Rent</SelectItem>
                                              <SelectItem value="Sold" className="text-white focus:bg-gold/20 focus:text-gold">Sold</SelectItem>
                                              <SelectItem value="Rented" className="text-white focus:bg-gold/20 focus:text-gold">Rented</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {/* Agent Section with Remove */}
                                        {meta.agent && (
                                          <div className="pt-2 border-t border-gold/30 space-y-2 bg-gold/5 backdrop-blur-sm rounded-lg p-2 border border-gold/20">
                                            <div className="flex items-start justify-between mb-2">
                                              <p className="text-xs font-bold text-gold/80 uppercase tracking-wider">Agent:</p>
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/70 hover:text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded">
                                                    <X className="h-3 w-3" />
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="backdrop-blur-xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 border border-gold/30 shadow-[0_8px_32px_0_rgba(255,215,0,0.15)]">
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-white font-black text-xl">Remove Agent?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-white/80">
                                                      Are you sure you want to remove <span className="font-semibold text-gold">{meta.agent.name}</span> from this property? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel className="backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white border-gold/30 hover:border-gold">
                                                      Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction 
                                                      onClick={() => handleRemoveAgent(property.id)}
                                                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                                                    >
                                                      Remove Agent
                                                    </AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            </div>
                                            <div className="space-y-1.5 text-xs">
                                              <p className="font-black text-white">{meta.agent.name}</p>
                                              {meta.agent.email && (
                                                <div className="flex items-center gap-1.5 text-white/70 font-bold">
                                                  <Mail className="h-3 w-3 text-gold" />
                                                  <span className="truncate">{meta.agent.email}</span>
                                                </div>
                                              )}
                                              {meta.agent.phone && (
                                                <div className="flex items-center gap-1.5 text-white/70 font-bold">
                                                  <Phone className="h-3 w-3 text-gold" />
                                                  <span>{meta.agent.phone}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {meta.features && meta.features.length > 0 && (
                                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gold/30">
                                            {meta.features.slice(0, 2).map((f: string, i: number) => (
                                              <Badge key={i} variant="outline" className="text-xs font-medium border-gold/30 bg-gold/10 text-white">{f}</Badge>
                                            ))}
                                            {meta.features.length > 2 && <span className="text-xs text-white/50 font-medium">+{meta.features.length - 2}</span>}
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
                            <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 rounded-2xl p-4 sm:p-6 border border-gold/20">
                              <h3 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold mb-4 sm:mb-6 flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-gold via-yellow-400 to-gold rounded-lg shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                                  <Users className="h-5 w-5 text-slate-900" />
                                </div>
                                Assigned Properties by Realtor
                              </h3>
                              {Object.values(assignmentsData.assigned_properties).map((realtorGroup: any) => (
                                <Card key={realtorGroup.realtor_id} className="mb-6 relative backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 shadow-[0_8px_32px_0_rgba(255,215,0,0.15)] border border-gold/20 rounded-xl overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-50"></div>
                                  <CardHeader className="relative z-10 bg-gradient-to-r from-gold/10 via-gold/5 to-transparent rounded-t-xl border-b border-gold/30 p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                      <div className="flex-1">
                                        <CardTitle className="text-white text-lg sm:text-xl font-black flex items-center gap-2">
                                          <div className="p-1.5 bg-gradient-to-br from-gold via-yellow-400 to-gold rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                                            <User className="h-4 w-4 text-slate-900" />
                                          </div>
                                          {realtorGroup.realtor_name}
                                        </CardTitle>
                                        <p className="text-sm text-white/80 mt-1 flex items-center gap-1">
                                          <Mail className="h-3 w-3 text-gold" />
                                          {realtorGroup.realtor_email}
                                        </p>
                                      </div>
                                      <Badge className="bg-gradient-to-r from-gold via-yellow-400 to-gold text-slate-900 border-2 border-gold/50 text-sm sm:text-base px-4 py-2 font-black shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                                        {realtorGroup.count} {realtorGroup.count === 1 ? 'Property' : 'Properties'}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="relative z-10 p-4 sm:p-6">
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                      {realtorGroup.properties.map((property: any, idx: number) => {
                                        const meta = getPropertyMetadata(property);
                                        return (
                                          <Card key={property.id || idx} className="relative backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 hover:shadow-[0_12px_40px_0_rgba(255,215,0,0.3)] transition-all duration-300 border border-gold/20 rounded-xl hover:border-gold/50 overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <CardHeader className="relative z-10 pb-2 p-3 sm:p-4">
                                              <CardTitle className="text-sm sm:text-base font-black text-white">
                                                {meta.address || `Property #${property.id}`}
                                              </CardTitle>
                                              {meta.listing_id && (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                  <Info className="h-3 w-3 text-gold" />
                                                  <p className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-400 bg-gold/20 backdrop-blur-sm px-2 py-0.5 rounded-md border border-gold/30">MLS: {meta.listing_id}</p>
                                                </div>
                                              )}
                                            </CardHeader>
                                            <CardContent className="relative z-10 space-y-3 text-sm p-3 sm:p-4">
                                              <div className="flex items-center justify-between gap-2">
                                                <p className="font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold text-lg sm:text-xl">
                                                  ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                                </p>
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 px-2 backdrop-blur-sm bg-red-500/20 hover:bg-red-500/30 text-white border-red-500/50 hover:border-red-500 font-semibold transition-all shadow-[0_4px_14px_0_rgba(239,68,68,0.15)]">
                                                      <Trash2 className="h-3 w-3 mr-1" />
                                                      <span className="hidden sm:inline">Unassign</span>
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent className="backdrop-blur-xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 border border-gold/30 shadow-[0_8px_32px_0_rgba(255,215,0,0.15)]">
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle className="text-white font-black text-xl">Unassign Property?</AlertDialogTitle>
                                                      <AlertDialogDescription className="text-white/80">
                                                        Are you sure you want to unassign this property from <span className="font-semibold text-gold">{realtorGroup.realtor_name}</span>? The property will become available for reassignment.
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel className="backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white border-gold/30 hover:border-gold">Cancel</AlertDialogCancel>
                                                      <AlertDialogAction 
                                                        onClick={() => handleUnassignProperties([property.id])}
                                                        className="bg-gradient-to-r from-gold via-yellow-400 to-gold text-slate-900 font-black shadow-[0_0_20px_rgba(255,215,0,0.5)]"
                                                      >
                                                        Unassign Property
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                              </div>
                                              <div className="flex flex-wrap gap-2 font-bold">
                                                <span className="border border-gold/30 px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm text-white"><Bed className="h-3 w-3 inline mr-1 text-gold" /> {meta.bedrooms || 0}</span>
                                                <span className="border border-gold/30 px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm text-white"><Bath className="h-3 w-3 inline mr-1 text-gold" /> {meta.bathrooms || 0}</span>
                                                {meta.square_feet && <span className="border border-gold/30 px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm text-white"><Square className="h-3 w-3 inline mr-1 text-gold" /> {meta.square_feet} sqft</span>}
                                              </div>
                                              {meta.property_type && <Badge variant="outline" className="text-xs font-medium border-gold/30 bg-gold/10 text-white">{meta.property_type}</Badge>}
                                              
                                              {/* Status Update */}
                                              <div className="flex items-center gap-2 pt-2 border-t border-gold/30">
                                                <span className="text-xs font-bold text-gold/80">Status:</span>
                                                <Select 
                                                  value={meta.listing_status || 'Available'} 
                                                  onValueChange={(value) => handleUpdatePropertyStatus(property.id, value)}
                                                >
                                                  <SelectTrigger className="h-8 text-xs flex-1 backdrop-blur-sm bg-white/10 text-white border-gold/30 hover:border-gold focus:ring-gold">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="backdrop-blur-xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 border border-gold/30">
                                                    <SelectItem value="Available" className="text-white focus:bg-gold/20 focus:text-gold">Available</SelectItem>
                                                    <SelectItem value="For Sale" className="text-white focus:bg-gold/20 focus:text-gold">For Sale</SelectItem>
                                                    <SelectItem value="For Rent" className="text-white focus:bg-gold/20 focus:text-gold">For Rent</SelectItem>
                                                    <SelectItem value="Sold" className="text-white focus:bg-gold/20 focus:text-gold">Sold</SelectItem>
                                                    <SelectItem value="Rented" className="text-white focus:bg-gold/20 focus:text-gold">Rented</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>

                                              {/* Agent Section with Remove */}
                                              {meta.agent && (
                                                <div className="pt-2 border-t border-gold/30 space-y-2 bg-gold/5 backdrop-blur-sm rounded-lg p-2 border border-gold/20">
                                                  <div className="flex items-start justify-between mb-2">
                                                    <p className="text-xs font-bold text-gold/80 uppercase tracking-wider">Agent:</p>
                                                    <AlertDialog>
                                                      <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/70 hover:text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded">
                                                          <X className="h-3 w-3" />
                                                        </Button>
                                                      </AlertDialogTrigger>
                                                      <AlertDialogContent className="backdrop-blur-xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 border border-gold/30 shadow-[0_8px_32px_0_rgba(255,215,0,0.15)]">
                                                        <AlertDialogHeader>
                                                          <AlertDialogTitle className="text-white font-black text-xl">Remove Agent?</AlertDialogTitle>
                                                          <AlertDialogDescription className="text-white/80">
                                                            Are you sure you want to remove <span className="font-semibold text-gold">{meta.agent.name}</span> from this property? This action cannot be undone.
                                                          </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                          <AlertDialogCancel className="backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white border-gold/30 hover:border-gold">
                                                            Cancel
                                                          </AlertDialogCancel>
                                                          <AlertDialogAction 
                                                            onClick={() => handleRemoveAgent(property.id)}
                                                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                                                          >
                                                            Remove Agent
                                                          </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                      </AlertDialogContent>
                                                    </AlertDialog>
                                                  </div>
                                                  <div className="space-y-1.5 text-xs">
                                                    <p className="font-black text-white">{meta.agent.name}</p>
                                                    {meta.agent.email && (
                                                      <div className="flex items-center gap-1.5 text-white/70 font-bold">
                                                        <Mail className="h-3 w-3 text-gold" />
                                                        <span className="truncate">{meta.agent.email}</span>
                                                      </div>
                                                    )}
                                                    {meta.agent.phone && (
                                                      <div className="flex items-center gap-1.5 text-white/70 font-bold">
                                                        <Phone className="h-3 w-3 text-gold" />
                                                        <span>{meta.agent.phone}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                              {meta.features && meta.features.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gold/30">
                                                  {meta.features.slice(0, 2).map((f: string, i: number) => (
                                                    <Badge key={i} variant="outline" className="text-xs font-medium border-gold/30 bg-gold/10 text-white">{f}</Badge>
                                                  ))}
                                                  {meta.features.length > 2 && <span className="text-xs text-white/50 font-medium">+{meta.features.length - 2}</span>}
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
      <p className="text-black font-semibold text-center py-8">Loading apartments...</p>
    ) : apartments.length === 0 ? (
      <p className="text-black/70 font-semibold text-center py-8">No apartments found.</p>
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
          <Card className="relative backdrop-blur-xl bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 rounded-2xl shadow-[0_8px_32px_0_rgba(255,215,0,0.15)] hover:shadow-[0_12px_40px_0_rgba(255,215,0,0.3)] transition-all duration-300 group overflow-hidden h-full border border-gold/20 hover:border-gold/50">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-gold/10 rounded-full blur-2xl -mr-20 -mt-20 group-hover:bg-gold/20 transition-all"></div>
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-800/50 rounded-t-2xl">
              <motion.img
                src={meta.image_url || "/images/properties/default.jpg"}
                alt={`Property at ${meta.address}`}
                loading="lazy"
                className="h-full w-full object-cover"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.5 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-gold/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {meta.listing_status && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge 
                    variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                    className={`text-xs font-black border-2 border-gold/50 shadow-[0_0_15px_rgba(255,215,0,0.5)] backdrop-blur-sm ${
                      meta.listing_status === 'Available' 
                        ? 'bg-gradient-to-r from-gold via-yellow-400 to-gold text-slate-900' 
                        : meta.listing_status === 'Sold' || meta.listing_status === 'Rented'
                        ? 'bg-white/90 text-slate-900'
                        : 'bg-white/90 text-slate-900'
                    }`}
                  >
                    {meta.listing_status}
                  </Badge>
                </div>
              )}
            </div>
            <CardHeader className="relative z-10 pb-3 pt-4 px-3 sm:px-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardTitle className="text-white text-base sm:text-lg font-black group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gold group-hover:to-yellow-400 transition-all">
                      {meta.address || `Property #${apt.id}`}
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p className="font-medium">{meta.address || `Property #${apt.id}`}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {meta.listing_id && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Info className="h-3 w-3 text-gold" />
                  <p className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-400 bg-gold/20 backdrop-blur-sm px-2 py-0.5 rounded-md border border-gold/30">MLS: {meta.listing_id}</p>
                </div>
              )}
            </CardHeader>
              <CardContent className="relative z-10 space-y-3 p-3 sm:p-4">
                {/* Price */}
                <div className="flex items-center justify-between border-b border-gold/30 pb-3">
                  <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold">
                    ${meta.price ? meta.price.toLocaleString() : "N/A"}
                  </div>
                  {meta.listing_status && (
                    <Badge 
                      variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                      className={`text-xs font-black border-2 border-gold/50 shadow-[0_0_10px_rgba(255,215,0,0.3)] backdrop-blur-sm ${
                        meta.listing_status === 'Available' 
                          ? 'bg-gradient-to-r from-gold via-yellow-400 to-gold text-slate-900' 
                          : 'bg-white/90 text-slate-900'
                      }`}
                    >
                      {meta.listing_status}
                    </Badge>
                  )}
                </div>

                {/* Basic Specs */}
                <div className="grid grid-cols-3 gap-2 text-sm font-bold">
                  <div className="flex items-center gap-1.5 text-white bg-white/10 backdrop-blur-sm border border-gold/30 px-2.5 py-1.5 rounded-lg hover:bg-gold/20 hover:border-gold transition-all">
                    <Bed className="h-4 w-4 text-gold" /> <span className="text-gold">{meta.bedrooms || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white bg-white/10 backdrop-blur-sm border border-gold/30 px-2.5 py-1.5 rounded-lg hover:bg-gold/20 hover:border-gold transition-all">
                    <Bath className="h-4 w-4 text-gold" /> <span className="text-gold">{meta.bathrooms || 0}</span>
                  </div>
                  {meta.square_feet && (
                    <div className="flex items-center gap-1.5 text-white bg-white/10 backdrop-blur-sm border border-gold/30 px-2.5 py-1.5 rounded-lg hover:bg-gold/20 hover:border-gold transition-all">
                      <Square className="h-4 w-4 text-gold" /> <span className="text-gold">{meta.square_feet}</span>
                    </div>
                  )}
                </div>

                {/* Property Details Grid */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  {meta.property_type && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Type:</span>
                      <Badge variant="outline" className="text-xs font-medium border-gray-300 bg-gray-50 text-gray-700">
                        {meta.property_type}
                      </Badge>
                    </div>
                  )}
                  
                  {meta.year_built && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Year Built:</span>
                      <span className="font-semibold text-gray-900">{meta.year_built}</span>
                    </div>
                  )}

                  {meta.lot_size_sqft && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Lot Size:</span>
                      <span className="font-semibold text-gray-900">{meta.lot_size_sqft.toLocaleString()} sqft</span>
                    </div>
                  )}

                  {meta.days_on_market !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Days on Market:</span>
                      <span className="font-semibold text-gray-900">{meta.days_on_market}</span>
                    </div>
                  )}

                  {meta.listing_date && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" /> Listed:
                      </span>
                      <span className="font-semibold text-gray-900">{new Date(meta.listing_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                {meta.features && meta.features.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Features:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {meta.features.map((feature: string, fIdx: number) => (
                        <Badge key={fIdx} variant="outline" className="text-xs font-medium border-gold/30 bg-gold/10 text-gray-700 hover:bg-gold/20 hover:border-gold transition-all">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agent Information */}
                {meta.agent && (
                  <div className="pt-2 border-t border-gray-200 space-y-1 bg-gray-50 rounded-lg p-2">
                    <p className="text-xs font-semibold text-gray-600">Agent:</p>
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-gray-900">{meta.agent.name}</p>
                      {meta.agent.email && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="truncate">{meta.agent.email}</span>
                        </div>
                      )}
                      {meta.agent.phone && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{meta.agent.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Assignment Status (for PM) */}
                {userType === "property_manager" && (
                  <div className="pt-2 border-t border-gray-200">
                    {meta.is_assigned && meta.assigned_to_realtor_name ? (
                      <div className="flex items-center justify-between text-xs bg-gray-50 rounded-lg p-2">
                        <span className="text-gray-600 font-medium">Assigned to:</span>
                        <Badge className="bg-gold text-white text-xs font-semibold">
                          {meta.assigned_to_realtor_name}
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-gray-600 border-yellow-200 text-xs font-medium w-full justify-center">
                        Unassigned
                      </Badge>
                    )}
                  </div>
                )}

                {/* Description (truncated) */}
                {meta.description && (
                  <div className="pt-2 border-t border-gray-200 bg-gray-50 rounded-lg p-2">
                    <div className="flex items-start gap-2">
                      <Info className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-600 line-clamp-2 font-medium">
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
    <Card className="bg-white border-2 border-black rounded-xl shadow-lg">
      <CardHeader className="bg-black rounded-t-xl border-b-2 border-gold p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <CardTitle className="text-white text-xl sm:text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gold rounded-lg">
              <Calendar className="h-5 w-5 text-black" />
            </div>
            Your Bookings
          </CardTitle>
          <p className="text-sm text-white/80 mt-2 ml-14">
            All your active and past bookings are listed below.
          </p>
        </motion.div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {loadingBookings ? (
          <p className="text-black font-semibold text-center py-8">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p className="text-black/70 font-semibold text-center py-8">No bookings found.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border-2 border-black bg-white">
            <Table>
              <TableHeader className="bg-black">
                <TableRow className="border-b-2 border-gold">
                  <TableHead className="font-bold text-white py-3 sm:py-4 px-2 sm:px-4">Booking ID</TableHead>
                  <TableHead className="font-bold text-white py-3 sm:py-4 px-2 sm:px-4">Property</TableHead>
                  <TableHead className="font-bold text-white py-3 sm:py-4 px-2 sm:px-4">Date</TableHead>
                  <TableHead className="font-bold text-white py-3 sm:py-4 px-2 sm:px-4">Time</TableHead>
                  <TableHead className="font-bold text-white py-3 sm:py-4 px-2 sm:px-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b, idx) => (
                  <motion.tr
                    key={b.id || idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="hover:bg-gold/10 transition-all duration-200 group border-b border-black/10"
                  >
                    <TableCell className="font-semibold text-black py-3 sm:py-4 px-2 sm:px-4 group-hover:text-black transition-colors">
                      {b.id}
                    </TableCell>
                    <TableCell className="text-black/70 py-3 sm:py-4 px-2 sm:px-4">{b.property || b.property_name || b.address}</TableCell>
                    <TableCell className="text-black/70 py-3 sm:py-4 px-2 sm:px-4">{b.date}</TableCell>
                    <TableCell className="text-black/70 py-3 sm:py-4 px-2 sm:px-4">{b.time}</TableCell>
                    <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                      <Badge
                        variant={b.status === "Confirmed" ? "default" : "secondary"}
                        className={`font-bold border-2 border-black ${
                          b.status === "Confirmed"
                            ? "bg-gold text-black"
                            : "bg-white text-black"
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

            <TabsContent value="conversations">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white rounded-t-xl border-b border-gray-200 p-4 sm:p-6">
        <CardTitle className="text-gray-900 text-xl sm:text-2xl font-bold flex items-center gap-2">
          <div className="p-2 bg-gold rounded-lg">
            <Music className="h-5 w-5 text-white" />
          </div>
          Conversations (Call Recordings)
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Listen to your recorded calls with leads and clients.
        </p>
      </CardHeader>
      <CardContent>
        {loadingRecordings ? (
          <p className="text-gray-600 font-medium text-center py-8">Loading recordings...</p>
        ) : recordings.length === 0 ? (
          <p className="text-gray-500 font-medium text-center py-8">No recordings available.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900 py-3 sm:py-4 px-2 sm:px-4">Call</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 sm:py-4 px-2 sm:px-4">Recording</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordings.map((rec, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="hover:bg-gold/10 transition-all duration-200 group border-b border-black/10"
                  >
                    <TableCell className="font-semibold text-black py-3 sm:py-4 px-2 sm:px-4 group-hover:text-black transition-colors">
                      Call #{idx + 1}
                    </TableCell>
                    <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
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
    <Card className="bg-white border-2 border-black rounded-xl shadow-lg">
      <CardHeader className="bg-black rounded-t-xl border-b-2 border-gold p-4 sm:p-6">
        <CardTitle className="text-white text-xl sm:text-2xl font-bold flex items-center gap-2">
          <div className="p-2 bg-gold rounded-lg">
            <Phone className="h-5 w-5 text-black" />
          </div>
          Customer Chats
        </CardTitle>
        <p className="text-sm text-white/80 mt-2">
          View conversations with your clients in a chat-style layout.
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {loadingChats ? (
          <p className="text-black font-semibold text-center py-8">Loading chats...</p>
        ) : Object.keys(chats).length === 0 ? (
          <p className="text-black/70 font-semibold text-center py-8">No chats available.</p>
        ) : (
          <div className="flex flex-col items-center gap-6 overflow-x-hidden">
            {Object.entries(chats).map(([customer, messages]: any, idx) => (
              <div
                key={idx}
                className="border-2 border-black rounded-xl p-4 sm:p-6 bg-white shadow-lg w-full max-w-[650px] mx-auto"
              >
                <h3 className="text-lg sm:text-xl font-bold text-black mb-4 text-center border-b-2 border-black pb-3">
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
                        className={`px-4 py-2 rounded-2xl max-w-[70%] text-sm shadow-lg border-2 ${
                          msg.sender === "realtor"
                            ? "bg-gold text-black border-black rounded-br-none"
                            : "bg-white text-black border-black rounded-bl-none"
                        }`}
                      >
                        <p className="font-medium">{msg.message}</p>
                        <div className="text-[10px] text-black/50 mt-1 font-semibold">
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
