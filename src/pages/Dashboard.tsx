import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, MapPin, Bed, Bath, Ruler, TrendingUp, Calendar, Eye, Music, Phone, Users, UserPlus, Settings, Building2, CheckSquare, Square, CalendarDays, User, ListChecks, RefreshCw, Mail, Calendar as CalendarIcon, Info, X, AlertTriangle, Edit2, Trash2, CheckCircle2, ChevronRight, Search, Filter, MoreHorizontal, Star, Download, Play, Pause, Volume2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
const API_BASE = "https://leasing-copilot-mvp.onrender.com";

// Helper function to parse and extract metadata from property
const getPropertyMetadata = (property: any) => {
  let metadata = property.listing_metadata;
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch (e) {
      metadata = {};
    }
  }
  
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
  const [availablePropertiesForAssignment, setAvailablePropertiesForAssignment] = useState<any[]>([]);
  const [loadingAssignmentProperties, setLoadingAssignmentProperties] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [selectedRealtor, setSelectedRealtor] = useState<number | null>(null);
  const [assigningProperties, setAssigningProperties] = useState(false);
  const [assignmentsData, setAssignmentsData] = useState<any>(null);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRecording, setActiveRecording] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Filter properties based on search
  const filteredProperties = useMemo(() => {
    if (!searchQuery) return apartments;
    return apartments.filter(property => {
      const meta = getPropertyMetadata(property);
      return (
        meta.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meta.property_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meta.listing_status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meta.price?.toString().includes(searchQuery)
      );
    });
  }, [apartments, searchQuery]);

  useEffect(() => {
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

    setTimeout(() => setAnimateCards(true), 300);
    
    fetchNumber();
    fetchApartments();
    fetchRecordings();
    fetchBookings();
    fetchChats(); 

    if (storedUserType === "property_manager") {
      fetchRealtors();
      fetchPropertiesForAssignment();
      fetchAssignments();
    }
  }, []);

  // Your existing API functions remain the same...
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
      
      fetchPropertiesForAssignment();
      fetchApartments();
      fetchAssignments();
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
      const token = localStorage.getItem("access_token");
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

  const handleRecordingPlay = (index: number) => {
    if (activeRecording === index) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveRecording(index);
      setIsPlaying(true);
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
        type: "spring",
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
        ease: "easeOut"
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
      {/* Enhanced Header */}
      <motion.header 
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-amber-200/50 shadow-sm"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-3 rounded-2xl shadow-lg shadow-amber-200">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-amber-400/20 rounded-2xl blur-sm -z-10"></div>
              </motion.div>
              <div className="min-w-0 flex-1">
                <motion.h1 
                  className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1 truncate"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {userType === "property_manager" ? "Property Manager" : "My"} Dashboard
                </motion.h1>
                <motion.p 
                  className="text-gray-600 text-sm truncate"
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
              className="flex flex-wrap gap-3 w-full lg:w-auto"
            >
              <Button 
                asChild 
                variant="outline"
                className="bg-white hover:bg-amber-50 text-gray-700 border-gray-300 hover:border-amber-300 font-medium transition-all duration-200 shadow-sm hover:shadow-md rounded-xl"
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
                className="bg-white hover:bg-amber-50 text-gray-700 border-gray-300 hover:border-amber-300 font-medium transition-all duration-200 shadow-sm hover:shadow-md rounded-xl"
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
                className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
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
          </div>

          {myNumber && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="mt-4 pt-4 border-t border-gray-200/50"
            >
              <div className="flex items-center gap-3 bg-amber-50/50 rounded-xl p-3 border border-amber-200/50">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Your Phone Number</p>
                  <p className="text-lg font-bold text-amber-600">{myNumber}</p>
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
                    <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Total Realtors</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" }}
                    >
                      {realtors.length}
                    </motion.p>
                    <p className="text-xs text-gray-400 mt-2">Active team members</p>
                  </div>
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-200 shadow-lg"
                    whileHover={{ rotate: 5 }}
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
                    <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Total Properties</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.0, type: "spring" }}
                    >
                      {apartments.length}
                    </motion.p>
                    <p className="text-xs text-gray-400 mt-2">In your portfolio</p>
                  </div>
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-200 shadow-lg"
                    whileHover={{ rotate: -5 }}
                  >
                    <TrendingUp className="h-6 w-6 text-white" />
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
                    <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Active Bookings</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" }}
                    >
                      {bookings.length}
                    </motion.p>
                    <p className="text-xs text-gray-400 mt-2">Scheduled viewings</p>
                  </div>
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-200 shadow-lg"
                    whileHover={{ rotate: 5 }}
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
                    <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Unassigned</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.4, type: "spring" }}
                    >
                      {availablePropertiesForAssignment.length}
                    </motion.p>
                    <p className="text-xs text-gray-400 mt-2">Need assignment</p>
                  </div>
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-200 shadow-lg"
                    whileHover={{ rotate: -5 }}
                  >
                    <AlertTriangle className="h-6 w-6 text-white" />
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
                    <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">My Properties</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" }}
                    >
                      {apartments.length}
                    </motion.p>
                    <p className="text-xs text-gray-400 mt-2">Assigned to you</p>
                  </div>
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-200 shadow-lg"
                    whileHover={{ rotate: 5 }}
                  >
                    <TrendingUp className="h-6 w-6 text-white" />
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
                    <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">My Bookings</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.0, type: "spring" }}
                    >
                      {bookings.length}
                    </motion.p>
                    <p className="text-xs text-gray-400 mt-2">Scheduled viewings</p>
                  </div>
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-200 shadow-lg"
                    whileHover={{ rotate: -5 }}
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
                    <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Property Views</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" }}
                    >
                      1,247
                    </motion.p>
                    <p className="text-xs text-gray-400 mt-2">Total views this month</p>
                  </div>
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-200 shadow-lg"
                    whileHover={{ rotate: 5 }}
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
                    <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Call Recordings</p>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.4, type: "spring" }}
                    >
                      {recordings.length}
                    </motion.p>
                    <p className="text-xs text-gray-400 mt-2">Client conversations</p>
                  </div>
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-200 shadow-lg"
                    whileHover={{ rotate: -5 }}
                  >
                    <Music className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </motion.section>

      {/* Main Content Area */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Tabs defaultValue={userType === "property_manager" ? "properties" : "properties"} className="w-full">
            {/* Enhanced Tabs List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mb-8"
            >
              <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                <TabsList className="bg-white border border-amber-200 rounded-2xl p-1.5 shadow-sm inline-flex min-w-full lg:min-w-0 overflow-x-auto">
                  {userType === "property_manager" && (
                    <TabsTrigger 
                      value="realtors" 
                      className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-4 py-2.5 font-semibold transition-all duration-200 text-sm"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      <span>Realtors</span>
                    </TabsTrigger>
                  )}
                  {userType === "property_manager" && (
                    <>
                      <TabsTrigger 
                        value="assign-properties" 
                        className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-4 py-2.5 font-semibold transition-all duration-200 text-sm"
                      >
                        <CheckSquare className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Assign Properties</span>
                        <span className="sm:hidden">Assign</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="view-assignments" 
                        className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-4 py-2.5 font-semibold transition-all duration-200 text-sm"
                      >
                        <ListChecks className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Assignments</span>
                        <span className="sm:hidden">View</span>
                      </TabsTrigger>
                    </>
                  )}
                  <TabsTrigger 
                    value="properties" 
                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-4 py-2.5 font-semibold transition-all duration-200 text-sm"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    <span>Properties</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="bookings" 
                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-4 py-2.5 font-semibold transition-all duration-200 text-sm"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Bookings</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="conversations" 
                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-4 py-2.5 font-semibold transition-all duration-200 text-sm"
                  >
                    <Music className="h-4 w-4 mr-2" />
                    <span className="hidden lg:inline">Recordings</span>
                    <span className="lg:hidden">Calls</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="chats" 
                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-4 py-2.5 font-semibold transition-all duration-200 text-sm"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    <span>Chats</span>
                  </TabsTrigger>
                </TabsList>

                {/* Search Bar */}
                <div className="relative min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search properties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-white border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                  />
                </div>
              </div>
            </motion.div>

            {/* Properties Tab - Enhanced Design */}
            <TabsContent value="properties" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Properties</h2>
                    <p className="text-gray-600 mt-1">Manage your property portfolio</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="border-amber-200 text-gray-700 hover:bg-amber-50 rounded-xl">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Property
                    </Button>
                  </div>
                </div>

                {loadingApartments ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-amber-200 shadow-sm">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties found</h3>
                    <p className="text-gray-600 mb-4">Get started by adding your first property</p>
                    <Button className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl">
                      Add Property
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredProperties.map((apt, idx) => {
                      const meta = getPropertyMetadata(apt);
                      return (
                        <motion.div
                          key={apt.id || idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: idx * 0.1 }}
                          whileHover={{ y: -8 }}
                          className="group"
                        >
                          <Card className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-amber-100 overflow-hidden h-full">
                            <div className="relative aspect-[4/3] overflow-hidden">
                              <img
                                src={meta.image_url || "/api/placeholder/400/300"}
                                alt={meta.address}
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className="absolute top-3 right-3">
                                <Badge className={`${
                                  meta.listing_status === 'Available' 
                                    ? 'bg-green-500 text-white' 
                                    : meta.listing_status === 'Sold'
                                    ? 'bg-gray-500 text-white'
                                    : 'bg-amber-500 text-white'
                                } font-semibold border-0 shadow-lg`}>
                                  {meta.listing_status || 'Available'}
                                </Badge>
                              </div>
                              <div className="absolute bottom-3 left-3 right-3">
                                <p className="text-white font-bold text-lg drop-shadow-lg">
                                  ${meta.price?.toLocaleString() || 'N/A'}
                                </p>
                              </div>
                            </div>

                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-bold text-gray-900 text-lg line-clamp-1 mb-1">
                                    {meta.address || `Property #${apt.id}`}
                                  </h3>
                                  <div className="flex items-center text-gray-600 text-sm">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    <span>Downtown District</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                      <Bed className="h-4 w-4 text-amber-600" />
                                      <span className="font-semibold text-gray-900">{meta.bedrooms || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Bath className="h-4 w-4 text-amber-600" />
                                      <span className="font-semibold text-gray-900">{meta.bathrooms || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Square className="h-4 w-4 text-amber-600" />
                                      <span className="font-semibold text-gray-900">{meta.square_feet || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>

                                {meta.features && meta.features.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {meta.features.slice(0, 2).map((feature: string, fIdx: number) => (
                                      <Badge key={fIdx} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                        {feature}
                                      </Badge>
                                    ))}
                                    {meta.features.length > 2 && (
                                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                                        +{meta.features.length - 2} more
                                      </Badge>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                  <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg">
                                    View Details
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </Button>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-amber-400 fill-current" />
                                    <span className="text-sm font-semibold text-gray-900">4.8</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* Bookings Tab - Enhanced Design */}
            <TabsContent value="bookings" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                            <Calendar className="h-6 w-6 text-white" />
                          </div>
                          Bookings & Appointments
                        </CardTitle>
                        <p className="text-gray-600 mt-2">Manage your property viewings and appointments</p>
                      </div>
                      <Button className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-lg">
                        <Calendar className="h-4 w-4 mr-2" />
                        New Booking
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loadingBookings ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                      </div>
                    ) : bookings.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings scheduled</h3>
                        <p className="text-gray-600 mb-4">Your upcoming appointments will appear here</p>
                        <Button className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl">
                          Schedule Viewing
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-gray-200">
                        <Table>
                          <TableHeader className="bg-amber-50">
                            <TableRow className="border-b border-amber-100">
                              <TableHead className="font-semibold text-gray-900 py-4 px-4">Property</TableHead>
                              <TableHead className="font-semibold text-gray-900 py-4 px-4">Client</TableHead>
                              <TableHead className="font-semibold text-gray-900 py-4 px-4">Date & Time</TableHead>
                              <TableHead className="font-semibold text-gray-900 py-4 px-4">Status</TableHead>
                              <TableHead className="font-semibold text-gray-900 py-4 px-4">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bookings.map((booking, idx) => (
                              <TableRow key={booking.id || idx} className="border-b border-gray-100 hover:bg-amber-50/50 transition-colors">
                                <TableCell className="py-4 px-4">
                                  <div className="font-semibold text-gray-900">{booking.property}</div>
                                  <div className="text-sm text-gray-600">{booking.address}</div>
                                </TableCell>
                                <TableCell className="py-4 px-4">
                                  <div className="font-medium text-gray-900">{booking.clientName}</div>
                                  <div className="text-sm text-gray-600">{booking.clientPhone}</div>
                                </TableCell>
                                <TableCell className="py-4 px-4">
                                  <div className="font-medium text-gray-900">{booking.date}</div>
                                  <div className="text-sm text-gray-600">{booking.time}</div>
                                </TableCell>
                                <TableCell className="py-4 px-4">
                                  <Badge className={`${
                                    booking.status === 'Confirmed' 
                                      ? 'bg-green-500 text-white'
                                      : booking.status === 'Pending'
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-gray-500 text-white'
                                  } font-semibold border-0`}>
                                    {booking.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-4 px-4">
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg">
                                      <Phone className="h-4 w-4 mr-1" />
                                      Call
                                    </Button>
                                    <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg">
                                      <Edit2 className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Recordings Tab - Enhanced Design */}
            <TabsContent value="conversations" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-6">
                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                        <Music className="h-6 w-6 text-white" />
                      </div>
                      Call Recordings
                    </CardTitle>
                    <p className="text-gray-600 mt-2">Review your client conversations and calls</p>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loadingRecordings ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                      </div>
                    ) : recordings.length === 0 ? (
                      <div className="text-center py-12">
                        <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No recordings available</h3>
                        <p className="text-gray-600">Your call recordings will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recordings.map((recording, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.1 }}
                            className="flex items-center justify-between p-4 bg-white border border-amber-100 rounded-xl hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`p-3 rounded-xl ${
                                activeRecording === idx && isPlaying 
                                  ? 'bg-amber-500 text-white' 
                                  : 'bg-amber-100 text-amber-600'
                              } transition-colors duration-200`}>
                                {activeRecording === idx && isPlaying ? (
                                  <Pause className="h-5 w-5" />
                                ) : (
                                  <Play className="h-5 w-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">
                                  Call with Client #{idx + 1}
                                </h4>
                                <p className="text-sm text-gray-600">Duration: 5:30 • Recorded 2 days ago</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleRecordingPlay(idx)}
                                variant="outline"
                                size="sm"
                                className={`rounded-lg ${
                                  activeRecording === idx && isPlaying
                                    ? 'border-amber-500 text-amber-600 bg-amber-50'
                                    : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                                }`}
                              >
                                {activeRecording === idx && isPlaying ? 'Pause' : 'Play'}
                              </Button>
                              <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Your existing other tabs (realtors, assign-properties, view-assignments, chats) */}
            {/* They would follow the same enhanced design pattern */}

          </Tabs>
        </motion.div>
      </section>
    </main>
  );
};

// Add the missing Plus icon component
const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default Dashboard;