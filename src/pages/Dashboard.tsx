import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, MapPin, Bed, Bath, Ruler, TrendingUp, Calendar, Eye } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [animateCards, setAnimateCards] = useState(false);

  // Basic SEO for SPA route
  useEffect(() => {
    const title = "Dashboard | EliteRealty AI";
    const description = "Personalized real estate dashboard with your properties and bookings.";
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
  }, []);

  // Placeholder properties (capacity up to 100)
  const properties = useMemo(() => (
    Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      title: `Premium Residence #${i + 1}`,
      price: 350000 + (i * 1250),
      location: i % 3 === 0 ? "Downtown" : i % 3 === 1 ? "Uptown" : "Waterfront",
      beds: (i % 5) + 1,
      baths: (i % 3) + 1,
      sqft: 800 + (i * 15),
      type: i % 2 === 0 ? "For Sale" : "For Rent",
      featured: i % 7 === 0,
      image: `/images/properties/property-${(i % 6) + 1}.jpg`,
    }))
  ), []);

  // Placeholder bookings
  const bookings = useMemo(() => (
    Array.from({ length: 8 }, (_, i) => ({
      id: `BK-${1000 + i}`,
      property: `Premium Residence #${(i + 1) * 3}`,
      propertyId: (i + 1) * 3,
      date: new Date(Date.now() + i * 86400000).toLocaleDateString(),
      time: "14:00",
      status: i % 2 === 0 ? "Confirmed" : "Pending",
    }))
  ), []);

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
                Client Dashboard
              </motion.h1>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button asChild className="hover-lift bg-navy/90 text-white hover:bg-navy">
                <Link to="/">Back to Home</Link>
              </Button>
            </motion.div>
          </motion.div>
          <motion.p 
            className="mt-4 text-muted-foreground max-w-2xl text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Review your saved properties and manage your bookings.
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
                  {properties.length}
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
        </div>
      </motion.section>

      {/* Content */}
      <section className="container mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Tabs defaultValue="properties" className="w-full">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <TabsList className="mb-8 glass-card p-1">
                <TabsTrigger value="properties" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  Properties
                </TabsTrigger>
                <TabsTrigger value="bookings" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  Bookings
                </TabsTrigger>
              </TabsList>
            </motion.div>

            {/* Properties Grid */}
            <TabsContent value="properties">
              <motion.div 
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {properties.map((p, idx) => (
                  <motion.div
                    key={p.id}
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
                          src={p.image}
                          alt={`Property ${p.title} in ${p.location} with ${p.beds} beds and ${p.baths} baths`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.4 }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge variant="secondary" className="backdrop-blur-sm bg-white/90">{p.type}</Badge>
                          {p.featured && (
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Badge className="bg-gold text-navy backdrop-blur-sm pulse-glow">Featured</Badge>
                            </motion.div>
                          )}
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-navy text-base group-hover:text-accent transition-colors">
                          {p.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center text-sm text-muted-foreground gap-2">
                          <MapPin className="h-4 w-4" /> {p.location}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="inline-flex items-center gap-1"><Bed className="h-4 w-4" /> {p.beds} bd</span>
                          <span className="inline-flex items-center gap-1"><Bath className="h-4 w-4" /> {p.baths} ba</span>
                          <span className="inline-flex items-center gap-1"><Ruler className="h-4 w-4" /> {p.sqft.toLocaleString()} sqft</span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div className="text-lg font-semibold text-navy">${p.price.toLocaleString()}</div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground" size="sm">
                              <Link to={`/properties/${p.id}`}>View</Link>
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
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
                        Click on any booking to view property details
                      </p>
                    </motion.div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden rounded-lg border border-border/50">
                      <Table>
                        <TableCaption className="text-muted-foreground">
                          Placeholder bookings for demonstration.
                        </TableCaption>
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
                              key={b.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.4, delay: idx * 0.1 }}
                              className="cursor-pointer hover:bg-accent/5 transition-all duration-200 group"
                              onClick={() => navigate(`/properties/${b.propertyId}`)}
                              whileHover={{ 
                                backgroundColor: "hsl(var(--accent) / 0.1)",
                                transition: { duration: 0.2 }
                              }}
                            >
                              <TableCell className="font-medium group-hover:text-accent transition-colors">
                                {b.id}
                              </TableCell>
                              <TableCell className="group-hover:text-navy transition-colors">
                                {b.property}
                              </TableCell>
                              <TableCell>{b.date}</TableCell>
                              <TableCell>{b.time}</TableCell>
                              <TableCell>
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Badge 
                                    variant={b.status === "Confirmed" ? "default" : "secondary"}
                                    className={b.status === "Confirmed" 
                                      ? "bg-accent text-accent-foreground" 
                                      : "bg-muted text-muted-foreground"
                                    }
                                  >
                                    {b.status}
                                  </Badge>
                                </motion.div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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
