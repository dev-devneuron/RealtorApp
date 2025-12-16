/**
 * Booking Calendar Component
 * 
 * Beautiful, modern calendar display for bookings with enhanced styling
 * Includes working hours visualization for PMs
 */

import { useMemo, useEffect, useState, useCallback, memo } from "react";
import { Calendar as BigCalendar, momentLocalizer, View, SlotInfo } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { formatTime, fetchCalendarEvents, fetchUnavailableSlots, fetchCalendarPreferences, formatCustomerTime, hasTimezoneInfo } from "./utils";
import { API_BASE } from "./constants";
import type { Booking } from "./types";
import "./BookingCalendar.css";

// Calendar preferences type (matches what we store in localStorage)
interface CalendarPreferences {
  start_time: string;
  end_time: string;
  timezone: string;
  slot_length: number;
  working_days: number[];
}

// Create localizer using moment
const localizer = momentLocalizer(moment);

interface BookingCalendarProps {
  bookings: Booking[];
  view: "day" | "week" | "month";
  date: Date;
  onViewChange: (view: "day" | "week" | "month") => void;
  onNavigate: (date: Date) => void;
  onSelectSlot?: (slotInfo: SlotInfo) => void;
  onSelectEvent?: (booking: Booking) => void;
  userId?: number;
  userType?: string;
}

// Enhanced event component with beautiful styling and better information density
// Memoized to prevent unnecessary re-renders
const EventComponent = memo(({ event }: { event: Booking }) => {
  const getStatusGradient = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 border-amber-800 shadow-amber-500/40";
      case "approved":
        return "bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 border-emerald-800 shadow-emerald-500/40";
      case "denied":
        return "bg-gradient-to-br from-red-500 via-red-600 to-red-700 border-red-800 shadow-red-500/40";
      case "cancelled":
        return "bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 border-gray-800 shadow-gray-500/40";
      case "rescheduled":
        return "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 border-blue-800 shadow-blue-500/40";
      default:
        return "bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 border-gray-800 shadow-gray-500/40";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "approved":
        return "✅";
      case "denied":
        return "❌";
      case "cancelled":
        return "🚫";
      case "rescheduled":
        return "🔄";
      default:
        return "📅";
    }
  };

  // Display the time that was used for calendar positioning (customer-sent time if available)
  // This ensures the displayed time matches where the booking appears on the calendar
  const displayStartTime = event.customerSentStartAt || event.startAt;
  const displayEndTime = event.customerSentEndAt || event.endAt;
  const startTime = formatTime(displayStartTime);
  const endTime = formatTime(displayEndTime);

  return (
    <div className={`${getStatusGradient(event.status)} text-white p-2.5 sm:p-3 rounded-2xl shadow-2xl border-l-[4px] hover:shadow-3xl hover:scale-[1.03] transition-all duration-400 cursor-pointer group relative overflow-hidden backdrop-blur-md`} style={{
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2), 0 5px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
    }}>
      {/* Animated shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500" />
      
      {/* Glow effect on hover */}
      <div className="absolute -inset-2 bg-gradient-to-r from-white/30 via-white/20 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-400" />
      
      {/* Top accent line with gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      
      {/* Status indicator dot */}
      <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-white rounded-full animate-pulse opacity-90 shadow-lg ring-2 ring-white/50" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-xs sm:text-sm leading-tight truncate mb-1 flex items-center gap-2">
              <span className="text-base sm:text-lg drop-shadow-lg filter drop-shadow-md">{getStatusIcon(event.status)}</span>
              <span className="truncate drop-shadow-md font-bold">{event.visitor.name}</span>
              {/* Call record indicator */}
              {event.callRecord && (event.callRecord.callRecordingUrl || event.callRecord.callTranscript) && (
                <span className="text-xs opacity-90" title="Has call recording/transcript">📞</span>
              )}
            </div>
            <div className="text-[10px] sm:text-xs opacity-95 truncate font-semibold mb-1.5 flex items-center gap-1.5 pl-1">
              <span className="opacity-90 text-xs filter drop-shadow-sm">📍</span>
              <span className="truncate drop-shadow-sm">{event.propertyAddress || `Property #${event.propertyId}`}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/40">
          <div className="text-[10px] sm:text-xs opacity-95 flex items-center gap-1.5 font-bold">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 drop-shadow-md flex-shrink-0" />
            <span className="drop-shadow-md">{startTime}</span>
            {startTime !== endTime && (
              <>
                <span className="opacity-70">-</span>
                <span className="drop-shadow-md">{endTime}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
    </div>
  );
});
EventComponent.displayName = "EventComponent";

