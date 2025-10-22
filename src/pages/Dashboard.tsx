import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, MapPin, Bed, Bath, Ruler, TrendingUp, Calendar, Eye, Music, Phone, Users, UserPlus, Settings } from "lucide-react";
import { toast } from "sonner";
const API_BASE = "https://leasing-copilot-mvp.onrender.com";

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
      apartments.map((apt, idx) => (
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
                src={apt.image_url || "/images/properties/default.jpg"}
                alt={`Apartment at ${apt.address}`}
                loading="lazy"
                className="h-full w-full object-cover"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.4 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-navy text-base group-hover:text-accent transition-colors">
                {apt.address}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <MapPin className="h-4 w-4" /> {apt.bedrooms + "Beds" || "Unknown location"}
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="text-lg font-semibold text-navy">
                  ${apt.price ? apt.price.toLocaleString() : "N/A"}
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground" size="sm">
                    <Link to={`/apartments/${apt.id}`}>View</Link>
                  </Button> */}
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))
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
