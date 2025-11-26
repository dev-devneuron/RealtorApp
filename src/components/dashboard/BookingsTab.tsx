/**
 * Bookings Tab Component
 * 
 * Comprehensive booking management interface with:
 * - Calendar view (day/week/month)
 * - Pending bookings queue
 * - Booking management (approve/deny/reschedule/cancel)
 * - Availability management
 * - Property assignment (PM only)
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  RefreshCw as RescheduleIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Sparkles,
  TrendingUp,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { 
  fetchUserBookings, 
  approveBooking, 
  denyBooking, 
  rescheduleBooking, 
  cancelBooking,
  formatDate,
  formatTime,
  formatDateTime,
  getStatusColor,
} from "./utils";
import { BookingDetailModal } from "./BookingDetailModal";
import { BookingCalendar } from "./BookingCalendar";
import { BookingStatistics } from "./BookingStatistics";
import { BookingExport } from "./BookingExport";
import { AvailabilityManager } from "./AvailabilityManager";
import { PropertyAssignmentPanel } from "./PropertyAssignmentPanel";
import { ManualBookingModal } from "./ManualBookingModal";
import type { Booking, Realtor, Property } from "./types";

interface BookingsTabProps {
  userId: number;
  userType: string;
  bookings: Booking[];
  loadingBookings: boolean;
  onRefresh: () => void;
  realtors?: Realtor[];
  properties?: Property[];
}

export const BookingsTab = ({
  userId,
  userType,
  bookings,
  loadingBookings,
  onRefresh,
  realtors = [],
  properties = [],
}: BookingsTabProps) => {
  const [view, setView] = useState<"list" | "day" | "week" | "month" | "stats" | "availability">("list");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [lastNotificationCheck, setLastNotificationCheck] = useState<Date>(new Date());
  const [pendingCount, setPendingCount] = useState(0);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const approved = bookings.filter((b) => b.status === "approved").length;
    const denied = bookings.filter((b) => b.status === "denied").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const rescheduled = bookings.filter((b) => b.status === "rescheduled").length;
    
    const approvalRate = total > 0 
      ? Math.round((approved / (approved + denied)) * 100) 
      : 0;

    const respondedBookings = bookings.filter(
      (b) => (b.status === "approved" || b.status === "denied") && b.requestedAt && b.updatedAt
    );
    const avgResponseTime = respondedBookings.length > 0
      ? Math.round(
          respondedBookings.reduce((sum, b) => {
            const requested = new Date(b.requestedAt!).getTime();
            const updated = new Date(b.updatedAt!).getTime();
            return sum + (updated - requested);
          }, 0) / respondedBookings.length / (1000 * 60)
        )
      : 0;

    return {
      total,
      pending,
      approved,
      denied,
      cancelled,
      rescheduled,
      approvalRate,
      avgResponseTime,
    };
  }, [bookings]);

  // Filter bookings based on status and search
  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.visitor.name.toLowerCase().includes(query) ||
          b.visitor.phone.toLowerCase().includes(query) ||
          (b.visitor.email && b.visitor.email.toLowerCase().includes(query)) ||
          (b.propertyAddress && b.propertyAddress.toLowerCase().includes(query)) ||
          b.bookingId.toString().includes(query)
      );
    }

    return filtered;
  }, [bookings, statusFilter, searchQuery]);

  // Separate pending bookings
  const pendingBookings = useMemo(
    () => filteredBookings.filter((b) => b.status === "pending"),
    [filteredBookings]
  );

  // Group bookings by date for calendar view
  const bookingsByDate = useMemo(() => {
    const grouped: { [key: string]: Booking[] } = {};
    filteredBookings.forEach((booking) => {
      const dateKey = formatDate(booking.startAt);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(booking);
    });
    return grouped;
  }, [filteredBookings]);

  const handleApprove = async (bookingId: number) => {
    setActionLoading(bookingId);
    try {
      await approveBooking(bookingId, userId);
      toast.success("Booking approved successfully");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (bookingId: number, reason?: string) => {
    setActionLoading(bookingId);
    try {
      await denyBooking(bookingId, userId, reason);
      toast.success("Booking denied");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to deny booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = async (
    bookingId: number,
    proposedSlots: Array<{ startAt: string; endAt: string }>,
    reason?: string
  ) => {
    setActionLoading(bookingId);
    try {
      await rescheduleBooking(bookingId, proposedSlots, reason);
      toast.success("Reschedule proposal sent");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to reschedule booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (bookingId: number, reason?: string) => {
    setActionLoading(bookingId);
    try {
      await cancelBooking(bookingId, reason);
      toast.success("Booking cancelled");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  // Check if realtor has assigned properties or bookings (for showing Availability tab)
  const hasAssignedPropertiesOrBookings = useMemo(() => {
    if (userType === "property_manager") {
      return true;
    }
    
    if (bookings.length > 0) {
      return true;
    }
    
    if (properties && properties.length > 0) {
      const assignedProperties = properties.filter((prop: Property) => {
        const meta = prop.listing_metadata || {};
        return meta.assigned_to_realtor_id === userId || prop.assigned_to_realtor_id === userId;
      });
      return assignedProperties.length > 0;
    }
    
    return false;
  }, [userType, bookings, properties, userId]);

  // Real-time notifications with polling
  useEffect(() => {
    const checkForNewBookings = async () => {
      try {
        const pending = bookings.filter((b) => b.status === "pending").length;
        if (pending > pendingCount && pendingCount > 0) {
          const newCount = pending - pendingCount;
          toast.success(`You have ${newCount} new pending booking${newCount > 1 ? "s" : ""}!`, {
            duration: 5000,
          });
        }
        setPendingCount(pending);
        setLastNotificationCheck(new Date());
      } catch (error) {
        console.error("Error checking for new bookings:", error);
      }
    };

    const interval = setInterval(checkForNewBookings, 30000);
    checkForNewBookings();

    return () => clearInterval(interval);
  }, [bookings, pendingCount]);

  // Navigate dates
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    if (view === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else if (view === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const StatCard = ({ icon, label, value, gradient, iconBg }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    gradient: string;
    iconBg: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`${gradient} border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={`${iconBg} p-3 rounded-xl shadow-md`}>
              {icon}
            </div>
            <Sparkles className="h-5 w-5 text-white/30" />
          </div>
          <div className="text-white/80 text-sm font-medium mb-1">{label}</div>
          <div className="text-white text-3xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<Calendar className="h-6 w-6 text-white" />}
          label="Total Bookings"
          value={stats.total}
          gradient="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700"
          iconBg="bg-blue-400/30"
        />
        <StatCard
          icon={<Clock className="h-6 w-6 text-white" />}
          label="Pending"
          value={stats.pending}
          gradient="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700"
          iconBg="bg-amber-400/30"
        />
        <StatCard
          icon={<CheckCircle2 className="h-6 w-6 text-white" />}
          label="Approved"
          value={stats.approved}
          gradient="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700"
          iconBg="bg-emerald-400/30"
        />
        <StatCard
          icon={<XCircle className="h-6 w-6 text-white" />}
          label="Denied"
          value={stats.denied}
          gradient="bg-gradient-to-br from-red-500 via-red-600 to-red-700"
          iconBg="bg-red-400/30"
        />
      </div>

      {/* Enhanced Header Card */}
      <Card className="bg-gradient-to-br from-white via-amber-50/30 to-white border-0 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-blue-500/5" />
        <CardHeader className="relative p-6 lg:p-8 border-b border-amber-100/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl blur-lg opacity-50" />
                <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-2xl shadow-xl">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                  Property Tour Bookings
                </CardTitle>
                <p className="text-gray-600 mt-1 text-sm">
                  Manage property tour bookings and availability
                </p>
              </div>
            </div>
            <Button 
              onClick={onRefresh} 
              disabled={loadingBookings} 
              variant="outline"
              className="bg-white/80 backdrop-blur-sm border-amber-200 hover:bg-white hover:border-amber-300 shadow-md hover:shadow-lg transition-all"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingBookings ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Enhanced Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
              <Input
                placeholder="Search bookings by name, phone, property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl shadow-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-12 bg-white/80 backdrop-blur-sm border-amber-200 focus:border-amber-400 rounded-xl shadow-sm">
                <Filter className="h-4 w-4 mr-2 text-amber-600" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="relative p-6 lg:p-8">
          {/* Enhanced View Tabs */}
          <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <TabsList className={`inline-flex h-12 items-center justify-center rounded-xl bg-amber-50/50 p-1.5 ${hasAssignedPropertiesOrBookings ? 'w-full sm:w-auto' : ''}`}>
                  <TabsTrigger 
                    value="list" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg px-6 font-medium transition-all"
                  >
                    List
                  </TabsTrigger>
                  <TabsTrigger 
                    value="day" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg px-6 font-medium transition-all"
                  >
                    Day
                  </TabsTrigger>
                  <TabsTrigger 
                    value="week" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg px-6 font-medium transition-all"
                  >
                    Week
                  </TabsTrigger>
                  <TabsTrigger 
                    value="month" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg px-6 font-medium transition-all"
                  >
                    Month
                  </TabsTrigger>
                  <TabsTrigger 
                    value="stats" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg px-6 font-medium transition-all"
                  >
                    Stats
                  </TabsTrigger>
                  {hasAssignedPropertiesOrBookings && (
                    <TabsTrigger 
                      value="availability" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg px-6 font-medium transition-all"
                    >
                      Availability
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowManualBookingModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Booking
                </Button>
                <BookingExport bookings={filteredBookings} filters={{ status: statusFilter, search: searchQuery }} />
              </div>
            </div>

            {/* Enhanced Pending Bookings Queue */}
            <AnimatePresence>
              {pendingBookings.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50/50 to-amber-50 shadow-lg">
                    <CardHeader className="p-5">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <div className="p-2 bg-amber-500 rounded-lg shadow-md">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent font-bold">
                          Pending Bookings ({pendingBookings.length})
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <div className="space-y-3">
                        {pendingBookings.slice(0, 5).map((booking, index) => (
                          <motion.div
                            key={booking.bookingId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-xl p-5 border border-amber-200 hover:shadow-xl hover:border-amber-300 transition-all cursor-pointer group"
                            onClick={() => handleBookingClick(booking)}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-3">
                                  <Badge className="bg-amber-500 text-white border-0 shadow-sm">
                                    {booking.status}
                                  </Badge>
                                  <span className="font-bold text-lg text-gray-900">{booking.visitor.name}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-amber-600" />
                                    <span className="truncate">{booking.propertyAddress || `Property #${booking.propertyId}`}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-amber-600" />
                                    <span>{formatDateTime(booking.startAt)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(booking.bookingId);
                                  }}
                                  disabled={actionLoading === booking.bookingId}
                                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeny(booking.bookingId);
                                  }}
                                  disabled={actionLoading === booking.bookingId}
                                  className="shadow-md hover:shadow-lg transition-all"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Deny
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {pendingBookings.length > 5 && (
                          <Button
                            variant="outline"
                            className="w-full border-amber-300 hover:bg-amber-50"
                            onClick={() => setStatusFilter("pending")}
                          >
                            View All {pendingBookings.length} Pending Bookings
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List View */}
            <TabsContent value="list" className="mt-0">
              {loadingBookings ? (
                <div className="text-center py-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-gray-600 font-medium">Loading bookings...</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex p-4 bg-amber-100 rounded-full mb-4">
                    <Calendar className="h-12 w-12 text-amber-600" />
                  </div>
                  <p className="text-gray-500 font-medium text-lg">
                    {searchQuery || statusFilter !== "all"
                      ? "No bookings match your filters"
                      : "No bookings found"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-lg">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-bold text-amber-900 py-4 px-6">ID</TableHead>
                          <TableHead className="font-bold text-amber-900 py-4 px-6">Visitor</TableHead>
                          <TableHead className="font-bold text-amber-900 py-4 px-6">Property</TableHead>
                          <TableHead className="font-bold text-amber-900 py-4 px-6">Date & Time</TableHead>
                          <TableHead className="font-bold text-amber-900 py-4 px-6">Status</TableHead>
                          <TableHead className="font-bold text-amber-900 py-4 px-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map((booking, index) => (
                          <motion.tr
                            key={booking.bookingId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-amber-50/50 transition-colors cursor-pointer border-b border-amber-50"
                            onClick={() => handleBookingClick(booking)}
                          >
                            <TableCell className="font-semibold text-amber-900 py-4 px-6">#{booking.bookingId}</TableCell>
                            <TableCell className="py-4 px-6">
                              <div>
                                <div className="font-semibold text-gray-900">{booking.visitor.name}</div>
                                <div className="text-sm text-gray-500">{booking.visitor.phone}</div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate py-4 px-6 text-gray-700">
                              {booking.propertyAddress || `Property #${booking.propertyId}`}
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <div>
                                <div className="font-medium text-gray-900">{formatDate(booking.startAt)}</div>
                                <div className="text-sm text-gray-500">{formatTime(booking.startAt)}</div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                {booking.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleApprove(booking.bookingId)}
                                      disabled={actionLoading === booking.bookingId}
                                      className="bg-emerald-500 hover:bg-emerald-600 h-9 w-9 p-0 shadow-md"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeny(booking.bookingId)}
                                      disabled={actionLoading === booking.bookingId}
                                      className="h-9 w-9 p-0 shadow-md"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {booking.status === "approved" && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleCancel(booking.bookingId)}
                                    disabled={actionLoading === booking.bookingId}
                                    className="h-9 w-9 p-0 shadow-md"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {filteredBookings.map((booking, index) => (
                      <motion.div
                        key={booking.bookingId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-xl p-5 border border-amber-200 shadow-md hover:shadow-xl transition-all cursor-pointer"
                        onClick={() => handleBookingClick(booking)}
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-sm text-amber-600">#{booking.bookingId}</span>
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                            </div>
                            <h3 className="font-bold text-lg mb-3 text-gray-900">{booking.visitor.name}</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-amber-600" />
                                <span>{booking.visitor.phone}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-amber-600 mt-0.5" />
                                <span>{booking.propertyAddress || `Property #${booking.propertyId}`}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-amber-600" />
                                <span>{formatDate(booking.startAt)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-600" />
                                <span>{formatTime(booking.startAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {booking.status === "pending" && (
                          <div className="flex gap-2 pt-4 border-t border-amber-100" onClick={(e) => e.stopPropagation()}>
                            <Button
                              onClick={() => handleApprove(booking.bookingId)}
                              disabled={actionLoading === booking.bookingId}
                              className="bg-emerald-500 hover:bg-emerald-600 flex-1 shadow-md"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeny(booking.bookingId)}
                              disabled={actionLoading === booking.bookingId}
                              className="flex-1 shadow-md"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Deny
                            </Button>
                          </div>
                        )}
                        {booking.status === "approved" && (
                          <div className="pt-4 border-t border-amber-100" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="destructive"
                              onClick={() => handleCancel(booking.bookingId)}
                              disabled={actionLoading === booking.bookingId}
                              className="w-full shadow-md"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel Booking
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Calendar Views */}
            <TabsContent value="day" className="mt-0">
              <BookingCalendar
                bookings={filteredBookings}
                view="day"
                date={selectedDate}
                onViewChange={(v) => setView(v)}
                onNavigate={setSelectedDate}
                onSelectEvent={(booking) => handleBookingClick(booking)}
                userId={userId}
                userType={userType}
              />
            </TabsContent>

            <TabsContent value="week" className="mt-0">
              <BookingCalendar
                bookings={filteredBookings}
                view="week"
                date={selectedDate}
                onViewChange={(v) => setView(v)}
                onNavigate={setSelectedDate}
                onSelectEvent={(booking) => handleBookingClick(booking)}
                userId={userId}
                userType={userType}
              />
            </TabsContent>

            <TabsContent value="month" className="mt-0">
              <BookingCalendar
                bookings={filteredBookings}
                view="month"
                date={selectedDate}
                onViewChange={(v) => setView(v)}
                onNavigate={setSelectedDate}
                onSelectEvent={(booking) => handleBookingClick(booking)}
                userId={userId}
                userType={userType}
              />
            </TabsContent>

            {/* Statistics View */}
            <TabsContent value="stats" className="mt-0">
              <BookingStatistics bookings={bookings} />
            </TabsContent>

            {/* Availability Management View */}
            <TabsContent value="availability" className="mt-0">
              {userType === "property_manager" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AvailabilityManager userId={userId} userType={userType} onSave={onRefresh} />
                  <PropertyAssignmentPanel
                    pmId={userId}
                    realtors={realtors}
                    properties={properties}
                    onAssignmentChange={onRefresh}
                  />
                </div>
              ) : (
                <AvailabilityManager userId={userId} userType={userType} onSave={onRefresh} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          open={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedBooking(null);
          }}
          onApprove={handleApprove}
          onDeny={handleDeny}
          onReschedule={handleReschedule}
          onCancel={handleCancel}
          approverId={userId}
        />
      )}

      {/* Manual Booking Modal */}
      <ManualBookingModal
        open={showManualBookingModal}
        onClose={() => setShowManualBookingModal(false)}
        onSuccess={() => {
          onRefresh();
          setShowManualBookingModal(false);
        }}
        userId={userId}
      />
    </div>
  );
};