export const BookingCalendar = ({
  bookings,
  view,
  date,
  onViewChange,
  onNavigate,
  onSelectSlot,
  onSelectEvent,
  userId,
  userType,
}: BookingCalendarProps) => {
  const [calendarPreferences, setCalendarPreferences] = useState<CalendarPreferences | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Throttle resize handler for better performance
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 150); // Throttle to 150ms
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // ⚠️ CRITICAL: Always fetch preferences from API first - don't use localStorage or hardcoded defaults
  // According to documentation: "Always fetch preferences on component mount - Don't use hardcoded defaults"
  // "Preferences persist across sessions - Always fetch from API, don't assume defaults"
  const loadPreferences = async () => {
    if (!userId || !userType) return;

    try {
      // Always fetch from API first (fetchCalendarPreferences already handles defaults if API fails)
      const prefs = await fetchCalendarPreferences(userId, userType);
      
      // Use the fetched preferences (they already have defaults if API fails)
      setCalendarPreferences({
        start_time: prefs.start_time,
        end_time: prefs.end_time,
        timezone: prefs.timezone,
        slot_length: prefs.slot_length,
        working_days: prefs.working_days,
      });
      
      // Save to localStorage for caching (but API is source of truth)
      localStorage.setItem(`calendar_preferences_${userId}`, JSON.stringify(prefs));
    } catch (error) {
      console.error("Error fetching calendar preferences:", error);
      // Only use defaults if fetch completely fails
      const defaults = {
        start_time: "09:00",
        end_time: "17:00",
        timezone: "America/New_York",
        slot_length: 30,
        working_days: [1, 2, 3, 4, 5],
      };
      setCalendarPreferences(defaults);
    }
  };

  // Load preferences on mount and when userId/userType changes
  // ⚠️ CRITICAL: Always fetch from API, not localStorage
  useEffect(() => {
    if (userId && userType) {
      loadPreferences();
    }
  }, [userId, userType]);

  // Listen for preference updates from AvailabilityManager
  useEffect(() => {
    const handlePreferenceUpdate = async (e: CustomEvent) => {
      if (e.detail?.userId === userId) {
        // Clear cache first to ensure fresh data
        const { clearCacheForEndpoint, clearCacheByPattern } = await import("../../utils/cache");
        clearCacheForEndpoint(`/api/users/${userId}/calendar-preferences`, { userType: userType || "" });
        clearCacheByPattern(`/api/users/${userId}/calendar-events`);
        
        // Reload preferences from API to ensure we have the latest data
        try {
          const prefs = await fetchCalendarPreferences(userId, userType || "");
          setCalendarPreferences({
            start_time: prefs.start_time,
            end_time: prefs.end_time,
            timezone: prefs.timezone,
            slot_length: prefs.slot_length,
            working_days: prefs.working_days,
          });
          
          // Clear ALL calendar events cache to force fresh fetch
          clearCacheByPattern(`/api/users/${userId}/calendar-events`);
          
          // Force re-fetch calendar events by clearing state
          // The useEffect with calendarPreferences dependency will trigger a re-fetch
          setAvailabilitySlots([]);
        } catch (error) {
          // Fallback to event data if API fails
          if (e.detail?.preferences) {
            setCalendarPreferences(e.detail.preferences);
          }
        }
      }
    };

    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === `calendar_preferences_${userId}` && e.newValue) {
        try {
          // Clear cache first to ensure fresh data
          const { clearCacheForEndpoint, clearCacheByPattern } = await import("../../utils/cache");
          clearCacheForEndpoint(`/api/users/${userId}/calendar-preferences`, { userType: userType || "" });
          clearCacheByPattern(`/api/users/${userId}/calendar-events`);
          
          // Reload from API to ensure consistency
          const prefs = await fetchCalendarPreferences(userId, userType || "");
          setCalendarPreferences({
            start_time: prefs.start_time,
            end_time: prefs.end_time,
            timezone: prefs.timezone,
            slot_length: prefs.slot_length,
            working_days: prefs.working_days,
          });
          
          // Clear calendar events cache and force re-fetch
          clearCacheByPattern(`/api/users/${userId}/calendar-events`);
          setAvailabilitySlots([]);
        } catch (error) {
          // Fallback to localStorage if API fails
          try {
            const prefs = JSON.parse(e.newValue);
            setCalendarPreferences({
              start_time: prefs.start_time || "09:00",
              end_time: prefs.end_time || "17:00",
              timezone: prefs.timezone || "America/New_York",
              slot_length: prefs.slot_length || 30,
              working_days: prefs.working_days || [1, 2, 3, 4, 5],
            });
          } catch (parseError) {
            console.error("Error parsing preferences:", parseError);
          }
        }
      }
    };

    // Listen for custom event (same window)
    window.addEventListener("calendarPreferencesUpdated", handlePreferenceUpdate as EventListener);
    // Listen for storage event (cross-tab)
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("calendarPreferencesUpdated", handlePreferenceUpdate as EventListener);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [userId, userType]);

  const [availabilitySlots, setAvailabilitySlots] = useState<Array<{
    id: number | string;
    startAt: string;
    endAt: string;
    slotType?: string;
    isFullDay?: boolean;
    reason?: string;
  }>>([]);

  // Fetch calendar events (bookings + availability slots) when view, date, or preferences change
  useEffect(() => {
    const loadCalendarEvents = async () => {
      if (!userId || !userType) return;

      try {
        // Calculate date range based on current view
        // Add buffer days to ensure slots are visible when navigating
        let fromDate: Date;
        let toDate: Date;

        if (view === "day") {
          // Add 1 day buffer on each side for day view
          fromDate = moment(date).subtract(1, 'day').startOf("day").toDate();
          toDate = moment(date).add(1, 'day').endOf("day").toDate();
        } else if (view === "week") {
          // For week view, use the actual week range (no buffer needed for blocked slots)
          // Buffer was causing issues - use exact week range
          fromDate = moment(date).startOf("week").toDate();
          toDate = moment(date).endOf("week").toDate();
        } else if (view === "month") {
          // Add 1 week buffer on each side for month view
          fromDate = moment(date).subtract(1, 'week').startOf("month").toDate();
          toDate = moment(date).add(1, 'week').endOf("month").toDate();
        } else {
          return; // List view doesn't need calendar events
        }

        // Only clear cache if preferences changed - otherwise use cached data
        // Cache is already managed by fetchCalendarEvents function

        // Try to fetch from calendar events endpoint
        try {
          const eventsData = await fetchCalendarEvents(
            userId,
            fromDate.toISOString(),
            toDate.toISOString()
          );
          
          // Update availability slots from calendar events
          if (eventsData && eventsData.availabilitySlots) {
            setAvailabilitySlots(eventsData.availabilitySlots.map((slot: any) => ({
              id: slot.slotId || slot.id || `slot-${slot.startAt || slot.start_at}`,
              startAt: slot.startAt || slot.start_at,
              endAt: slot.endAt || slot.end_at,
              slotType: slot.slotType || slot.slot_type || "unavailable",
              isFullDay: slot.isFullDay !== undefined ? slot.isFullDay : (slot.is_full_day || false),
              reason: slot.notes || slot.reason,
            })));
          } else {
            setAvailabilitySlots([]);
          }
        } catch (error) {
          // Fallback: fetch unavailable slots directly
          console.warn("Failed to fetch calendar events, trying unavailable slots:", error);
          try {
            const slots = await fetchUnavailableSlots(
              userId,
              userType,
              fromDate.toISOString(),
              toDate.toISOString()
            );
            if (slots && Array.isArray(slots)) {
              setAvailabilitySlots(slots.map(slot => ({
                id: slot.id,
                startAt: slot.startAt,
                endAt: slot.endAt,
                slotType: slot.slotType,
                isFullDay: slot.isFullDay,
                reason: slot.reason || slot.notes,
              })));
            } else {
              setAvailabilitySlots([]);
            }
          } catch (e) {
            console.error("Error fetching unavailable slots:", e);
            // Don't crash - just leave availability slots empty
            setAvailabilitySlots([]);
          }
        }
      } catch (error) {
        console.error("Error loading calendar events:", error);
        // Don't crash - just leave availability slots empty
        setAvailabilitySlots([]);
      }
    };

    if (view !== "list" && view !== "stats" && view !== "availability") {
      loadCalendarEvents();
    } else {
      // Clear availability slots when not in calendar view
      setAvailabilitySlots([]);
    }
  }, [userId, userType, view, date, calendarPreferences]); // Added calendarPreferences as dependency to re-fetch when preferences change

  // Convert bookings to calendar events - CRITICAL: Only show bookings with customer-sent times
  // ABSOLUTELY NO UTC TIMES - If a booking doesn't have customer-sent times, it doesn't appear
  const bookingEvents = useMemo(() => {
    // DEBUG: Log what we're receiving
    console.log(`[BookingCalendar] INPUT: Received ${bookings.length} bookings`);
    
    // STEP 0: FIRST - Deduplicate by bookingId, ALWAYS preferring the one with customerSentStartAt
    // This prevents showing the same booking twice (once with customerSentStartAt, once without)
    const deduplicatedBookingsMap = new Map<number, Booking>();
    bookings.forEach((booking) => {
      if (!booking.bookingId) {
        console.warn(`[BookingCalendar] Skipping booking without bookingId:`, booking);
        return;
      }
      
      const existing = deduplicatedBookingsMap.get(booking.bookingId);
      const hasCustomerSent = !!(booking.customerSentStartAt && booking.customerSentEndAt);
      const existingHasCustomerSent = !!(existing?.customerSentStartAt && existing?.customerSentEndAt);
      
      // Always prefer the booking with customerSentStartAt
      if (!existing) {
        deduplicatedBookingsMap.set(booking.bookingId, booking);
      } else if (hasCustomerSent && !existingHasCustomerSent) {
        // New one has customerSentStartAt, existing doesn't - replace
        console.log(`[BookingCalendar] Replacing booking ${booking.bookingId} - new one has customerSentStartAt`);
        deduplicatedBookingsMap.set(booking.bookingId, booking);
      } else if (!hasCustomerSent && existingHasCustomerSent) {
        // Existing has customerSentStartAt, new one doesn't - keep existing
        console.log(`[BookingCalendar] Keeping existing booking ${booking.bookingId} - it has customerSentStartAt`);
      } else if (hasCustomerSent && existingHasCustomerSent) {
        // Both have customerSentStartAt - keep the existing one (first occurrence)
        console.log(`[BookingCalendar] Keeping first occurrence of booking ${booking.bookingId} (both have customerSentStartAt)`);
      } else {
        // Neither has customerSentStartAt - keep existing (first occurrence)
        console.log(`[BookingCalendar] Keeping first occurrence of booking ${booking.bookingId} (neither has customerSentStartAt - will be filtered out)`);
      }
    });
    
    const deduplicatedBookings = Array.from(deduplicatedBookingsMap.values());
    console.log(`[BookingCalendar] After initial deduplication: ${bookings.length} → ${deduplicatedBookings.length} unique bookings`);
    
    const bookingsWithoutCustomerSent = deduplicatedBookings.filter(b => !b.customerSentStartAt || !b.customerSentEndAt);
    if (bookingsWithoutCustomerSent.length > 0) {
      console.warn(`[BookingCalendar] WARNING: Found ${bookingsWithoutCustomerSent.length} bookings WITHOUT customerSentStartAt:`, bookingsWithoutCustomerSent.map(b => ({ id: b.bookingId, startAt: b.startAt })));
    }
    
    // FILTER: Only keep bookings that have customer-sent times
    // We will use customerSentStartAt for display, regardless of whether it matches startAt
    // The key is: if customerSentStartAt exists, use it. If not, don't show the booking.
    const validBookings = deduplicatedBookings.filter((booking) => {
      // STEP 1: Must have both customer-sent times - if not, REJECT IMMEDIATELY
      if (!booking.customerSentStartAt || !booking.customerSentEndAt) {
        console.log(`[BookingCalendar] Rejecting booking ${booking.bookingId}: missing customer-sent times`);
        return false;
      }
      
      const customerStart = String(booking.customerSentStartAt).trim();
      const customerEnd = String(booking.customerSentEndAt).trim();
      
      // STEP 2: Must not be empty - if empty, REJECT
      if (customerStart === "" || customerEnd === "") {
        console.log(`[BookingCalendar] Rejecting booking ${booking.bookingId}: empty customer-sent times`);
        return false;
      }
      
      // STEP 3: Must be parseable as dates - if not, REJECT
      const customerStartDate = new Date(customerStart);
      const customerEndDate = new Date(customerEnd);
      if (isNaN(customerStartDate.getTime()) || isNaN(customerEndDate.getTime())) {
        console.log(`[BookingCalendar] Rejecting booking ${booking.bookingId}: invalid date format`);
        return false;
      }
      
      // STEP 4: REJECT bookings that ONLY have UTC times (no customer-sent times)
      // But if customerSentStartAt exists and is valid, we KEEP it and use it for display
      // We don't care if it matches startAt - we just use customerSentStartAt for the calendar position
      
      console.log(`[BookingCalendar] ACCEPTING booking ${booking.bookingId}: has valid customerSentStartAt="${customerStart}" - will use for calendar display`);
      return true;
    });
    
    console.log(`[BookingCalendar] STRICT FILTER: ${bookings.length} total → ${validBookings.length} with valid customer-sent times`);
    
    // If no valid bookings, return empty array immediately
    if (validBookings.length === 0) {
      console.log(`[BookingCalendar] No bookings with valid customer-sent times - returning empty array`);
      return [];
    }
    
    // Step 1: Deduplicate by bookingId (keep first occurrence)
    const uniqueBookingsMap = new Map<number, Booking>();
    validBookings.forEach((booking) => {
      if (!booking.bookingId || typeof booking.bookingId !== 'number') {
        console.warn(`[BookingCalendar] Skipping booking with invalid ID:`, booking);
        return;
      }
      
      // If we already have this bookingId, skip it (keep first occurrence)
      if (!uniqueBookingsMap.has(booking.bookingId)) {
        uniqueBookingsMap.set(booking.bookingId, booking);
      } else {
        console.log(`[BookingCalendar] Skipping duplicate booking ID: ${booking.bookingId}`);
      }
    });
    
    const uniqueBookings = Array.from(uniqueBookingsMap.values());
    console.log(`[BookingCalendar] After deduplication: ${uniqueBookings.length} unique bookings`);

    // Step 2: Convert to calendar events using ONLY customer-sent times
    // NEVER use startAt/endAt - only customerSentStartAt/customerSentEndAt
    // CRITICAL: Parse customerSentStartAt in the booking's timezone, not browser's local timezone
    const events = uniqueBookings.map((booking) => {
      // CRITICAL: Use ONLY customer-sent times - NEVER use startAt/endAt
      // We've already validated these exist and are valid above
      const startTimeString = String(booking.customerSentStartAt).trim();
      const endTimeString = String(booking.customerSentEndAt).trim();
      const bookingTimezone = booking.timezone || "UTC";

      // CRITICAL: Parse customerSentStartAt in the booking's timezone
      // If it has timezone info, parse directly. Otherwise, interpret it in booking.timezone
      let startDate: Date;
      let endDate: Date;
      
      if (hasTimezoneInfo(startTimeString)) {
        // Has timezone info - parse directly
        startDate = new Date(startTimeString);
      } else if (bookingTimezone && bookingTimezone !== "UTC") {
        // No timezone info - interpret as being in the booking's timezone
        // Use formatCustomerTime to get the UTC date
        const startTimeData = formatCustomerTime(startTimeString, bookingTimezone);
        startDate = startTimeData.utcDate;
      } else {
        // No timezone info and no booking timezone - treat as UTC
        startDate = new Date(startTimeString + "Z");
      }
      
      if (hasTimezoneInfo(endTimeString)) {
        endDate = new Date(endTimeString);
      } else if (bookingTimezone && bookingTimezone !== "UTC") {
        const endTimeData = formatCustomerTime(endTimeString, bookingTimezone);
        endDate = endTimeData.utcDate;
      } else {
        endDate = new Date(endTimeString + "Z");
      }

      // Final validation - if this fails, something is very wrong
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error(`[BookingCalendar] CRITICAL: Invalid dates for booking ${booking.bookingId} after filtering:`, {
          customerSentStartAt: startTimeString,
          customerSentEndAt: endTimeString,
          startAt: booking.startAt,
          endAt: booking.endAt,
        });
        return null;
      }
      
      // CRITICAL: Log the dates being used to verify we're using customerSentStartAt
      console.log(`[BookingCalendar] Creating event for booking ${booking.bookingId}: using customerSentStartAt="${startTimeString}" -> startDate=${startDate.toISOString()}, startAt="${booking.startAt}" -> would be ${booking.startAt ? new Date(booking.startAt).toISOString() : 'N/A'}`);
      
      // ABSOLUTE SAFETY CHECK: Ensure we're not accidentally using UTC times
      // If the event start date matches startAt (UTC), something is wrong
      if (booking.startAt) {
        const utcStart = new Date(String(booking.startAt).trim());
        if (!isNaN(utcStart.getTime())) {
          const timeDiff = Math.abs(startDate.getTime() - utcStart.getTime());
          // If they're the same (within 1 second), we're accidentally using UTC - REJECT
          if (timeDiff < 1000) {
            console.error(`[BookingCalendar] CRITICAL: Booking ${booking.bookingId} - event date matches UTC startAt! Rejecting. customerSentStartAt="${startTimeString}" -> ${startDate.toISOString()}, startAt="${booking.startAt}" -> ${utcStart.toISOString()}`);
            return null;
          }
        }
      }

      return {
        id: `booking-${booking.bookingId}`, // CRITICAL: Unique ID for react-big-calendar
        ...booking,
        title: `${booking.visitor.name} - ${booking.propertyAddress || `Property #${booking.propertyId}`}`,
        start: startDate,
        end: endDate,
        resource: booking, // Store full booking object in resource
        bookingId: booking.bookingId, // Also store bookingId directly for easier access
      };
    }).filter((event) => event !== null) as Array<{
      bookingId: number;
      title: string;
      start: Date;
      end: Date;
      resource: Booking;
      [key: string]: any;
    }>;

    // Step 4: Final deduplication pass - ensure no duplicate events by bookingId
    // This is a safety net to catch any edge cases
    const finalEventsMap = new Map<number, typeof events[0]>();
    const duplicateEvents: number[] = [];
    
    events.forEach((event) => {
      if (event && event.bookingId) {
        // If we already have an event for this bookingId, keep the first one
        // (they should be identical at this point, but this ensures no duplicates)
        if (!finalEventsMap.has(event.bookingId)) {
          finalEventsMap.set(event.bookingId, event);
        } else {
          duplicateEvents.push(event.bookingId);
          console.warn(`[BookingCalendar] Duplicate event detected for booking ${event.bookingId}, keeping first occurrence`);
        }
      }
    });

    if (duplicateEvents.length > 0) {
      console.warn(`[BookingCalendar] Removed ${duplicateEvents.length} duplicate events:`, duplicateEvents);
    }

    const finalEvents = Array.from(finalEventsMap.values());
    console.log(`[BookingCalendar] FINAL SUMMARY: ${bookings.length} total bookings → ${validBookings.length} passed filter → ${uniqueBookings.length} after dedup → ${events.length} events created → ${finalEvents.length} final events displayed`);
    
    // CRITICAL FINAL CHECK: Log any events that might be using UTC times
    finalEvents.forEach((event) => {
      if (event.resource?.startAt && event.resource?.customerSentStartAt) {
        const utcTime = new Date(String(event.resource.startAt).trim()).getTime();
        const customerTime = event.start.getTime();
        if (Math.abs(utcTime - customerTime) < 1000) {
          console.error(`[BookingCalendar] WARNING: Event for booking ${event.bookingId} appears to be using UTC time!`, {
            eventStart: event.start,
            customerSentStartAt: event.resource.customerSentStartAt,
            startAt: event.resource.startAt,
          });
        }
      }
    });
    
    return finalEvents;
  }, [bookings]);

  // Convert availability slots to calendar events
  const availabilityEvents = useMemo(() => {
    return availabilitySlots.map((slot) => ({
      id: `availability-${slot.id}`,
      title: slot.isFullDay 
        ? `${slot.slotType === "holiday" ? "Holiday" : slot.slotType === "off_day" ? "Off Day" : slot.slotType || "Unavailable"}: ${slot.reason || ""}`
        : `${slot.slotType || "Unavailable"}: ${slot.reason || ""}`,
      start: new Date(slot.startAt),
      end: new Date(slot.endAt),
      resource: { type: "availability", ...slot },
      allDay: slot.isFullDay || false,
    }));
  }, [availabilitySlots]);

  // Generate working hours events for day/week views - DISABLED (not displayed)
  const workingHoursEvents = useMemo(() => {
    // Don't display working hours events - they were causing visual clutter
      return [];
  }, []);

  // Combine bookings, working hours, and availability slots
  // CRITICAL FINAL FILTER: Remove ALL UTC-based events and ensure no duplicates
  const allEvents = useMemo(() => {
    // Step 1: Filter bookingEvents one more time to remove any UTC-based events
    const filteredBookingEvents = bookingEvents.filter((event) => {
      if (!event.resource || !event.bookingId) {
        return false;
      }
      
      const booking = event.resource as Booking;
      
      // CRITICAL: Must have customerSentStartAt - if not, this is a UTC-only booking - REJECT
      if (!booking.customerSentStartAt || !booking.customerSentEndAt) {
        console.error(`[BookingCalendar] FINAL FILTER: Rejecting booking ${event.bookingId} - missing customerSentStartAt`);
        return false;
      }
      
      // CRITICAL: Verify event is positioned using customerSentStartAt, not startAt
      const customerStartTime = new Date(String(booking.customerSentStartAt).trim()).getTime();
      const eventStartTime = event.start.getTime();
      const timeDiffFromCustomer = Math.abs(eventStartTime - customerStartTime);
      
      // Event should be positioned at customerSentStartAt (within reasonable tolerance)
      // Allow up to 1 hour difference to account for timezone parsing differences
      if (timeDiffFromCustomer > 3600000) { // 1 hour in milliseconds
        console.error(`[BookingCalendar] FINAL FILTER: Rejecting booking ${event.bookingId} - event not positioned at customerSentStartAt (diff: ${timeDiffFromCustomer}ms)`);
        return false;
      }
      
      // If booking has startAt, verify event is NOT positioned at startAt (UTC)
      if (booking.startAt) {
        const utcStartTime = new Date(String(booking.startAt).trim()).getTime();
        const timeDiffFromUtc = Math.abs(eventStartTime - utcStartTime);
        
        // If event is closer to UTC than customer time, it's wrong - REJECT
        if (timeDiffFromUtc < timeDiffFromCustomer && timeDiffFromUtc < 1000) {
          console.error(`[BookingCalendar] FINAL FILTER: Rejecting booking ${event.bookingId} - event positioned at UTC time (${timeDiffFromUtc}ms) instead of customer time (${timeDiffFromCustomer}ms)`);
          return false;
        }
      }
      
      return true;
    });
    
    console.log(`[BookingCalendar] FINAL FILTER: ${bookingEvents.length} booking events → ${filteredBookingEvents.length} after UTC removal`);
    
    // Step 2: Combine all events
    const combined = [...filteredBookingEvents, ...workingHoursEvents, ...availabilityEvents];
    
    // Step 3: Final deduplication by unique ID and bookingId
    const seenIds = new Set<string>();
    const seenBookingIds = new Set<number>();
    const deduplicated: typeof combined = [];
    
    combined.forEach((event) => {
      // Use event.id if available, otherwise create one
      const eventId = event.id || (event.bookingId ? `booking-${event.bookingId}` : `event-${Math.random()}`);
      
      // Check by unique ID first
      if (seenIds.has(eventId)) {
        console.warn(`[BookingCalendar] Duplicate event ID detected: ${eventId}, removing`);
        return;
      }
      
      // For booking events, also check by bookingId
      if (event.bookingId && typeof event.bookingId === 'number') {
        if (seenBookingIds.has(event.bookingId)) {
          console.warn(`[BookingCalendar] Duplicate booking ID detected: ${event.bookingId}, removing`);
          return;
        }
        seenBookingIds.add(event.bookingId);
      }
      
      seenIds.add(eventId);
      deduplicated.push(event);
    });
    
    console.log(`[BookingCalendar] FINAL: ${combined.length} combined events → ${deduplicated.length} after deduplication`);
    
    return deduplicated;
  }, [bookingEvents, workingHoursEvents, availabilityEvents]);

  // Enhanced custom toolbar with beautiful design
  const CustomToolbar = ({ label, onNavigate: nav, onView }: any) => {
    return (
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 p-6 bg-gradient-to-br from-white via-amber-50/40 to-blue-50/30 rounded-3xl border-2 border-amber-200/50 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-200/20 to-blue-200/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200/20 to-amber-200/20 rounded-full blur-2xl -ml-24 -mb-24" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity" />
            <div className="relative p-4 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all group-hover:scale-105">
              <CalendarIcon className="h-7 w-7 text-white drop-shadow-lg" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-amber-700 via-amber-800 via-blue-700 to-indigo-800 bg-clip-text text-transparent tracking-tight">
              {label}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">View and manage your bookings with ease</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap relative z-10">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border-2 border-amber-200/60 shadow-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={() => nav("PREV")}
              className="h-10 w-10 p-0 rounded-xl border-amber-300/60 hover:bg-gradient-to-br hover:from-amber-50 hover:to-amber-100 hover:border-amber-400 shadow-sm transition-all hover:scale-110 active:scale-95"
          >
              <ChevronLeft className="h-5 w-5 text-amber-700" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => nav("TODAY")}
              className="h-10 px-5 rounded-xl border-amber-300/60 hover:bg-gradient-to-br hover:from-amber-50 hover:to-amber-100 hover:border-amber-400 shadow-sm font-semibold transition-all hover:scale-105 active:scale-95 text-amber-800"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => nav("NEXT")}
              className="h-10 w-10 p-0 rounded-xl border-amber-300/60 hover:bg-gradient-to-br hover:from-amber-50 hover:to-amber-100 hover:border-amber-400 shadow-sm transition-all hover:scale-110 active:scale-95"
          >
              <ChevronRight className="h-5 w-5 text-amber-700" />
          </Button>
        </div>

          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border-2 border-amber-200/60 shadow-lg">
          <Button
            variant={view === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => onView("day")}
              className={`h-10 px-5 rounded-xl font-bold transition-all ${
              view === "day" 
                  ? "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 border-2 border-amber-400/50" 
                  : "hover:bg-gradient-to-br hover:from-amber-50 hover:to-amber-100 text-gray-700 hover:text-amber-800"
            }`}
          >
            Day
          </Button>
          <Button
            variant={view === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => onView("week")}
              className={`h-10 px-5 rounded-xl font-bold transition-all ${
              view === "week" 
                  ? "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 border-2 border-amber-400/50" 
                  : "hover:bg-gradient-to-br hover:from-amber-50 hover:to-amber-100 text-gray-700 hover:text-amber-800"
            }`}
          >
            Week
          </Button>
          <Button
            variant={view === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => onView("month")}
              className={`h-10 px-5 rounded-xl font-bold transition-all ${
              view === "month" 
                  ? "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 border-2 border-amber-400/50" 
                  : "hover:bg-gradient-to-br hover:from-amber-50 hover:to-amber-100 text-gray-700 hover:text-amber-800"
            }`}
          >
            Month
          </Button>
          </div>
        </div>
      </div>
    );
  };

  // Custom day component for month view to make whole day clickable
  const CustomDay = ({ date, ...props }: any) => {
    const dayBookings = bookings.filter((booking) => {
      const bookingDate = moment(booking.startAt);
      return bookingDate.isSame(date, "day");
    });

    return (
      <div
        className="rbc-day-bg h-full w-full cursor-pointer hover:bg-amber-50/50 transition-colors"
        onClick={() => {
          onNavigate(date);
          onViewChange("day");
        }}
        {...props}
      >
        {props.children}
      </div>
    );
  };

  // Enhanced event style getter with gradients
  const eventStyleGetter = (event: any) => {
    // Working hours styling
    if (event.resource?.type === "working-hours") {
      return {
        style: {
          backgroundColor: "rgba(251, 191, 36, 0.1)",
          border: "2px dashed #fbbf24",
          borderRadius: "4px",
          color: "#92400e",
          padding: "2px 4px",
          fontWeight: "500",
          opacity: 0.7,
        },
      };
    }

    // Availability slot styling
    if (event.resource?.type === "availability") {
      const slotType = event.resource.slotType || "unavailable";
      const isFullDay = event.resource.isFullDay;
      
      if (slotType === "holiday") {
        return {
          style: {
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "2px solid #ef4444",
            color: "#991b1b",
            opacity: 0.8,
            borderRadius: "4px",
            padding: "2px 4px",
            fontWeight: "500",
          },
        };
      }
      if (slotType === "off_day") {
        return {
          style: {
            backgroundColor: "rgba(168, 85, 247, 0.15)",
            border: "2px solid #a855f7",
            color: "#6b21a8",
            opacity: 0.8,
            borderRadius: "4px",
            padding: "2px 4px",
            fontWeight: "500",
          },
        };
      }
      if (slotType === "busy") {
        return {
          style: {
            backgroundColor: "rgba(249, 115, 22, 0.15)",
            border: "2px dashed #f97316",
            color: "#9a3412",
            opacity: 0.7,
            borderRadius: "4px",
            padding: "2px 4px",
            fontWeight: "500",
          },
        };
      }
      // unavailable, personal - Make them clearly visible with red background
      return {
        style: {
          backgroundColor: "rgba(239, 68, 68, 0.25)", // Red background for better visibility
          border: "2px solid #ef4444", // Red border
          color: "#7f1d1d", // Dark red text
          opacity: 0.95, // More opaque for better visibility
          borderRadius: "6px",
          padding: "4px 8px",
          fontWeight: "700", // Bolder text
          boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)", // Red shadow
        },
      };
    }

    // Booking styling
    const status = event.resource?.status || "pending";
    let backgroundColor = "#fbbf24"; // amber for pending
    let borderColor = "#f59e0b";
    
    switch (status) {
      case "approved":
        backgroundColor = "#10b981"; // emerald
        borderColor = "#059669";
        break;
      case "denied":
        backgroundColor = "#ef4444"; // red
        borderColor = "#dc2626";
        break;
      case "cancelled":
        backgroundColor = "#6b7280"; // gray
        borderColor = "#4b5563";
        break;
      case "rescheduled":
        backgroundColor = "#3b82f6"; // blue
        borderColor = "#2563eb";
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "8px",
        opacity: 0.95,
        color: "white",
        border: `2px solid ${borderColor}`,
        display: "block",
        padding: "4px 8px",
        fontWeight: "500",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      },
    };
  };

  // Custom event component that handles working hours and availability slots differently
  const CustomEventComponent = ({ event }: { event: any }) => {
    if (event.resource?.type === "working-hours") {
      const timeRange = event.title?.replace("Working Hours: ", "") || "";
      return (
        <div className="flex items-center gap-1 text-xs text-amber-700 font-medium px-1">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{timeRange || "Working Hours"}</span>
        </div>
      );
    }
    if (event.resource?.type === "availability") {
      const slotType = event.resource.slotType || "unavailable";
      const isFullDay = event.resource.isFullDay;
      // Make all blocked/unavailable slots show with red background for better visibility
      const bgColor = slotType === "holiday" ? "bg-red-200" 
        : slotType === "off_day" ? "bg-purple-200"
        : slotType === "busy" ? "bg-orange-200"
        : slotType === "unavailable" ? "bg-red-200" // Red background for unavailable slots
        : slotType === "personal" ? "bg-pink-200"
        : "bg-red-200"; // Default to red for any other blocked slots
      const textColor = slotType === "holiday" ? "text-red-900"
        : slotType === "off_day" ? "text-purple-900"
        : slotType === "busy" ? "text-orange-900"
        : slotType === "unavailable" ? "text-red-900" // Dark red text for unavailable slots
        : slotType === "personal" ? "text-pink-900"
        : "text-red-900"; // Default to dark red text
      
      return (
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 ${bgColor} ${textColor} rounded-md border-2 border-red-300 shadow-sm`}>
          <span className="truncate">{isFullDay ? event.title : event.title.split(":")[0]}</span>
        </div>
      );
    }
    return <EventComponent event={event.resource} />;
  };

  // Calculate min/max times - 16-hour day view (6 AM - 10 PM)
  const minTime = useMemo(() => {
    // Always show 6 AM to 10 PM (16 hours) for day and week views
    if (view === "day" || view === "week") {
      return new Date(2024, 0, 1, 6, 0); // 6:00 AM
    }
    return new Date(2024, 0, 1, 6, 0);
  }, [view]);

  const maxTime = useMemo(() => {
    // Always show 6 AM to 10 PM (16 hours) for day and week views
    if (view === "day" || view === "week") {
      return new Date(2024, 0, 1, 22, 0); // 10:00 PM
    }
    return new Date(2024, 0, 1, 22, 0);
  }, [view]);

  return (
    <Card className="bg-gradient-to-br from-white via-amber-50/40 to-blue-50/30 border-0 shadow-2xl overflow-hidden relative group">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-blue-500/5 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 via-blue-500 to-indigo-500 animate-gradient-x" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
      
      <CardContent className="relative p-6 lg:p-8">
        {calendarPreferences && (view === "day" || view === "week") && (
          <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 via-yellow-50/80 to-amber-50 border-2 border-amber-300/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-amber-800 shadow-lg backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-2xl -mr-16 -mt-16" />
            <div className="relative z-10 flex items-center gap-4 w-full sm:w-auto">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-amber-900 mb-1 text-sm sm:text-base">Working Hours</div>
                <div className="text-xs sm:text-sm text-amber-700 font-medium">
                  {calendarPreferences.start_time} - {calendarPreferences.end_time}
                  {calendarPreferences.working_days && calendarPreferences.working_days.length > 0 && (
                    <span className="ml-2 text-xs">
                      • {calendarPreferences.working_days
                        .slice() // Create a copy to avoid mutating original
                        .sort((a, b) => a - b) // Sort days to ensure consistent order
                        .map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
                        .join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="relative z-10 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-amber-300/50 text-xs font-bold text-amber-900 shadow-md">
              📅 Calendar View: 6:00 AM - 10:00 PM
            </div>
          </div>
        )}
        {(!calendarPreferences || view === "month") && (view === "day" || view === "week") && (
          <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 via-indigo-50/80 to-blue-50 border-2 border-blue-300/50 rounded-2xl flex items-center gap-4 text-sm text-blue-800 shadow-lg backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl -mr-16 -mt-16" />
            <div className="relative z-10 p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="relative z-10 flex-1">
              <div className="font-bold text-blue-900 mb-1 text-sm sm:text-base">Calendar View</div>
              <div className="text-xs sm:text-sm text-blue-700 font-medium">Showing 16-hour day view (6:00 AM - 10:00 PM)</div>
            </div>
          </div>
        )}
        <BigCalendar
          localizer={localizer}
          events={allEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: view === "day" ? (windowWidth < 768 ? 800 : 1000) : view === "week" ? (windowWidth < 768 ? 700 : 900) : 700 }}
          view={view}
          date={date}
          onView={onViewChange}
          onNavigate={onNavigate}
          onSelectEvent={(event) => {
            // Don't trigger for working hours or availability slot events
            if (event.resource?.type === "working-hours" || event.resource?.type === "availability") {
              return;
            }
            // Check if it's a booking event - can be from event.resource or event itself
            const booking = event.resource?.bookingId ? event.resource : 
                           (event.bookingId ? event : null);
            if (booking) {
              onSelectEvent?.(booking);
            }
          }}
          onSelectSlot={(slotInfo) => {
            // In month view, clicking anywhere in a day should navigate to day view
            if (view === "month") {
              onNavigate(slotInfo.start);
              onViewChange("day");
            } else {
              onSelectSlot?.(slotInfo);
            }
          }}
          components={{
              toolbar: CustomToolbar,
              event: CustomEventComponent,
              month: {
                dateHeader: ({ date, label }: any) => (
                  <div
                    className="rbc-date-cell cursor-pointer hover:bg-amber-50 rounded px-2 py-1 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(date);
                      onViewChange("day");
                    }}
                  >
                    {label}
                  </div>
                ),
                dateCellWrapper: ({ children, value }: any) => (
                  <div
                    className="rbc-day-bg cursor-pointer h-full w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(value);
                      onViewChange("day");
                    }}
                  >
                    {children}
                  </div>
                ),
              },
            }}
          eventPropGetter={eventStyleGetter}
          selectable={view !== "month"}
          popup={false}
          step={30}
          timeslots={2}
          min={minTime}
          max={maxTime}
          className="booking-calendar-enhanced"
          dayPropGetter={(date) => {
            // Style off days (Saturday, Sunday, and non-working days) differently
            if (!calendarPreferences) {
              // Make whole day clickable in month view
              if (view === "month") {
                return {
                  className: "rbc-day-bg cursor-pointer hover:bg-amber-50/50 transition-colors",
                };
              }
              return {};
            }
            
            const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
            const isWorkingDay = calendarPreferences.working_days.includes(dayOfWeek);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
            
            // Check if this day has any full-day unavailable slots (holiday, off_day)
            const hasFullDayUnavailable = availabilitySlots.some(slot => {
              if (!slot.isFullDay) return false;
              const slotDate = moment(slot.startAt);
              return slotDate.isSame(date, 'day') && 
                     (slot.slotType === 'holiday' || slot.slotType === 'off_day' || slot.slotType === 'unavailable');
            });
            
            // Off days: weekend or non-working days or full-day unavailable
            if (isWeekend || !isWorkingDay || hasFullDayUnavailable) {
              return {
                className: 'rbc-off-day cursor-pointer',
                style: {
                  backgroundColor: '#ffffff', // White background for off days
                  opacity: 0.7,
                  position: 'relative',
                  borderLeft: '3px solid #e5e7eb', // Light gray border to indicate off day
                }
              };
            }
            
            // Working days - keep default styling
            if (view === "month") {
              return {
                className: "rbc-day-bg cursor-pointer hover:bg-amber-50/50 transition-colors",
              };
            }
            return {};
          }}
          slotPropGetter={(date) => {
            // Style time slots for off days
            if (!calendarPreferences) return {};
            
            const dayOfWeek = date.getDay();
            const isWorkingDay = calendarPreferences.working_days.includes(dayOfWeek);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            // Off day time slots - make them appear grayed out
            if (isWeekend || !isWorkingDay) {
              return {
                className: 'rbc-off-day-slot',
                style: {
                  backgroundColor: '#fafafa', // Very light gray
                  opacity: 0.5,
                }
              };
            }
            
            return {};
          }}
          formats={{
            timeGutterFormat: (date: Date) => moment(date).format('h:mm A'),
            eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => 
              `${moment(start).format('h:mm A')} - ${moment(end).format('h:mm A')}`,
          }}
        />
      </CardContent>
    </Card>
  );
};

