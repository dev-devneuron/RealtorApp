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
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [lastNotificationCheck, setLastNotificationCheck] = useState<Date>(new Date());
  const [pendingCount, setPendingCount] = useState(0);
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  // Local copy to allow optimistic updates without mutating props
  const [bookingsState, setBookingsState] = useState<Booking[]>(bookings || []);

  // Keep local state in sync when parent provides fresh bookings, but don't overwrite optimistic non-pending changes with stale pending data
  useEffect(() => {
    setBookingsState((prev) => {
      const prevMap = new Map(prev.map((b) => [b.bookingId, b]));
      return (bookings || []).map((incoming) => {
        const existing = prevMap.get(incoming.bookingId);
        if (!existing) return incoming;
        // If we previously moved it out of pending and incoming is still pending, keep our optimistic/non-pending state
        if (existing.status !== "pending" && incoming.status === "pending") {
          return existing;
        }
        return incoming;
      });
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

  // Filter bookings based on status, search, and date range (use debounced query)
  const filteredBookings = useMemo(() => {
    let filtered = bookingsState;

    if (statusFilter !== "all") {
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

    // Date range filtering - filter by booking start date
    if (startDateFilter || endDateFilter) {
      filtered = filtered.filter((b) => {
        if (!b.startAt) return false;
        
        const bookingDate = new Date(b.startAt);
        if (isNaN(bookingDate.getTime())) return false;
        
        // Normalize to start of day for comparison (ignore time)
        const bookingDateOnly = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
        
        if (startDateFilter) {
          const startDate = new Date(startDateFilter);
          if (isNaN(startDate.getTime())) return true; // Invalid start date, skip this filter
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          if (bookingDateOnly < startDateOnly) return false;
        }
        
        if (endDateFilter) {
          const endDate = new Date(endDateFilter);
          if (isNaN(endDate.getTime())) return true; // Invalid end date, skip this filter
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          if (bookingDateOnly > endDateOnly) return false;
        }
        
        return true;
      });
    }

    return filtered;
  }, [bookingsState, statusFilter, debouncedSearchQuery, startDateFilter, endDateFilter]);

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
      <Card className={`${gradient} border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative group`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none group-hover:bg-white/15 transition-colors" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none" />
        <CardContent className="p-6 lg:p-7 relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className={`${iconBg} p-3.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              {icon}
            </div>
            <Sparkles className="h-5 w-5 text-white/30 group-hover:text-white/50 transition-colors" />
          </div>
          <div className="text-white/90 text-xs sm:text-sm font-semibold mb-2 uppercase tracking-wide">{label}</div>
          <div className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
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
          label="Cancelled"
          value={stats.cancelled}
          gradient="bg-gradient-to-br from-red-500 via-red-600 to-red-700"
          iconBg="bg-red-400/30"
        />
      </div>

      {/* Enhanced Header Card */}
      <Card className="bg-gradient-to-br from-white via-amber-50/30 to-white border-0 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-blue-500/5 pointer-events-none" />
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
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
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
                className="bg-white/80 backdrop-blur-sm border-amber-200 hover:bg-white hover:border-amber-300 shadow-md hover:shadow-lg transition-all"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingBookings ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                onClick={() => setShowManualBookingModal(true)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg"
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
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors z-10" />
                <Input
                  placeholder="Search bookings by name, phone, property, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-12 bg-white/90 backdrop-blur-sm border-2 border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-xl shadow-md hover:shadow-lg transition-all"
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
                <SelectTrigger className="w-full sm:w-[220px] h-12 bg-white/90 backdrop-blur-sm border-2 border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-xl shadow-md hover:shadow-lg transition-all">
                  <Filter className="h-4 w-4 mr-2 text-amber-600" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-amber-200 shadow-xl">
                  <SelectItem value="all" className="rounded-lg">All Statuses</SelectItem>
                  <SelectItem value="pending" className="rounded-lg">Pending</SelectItem>
                  <SelectItem value="approved" className="rounded-lg">Approved</SelectItem>
                  <SelectItem value="denied" className="rounded-lg">Denied</SelectItem>
                  <SelectItem value="cancelled" className="rounded-lg">Cancelled</SelectItem>
                  <SelectItem value="rescheduled" className="rounded-lg">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Second Row: Date Range Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1 text-amber-600" />
                  Start Date
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => {
                      const newStartDate = e.target.value;
                      setStartDateFilter(newStartDate);
                      // If end date is before new start date, clear it
                      if (endDateFilter && newStartDate && new Date(endDateFilter) < new Date(newStartDate)) {
                        setEndDateFilter("");
                      }
                    }}
                    max={endDateFilter || undefined}
                    className="h-12 bg-white/90 backdrop-blur-sm border-2 border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-xl shadow-md hover:shadow-lg transition-all"
                  />
                  {startDateFilter && (
                    <button
                      onClick={() => setStartDateFilter("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1 text-amber-600" />
                  End Date
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => {
                      const newEndDate = e.target.value;
                      setEndDateFilter(newEndDate);
                      // If start date is after new end date, clear it
                      if (startDateFilter && newEndDate && new Date(startDateFilter) > new Date(newEndDate)) {
                        setStartDateFilter("");
                      }
                    }}
                    min={startDateFilter || undefined}
                    className="h-12 bg-white/90 backdrop-blur-sm border-2 border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-xl shadow-md hover:shadow-lg transition-all"
                  />
                  {endDateFilter && (
                    <button
                      onClick={() => setEndDateFilter("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {(startDateFilter || endDateFilter) && (
                <Button
                  onClick={() => {
                    setStartDateFilter("");
                    setEndDateFilter("");
                  }}
                  variant="outline"
                  className="h-12 px-4 bg-white/90 backdrop-blur-sm border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Dates
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative p-6 lg:p-8">
          {/* Enhanced View Tabs */}
          <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <TabsList className={`inline-flex h-12 items-center justify-center rounded-xl bg-amber-50/70 backdrop-blur-sm p-1.5 border border-amber-200 shadow-md ${hasAssignedPropertiesOrBookings ? 'w-full sm:w-auto' : ''}`}>
                  <TabsTrigger 
                    value="list" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-amber-700 rounded-lg px-6 font-semibold transition-all hover:bg-white/50"
                  >
                    List
                  </TabsTrigger>
                  <TabsTrigger 
                    value="day" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-amber-700 rounded-lg px-6 font-semibold transition-all hover:bg-white/50"
                  >
                    Day
                  </TabsTrigger>
                  <TabsTrigger 
                    value="week" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-amber-700 rounded-lg px-6 font-semibold transition-all hover:bg-white/50"
                  >
                    Week
                  </TabsTrigger>
                  <TabsTrigger 
                    value="month" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-amber-700 rounded-lg px-6 font-semibold transition-all hover:bg-white/50"
                  >
                    Month
                  </TabsTrigger>
                  <TabsTrigger 
                    value="stats" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-amber-700 rounded-lg px-6 font-semibold transition-all hover:bg-white/50"
                  >
                    Stats
                  </TabsTrigger>
                  {hasAssignedPropertiesOrBookings && (
                    <TabsTrigger 
                      value="availability" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-amber-700 rounded-lg px-6 font-semibold transition-all hover:bg-white/50"
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
                    startDate: startDateFilter,
                    endDate: endDateFilter,
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
                  <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50/50 to-amber-50 shadow-lg">
                    <CardHeader className="p-5">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <div className="p-2 bg-amber-500 rounded-lg shadow-md">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent font-bold text-base sm:text-lg">
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
                                  <span className="font-bold text-base sm:text-lg text-gray-900">{booking.visitor.name}</span>
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
                                {booking.status === "denied" && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(booking.bookingId)}
                                    disabled={actionLoading === booking.bookingId}
                                    className="h-9 w-9 p-0 shadow-md"
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
                                    className="h-9 w-9 p-0 shadow-md"
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
                            <h3 className="font-bold text-base sm:text-lg mb-3 text-gray-900">{booking.visitor.name}</h3>
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
