/**
 * Availability Management Component
 * 
 * Allows users to:
 * - Configure working hours
 * - Block time slots
 * - Manage calendar preferences
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, X, Plus, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatTime, fetchCalendarPreferences, updateCalendarPreferences, fetchUnavailableSlots, addUnavailableSlot, removeUnavailableSlot, extractErrorMessage, fetchCalendarEvents } from "./utils";
import { clearCacheForEndpoint } from "../../utils/cache";
import { API_BASE } from "./constants";
import type { CalendarPreferences, AvailabilitySlot } from "./types";

interface AvailabilityManagerProps {
  userId: number;
  userType: string;
  onSave?: () => void;
}

export const AvailabilityManager = ({
  userId,
  userType,
  onSave,
}: AvailabilityManagerProps) => {
  // ⚠️ CRITICAL: Start with null to avoid hardcoded defaults
  // According to documentation: "Always fetch preferences on component mount - Don't use hardcoded defaults"
  // "Preferences persist across sessions - Always fetch from API, don't assume defaults"
  const [workingHours, setWorkingHours] = useState<{
    start_time: string;
    end_time: string;
    timezone: string;
    slot_length: number;
    working_days: number[];
  } | null>(null);

  const [blockedSlots, setBlockedSlots] = useState<Array<{
    id: number | string;
    startAt: string;
    endAt: string;
    slotType?: string;
    isFullDay?: boolean;
    reason?: string;
    notes?: string;
  }>>([]);

  const [newBlock, setNewBlock] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    slotType: "unavailable" as "unavailable" | "busy" | "personal" | "holiday" | "off_day",
    isFullDay: false,
    reason: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);

  // ⚠️ CRITICAL: Always fetch preferences from API first - don't use localStorage or hardcoded defaults
  // According to documentation: "Always fetch preferences on component mount - Don't use hardcoded defaults"
  // "Preferences persist across sessions - Always fetch from API, don't assume defaults"
  useEffect(() => {
    const loadData = async () => {
      try {
        // Always fetch from API first (not localStorage)
        // fetchCalendarPreferences will return defaults only if API fails
        const prefs = await fetchCalendarPreferences(userId, userType);
        setWorkingHours({
          start_time: prefs.start_time,
          end_time: prefs.end_time,
          timezone: prefs.timezone,
          slot_length: prefs.slot_length,
          working_days: prefs.working_days,
        });
        // Save to localStorage for caching (but API is source of truth)
        localStorage.setItem(`calendar_preferences_${userId}`, JSON.stringify(prefs));

        // Fetch unavailable slots - use optimized date range (2 months past, 4 months future)
        // Reduced from 9 months to 6 months to minimize latency and data transfer
        try {
          // Optimized date range: 2 months past to 4 months future (6 months total)
          const now = new Date();
          const fromDate = new Date(now);
          fromDate.setMonth(now.getMonth() - 2); // 2 months ago (reduced from 3)
          fromDate.setDate(1); // Start of month
          fromDate.setHours(0, 0, 0, 0);
          
          const toDate = new Date(now);
          toDate.setMonth(now.getMonth() + 4); // 4 months ahead (reduced from 6)
          toDate.setDate(0); // Last day of previous month (end of target month)
          toDate.setHours(23, 59, 59, 999);
          
          // Use static import - no dynamic import delay
          const eventsData = await fetchCalendarEvents(
            userId,
            fromDate.toISOString(),
            toDate.toISOString()
          );
          
          if (eventsData && eventsData.availabilitySlots && Array.isArray(eventsData.availabilitySlots)) {
            // Map slots from calendar events format to our format
            const mappedSlots = eventsData.availabilitySlots.map((slot: any) => ({
              id: slot.slotId || slot.id || `slot-${slot.startAt || slot.start_at}`,
              startAt: slot.startAt || slot.start_at,
              endAt: slot.endAt || slot.end_at,
              slotType: slot.slotType || slot.slot_type || "unavailable",
              isFullDay: slot.isFullDay !== undefined ? slot.isFullDay : (slot.is_full_day || false),
              reason: slot.reason || slot.notes || "",
              notes: slot.notes || slot.reason || "",
            }));
            
            // Update state immediately
            setBlockedSlots(mappedSlots);
          } else {
            // Fallback: try availability endpoint if calendar events doesn't have slots
            try {
              const slots = await fetchUnavailableSlots(userId, userType);
              if (slots && Array.isArray(slots) && slots.length > 0) {
                const mappedSlots = slots.map(slot => ({
                  id: slot.id || `slot-${slot.startAt}-${slot.endAt}`,
                  startAt: slot.startAt,
                  endAt: slot.endAt,
                  slotType: slot.slotType || "unavailable",
                  isFullDay: slot.isFullDay || false,
                  reason: slot.reason || slot.notes || "",
                  notes: slot.notes || slot.reason || "",
                }));
                setBlockedSlots(mappedSlots);
              } else {
                setBlockedSlots([]);
              }
            } catch (availabilityError) {
              console.warn("Error fetching from availability endpoint:", availabilityError);
              setBlockedSlots([]);
            }
          }
        } catch (e) {
          console.error("Error fetching unavailable slots:", e);
          setBlockedSlots([]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, [userId, userType]);

  // Listen for preference updates from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `calendar_preferences_${userId}` && e.newValue) {
        try {
          const prefs = JSON.parse(e.newValue);
          // Only update if we have valid preferences
          if (prefs && prefs.start_time && prefs.end_time) {
            setWorkingHours({
              start_time: prefs.start_time,
              end_time: prefs.end_time,
              timezone: prefs.timezone || "America/New_York",
              slot_length: prefs.slot_length || 30,
              working_days: prefs.working_days || [1, 2, 3, 4, 5],
            });
          }
        } catch (error) {
          console.error("Error parsing preferences:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [userId]);

  const handleSavePreferences = async () => {
    if (!workingHours) {
      toast.error("Preferences not loaded yet");
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      // Clear ALL related caches BEFORE updating (ensures fresh data)
      // This prevents stale cache from being used
      const { clearCacheForEndpoint, clearCacheByPattern } = await import("../../utils/cache");
      clearCacheForEndpoint(`/api/users/${userId}/calendar-preferences`, { userType });
      clearCacheByPattern(`/api/users/${userId}/calendar-events`);
      clearCacheByPattern(`/api/users/${userId}/availability`);
      
      // Save to API first (API is source of truth)
      const updatedPrefs = await updateCalendarPreferences(userId, userType, workingHours);
      
      // Reload preferences from API to ensure we have the latest data (robust approach)
      // Cache is already cleared, so this will fetch fresh data
      const freshPrefs = await fetchCalendarPreferences(userId, userType);
      
      // Update local state with fresh API data
      setWorkingHours({
        start_time: freshPrefs.start_time,
        end_time: freshPrefs.end_time,
        timezone: freshPrefs.timezone,
        slot_length: freshPrefs.slot_length,
        working_days: freshPrefs.working_days,
      });
      
      // Save to localStorage for caching (use fresh data from API)
      const prefsKey = `calendar_preferences_${userId}`;
      localStorage.setItem(prefsKey, JSON.stringify(freshPrefs));
      
      // Trigger custom event for same-window updates (use fresh data)
      window.dispatchEvent(new CustomEvent("calendarPreferencesUpdated", { 
        detail: { userId, preferences: freshPrefs } 
      }));
      
      toast.success("Working hours updated successfully");
      onSave?.();
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage || "Failed to update preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlock = async () => {
    if (!newBlock.startDate) {
      toast.error("Please select a start date");
      return;
    }

    let startAt: string;
    let endAt: string;

    if (newBlock.isFullDay) {
      // Full day event - set to start and end of day
      const startDate = new Date(newBlock.startDate);
      startDate.setHours(0, 0, 0, 0);
      startAt = startDate.toISOString();

      const endDate = new Date(newBlock.startDate);
      endDate.setHours(23, 59, 59, 999);
      endAt = endDate.toISOString();
    } else {
      // Time-specific slot
      if (!newBlock.startTime || !newBlock.endTime) {
        toast.error("Please fill in start and end times");
        return;
      }
      startAt = new Date(`${newBlock.startDate}T${newBlock.startTime}`).toISOString();
      endAt = new Date(`${newBlock.startDate}T${newBlock.endTime}`).toISOString();

      if (new Date(endAt) <= new Date(startAt)) {
        toast.error("End time must be after start time");
        return;
      }
    }

    try {
      setLoading(true);
      const result = await addUnavailableSlot(userId, userType, {
        start_at: startAt,
        end_at: endAt,
        slot_type: newBlock.slotType,
        is_full_day: newBlock.isFullDay,
        reason: newBlock.reason || undefined,
        notes: newBlock.notes || undefined,
      });

      // Clear cache before refreshing to get fresh data
      const allCacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('api_cache_') && (
          key.includes('/availability') || 
          key.includes('/calendar-events')
        )
      );
      allCacheKeys.forEach(key => localStorage.removeItem(key));
      
      // Refresh blocked slots using calendar events (optimized date range)
      const now = new Date();
      const fromDate = new Date(now);
      fromDate.setMonth(now.getMonth() - 3);
      fromDate.setDate(1);
      fromDate.setHours(0, 0, 0, 0);
      
      const toDate = new Date(now);
      toDate.setMonth(now.getMonth() + 6);
      toDate.setDate(0);
      toDate.setHours(23, 59, 59, 999);
      
      const eventsData = await fetchCalendarEvents(
        userId,
        fromDate.toISOString(),
        toDate.toISOString()
      );
      
      if (eventsData && eventsData.availabilitySlots && Array.isArray(eventsData.availabilitySlots)) {
        const mappedSlots = eventsData.availabilitySlots.map((slot: any) => ({
          id: slot.slotId || slot.id || `slot-${slot.startAt || slot.start_at}`,
          startAt: slot.startAt || slot.start_at,
          endAt: slot.endAt || slot.end_at,
          slotType: slot.slotType || slot.slot_type || "unavailable",
          isFullDay: slot.isFullDay !== undefined ? slot.isFullDay : (slot.is_full_day || false),
          reason: slot.reason || slot.notes || "",
          notes: slot.notes || slot.reason || "",
        }));
        setBlockedSlots(mappedSlots);
      } else {
        setBlockedSlots([]);
      }

      setNewBlock({
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        slotType: "unavailable",
        isFullDay: false,
        reason: "",
        notes: "",
      });
      setShowBlockForm(false);
      toast.success("Time slot blocked successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to block time slot");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBlock = async (id: number | string) => {
    try {
      setLoading(true);
      if (typeof id === "number") {
        // Pass userType as required by the API endpoint
        await removeUnavailableSlot(userId, id, userType);
      }
      
      // Clear cache before refreshing to get fresh data
      const allCacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('api_cache_') && (
          key.includes('/availability') || 
          key.includes('/calendar-events')
        )
      );
      allCacheKeys.forEach(key => localStorage.removeItem(key));
      
      // Refresh blocked slots using calendar events (optimized date range)
      const now = new Date();
      const fromDate = new Date(now);
      fromDate.setMonth(now.getMonth() - 3);
      fromDate.setDate(1);
      fromDate.setHours(0, 0, 0, 0);
      
      const toDate = new Date(now);
      toDate.setMonth(now.getMonth() + 6);
      toDate.setDate(0);
      toDate.setHours(23, 59, 59, 999);
      
      const eventsData = await fetchCalendarEvents(
        userId,
        fromDate.toISOString(),
        toDate.toISOString()
      );
      
      if (eventsData && eventsData.availabilitySlots && Array.isArray(eventsData.availabilitySlots)) {
        const mappedSlots = eventsData.availabilitySlots.map((slot: any) => ({
          id: slot.slotId || slot.id || `slot-${slot.startAt || slot.start_at}`,
          startAt: slot.startAt || slot.start_at,
          endAt: slot.endAt || slot.end_at,
          slotType: slot.slotType || slot.slot_type || "unavailable",
          isFullDay: slot.isFullDay !== undefined ? slot.isFullDay : (slot.is_full_day || false),
          reason: slot.reason || slot.notes || "",
          notes: slot.notes || slot.reason || "",
        }));
        setBlockedSlots(mappedSlots);
      } else {
        setBlockedSlots([]);
      }

      toast.success("Block removed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove block");
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkingDay = (day: number) => {
    if (!workingHours) return;
    
    setWorkingHours({
      ...workingHours,
      working_days: workingHours.working_days.includes(day)
        ? workingHours.working_days.filter((d) => d !== day)
        : [...workingHours.working_days, day].sort(),
    });
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Don't render until preferences are loaded
  if (!workingHours) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Working Hours Configuration */}
      <Card className="bg-gradient-to-br from-white via-amber-50/30 to-white border-0 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        <CardHeader className="relative p-6 lg:p-8 border-b border-amber-100/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl blur-lg opacity-50" />
              <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-2xl shadow-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent">
                Working Hours
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">
                Configure your default working hours and availability
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time" className="text-sm font-semibold text-gray-700 mb-2 block">
                Start Time
              </Label>
              <Input
                id="start-time"
                type="time"
                value={workingHours.start_time}
                onChange={(e) =>
                  setWorkingHours({ ...workingHours, start_time: e.target.value })
                }
                className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="end-time" className="text-sm font-semibold text-gray-700 mb-2 block">
                End Time
              </Label>
              <Input
                id="end-time"
                type="time"
                value={workingHours.end_time}
                onChange={(e) =>
                  setWorkingHours({ ...workingHours, end_time: e.target.value })
                }
                className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone" className="text-sm font-semibold text-gray-700 mb-2 block">
                Timezone
              </Label>
              <Select
                value={workingHours.timezone}
                onValueChange={(value) =>
                  setWorkingHours({ ...workingHours, timezone: value })
                }
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
            <div>
              <Label htmlFor="slot-length" className="text-sm font-semibold text-gray-700 mb-2 block">
                Slot Length (minutes)
              </Label>
              <Select
                value={workingHours.slot_length.toString()}
                onValueChange={(value) =>
                  setWorkingHours({ ...workingHours, slot_length: parseInt(value) })
                }
              >
                <SelectTrigger className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">Working Days</Label>
            <div className="flex flex-wrap gap-3">
              {dayNames.map((day, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                    className={`flex items-center space-x-2 p-3 rounded-xl border-2 transition-all ${
                    workingHours?.working_days.includes(index)
                      ? "bg-gradient-to-br from-amber-100 to-amber-50 border-amber-400 shadow-md"
                      : "bg-white border-amber-200 hover:border-amber-300"
                  }`}
                >
                  <Checkbox
                    id={`day-${index}`}
                    checked={workingHours?.working_days.includes(index) || false}
                    onCheckedChange={() => toggleWorkingDay(index)}
                    className="border-amber-400 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                  />
                  <Label
                    htmlFor={`day-${index}`}
                    className={`text-sm font-medium cursor-pointer ${
                      workingHours?.working_days.includes(index)
                        ? "text-amber-900"
                        : "text-gray-600"
                    }`}
                  >
                    {day}
                  </Label>
                </motion.div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSavePreferences}
            disabled={loading}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all h-12 px-8 text-base font-semibold"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>

      {/* Blocked Time Slots */}
      <Card className="bg-gradient-to-br from-white via-amber-50/30 to-white border-0 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        <CardHeader className="relative p-6 lg:p-8 border-b border-amber-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl blur-lg opacity-50" />
                <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-2xl shadow-xl">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent">
                  Blocked Time Slots
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  Block specific time slots when you're unavailable
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setShowBlockForm(!showBlockForm)}
              variant="outline"
              className="border-amber-300 hover:bg-amber-50 hover:border-amber-400 shadow-md hover:shadow-lg transition-all h-12 px-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Block
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative p-6 lg:p-8 space-y-4">
          {showBlockForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-2xl border-2 border-amber-200 shadow-lg"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id="full-day"
                      checked={newBlock.isFullDay}
                      onCheckedChange={(checked) =>
                        setNewBlock({ ...newBlock, isFullDay: checked === true })
                      }
                      className="border-amber-400 data-[state=checked]:bg-amber-500"
                    />
                    <Label htmlFor="full-day" className="text-sm font-semibold text-gray-700 cursor-pointer">
                      Full Day Event (Holiday/Off Day)
                    </Label>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">Date</Label>
                  <Input
                    type="date"
                    value={newBlock.startDate}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, startDate: e.target.value })
                    }
                    className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
                  />
                </div>
                {!newBlock.isFullDay && (
                  <>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Start Time</Label>
                      <Input
                        type="time"
                        value={newBlock.startTime}
                        onChange={(e) =>
                          setNewBlock({ ...newBlock, startTime: e.target.value })
                        }
                        className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">End Time</Label>
                      <Input
                        type="time"
                        value={newBlock.endTime}
                        onChange={(e) =>
                          setNewBlock({ ...newBlock, endTime: e.target.value })
                        }
                        className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
                      />
                    </div>
                  </>
                )}
                <div className="sm:col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">Slot Type</Label>
                  <Select
                    value={newBlock.slotType}
                    onValueChange={(value: any) =>
                      setNewBlock({ ...newBlock, slotType: value })
                    }
                  >
                    <SelectTrigger className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="off_day">Off Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">Reason/Notes (optional)</Label>
                  <Textarea
                    value={newBlock.reason}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, reason: e.target.value })
                    }
                    placeholder="e.g., Personal appointment, Meeting, Christmas Day..."
                    className="mt-2 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={handleAddBlock} 
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg h-12 px-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Block
                </Button>
                <Button
                  onClick={() => {
                    setShowBlockForm(false);
                    setNewBlock({
                      startDate: "",
                      startTime: "",
                      endDate: "",
                      endTime: "",
                      slotType: "unavailable",
                      isFullDay: false,
                      reason: "",
                      notes: "",
                    });
                  }}
                  variant="outline"
                  className="border-amber-300 hover:bg-amber-50 hover:border-amber-400 h-12 px-6"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {blockedSlots.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex p-4 bg-amber-100 rounded-full mb-4">
                <Calendar className="h-12 w-12 text-amber-600" />
              </div>
              <p className="text-gray-500 font-medium text-base">No blocked time slots</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedSlots.map((slot, index) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-amber-50/50 rounded-xl border-2 border-amber-200 hover:border-amber-300 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {slot.slotType || "unavailable"}
                      </Badge>
                      {slot.isFullDay && (
                        <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800">
                          Full Day
                        </Badge>
                      )}
                    </div>
                    <div className="font-semibold text-base text-gray-900 mb-1">
                      {slot.isFullDay 
                        ? formatDate(slot.startAt)
                        : `${formatDate(slot.startAt)} ${formatTime(slot.startAt, true)} - ${formatTime(slot.endAt, true)}`
                      }
                    </div>
                    {(slot.reason || slot.notes) && (
                      <div className="text-sm text-amber-700 mt-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        {slot.reason || slot.notes}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBlock(slot.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
