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
import { motion } from "framer-motion";
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
import type { Booking } from "./types";

interface BookingsTabProps {
  userId: number;
  userType: string;
  bookings: Booking[];
  loadingBookings: boolean;
  onRefresh: () => void;
}

export const BookingsTab = ({
  userId,
  userType,
  bookings,
  loadingBookings,
  onRefresh,
}: BookingsTabProps) => {
  const [view, setView] = useState<"list" | "day" | "week" | "month">("list");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Filter bookings based on status and search
  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Filter by search query
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

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6 xl:space-y-6">
      {/* Header with filters and view controls */}
      <Card className="bg-white shadow-xl border border-amber-100 rounded-xl sm:rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-4 sm:p-5 lg:p-6 xl:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-gray-900 text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-2 sm:gap-3 lg:gap-3 xl:gap-4">
                <div className="p-1.5 sm:p-2 lg:p-2.5 xl:p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-white" />
                </div>
                <span className="truncate">Property Tour Bookings</span>
              </CardTitle>
              <p className="text-gray-600 mt-1 sm:mt-2 lg:mt-2 xl:mt-3 text-sm sm:text-base lg:text-base xl:text-lg">
                Manage property tour bookings and availability
              </p>
            </div>
            <Button 
              onClick={onRefresh} 
              disabled={loadingBookings} 
              variant="outline"
              className="w-full sm:w-auto min-h-[44px] lg:min-h-[48px] xl:min-h-[52px] px-4 sm:px-4 lg:px-5 xl:px-6 text-sm sm:text-sm lg:text-base xl:text-base"
            >
              <RefreshCw className={`h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5 mr-2 ${loadingBookings ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-4 xl:gap-5 mt-4 lg:mt-5 xl:mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 lg:left-4 xl:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-gray-400 pointer-events-none" />
              <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 lg:pl-11 xl:pl-12 min-h-[44px] lg:min-h-[48px] xl:min-h-[52px] text-base lg:text-base xl:text-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] lg:w-[200px] xl:w-[220px] min-h-[44px] lg:min-h-[48px] xl:min-h-[52px] text-sm lg:text-base xl:text-base">
                <Filter className="h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5 mr-2 flex-shrink-0" />
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

        <CardContent className="p-4 sm:p-5 lg:p-6 xl:p-8">
          {/* View Tabs */}
          <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mb-4 sm:mb-5 lg:mb-6 xl:mb-6">
              <TabsList className="grid w-full grid-cols-4 min-w-[400px] sm:min-w-0 gap-1 lg:gap-2 xl:gap-2">
                <TabsTrigger value="list" className="text-xs sm:text-sm lg:text-base xl:text-base px-2 sm:px-4 lg:px-5 xl:px-6 min-h-[44px] lg:min-h-[48px] xl:min-h-[52px]">List</TabsTrigger>
                <TabsTrigger value="day" className="text-xs sm:text-sm lg:text-base xl:text-base px-2 sm:px-4 lg:px-5 xl:px-6 min-h-[44px] lg:min-h-[48px] xl:min-h-[52px]">Day</TabsTrigger>
                <TabsTrigger value="week" className="text-xs sm:text-sm lg:text-base xl:text-base px-2 sm:px-4 lg:px-5 xl:px-6 min-h-[44px] lg:min-h-[48px] xl:min-h-[52px]">Week</TabsTrigger>
                <TabsTrigger value="month" className="text-xs sm:text-sm lg:text-base xl:text-base px-2 sm:px-4 lg:px-5 xl:px-6 min-h-[44px] lg:min-h-[48px] xl:min-h-[52px]">Month</TabsTrigger>
              </TabsList>
            </div>

            {/* Pending Bookings Queue */}
            {pendingBookings.length > 0 && (
              <Card className="mb-4 sm:mb-5 lg:mb-6 xl:mb-6 border-yellow-200 bg-yellow-50/50">
                <CardHeader className="p-4 sm:p-5 lg:p-6 xl:p-6">
                  <CardTitle className="text-base sm:text-lg lg:text-lg xl:text-xl flex items-center gap-2 lg:gap-2.5 xl:gap-3">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-yellow-600 flex-shrink-0" />
                    <span>Pending Bookings ({pendingBookings.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 lg:p-6 xl:p-6 pt-0">
                  <div className="space-y-3 lg:space-y-3.5 xl:space-y-4">
                    {pendingBookings.slice(0, 5).map((booking) => (
                      <motion.div
                        key={booking.bookingId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg p-3 sm:p-4 lg:p-4 xl:p-5 border border-yellow-200 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                        onClick={() => handleBookingClick(booking)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 lg:gap-4 xl:gap-5">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2 lg:mb-2.5 xl:mb-3">
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                              <span className="font-semibold text-sm sm:text-base lg:text-base xl:text-lg truncate">{booking.visitor.name}</span>
                            </div>
                            <div className="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 space-y-1.5 lg:space-y-2 xl:space-y-2">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-3.5 w-3.5 lg:h-4 lg:w-4 xl:h-4 xl:w-4 mt-0.5 flex-shrink-0" />
                                <span className="break-words">{booking.propertyAddress || `Property #${booking.propertyId}`}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 lg:h-4 lg:w-4 xl:h-4 xl:w-4 flex-shrink-0" />
                                <span className="break-words">{formatDateTime(booking.startAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 sm:flex-col sm:gap-2 lg:gap-2.5 xl:gap-3">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(booking.bookingId);
                              }}
                              disabled={actionLoading === booking.bookingId}
                              className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none min-h-[44px] lg:min-h-[48px] xl:min-h-[52px] sm:min-h-0 sm:px-3 lg:px-4 xl:px-5 text-sm lg:text-base xl:text-base"
                            >
                              <CheckCircle2 className="h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5 sm:mr-2" />
                              <span className="hidden sm:inline">Approve</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeny(booking.bookingId);
                              }}
                              disabled={actionLoading === booking.bookingId}
                              className="flex-1 sm:flex-none min-h-[44px] lg:min-h-[48px] xl:min-h-[52px] sm:min-h-0 sm:px-3 lg:px-4 xl:px-5 text-sm lg:text-base xl:text-base"
                            >
                              <XCircle className="h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5 sm:mr-2" />
                              <span className="hidden sm:inline">Deny</span>
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {pendingBookings.length > 5 && (
                      <Button
                        variant="outline"
                        className="w-full min-h-[44px] lg:min-h-[48px] xl:min-h-[52px] text-sm lg:text-base xl:text-base"
                        onClick={() => setStatusFilter("pending")}
                      >
                        View All {pendingBookings.length} Pending Bookings
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* List View */}
            <TabsContent value="list" className="mt-0">
              {loadingBookings ? (
                <div className="text-center py-8 sm:py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium text-sm sm:text-base">Loading bookings...</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium text-base sm:text-lg">
                    {searchQuery || statusFilter !== "all"
                      ? "No bookings match your filters"
                      : "No bookings found"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50">
                        <TableRow>
                          <TableHead className="font-bold text-sm lg:text-base xl:text-base py-3 lg:py-4 xl:py-5 px-4 lg:px-5 xl:px-6">ID</TableHead>
                          <TableHead className="font-bold text-sm lg:text-base xl:text-base py-3 lg:py-4 xl:py-5 px-4 lg:px-5 xl:px-6">Visitor</TableHead>
                          <TableHead className="font-bold text-sm lg:text-base xl:text-base py-3 lg:py-4 xl:py-5 px-4 lg:px-5 xl:px-6">Property</TableHead>
                          <TableHead className="font-bold text-sm lg:text-base xl:text-base py-3 lg:py-4 xl:py-5 px-4 lg:px-5 xl:px-6">Date & Time</TableHead>
                          <TableHead className="font-bold text-sm lg:text-base xl:text-base py-3 lg:py-4 xl:py-5 px-4 lg:px-5 xl:px-6">Status</TableHead>
                          <TableHead className="font-bold text-sm lg:text-base xl:text-base py-3 lg:py-4 xl:py-5 px-4 lg:px-5 xl:px-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map((booking) => (
                          <motion.tr
                            key={booking.bookingId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="hover:bg-amber-50/50 transition-colors cursor-pointer"
                            onClick={() => handleBookingClick(booking)}
                          >
                            <TableCell className="font-semibold text-sm lg:text-base xl:text-base py-3 lg:py-4 xl:py-5 px-4 lg:px-5 xl:px-6">#{booking.bookingId}</TableCell>
                            <TableCell className="py-3 lg:py-4 xl:py-5 px-4 lg:px-5 xl:px-6">
                              <div>
                                <div className="font-medium text-sm lg:text-base xl:text-base">{booking.visitor.name}</div>
                                <div className="text-xs lg:text-sm xl:text-sm text-gray-500">{booking.visitor.phone}</div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-sm lg:text-base xl:text-base py-3 lg:py-4 xl:py-5 px-4 lg:px-5 xl:px-6">
                              {booking.propertyAddress || `Property #${booking.propertyId}`}
                            </TableCell>
                            <TableCell className="py-3 lg:py-4 xl:py-5 px-4 lg:px-5 xl:px-6">
                              <div className="text-sm lg:text-base xl:text-base">
                                <div>{formatDate(booking.startAt)}</div>
                                <div className="text-gray-500 text-xs lg:text-sm xl:text-sm">{formatTime(booking.startAt)}</div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 lg:py-4 xl:py-5 px-4 lg:px-5 xl:px-6">
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 lg:py-4 xl:py-5 px-4 lg:px-5 xl:px-6">
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                {booking.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleApprove(booking.bookingId)}
                                      disabled={actionLoading === booking.bookingId}
                                      className="bg-green-600 hover:bg-green-700 h-8 lg:h-9 xl:h-10 w-8 lg:w-9 xl:w-10 p-0"
                                    >
                                      <CheckCircle2 className="h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeny(booking.bookingId)}
                                      disabled={actionLoading === booking.bookingId}
                                      className="h-8 lg:h-9 xl:h-10 w-8 lg:w-9 xl:w-10 p-0"
                                    >
                                      <XCircle className="h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
                                    </Button>
                                  </>
                                )}
                                {booking.status === "approved" && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleCancel(booking.bookingId)}
                                    disabled={actionLoading === booking.bookingId}
                                    className="h-8 lg:h-9 xl:h-10 w-8 lg:w-9 xl:w-10 p-0"
                                  >
                                    <X className="h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
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
                  <div className="md:hidden space-y-3">
                    {filteredBookings.map((booking) => (
                      <motion.div
                        key={booking.bookingId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                        onClick={() => handleBookingClick(booking)}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-sm text-gray-500">#{booking.bookingId}</span>
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-base mb-1 truncate">{booking.visitor.name}</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{booking.visitor.phone}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                <span className="break-words">{booking.propertyAddress || `Property #${booking.propertyId}`}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{formatDate(booking.startAt)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{formatTime(booking.startAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {booking.status === "pending" && (
                          <div className="flex gap-2 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <Button
                              onClick={() => handleApprove(booking.bookingId)}
                              disabled={actionLoading === booking.bookingId}
                              className="bg-green-600 hover:bg-green-700 flex-1 min-h-[44px]"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeny(booking.bookingId)}
                              disabled={actionLoading === booking.bookingId}
                              className="flex-1 min-h-[44px]"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Deny
                            </Button>
                          </div>
                        )}
                        {booking.status === "approved" && (
                          <div className="pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="destructive"
                              onClick={() => handleCancel(booking.bookingId)}
                              disabled={actionLoading === booking.bookingId}
                              className="w-full min-h-[44px]"
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

            {/* Calendar Views (simplified for now) */}
            <TabsContent value="day" className="mt-0">
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Day view coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="week" className="mt-0">
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Week view coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="month" className="mt-0">
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Month view coming soon</p>
              </div>
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
    </div>
  );
};
