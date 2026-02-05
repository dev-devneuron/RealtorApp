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
  Trash2,
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
  updateBooking,
  deleteBooking,
  formatDate,
  formatTime,
  formatDateTime,
  getStatusColor,
  extractErrorMessage,
} from "./utils";
import { debounce } from "../../utils/cache";
import { BookingDetailModal } from "./BookingDetailModal";
import { BookingCalendar } from "./BookingCalendar";
import { BookingStatistics } from "./BookingStatistics";
import { BookingExport } from "./BookingExport";
import { AvailabilityManager } from "./AvailabilityManager";
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [lastNotificationCheck, setLastNotificationCheck] = useState<Date>(new Date());
  const [pendingCount, setPendingCount] = useState(0);
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  // Local copy to allow optimistic updates without mutating props
  // Sort by bookingId in descending order (newest/highest ID first)
  const [bookingsState, setBookingsState] = useState<Booking[]>(
    (bookings || []).slice().sort((a, b) => b.bookingId - a.bookingId)
  );

  // Keep local state in sync when parent provides fresh bookings, but don't overwrite optimistic non-pending changes with stale pending data
  useEffect(() => {
    setBookingsState((prev) => {
      const prevMap = new Map(prev.map((b) => [b.bookingId, b]));
      const merged = (bookings || []).map((incoming) => {
        const existing = prevMap.get(incoming.bookingId);
        if (!existing) return incoming;
        // If we previously moved it out of pending and incoming is still pending, keep our optimistic/non-pending state
        if (existing.status !== "pending" && incoming.status === "pending") {
          return existing;
        }
        return incoming;
      });
      // Sort by bookingId in descending order (newest/highest ID first)
      return merged.sort((a, b) => b.bookingId - a.bookingId);
    });
  }, [bookings]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = bookingsState.length;
    const pending = bookingsState.filter((b) => b.status === "pending").length;
    const approved = bookingsState.filter((b) => b.status === "approved").length;
    const denied = bookingsState.filter((b) => b.status === "denied").length;
    const cancelled = bookingsState.filter((b) => b.status === "cancelled").length;
    const rescheduled = bookingsState.filter((b) => b.status === "rescheduled").length;
    
    const approvalRate = total > 0 
      ? Math.round((approved / (approved + denied)) * 100) 
      : 0;

    const respondedBookings = bookingsState.filter(
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
  }, [bookingsState]);

  // Debounce search query to reduce filtering overhead
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter bookings based on status, search, and upcoming 2 days (use debounced query)
  const filteredBookings = useMemo(() => {
    let filtered = [...bookingsState]; // Create a copy to avoid mutating the original

    // Handle status filter and upcoming 2 days filter
    if (statusFilter === "upcoming-2-days") {
      // Filter for bookings in the next 2 days (today, tomorrow, and day after tomorrow)
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const twoDaysLater = new Date(todayStart);
      twoDaysLater.setDate(todayStart.getDate() + 2);
      twoDaysLater.setHours(23, 59, 59, 999); // End of the day (2 days from today)
      
      filtered = filtered.filter((b) => {
        if (!b.startAt) return false;
        const bookingDate = new Date(b.startAt);
        if (isNaN(bookingDate.getTime())) return false;
        
        // Check if booking start date is between today (inclusive) and 2 days from today (inclusive)
        return bookingDate >= todayStart && bookingDate <= twoDaysLater;
      });
    } else if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.visitor.name.toLowerCase().includes(query) ||
          b.visitor.phone.toLowerCase().includes(query) ||
          (b.visitor.email && b.visitor.email.toLowerCase().includes(query)) ||
          (b.propertyAddress && b.propertyAddress.toLowerCase().includes(query)) ||
          b.bookingId.toString().includes(query)
      );
    }

    // Sort by bookingId in descending order (newest/highest ID first)
    return filtered.sort((a, b) => b.bookingId - a.bookingId);
  }, [bookingsState, statusFilter, debouncedSearchQuery]);

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
    // Optimistic update - update UI immediately
    const previousBookings = bookingsState;
    setBookingsState(prev => prev.map(b => 
      b.bookingId === bookingId ? { ...b, status: 'approved' as const } : b
    ));
    
    try {
      await approveBooking(bookingId);
      toast.success("Booking approved successfully");
      // Refresh in background without blocking UI
      onRefresh();
    } catch (error: any) {
      // Revert optimistic update on error
      setBookingsState(previousBookings);
      const errorMessage = extractErrorMessage(error) || "Failed to approve booking";
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (bookingId: number, reason?: string) => {
    setActionLoading(bookingId);
    // Optimistic update - update UI immediately
    const previousBookings = bookingsState;
    setBookingsState(prev => prev.map(b => 
      b.bookingId === bookingId ? { ...b, status: 'denied' as const } : b
    ));
    
    try {
      await denyBooking(bookingId, reason);
      toast.success("Booking denied");
      // Refresh in background without blocking UI
      onRefresh();
    } catch (error: any) {
      // Revert optimistic update on error
      setBookingsState(previousBookings);
      const errorMessage = extractErrorMessage(error) || "Failed to deny booking";
      toast.error(errorMessage);
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
    // Optimistic update - update UI immediately
    const previousBookings = bookingsState;
    setBookingsState(prev => prev.map(b => 
      b.bookingId === bookingId ? { ...b, status: 'rescheduled' as const } : b
    ));
    
    try {
      await rescheduleBooking(bookingId, proposedSlots, reason);
      toast.success("Reschedule proposal sent");
      // Refresh in background without blocking UI
      onRefresh();
    } catch (error: any) {
      // Revert optimistic update on error
      setBookingsState(previousBookings);
      const errorMessage = extractErrorMessage(error) || "Failed to reschedule booking";
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (bookingId: number, reason?: string) => {
    setActionLoading(bookingId);
    // Optimistic update - update UI immediately
    const previousBookings = bookingsState;
    setBookingsState(prev => prev.map(b => 
      b.bookingId === bookingId ? { ...b, status: 'cancelled' as const } : b
    ));
    
    try {
      await cancelBooking(bookingId, reason);
      toast.success("Booking cancelled");
      // Refresh in background without blocking UI
      onRefresh();
    } catch (error: any) {
      // Revert optimistic update on error
      setBookingsState(previousBookings);
      const errorMessage = extractErrorMessage(error) || "Failed to cancel booking";
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdate = async (bookingId: number, updates: any) => {
    setActionLoading(bookingId);
    try {
      await updateBooking(bookingId, updates);
      toast.success("Booking updated successfully");
      onRefresh();
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error) || "Failed to update booking";
      toast.error(errorMessage);
      throw error; // Re-throw so modal can handle it
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (bookingId: number) => {
    setActionLoading(bookingId);
    try {
      await deleteBooking(bookingId);
      toast.success("Booking deleted successfully");
      onRefresh();
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error) || "Failed to delete booking";
      toast.error(errorMessage);
      throw error; // Re-throw so modal can handle it
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
    
    if (bookingsState.length > 0) {
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
  }, [userType, bookingsState, properties, userId]);

  // Real-time notifications with polling
  useEffect(() => {
    const checkForNewBookings = async () => {
      try {
        const pending = bookingsState.filter((b) => b.status === "pending").length;
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

    // Increase polling interval from 30s to 60s to reduce API calls
    const interval = setInterval(checkForNewBookings, 60000);
    checkForNewBookings();

    return () => clearInterval(interval);
  }, [bookingsState, pendingCount]);

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
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className={`${gradient} border border-gray-200 shadow-sm hover:shadow transition-all duration-300 overflow-hidden relative group`}>
        <CardContent className="p-6 lg:p-7 relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className={`${iconBg} p-3.5 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-300`}>
              {icon}
            </div>
          </div>
          <div className="text-gray-600 text-xs sm:text-sm font-medium mb-2 uppercase tracking-wide">{label}</div>
          <div className="text-gray-900 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          icon={<Calendar className="h-6 w-6 text-blue-600" />}
          label="Total Bookings"
          value={stats.total}
          gradient="bg-blue-50"
          iconBg="bg-blue-100"
        />
        <StatCard
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          label="Pending"
          value={stats.pending}
          gradient="bg-amber-50"
          iconBg="bg-amber-100"
        />
        <StatCard
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
          label="Approved"
          value={stats.approved}
          gradient="bg-emerald-50"
          iconBg="bg-emerald-100"
        />
        <StatCard
          icon={<XCircle className="h-6 w-6 text-red-600" />}
          label="Cancelled"
          value={stats.cancelled}
          gradient="bg-red-50"
          iconBg="bg-red-100"
        />
      </div>

      {/* Enhanced Header Card */}
      <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden relative">
        <CardHeader className="relative p-6 lg:p-8 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="relative bg-amber-100 p-4 rounded-lg shadow-sm">
                  <Calendar className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Property Tour Bookings
                </CardTitle>
                <p className="text-gray-600 mt-1 text-xs sm:text-sm">
                  Manage property tour bookings and availability
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={onRefresh} 
                disabled={loadingBookings} 
                variant="outline"
                className="bg-white border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow transition-all"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingBookings ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                onClick={() => setShowManualBookingModal(true)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800 shadow-sm hover:shadow transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Booking
              </Button>
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="space-y-4 mt-6">
            {/* First Row: Search and Status */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-gray-600 transition-colors z-10" />
                <Input
                  placeholder="Search bookings by name, phone, property, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-12 bg-white border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-lg shadow-sm hover:shadow transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[220px] h-12 bg-white border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-lg shadow-sm hover:shadow transition-all">
                  <Filter className="h-4 w-4 mr-2 text-gray-600" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-gray-200 shadow-sm">
                  <SelectItem value="all" className="rounded-lg">All Statuses</SelectItem>
                  <SelectItem value="upcoming-2-days" className="rounded-lg">Upcoming 2 Days</SelectItem>
                  <SelectItem value="pending" className="rounded-lg">Pending</SelectItem>
                  <SelectItem value="approved" className="rounded-lg">Approved</SelectItem>
                  <SelectItem value="denied" className="rounded-lg">Denied</SelectItem>
                  <SelectItem value="cancelled" className="rounded-lg">Cancelled</SelectItem>
                  <SelectItem value="rescheduled" className="rounded-lg">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative p-6 lg:p-8">
          {/* Enhanced View Tabs */}
          <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <TabsList className={`inline-flex h-12 items-center justify-center rounded-lg bg-gray-50 p-1.5 border border-gray-200 shadow-sm ${hasAssignedPropertiesOrBookings ? 'w-full sm:w-auto' : ''}`}>
                  <TabsTrigger 
                    value="list" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 rounded-lg px-6 font-medium transition-all hover:bg-white/50"
                  >
                    List
                  </TabsTrigger>
                  <TabsTrigger 
                    value="day" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 rounded-lg px-6 font-medium transition-all hover:bg-white/50"
                  >
                    Day
                  </TabsTrigger>
                  <TabsTrigger 
                    value="week" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 rounded-lg px-6 font-medium transition-all hover:bg-white/50"
                  >
                    Week
                  </TabsTrigger>
                  <TabsTrigger 
                    value="month" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 rounded-lg px-6 font-medium transition-all hover:bg-white/50"
                  >
                    Month
                  </TabsTrigger>
                  <TabsTrigger 
                    value="stats" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 rounded-lg px-6 font-medium transition-all hover:bg-white/50"
                  >
                    Stats
                  </TabsTrigger>
                  {hasAssignedPropertiesOrBookings && (
                    <TabsTrigger 
                      value="availability" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 rounded-lg px-6 font-medium transition-all hover:bg-white/50"
                    >
                      Availability
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
              <div className="flex gap-2">
                <BookingExport 
                  bookings={filteredBookings} 
                  filters={{ 
                    status: statusFilter, 
                    search: searchQuery,
                  }} 
                />
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
                  <Card className="border border-amber-200 bg-amber-50 shadow-sm">
                    <CardHeader className="p-5">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg shadow-sm">
                          <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <span className="text-gray-800 font-semibold text-base sm:text-lg">
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
                            className="bg-white rounded-lg p-5 border border-gray-200 hover:shadow-sm hover:border-gray-300 transition-all cursor-pointer group"
                            onClick={() => handleBookingClick(booking)}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-3">
                                  <Badge className="bg-amber-100 text-amber-800 border-0 shadow-sm">
                                    {booking.status}
                                  </Badge>
                                  <span className="font-semibold text-base sm:text-lg text-gray-900">{booking.visitor.name}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-500" />
                                    <span className="truncate">{booking.propertyAddress || `Property #${booking.propertyId}`}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
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
                                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 shadow-sm hover:shadow transition-all"
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
                                  className="shadow-sm hover:shadow transition-all"
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
                            className="w-full border-gray-300 hover:bg-gray-50"
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
                    <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-gray-600 font-medium">Loading bookings...</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                    <Calendar className="h-12 w-12 text-gray-500" />
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
                  <div className="hidden md:block">
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                      <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-semibold text-gray-700 py-4 px-6 bg-amber-50">ID</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-6 bg-amber-50">Visitor</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-6 bg-amber-50">Property</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-6 bg-amber-50">Date & Time</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-6 bg-amber-50">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-6 bg-amber-50">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map((booking, index) => (
                          <motion.tr
                            key={booking.bookingId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100"
                            onClick={() => handleBookingClick(booking)}
                          >
                            <TableCell className="font-medium text-gray-800 py-4 px-6">#{booking.bookingId}</TableCell>
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
                                      className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 h-9 w-9 p-0 shadow-sm"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeny(booking.bookingId)}
                                      disabled={actionLoading === booking.bookingId}
                                      className="h-9 w-9 p-0 shadow-sm"
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
                                    className="h-9 w-9 p-0 shadow-sm"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                                {booking.status === "denied" && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(booking.bookingId)}
                                    disabled={actionLoading === booking.bookingId}
                                    className="h-9 w-9 p-0 shadow-sm"
                                    title="Delete permanently"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                                {booking.status === "cancelled" && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(booking.bookingId)}
                                    disabled={actionLoading === booking.bookingId}
                                    className="h-9 w-9 p-0 shadow-sm"
                                    title="Delete permanently"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {filteredBookings.map((booking, index) => (
                      <motion.div
                        key={booking.bookingId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow transition-all cursor-pointer"
                        onClick={() => handleBookingClick(booking)}
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm text-gray-600">#{booking.bookingId}</span>
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-base sm:text-lg mb-3 text-gray-900">{booking.visitor.name}</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span>{booking.visitor.phone}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                <span>{booking.propertyAddress || `Property #${booking.propertyId}`}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span>{formatDate(booking.startAt)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span>{formatTime(booking.startAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {booking.status === "pending" && (
                          <div className="flex gap-2 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <Button
                              onClick={() => handleApprove(booking.bookingId)}
                              disabled={actionLoading === booking.bookingId}
                              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex-1 shadow-sm"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeny(booking.bookingId)}
                              disabled={actionLoading === booking.bookingId}
                              className="flex-1 shadow-sm"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Deny
                            </Button>
                          </div>
                        )}
                        {booking.status === "approved" && (
                          <div className="pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="destructive"
                              onClick={() => handleCancel(booking.bookingId)}
                              disabled={actionLoading === booking.bookingId}
                              className="w-full shadow-sm"
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
            {/* CRITICAL: Only pass bookings with customerSentStartAt to calendar - filter out UTC-only bookings */}
            {(() => {
              const calendarBookings = filteredBookings.filter((b) => {
                // Only include bookings that have customerSentStartAt and customerSentEndAt
                return !!(b.customerSentStartAt && b.customerSentEndAt);
              });
              return (
                <>
                  <TabsContent value="day" className="mt-0">
                    <BookingCalendar
                      bookings={calendarBookings}
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
                      bookings={calendarBookings}
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
                      bookings={calendarBookings}
                      view="month"
                      date={selectedDate}
                      onViewChange={(v) => setView(v)}
                      onNavigate={setSelectedDate}
                      onSelectEvent={(booking) => handleBookingClick(booking)}
                      userId={userId}
                      userType={userType}
                    />
                  </TabsContent>
                </>
              );
            })()}

            {/* Statistics View */}
            <TabsContent value="stats" className="mt-0">
              <BookingStatistics bookings={bookingsState} />
            </TabsContent>

            {/* Availability Management View */}
            <TabsContent value="availability" className="mt-0">
              <AvailabilityManager userId={userId} userType={userType} onSave={onRefresh} />
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
          onUpdate={handleUpdate}
          onDelete={handleDelete}
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
