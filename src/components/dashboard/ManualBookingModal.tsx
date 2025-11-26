/**
 * Manual Booking Creation Modal
 * 
 * Allows PMs/Realtors to create manual bookings from the dashboard
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, User, Phone, Mail, MapPin, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createManualBooking, fetchPropertiesForAssignment } from "./utils";
import type { Property } from "./types";

interface ManualBookingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId: number;
  initialPropertyId?: number;
}

export const ManualBookingModal = ({
  open,
  onClose,
  onSuccess,
  userId,
  initialPropertyId,
}: ManualBookingModalProps) => {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [formData, setFormData] = useState({
    property_id: initialPropertyId || 0,
    visitor_name: "",
    visitor_phone: "",
    visitor_email: "",
    start_date: "",
    start_time: "",
    end_time: "",
    timezone: "America/New_York",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      loadProperties();
      if (initialPropertyId) {
        setFormData((prev) => ({ ...prev, property_id: initialPropertyId }));
      }
    }
  }, [open, initialPropertyId]);

  const loadProperties = async () => {
    try {
      setLoadingProperties(true);
      const props = await fetchPropertiesForAssignment(userId);
      setProperties(props);
    } catch (error: any) {
      console.error("Error loading properties:", error);
      toast.error(error.message || "Failed to load properties");
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.property_id) {
      toast.error("Please select a property");
      return;
    }
    if (!formData.visitor_name || !formData.visitor_phone) {
      toast.error("Please fill in visitor name and phone");
      return;
    }
    if (!formData.start_date || !formData.start_time || !formData.end_time) {
      toast.error("Please fill in date and time");
      return;
    }

    try {
      setLoading(true);

      // Combine date and time into ISO strings
      const startAt = new Date(`${formData.start_date}T${formData.start_time}`).toISOString();
      const endAt = new Date(`${formData.start_date}T${formData.end_time}`).toISOString();

      if (new Date(endAt) <= new Date(startAt)) {
        toast.error("End time must be after start time");
        return;
      }

      await createManualBooking({
        property_id: formData.property_id,
        visitor_name: formData.visitor_name,
        visitor_phone: formData.visitor_phone,
        visitor_email: formData.visitor_email || undefined,
        start_at: startAt,
        end_at: endAt,
        timezone: formData.timezone,
        notes: formData.notes || undefined,
      });

      toast.success("Booking created successfully");
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast.error(error.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      property_id: initialPropertyId || 0,
      visitor_name: "",
      visitor_phone: "",
      visitor_email: "",
      start_date: "",
      start_time: "",
      end_time: "",
      timezone: "America/New_York",
      notes: "",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Plus className="h-6 w-6 text-amber-600" />
            Create Manual Booking
          </DialogTitle>
          <DialogDescription>
            Create a new booking/tour manually. This booking will be automatically approved.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Property Selection */}
          <div>
            <Label htmlFor="property" className="text-sm font-semibold text-gray-700 mb-2 block">
              Property <span className="text-red-500">*</span>
            </Label>
            {loadingProperties ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading properties...
              </div>
            ) : (
              <Select
                value={formData.property_id.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, property_id: parseInt(value) })
                }
              >
                <SelectTrigger className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl">
                  <SelectValue placeholder="Select a property..." />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-amber-600" />
                        <span>{property.address || `Property #${property.id}`}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Visitor Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visitor_name" className="text-sm font-semibold text-gray-700 mb-2 block">
                <User className="h-4 w-4 inline mr-1" />
                Visitor Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="visitor_name"
                value={formData.visitor_name}
                onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
                placeholder="John Doe"
                className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
                required
              />
            </div>
            <div>
              <Label htmlFor="visitor_phone" className="text-sm font-semibold text-gray-700 mb-2 block">
                <Phone className="h-4 w-4 inline mr-1" />
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="visitor_phone"
                type="tel"
                value={formData.visitor_phone}
                onChange={(e) => setFormData({ ...formData, visitor_phone: e.target.value })}
                placeholder="+14125551234"
                className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="visitor_email" className="text-sm font-semibold text-gray-700 mb-2 block">
                <Mail className="h-4 w-4 inline mr-1" />
                Email (optional)
              </Label>
              <Input
                id="visitor_email"
                type="email"
                value={formData.visitor_email}
                onChange={(e) => setFormData({ ...formData, visitor_email: e.target.value })}
                placeholder="john@example.com"
                className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start_date" className="text-sm font-semibold text-gray-700 mb-2 block">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
                required
              />
            </div>
            <div>
              <Label htmlFor="start_time" className="text-sm font-semibold text-gray-700 mb-2 block">
                <Clock className="h-4 w-4 inline mr-1" />
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
                required
              />
            </div>
            <div>
              <Label htmlFor="end_time" className="text-sm font-semibold text-gray-700 mb-2 block">
                <Clock className="h-4 w-4 inline mr-1" />
                End Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
                required
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <Label htmlFor="timezone" className="text-sm font-semibold text-gray-700 mb-2 block">
              Timezone
            </Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => setFormData({ ...formData, timezone: value })}
            >
              <SelectTrigger className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-semibold text-gray-700 mb-2 block">
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this booking..."
              rows={3}
              className="border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Booking
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

