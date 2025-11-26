/**
 * Booking Detail Modal Component
 * 
 * Displays detailed information about a booking and allows actions
 * (approve, deny, reschedule, cancel) based on booking status.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, Mail, MapPin, Calendar, Clock, User, FileText, CheckCircle2, XCircle, RefreshCw, X, Loader2, Headphones, Download, Play } from "lucide-react";
import { formatDateTime, formatDate, formatTime, getStatusColor, fetchPropertyAvailability } from "./utils";
import { toast } from "sonner";
import type { Booking, AvailabilitySlot } from "./types";

interface BookingDetailModalProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onApprove: (bookingId: number) => Promise<void>;
  onDeny: (bookingId: number, reason?: string) => Promise<void>;
  onReschedule: (bookingId: number, proposedSlots: Array<{ startAt: string; endAt: string }>, reason?: string) => Promise<void>;
  onCancel: (bookingId: number, reason?: string) => Promise<void>;
  approverId: number;
}

export const BookingDetailModal = ({
  booking,
  open,
  onClose,
  onApprove,
  onDeny,
  onReschedule,
  onCancel,
  approverId,
}: BookingDetailModalProps) => {
  const [denyReason, setDenyReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [showDenyDialog, setShowDenyDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Array<{ startAt: string; endAt: string }>>([]);

  if (!booking) return null;

  // Fetch available slots when reschedule dialog opens
  useEffect(() => {
    if (showRescheduleDialog && booking.propertyId) {
      setLoadingSlots(true);
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      fetchPropertyAvailability(
        booking.propertyId,
        now.toISOString(),
        nextWeek.toISOString()
      )
        .then((data) => {
          setAvailableSlots(data.availableSlots || []);
        })
        .catch((error) => {
          console.error("Error fetching availability:", error);
          toast.error("Failed to load available time slots");
        })
        .finally(() => {
          setLoadingSlots(false);
        });
    }
  }, [showRescheduleDialog, booking.propertyId]);

  const toggleSlot = (slot: AvailabilitySlot) => {
    const slotKey = `${slot.startAt}-${slot.endAt}`;
    setSelectedSlots((prev) => {
      const exists = prev.some(
        (s) => `${s.startAt}-${s.endAt}` === slotKey
      );
      if (exists) {
        return prev.filter((s) => `${s.startAt}-${s.endAt}` !== slotKey);
      } else {
        return [...prev, { startAt: slot.startAt, endAt: slot.endAt }];
      }
    });
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(booking.bookingId);
      onClose();
    } catch (error) {
      console.error("Error approving booking:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    setLoading(true);
    try {
      await onDeny(booking.bookingId, denyReason || undefined);
      setShowDenyDialog(false);
      setDenyReason("");
      onClose();
    } catch (error) {
      console.error("Error denying booking:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await onCancel(booking.bookingId, cancelReason || undefined);
      setShowCancelDialog(false);
      setCancelReason("");
      onClose();
    } catch (error) {
      console.error("Error cancelling booking:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (selectedSlots.length === 0) {
      toast.error("Please select at least one alternative time slot");
      return;
    }
    setLoading(true);
    try {
      await onReschedule(booking.bookingId, selectedSlots, rescheduleReason || undefined);
      setShowRescheduleDialog(false);
      setRescheduleReason("");
      setSelectedSlots([]);
      onClose();
    } catch (error) {
      console.error("Error rescheduling booking:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[90vh] sm:max-h-[85vh] lg:max-h-[85vh] xl:max-h-[80vh] overflow-y-auto p-4 sm:p-5 lg:p-6 xl:p-8 w-[95vw] sm:w-full">
          <DialogHeader className="pb-4 lg:pb-5 xl:pb-6">
            <DialogTitle className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-2 lg:gap-3 xl:gap-4">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-amber-600 flex-shrink-0" />
              <span className="truncate">Booking #{booking.bookingId}</span>
            </DialogTitle>
            <DialogDescription className="pt-2 lg:pt-3 xl:pt-3">
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-5 lg:space-y-6 xl:space-y-6 py-2 sm:py-3 lg:py-4 xl:py-5">
            {/* Visitor Information */}
            <section className="space-y-2 sm:space-y-3 lg:space-y-3 xl:space-y-4">
              <h3 className="text-base sm:text-lg lg:text-lg xl:text-xl font-semibold flex items-center gap-2 lg:gap-2.5 xl:gap-3">
                <User className="h-4 w-4 sm:h-5 sm:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-amber-600 flex-shrink-0" />
                Visitor Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-4 xl:p-5 space-y-2 lg:space-y-2.5 xl:space-y-3">
                <p className="font-medium text-sm sm:text-base lg:text-base xl:text-lg">{booking.visitor.name}</p>
                <div className="flex items-center gap-2 text-sm lg:text-base xl:text-base text-gray-600">
                  <Phone className="h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5 flex-shrink-0" />
                  <a 
                    href={`tel:${booking.visitor.phone}`} 
                    className="hover:text-amber-600 break-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {booking.visitor.phone}
                  </a>
                </div>
                {booking.visitor.email && (
                  <div className="flex items-center gap-2 text-sm lg:text-base xl:text-base text-gray-600">
                    <Mail className="h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5 flex-shrink-0" />
                    <a 
                      href={`mailto:${booking.visitor.email}`} 
                      className="hover:text-amber-600 break-all"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {booking.visitor.email}
                    </a>
                  </div>
                )}
              </div>
            </section>

            {/* Property Information */}
            <section className="space-y-2 sm:space-y-3 lg:space-y-3 xl:space-y-4">
              <h3 className="text-base sm:text-lg lg:text-lg xl:text-xl font-semibold flex items-center gap-2 lg:gap-2.5 xl:gap-3">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-amber-600 flex-shrink-0" />
                Property
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-4 xl:p-5">
                <p className="font-medium text-sm sm:text-base lg:text-base xl:text-lg break-words">{booking.propertyAddress || `Property #${booking.propertyId}`}</p>
              </div>
            </section>

            {/* Booking Details */}
            <section className="space-y-2 sm:space-y-3 lg:space-y-3 xl:space-y-4">
              <h3 className="text-base sm:text-lg lg:text-lg xl:text-xl font-semibold flex items-center gap-2 lg:gap-2.5 xl:gap-3">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-amber-600 flex-shrink-0" />
                Booking Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-4 xl:p-5 space-y-2 lg:space-y-2.5 xl:space-y-3">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm lg:text-base xl:text-base">
                    <strong>Date:</strong> {formatDate(booking.startAt)}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm lg:text-base xl:text-base break-words">
                    <strong>Time:</strong> {formatTime(booking.startAt)} - {formatTime(booking.endAt)}
                  </span>
                </div>
                <div className="text-sm lg:text-base xl:text-base text-gray-600">
                  <strong>Timezone:</strong> {booking.timezone}
                </div>
                {booking.requestedAt && (
                  <div className="text-sm lg:text-base xl:text-base text-gray-600 break-words">
                    <strong>Requested:</strong> {formatDateTime(booking.requestedAt)}
                  </div>
                )}
              </div>
            </section>

            {/* Call Record (if booking came from phone call) */}
            {booking.callRecord && (booking.callRecord.callRecordingUrl || booking.callRecord.callTranscript || booking.callRecord.vapiCallId) && (
              <section className="space-y-2 sm:space-y-3 lg:space-y-3 xl:space-y-4">
                <h3 className="text-base sm:text-lg lg:text-lg xl:text-xl font-semibold flex items-center gap-2 lg:gap-2.5 xl:gap-3">
                  <Headphones className="h-4 w-4 sm:h-5 sm:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-amber-600 flex-shrink-0" />
                  Call Record
                </h3>
                <div className="bg-gradient-to-br from-blue-50 to-amber-50 rounded-lg p-3 sm:p-4 lg:p-4 xl:p-5 space-y-3 border-2 border-amber-200">
                  {booking.callRecord.callRecordingUrl && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm sm:text-base font-medium text-gray-900">
                        <Headphones className="h-4 w-4 text-amber-600" />
                        Call Recording
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <audio 
                          controls 
                          className="w-full sm:flex-1 h-10 rounded-lg"
                          src={booking.callRecord.callRecordingUrl}
                        >
                          Your browser does not support the audio element.
                        </audio>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = booking.callRecord!.callRecordingUrl!;
                            link.download = `call-${booking.callRecord!.vapiCallId || booking.bookingId}.mp3`;
                            link.click();
                          }}
                          className="border-amber-300 hover:bg-amber-50 hover:border-amber-400"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                  {booking.callRecord.callTranscript && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm sm:text-base font-medium text-gray-900">
                        <FileText className="h-4 w-4 text-amber-600" />
                        Call Transcript
                      </div>
                      <div className="bg-white rounded-lg p-3 sm:p-4 max-h-60 overflow-y-auto border border-amber-200">
                        <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{booking.callRecord.callTranscript}</p>
                      </div>
                    </div>
                  )}
                  {booking.callRecord.vapiCallId && (
                    <div className="text-xs sm:text-sm text-gray-600">
                      <strong>Call ID:</strong> {booking.callRecord.vapiCallId}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Notes */}
            {booking.notes && (
              <section className="space-y-2 sm:space-y-3 lg:space-y-3 xl:space-y-4">
                <h3 className="text-base sm:text-lg lg:text-lg xl:text-xl font-semibold flex items-center gap-2 lg:gap-2.5 xl:gap-3">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-amber-600 flex-shrink-0" />
                  Notes
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-4 xl:p-5">
                  <p className="text-sm sm:text-base text-gray-700">{booking.notes}</p>
                </div>
              </section>
            )}

            {/* Proposed Slots (for rescheduled bookings) */}
            {booking.status === "rescheduled" && booking.proposedSlots && booking.proposedSlots.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-lg font-semibold">Proposed Alternative Times</h3>
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  {booking.proposedSlots.map((slot, idx) => (
                    <div key={idx} className="text-sm">
                      {formatDateTime(slot.startAt)} - {formatTime(slot.endAt)}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Audit Log */}
            {booking.auditLog && booking.auditLog.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-lg font-semibold">History</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {booking.auditLog.map((log, idx) => (
                    <div key={idx} className="text-sm border-b border-gray-200 pb-2 last:border-0">
                      <div className="font-medium">{log.action}</div>
                      <div className="text-gray-600">By {log.performedBy} on {formatDateTime(log.performedAt)}</div>
                      {log.notes && <div className="text-gray-500 italic">{log.notes}</div>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2 lg:gap-3 xl:gap-3 pt-4 lg:pt-5 xl:pt-6">
            {booking.status === "pending" && (
              <>
                <Button
                  onClick={handleApprove}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto min-h-[44px] lg:min-h-[48px] xl:min-h-[52px] order-1 px-4 lg:px-5 xl:px-6 text-sm lg:text-base xl:text-base"
                >
                  <CheckCircle2 className="h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => setShowDenyDialog(true)}
                  disabled={loading}
                  variant="destructive"
                  className="w-full sm:w-auto min-h-[44px] lg:min-h-[48px] xl:min-h-[52px] order-2 px-4 lg:px-5 xl:px-6 text-sm lg:text-base xl:text-base"
                >
                  <XCircle className="h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5 mr-2" />
                  Deny
                </Button>
                <Button
                  onClick={() => setShowRescheduleDialog(true)}
                  disabled={loading}
                  variant="outline"
                  className="w-full sm:w-auto min-h-[44px] lg:min-h-[48px] xl:min-h-[52px] order-3 px-4 lg:px-5 xl:px-6 text-sm lg:text-base xl:text-base"
                >
                  <RefreshCw className="h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5 mr-2" />
                  Reschedule
                </Button>
              </>
            )}
            {booking.status === "approved" && (
              <Button
                onClick={() => setShowCancelDialog(true)}
                disabled={loading}
                variant="destructive"
                className="w-full sm:w-auto min-h-[44px] lg:min-h-[48px] xl:min-h-[52px] order-1 px-4 lg:px-5 xl:px-6 text-sm lg:text-base xl:text-base"
              >
                <X className="h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5 mr-2" />
                Cancel Booking
              </Button>
            )}
            <Button 
              onClick={onClose} 
              variant="outline"
              className="w-full sm:w-auto min-h-[44px] lg:min-h-[48px] xl:min-h-[52px] order-last px-4 lg:px-5 xl:px-6 text-sm lg:text-base xl:text-base"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deny Confirmation Dialog */}
      <Dialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
        <DialogContent className="w-[95vw] sm:w-full p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Deny Booking Request</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Are you sure you want to deny this booking request? The visitor will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="deny-reason" className="text-sm sm:text-base">Reason (optional)</Label>
              <Textarea
                id="deny-reason"
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Enter reason for denial..."
                rows={3}
                className="mt-2 text-base"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => setShowDenyDialog(false)} 
              variant="outline"
              className="w-full sm:w-auto min-h-[44px] order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeny} 
              disabled={loading} 
              variant="destructive"
              className="w-full sm:w-auto min-h-[44px] order-1 sm:order-2"
            >
              Deny Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="w-[95vw] sm:w-full p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Cancel Booking</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Are you sure you want to cancel this booking? The visitor will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cancel-reason" className="text-sm sm:text-base">Reason (optional)</Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                rows={3}
                className="mt-2 text-base"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => setShowCancelDialog(false)} 
              variant="outline"
              className="w-full sm:w-auto min-h-[44px] order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCancel} 
              disabled={loading} 
              variant="destructive"
              className="w-full sm:w-auto min-h-[44px] order-1 sm:order-2"
            >
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={(open) => {
        setShowRescheduleDialog(open);
        if (!open) {
          setSelectedSlots([]);
          setRescheduleReason("");
        }
      }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl lg:text-xl xl:text-2xl">Reschedule Booking</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Select alternative time slots for this booking. The visitor will be asked to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-5 lg:space-y-6 py-4">
            <div>
              <Label htmlFor="reschedule-reason" className="text-sm sm:text-base">Reason (optional)</Label>
              <Textarea
                id="reschedule-reason"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="Enter reason for rescheduling..."
                rows={3}
                className="mt-2 text-base"
              />
            </div>

            <div>
              <Label className="text-sm sm:text-base lg:text-base xl:text-lg font-semibold mb-3 block">
                Select Alternative Time Slots (Select 1-3 options)
              </Label>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-600 mr-2" />
                  <span className="text-sm sm:text-base">Loading available slots...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm sm:text-base text-gray-600">No available slots found for the next 7 days</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg p-3 sm:p-4">
                  {availableSlots.map((slot, idx) => {
                    const slotKey = `${slot.startAt}-${slot.endAt}`;
                    const isSelected = selectedSlots.some(
                      (s) => `${s.startAt}-${s.endAt}` === slotKey
                    );
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
                        }`}
                        onClick={() => toggleSlot(slot)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSlot(slot)}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base lg:text-base xl:text-lg">
                            {formatDate(slot.startAt)}
                          </div>
                          <div className="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600">
                            {formatTime(slot.startAt)} - {formatTime(slot.endAt)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
              {selectedSlots.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm sm:text-base font-medium text-blue-900 mb-2">
                    Selected {selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""}:
                  </p>
                  <div className="space-y-1">
                    {selectedSlots.map((slot, idx) => (
                      <div key={idx} className="text-xs sm:text-sm text-blue-800">
                        • {formatDateTime(slot.startAt)} - {formatTime(slot.endAt)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => {
                setShowRescheduleDialog(false);
                setSelectedSlots([]);
                setRescheduleReason("");
              }} 
              variant="outline"
              className="w-full sm:w-auto min-h-[44px] lg:min-h-[48px] xl:min-h-[52px] order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReschedule} 
              disabled={loading || selectedSlots.length === 0 || loadingSlots}
              className="w-full sm:w-auto min-h-[44px] lg:min-h-[48px] xl:min-h-[52px] order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Proposing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5 mr-2" />
                  Propose Reschedule ({selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

