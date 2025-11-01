import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, MapPin, Bed, Bath, Ruler, TrendingUp, Calendar, Eye, Music, Phone, Users, UserPlus, Settings, Building2, CheckSquare, Square, CalendarDays, User, ListChecks, RefreshCw } from "lucide-react";
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
      {/* Animated Header */}
      <motion.header 
        className="relative overflow-hidden"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-6 pt-28 pb-10">
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="bg-accent-gradient p-3 rounded-xl shadow-glow float-animation pulse-glow"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Home className="h-6 w-6 text-navy" />
              </motion.div>
              <motion.h1 
                className="text-4xl font-bold bg-luxury-gradient bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {userType === "property_manager" ? "Property Manager Dashboard" : "Client Dashboard"}
              </motion.h1>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex gap-3"
            >
              <Button asChild className="hover-lift bg-navy/90 text-white hover:bg-navy">
                <Link to="/">Back to Home</Link>
              </Button>
  
              <Button asChild className="hover-lift bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/uploadpage">Upload Docs</Link>
              </Button>
              <Button 
                onClick={handleBuyNumber} 
                disabled={loading} 
                className="hover-lift bg-gold text-navy hover:bg-gold/90"
              >
                {loading ? "Purchasing..." : "Get a Number for Trial\n($1.5)"}
              </Button>
              {myNumber ? (
                <p className="mt-2">Your Leasap Number: <b>{myNumber}</b></p>
              ) : (
                <p className="mt-2 text-gray-500">You don’t have a number yet.</p>
              )}
            </motion.div>
          </motion.div>
          <motion.p 
            className="mt-4 text-muted-foreground max-w-2xl text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {userType === "property_manager" 
              ? "Manage your realtors, assign passwords, and oversee your property portfolio."
              : "Review your saved properties and manage your bookings."
            }
          </motion.p>
        </div>
      </motion.header>

      {/* Stats Cards */}
      <motion.section 
        className="container mx-auto px-6 -mt-8 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userType === "property_manager" ? (
            <>
              <motion.div variants={itemVariants} className="glass-card hover-lift p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Realtors</p>
                    <motion.p 
                      className="text-2xl font-bold text-navy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" as const }}
                    >
                      {realtors.length}
                    </motion.p>
                  </div>
                  <motion.div 
                    className="p-3 bg-accent/10 rounded-xl"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                  >
                    <Users className="h-6 w-6 text-accent" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card hover-lift p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Properties</p>
                    <motion.p 
                      className="text-2xl font-bold text-navy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.0, type: "spring" as const }}
                    >
                      {apartments.length}
                    </motion.p>
                  </div>
                  <motion.div 
                    className="p-3 bg-gold/10 rounded-xl"
                    whileHover={{ rotate: -15, scale: 1.1 }}
                  >
                    <TrendingUp className="h-6 w-6 text-gold" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card hover-lift p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Bookings</p>
                    <motion.p 
                      className="text-2xl font-bold text-navy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" as const }}
                    >
                      {bookings.length}
                    </motion.p>
                  </div>
                  <motion.div 
                    className="p-3 bg-navy/10 rounded-xl"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                  >
                    <Calendar className="h-6 w-6 text-navy" />
                  </motion.div>
                </div>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div variants={itemVariants} className="glass-card hover-lift p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Properties</p>
                    <motion.p 
                      className="text-2xl font-bold text-navy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" as const }}
                    >
                      {apartments.length}
                    </motion.p>
                  </div>
                  <motion.div 
                    className="p-3 bg-accent/10 rounded-xl"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                  >
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card hover-lift p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Bookings</p>
                    <motion.p 
                      className="text-2xl font-bold text-navy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.0, type: "spring" as const }}
                    >
                      {bookings.length}
                    </motion.p>
                  </div>
                  <motion.div 
                    className="p-3 bg-gold/10 rounded-xl"
                    whileHover={{ rotate: -15, scale: 1.1 }}
                  >
                    <Calendar className="h-6 w-6 text-gold" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card hover-lift p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Property Views</p>
                    <motion.p 
                      className="text-2xl font-bold text-navy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" as const }}
                    >
                      1,247
                    </motion.p>
                  </div>
                  <motion.div 
                    className="p-3 bg-navy/10 rounded-xl"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                  >
                    <Eye className="h-6 w-6 text-navy" />
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
              <TabsList className="mb-8 glass-card p-1">
                {userType === "property_manager" && (
                  <TabsTrigger value="realtors" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    Realtors
                  </TabsTrigger>
                )}
                {userType === "property_manager" && (
                  <>
                    <TabsTrigger value="assign-properties" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Assign Properties
                    </TabsTrigger>
                    <TabsTrigger value="view-assignments" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                      <ListChecks className="h-4 w-4 mr-2" />
                      View Assignments
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger value="properties" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  Properties
                </TabsTrigger>
                <TabsTrigger value="bookings" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  Bookings
                </TabsTrigger>
                <TabsTrigger value="conversations" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  Conversations
                </TabsTrigger>
                <TabsTrigger value="chats" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
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
                  <Card className="glass-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-navy text-xl flex items-center gap-2">
                            <Users className="h-5 w-5 text-accent" />
                            Manage Realtors
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Add and manage your realtor team members.
                          </p>
                        </div>
                        <Button 
                          onClick={() => setShowAddRealtor(!showAddRealtor)}
                          className="bg-gold hover:bg-gold/90 text-navy"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Realtor
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {showAddRealtor && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6 p-4 border rounded-lg bg-muted/30"
                        >
                          <h3 className="text-lg font-semibold mb-4">Add New Realtor</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm font-medium">Name</label>
                              <input
                                type="text"
                                value={newRealtor.name}
                                onChange={(e) => setNewRealtor({...newRealtor, name: e.target.value})}
                                className="w-full mt-1 p-2 border rounded-md"
                                placeholder="Realtor name"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Email</label>
                              <input
                                type="email"
                                value={newRealtor.email}
                                onChange={(e) => setNewRealtor({...newRealtor, email: e.target.value})}
                                className="w-full mt-1 p-2 border rounded-md"
                                placeholder="realtor@example.com"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Password</label>
                              <input
                                type="password"
                                value={newRealtor.password}
                                onChange={(e) => setNewRealtor({...newRealtor, password: e.target.value})}
                                className="w-full mt-1 p-2 border rounded-md"
                                placeholder="Temporary password"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button onClick={addRealtor} className="bg-accent hover:bg-accent/90">
                              Add Realtor
                            </Button>
                            <Button 
                              onClick={() => setShowAddRealtor(false)}
                              variant="outline"
                            >
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
                        <div className="overflow-hidden rounded-lg border border-border/50">
                          <Table>
                            <TableHeader className="bg-muted/30">
                              <TableRow>
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Email</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {realtors.map((realtor, idx) => (
                                <motion.tr
                                  key={realtor.id || idx}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                                  className="hover:bg-accent/5 transition-all duration-200 group"
                                >
                                  <TableCell className="font-medium group-hover:text-accent transition-colors">
                                    {realtor.name}
                                  </TableCell>
                                  <TableCell>{realtor.email}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={realtor.status === "active" ? "default" : "secondary"}
                                      className={
                                        realtor.status === "active"
                                          ? "bg-accent text-accent-foreground"
                                          : "bg-muted text-muted-foreground"
                                      }
                                    >
                                      {realtor.status || "Active"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="outline">
                                        <Settings className="h-4 w-4" />
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
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-navy text-xl flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-accent" />
                        Assign Properties to Realtors
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select properties and assign them to a realtor. Assigned properties will appear on the realtor's dashboard.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Realtor Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-navy">Select Realtor:</label>
                        <select 
                          value={selectedRealtor || ''} 
                          onChange={(e) => setSelectedRealtor(e.target.value ? Number(e.target.value) : null)}
                          className="w-full md:w-96 p-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="">Choose a realtor...</option>
                          {realtors.map(realtor => (
                            <option key={realtor.id} value={realtor.id}>
                              {realtor.name} ({realtor.email})
                            </option>
                          ))}
                        </select>
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
                          
                          {/* Bulk Selection Buttons */}
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              onClick={() => handleBulkSelect(10, true)}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              First 10
                            </Button>
                            <Button 
                              onClick={() => handleBulkSelect(20, true)}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              First 20
                            </Button>
                            <Button 
                              onClick={() => handleBulkSelect(50, true)}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              First 50
                            </Button>
                            <Button 
                              onClick={() => handleBulkSelect(10, false)}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              Last 10
                            </Button>
                            <Button 
                              onClick={() => handleBulkSelect(20, false)}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              Last 20
                            </Button>
                            <Button 
                              onClick={() => handleBulkSelect(50, false)}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              Last 50
                            </Button>
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
                                    className={`hover-lift cursor-pointer transition-all ${
                                      selectedProperties.includes(property.id) 
                                        ? 'border-accent border-2 bg-accent/5' 
                                        : 'border-border'
                                    }`}
                                    onClick={() => handlePropertyToggle(property.id)}
                                  >
                                    <div className="flex items-start p-4 gap-3">
                                      <input
                                        type="checkbox"
                                        checked={selectedProperties.includes(property.id)}
                                        onChange={() => handlePropertyToggle(property.id)}
                                        className="mt-1 h-4 w-4 cursor-pointer accent-accent flex-shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <div className="flex-1 min-w-0 space-y-2">
                                        <div>
                                          <h4 className="font-semibold text-navy truncate">
                                            {meta.address || `Property #${property.id}`}
                                          </h4>
                                          {meta.listing_id && (
                                            <p className="text-xs text-muted-foreground">MLS: {meta.listing_id}</p>
                                          )}
                                        </div>
                                        <div className="space-y-1 text-sm">
                                          <p className="font-semibold text-gold">
                                            ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                          </p>
                                          <div className="flex flex-wrap gap-2 text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                              <Bed className="h-3 w-3" /> {meta.bedrooms || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Bath className="h-3 w-3" /> {meta.bathrooms || 0}
                                            </span>
                                            {meta.square_feet && (
                                              <span className="flex items-center gap-1">
                                                <Square className="h-3 w-3" /> {meta.square_feet} sqft
                                              </span>
                                            )}
                                          </div>
                                          {meta.property_type && (
                                            <Badge variant="outline" className="text-xs">
                                              {meta.property_type}
                                            </Badge>
                                          )}
                                          {meta.listing_status && (
                                            <Badge 
                                              variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                                              className="text-xs ml-1"
                                            >
                                              {meta.listing_status}
                                            </Badge>
                                          )}
                                          {meta.features && meta.features.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {meta.features.slice(0, 2).map((feature: string, fIdx: number) => (
                                                <Badge key={fIdx} variant="outline" className="text-xs">
                                                  {feature}
                                                </Badge>
                                              ))}
                                              {meta.features.length > 2 && (
                                                <span className="text-xs text-muted-foreground">+{meta.features.length - 2}</span>
                                              )}
                                            </div>
                                          )}
                                          {meta.agent && (
                                            <p className="text-xs text-muted-foreground truncate">
                                              Agent: {meta.agent.name}
                                            </p>
                                          )}
                                          <p className="text-xs text-muted-foreground">ID: {property.id}</p>
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

                      {/* Assign Button */}
                      <div className="pt-4 border-t">
                        <Button 
                          onClick={assignProperties} 
                          disabled={assigningProperties || !selectedRealtor || selectedProperties.length === 0}
                          className="w-full md:w-auto bg-gold hover:bg-gold/90 text-navy font-semibold"
                          size="lg"
                        >
                          {assigningProperties 
                            ? 'Assigning...' 
                            : `Assign ${selectedProperties.length} ${selectedProperties.length === 1 ? 'Property' : 'Properties'}`}
                        </Button>
                        {!selectedRealtor && selectedProperties.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Please select a realtor to assign properties
                          </p>
                        )}
                        {selectedRealtor && selectedProperties.length === 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Please select at least one property to assign
                          </p>
                        )}
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
                  <Card className="glass-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-navy text-xl flex items-center gap-2">
                            <ListChecks className="h-5 w-5 text-accent" />
                            Property Assignments Overview
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            View all property assignments and unassigned properties
                          </p>
                        </div>
                        <Button 
                          onClick={() => { fetchAssignments(); fetchPropertiesForAssignment(); }}
                          variant="outline"
                          size="sm"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
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
                          {/* Summary Cards */}
                          {assignmentsData.summary && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Card className="p-4">
                                <p className="text-sm text-muted-foreground">Total Properties</p>
                                <p className="text-2xl font-bold text-navy mt-1">
                                  {assignmentsData.summary.total_properties || 0}
                                </p>
                              </Card>
                              <Card className="p-4">
                                <p className="text-sm text-muted-foreground">Unassigned</p>
                                <p className="text-2xl font-bold text-yellow-600 mt-1">
                                  {assignmentsData.summary.unassigned_count || 0}
                                </p>
                              </Card>
                              <Card className="p-4">
                                <p className="text-sm text-muted-foreground">Assigned</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                  {assignmentsData.summary.assigned_count || 0}
                                </p>
                              </Card>
                            </div>
                          )}

                          {/* Unassigned Properties */}
                          {assignmentsData.unassigned_properties && assignmentsData.unassigned_properties.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                                Unassigned Properties
                                <Badge>{assignmentsData.unassigned_properties.length}</Badge>
                              </h3>
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {assignmentsData.unassigned_properties.map((property: any, idx: number) => {
                                  const meta = getPropertyMetadata(property);
                                  return (
                                    <Card key={property.id || idx} className="hover-lift">
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
                                      <CardContent className="space-y-2 text-sm">
                                        <p className="font-semibold text-gold">
                                          ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                        </p>
                                        <div className="flex flex-wrap gap-2 text-muted-foreground">
                                          <span><Bed className="h-3 w-3 inline" /> {meta.bedrooms || 0}</span>
                                          <span><Bath className="h-3 w-3 inline" /> {meta.bathrooms || 0}</span>
                                          {meta.square_feet && <span><Square className="h-3 w-3 inline" /> {meta.square_feet} sqft</span>}
                                        </div>
                                        {meta.property_type && <Badge variant="outline" className="text-xs">{meta.property_type}</Badge>}
                                        {meta.features && meta.features.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {meta.features.slice(0, 2).map((f: string, i: number) => (
                                              <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                                            ))}
                                            {meta.features.length > 2 && <span className="text-xs">+{meta.features.length - 2}</span>}
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
                            <div>
                              <h3 className="text-lg font-semibold text-navy mb-4">Assigned Properties by Realtor</h3>
                              {Object.values(assignmentsData.assigned_properties).map((realtorGroup: any) => (
                                <Card key={realtorGroup.realtor_id} className="mb-6">
                                  <CardHeader>
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <CardTitle className="text-navy">{realtorGroup.realtor_name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{realtorGroup.realtor_email}</p>
                                      </div>
                                      <Badge className="bg-green-600">
                                        {realtorGroup.count} {realtorGroup.count === 1 ? 'property' : 'properties'}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                      {realtorGroup.properties.map((property: any, idx: number) => {
                                        const meta = getPropertyMetadata(property);
                                        return (
                                          <Card key={property.id || idx} className="hover-lift">
                                            <CardHeader className="pb-2">
                                              <CardTitle className="text-sm text-navy">
                                                {meta.address || `Property #${property.id}`}
                                              </CardTitle>
                                              {meta.listing_id && (
                                                <p className="text-xs text-muted-foreground mt-1">MLS: {meta.listing_id}</p>
                                              )}
                                            </CardHeader>
                                            <CardContent className="space-y-2 text-sm">
                                              <p className="font-semibold text-gold">
                                                ${meta.price ? meta.price.toLocaleString() : 'N/A'}
                                              </p>
                                              <div className="flex flex-wrap gap-2 text-muted-foreground">
                                                <span><Bed className="h-3 w-3 inline" /> {meta.bedrooms || 0}</span>
                                                <span><Bath className="h-3 w-3 inline" /> {meta.bathrooms || 0}</span>
                                                {meta.square_feet && <span><Square className="h-3 w-3 inline" /> {meta.square_feet} sqft</span>}
                                              </div>
                                              {meta.property_type && <Badge variant="outline" className="text-xs">{meta.property_type}</Badge>}
                                              {meta.features && meta.features.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                  {meta.features.slice(0, 2).map((f: string, i: number) => (
                                                    <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                                                  ))}
                                                  {meta.features.length > 2 && <span className="text-xs">+{meta.features.length - 2}</span>}
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
            <Card className="glass-card hover-lift group overflow-hidden h-full">
              <div className="relative aspect-[4/3] overflow-hidden">
                <motion.img
                  src={meta.image_url || "/images/properties/default.jpg"}
                  alt={`Property at ${meta.address}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {meta.listing_status && (
                  <div className="absolute top-2 right-2">
                    <Badge 
                      variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {meta.listing_status}
                    </Badge>
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-navy text-base group-hover:text-accent transition-colors">
                  {meta.address || `Property #${apt.id}`}
                </CardTitle>
                {meta.listing_id && (
                  <p className="text-xs text-muted-foreground mt-1">MLS: {meta.listing_id}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-gold">
                    ${meta.price ? meta.price.toLocaleString() : "N/A"}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Bed className="h-4 w-4" /> {meta.bedrooms || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="h-4 w-4" /> {meta.bathrooms || 0}
                  </span>
                  {meta.square_feet && (
                    <span className="flex items-center gap-1">
                      <Square className="h-4 w-4" /> {meta.square_feet} sqft
                    </span>
                  )}
                </div>
                {meta.property_type && (
                  <Badge variant="outline" className="text-xs">
                    {meta.property_type}
                  </Badge>
                )}
                {meta.features && meta.features.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {meta.features.slice(0, 3).map((feature: string, fIdx: number) => (
                      <Badge key={fIdx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {meta.features.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{meta.features.length - 3}</span>
                    )}
                  </div>
                )}
                {meta.agent && (
                  <p className="text-xs text-muted-foreground truncate">
                    Agent: {meta.agent.name}
                  </p>
                )}
                {meta.days_on_market !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    {meta.days_on_market} days on market
                  </p>
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
