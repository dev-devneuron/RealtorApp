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
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      {/* Header */}
      <motion.header 
        className="bg-white shadow-sm border-b border-amber-200"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl shadow-md">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {userType === "property_manager" ? "Property Manager" : "My"} Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {userType === "property_manager" 
                    ? "Manage your properties and team"
                    : "View your assigned properties and bookings"
                  }
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <Button 
                asChild 
                variant="outline"
                className="border-amber-200 hover:bg-amber-50 hover:border-amber-400"
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
                className="border-amber-200 hover:bg-amber-50 hover:border-amber-400"
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
                className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white shadow-md"
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
            </div>
          </div>
          {myNumber && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Your Phone Number: <span className="font-bold">{myNumber}</span></span>
              </div>
            </div>
          )}
        </div>
      </motion.header>

      {/* Stats Cards */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {userType === "property_manager" ? (
            <>
              <motion.div variants={itemVariants}>
                <Card className="bg-white border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">My Bookings</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{bookings.length}</p>
                      </div>
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Card className="bg-white border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Property Views</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">1,247</p>
                      </div>
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <Eye className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </motion.div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs defaultValue={userType === "property_manager" ? "realtors" : "properties"} className="w-full">
          <div className="bg-white rounded-lg shadow-sm border border-amber-100 p-1 mb-6 overflow-x-auto">
            <TabsList className="bg-transparent gap-1">
              {userType === "property_manager" && (
                <>
                  <TabsTrigger 
                    value="realtors" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-white rounded-md px-4 py-2"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Realtors
                  </TabsTrigger>
                  <TabsTrigger 
                    value="assign-properties" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-white rounded-md px-4 py-2"
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Assign Properties</span>
                    <span className="sm:hidden">Assign</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="view-assignments" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-white rounded-md px-4 py-2"
                  >
                    <ListChecks className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">View Assignments</span>
                    <span className="sm:hidden">Assignments</span>
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger 
                value="properties" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-white rounded-md px-4 py-2"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Properties
              </TabsTrigger>
              <TabsTrigger 
                value="bookings" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-white rounded-md px-4 py-2"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Bookings
              </TabsTrigger>
              <TabsTrigger 
                value="conversations" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-white rounded-md px-4 py-2"
              >
                <Music className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Conversations</span>
                <span className="lg:hidden">Chats</span>
              </TabsTrigger>
              <TabsTrigger 
                value="chats" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-white rounded-md px-4 py-2"
              >
                <Phone className="h-4 w-4 mr-2" />
                Calls
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Realtors Tab */}
          {userType === "property_manager" && (
            <TabsContent value="realtors">
              <Card className="bg-white shadow-sm border border-amber-100">
                <CardHeader className="border-b border-amber-100">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="h-5 w-5 text-amber-600" />
                        Manage Realtors
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Add and manage your realtor team members
                      </p>
                    </div>
                    <Button 
                      onClick={() => setShowAddRealtor(!showAddRealtor)}
                      className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Realtor
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {showAddRealtor && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Realtor</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <input
                          type="text"
                          value={newRealtor.name}
                          onChange={(e) => setNewRealtor({...newRealtor, name: e.target.value})}
                          className="p-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                          placeholder="Full Name"
                        />
                        <input
                          type="email"
                          value={newRealtor.email}
                          onChange={(e) => setNewRealtor({...newRealtor, email: e.target.value})}
                          className="p-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                          placeholder="Email Address"
                        />
                        <input
                          type="password"
                          value={newRealtor.password}
                          onChange={(e) => setNewRealtor({...newRealtor, password: e.target.value})}
                          className="p-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                          placeholder="Password"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          onClick={addRealtor} 
                          className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Create Account
                        </Button>
                        <Button 
                          onClick={() => setShowAddRealtor(false)}
                          variant="outline"
                          className="border-amber-200"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {loadingRealtors ? (
                    <p className="text-center py-8 text-gray-600">Loading realtors...</p>
                  ) : realtors.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">No realtors found. Add your first realtor above.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-amber-100">
                      <Table>
                        <TableHeader className="bg-amber-50">
                          <TableRow>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Email</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {realtors.map((realtor) => (
                            <TableRow key={realtor.id} className="hover:bg-amber-50">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-amber-600" />
                                  {realtor.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-600">{realtor.email}</TableCell>
                              <TableCell>
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  Active
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={handleSettingsClick}
                                    className="border-amber-200"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete {realtor.name}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will move all their properties back to you and remove them from the system. This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteRealtor(realtor.id, realtor.name)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
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
            </TabsContent>
          )}

          {/* Assign Properties Tab */}
          {userType === "property_manager" && (
            <TabsContent value="assign-properties">
              <Card className="bg-white shadow-sm border border-amber-100">
                <CardHeader className="border-b border-amber-100">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-amber-600" />
                    Assign Properties to Realtors
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Select properties and assign them to a realtor
                  </p>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Realtor Selection */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Select Realtor
                    </label>
                    <select 
                      value={selectedRealtor || ''} 
                      onChange={(e) => setSelectedRealtor(e.target.value ? Number(e.target.value) : null)}
                      className="w-full p-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="">Choose a realtor...</option>
                      {realtors.map(realtor => (
                        <option key={realtor.id} value={realtor.id}>
                          {realtor.name} - {realtor.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Properties Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Available Properties ({selectedProperties.length} selected)
                      </h3>
                      <Button 
                        onClick={handleSelectAll}
                        variant="outline"
                        size="sm"
                        className="border-amber-200"
                      >
                        {selectedProperties.length === availablePropertiesForAssignment.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>

                    {/* Quick Selection */}
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Quick Selection:</p>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => handleBulkSelect(10, true)} variant="outline" size="sm" className="border-amber-200">First 10</Button>
                        <Button onClick={() => handleBulkSelect(20, true)} variant="outline" size="sm" className="border-amber-200">First 20</Button>
                        <Button onClick={() => handleBulkSelect(50, true)} variant="outline" size="sm" className="border-amber-200">First 50</Button>
                      </div>
                    </div>

                    {loadingAssignmentProperties ? (
                      <p className="text-center py-8 text-gray-600">Loading properties...</p>
                    ) : availablePropertiesForAssignment.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">No properties available</p>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {availablePropertiesForAssignment.map((property) => {
                          const meta = getPropertyMetadata(property);
                          return (
                            <Card 
                              key={property.id}
                              className={`cursor-pointer transition-all ${
                                selectedProperties.includes(property.id) 
                                  ? 'border-amber-400 bg-amber-50 shadow-md' 
                                  : 'border-amber-100 hover:border-amber-300'
                              }`}
                              onClick={() => handlePropertyToggle(property.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedProperties.includes(property.id)}
                                    onChange={() => handlePropertyToggle(property.id)}
                                    className="mt-1"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 truncate">
                                      {meta.address || `Property #${property.id}`}
                                    </h4>
                                    <p className="text-lg font-bold text-amber-600 mt-1">
                                      ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                    </p>
                                    <div className="flex gap-2 mt-2 text-sm text-gray-600">
                                      <span><Bed className="h-4 w-4 inline" /> {meta.bedrooms || 0}</span>
                                      <span><Bath className="h-4 w-4 inline" /> {meta.bathrooms || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Assign Button */}
                  <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">
                      {selectedProperties.length > 0 && selectedRealtor 
                        ? `Ready to assign ${selectedProperties.length} properties`
                        : 'Select a realtor and properties to begin'
                      }
                    </p>
                    <Button 
                      onClick={assignProperties} 
                      disabled={assigningProperties || !selectedRealtor || selectedProperties.length === 0}
                      className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white"
                    >
                      {assigningProperties ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Assign Properties
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* View Assignments Tab */}
          {userType === "property_manager" && (
            <TabsContent value="view-assignments">
              <Card className="bg-white shadow-sm border border-amber-100">
                <CardHeader className="border-b border-amber-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ListChecks className="h-5 w-5 text-amber-600" />
                        Property Assignments Overview
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Manage property assignments and status
                      </p>
                    </div>
                    <Button 
                      onClick={() => { fetchAssignments(); fetchPropertiesForAssignment(); }}
                      variant="outline"
                      size="sm"
                      className="border-amber-200"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {loadingAssignments ? (
                    <p className="text-center py-8 text-gray-600">Loading assignments...</p>
                  ) : !assignmentsData ? (
                    <p className="text-center py-8 text-gray-500">No assignment data available</p>
                  ) : (
                    <div className="space-y-6">
                      {/* Summary Cards */}
                      {assignmentsData.summary && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Card className="border-amber-100">
                            <CardContent className="p-4">
                              <p className="text-sm text-gray-600">Total Properties</p>
                              <p className="text-2xl font-bold text-gray-900 mt-1">
                                {assignmentsData.summary.total_properties || 0}
                              </p>
                            </CardContent>
                          </Card>
                          <Card className="border-amber-100">
                            <CardContent className="p-4">
                              <p className="text-sm text-gray-600">Unassigned</p>
                              <p className="text-2xl font-bold text-gray-900 mt-1">
                                {assignmentsData.summary.unassigned_count || 0}
                              </p>
                            </CardContent>
                          </Card>
                          <Card className="border-amber-100">
                            <CardContent className="p-4">
                              <p className="text-sm text-gray-600">Assigned</p>
                              <p className="text-2xl font-bold text-gray-900 mt-1">
                                {assignmentsData.summary.assigned_count || 0}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Unassigned Properties */}
                      {assignmentsData.unassigned_properties && assignmentsData.unassigned_properties.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Unassigned Properties</h3>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {assignmentsData.unassigned_properties.map((property: any) => {
                              const meta = getPropertyMetadata(property);
                              return (
                                <Card key={property.id} className="border-amber-100">
                                  <CardContent className="p-4">
                                    <h4 className="font-semibold text-gray-900">{meta.address || `Property #${property.id}`}</h4>
                                    <p className="text-lg font-bold text-amber-600 mt-2">
                                      ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                    </p>
                                    <div className="flex gap-2 mt-2 text-sm text-gray-600">
                                      <span><Bed className="h-4 w-4 inline" /> {meta.bedrooms || 0}</span>
                                      <span><Bath className="h-4 w-4 inline" /> {meta.bathrooms || 0}</span>
                                    </div>
                                    <Badge variant="outline" className="mt-2 border-amber-200">Unassigned</Badge>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Assigned Properties by Realtor */}
                      {assignmentsData.assigned_properties && Object.keys(assignmentsData.assigned_properties).length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Properties by Realtor</h3>
                          {Object.values(assignmentsData.assigned_properties).map((realtorGroup: any) => (
                            <Card key={realtorGroup.realtor_id} className="mb-4 border-amber-100">
                              <CardHeader className="bg-amber-50 border-b border-amber-100">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle className="text-lg font-semibold">{realtorGroup.realtor_name}</CardTitle>
                                    <p className="text-sm text-gray-600">{realtorGroup.realtor_email}</p>
                                  </div>
                                  <Badge className="bg-amber-100 text-amber-800">
                                    {realtorGroup.count} {realtorGroup.count === 1 ? 'Property' : 'Properties'}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4">
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                  {realtorGroup.properties.map((property: any) => {
                                    const meta = getPropertyMetadata(property);
                                    return (
                                      <Card key={property.id} className="border-gray-200">
                                        <CardContent className="p-4">
                                          <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-semibold text-gray-900 text-sm">{meta.address || `Property #${property.id}`}</h4>
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600">
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>Unassign Property?</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                    This will remove the property from {realtorGroup.realtor_name}'s assignments.
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                  <AlertDialogAction 
                                                    onClick={() => handleUnassignProperties([property.id])}
                                                    className="bg-red-600 hover:bg-red-700"
                                                  >
                                                    Unassign
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </div>
                                          <p className="text-lg font-bold text-amber-600">
                                            ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                          </p>
                                          <div className="flex gap-2 mt-2 text-sm text-gray-600">
                                            <span><Bed className="h-4 w-4 inline" /> {meta.bedrooms || 0}</span>
                                            <span><Bath className="h-4 w-4 inline" /> {meta.bathrooms || 0}</span>
                                          </div>
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
            </TabsContent>
          )}

          {/* Properties Tab */}
          <TabsContent value="properties">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {loadingApartments ? (
                <p className="col-span-full text-center py-8 text-gray-600">Loading properties...</p>
              ) : apartments.length === 0 ? (
                <p className="col-span-full text-center py-8 text-gray-500">No properties found.</p>
              ) : (
                apartments.map((apt) => {
                  const meta = getPropertyMetadata(apt);
                  return (
                    <motion.div key={apt.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                      <Card className="bg-white border border-amber-100 hover:shadow-lg transition-shadow overflow-hidden h-full">
                        <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                          <img
                            src={meta.image_url || "/images/properties/default.jpg"}
                            alt={meta.address}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 truncate">{meta.address || `Property #${apt.id}`}</h3>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-2xl font-bold text-amber-600">
                              ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                            </p>
                            {meta.listing_status && (
                              <Badge className={meta.listing_status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {meta.listing_status}
                              </Badge>-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Realtors</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{realtors.length}</p>
                      </div>
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <Users className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Card className="bg-white border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Properties</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{apartments.length}</p>
                      </div>
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <Building2 className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Card className="bg-white border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{bookings.length}</p>
                      </div>
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div variants={itemVariants}>
                <Card className="bg-white border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">My Properties</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{apartments.length}</p>
                      </div>
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <Building2 className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Card className="bg-white border border-amber-100 shadow-sm hover:shadow