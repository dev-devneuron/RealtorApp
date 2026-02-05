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
import { formatTime, fetchCalendarEvents, fetchUnavailableSlots, fetchCalendarPreferences, formatCustomerTime, hasTimezoneInfo, convertTzToUTC } from "./utils";
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
        return "bg-amber-50 border-amber-200 text-amber-900 shadow-sm";
      case "approved":
        return "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm";
      case "denied":
        return "bg-red-50 border-red-200 text-red-900 shadow-sm";
      case "cancelled":
        return "bg-gray-50 border-gray-200 text-gray-700 shadow-sm";
      case "rescheduled":
        return "bg-blue-50 border-blue-200 text-blue-900 shadow-sm";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700 shadow-sm";
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

  // Display ONLY customer's mentioned time in the event card (no UTC)
  // UTC time is only shown in the modal, not in calendar event cards
  const customerStartTime = event.customerSentStartAt 
    ? formatCustomerTime(event.customerSentStartAt, event.timezone || "UTC").localTime
    : formatTime(event.startAt, true);
  const customerEndTime = event.customerSentEndAt
    ? formatCustomerTime(event.customerSentEndAt, event.timezone || "UTC").localTime
    : formatTime(event.endAt, true);

  return (
    <div className={`${getStatusGradient(event.status)} p-2 sm:p-2.5 rounded-lg border hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer group relative overflow-hidden`}>
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs sm:text-sm leading-tight truncate mb-1 flex items-center gap-1.5">
              <span className="text-sm sm:text-base">{getStatusIcon(event.status)}</span>
              <span className="truncate font-medium">{event.visitor.name}</span>
              {/* Call record indicator */}
              {event.callRecord && (event.callRecord.callRecordingUrl || event.callRecord.callTranscript) && (
                <span className="text-xs opacity-70" title="Has call recording/transcript">📞</span>
              )}
            </div>
            <div className="text-[10px] sm:text-xs opacity-80 truncate font-medium mb-1 flex items-center gap-1">
              <span className="opacity-70 text-xs">📍</span>
              <span className="truncate">{event.propertyAddress || `Property #${event.propertyId}`}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-current/20">
          <div className="text-[10px] sm:text-xs opacity-90 flex items-center gap-1 font-medium">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
            <span>{customerStartTime}</span>
            {customerStartTime !== customerEndTime && (
              <>
                <span className="opacity-60">-</span>
                <span>{customerEndTime}</span>
              </>
            )}
          </div>
        </div>
      </div>
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
            // Don't crash - just leave availability slots empty
            setAvailabilitySlots([]);
          }
        }
      } catch (error) {
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
    // STEP 0: FIRST - Deduplicate by bookingId at the INPUT level
    // This prevents duplicate bookings from entering the processing pipeline
    const inputDeduplicationMap = new Map<number, Booking>();
    const duplicateInputIds: number[] = [];
    bookings.forEach((booking) => {
      if (!booking.bookingId) {
        return;
      }
      
      // If we already have this bookingId, skip it (keep first occurrence)
      if (!inputDeduplicationMap.has(booking.bookingId)) {
        inputDeduplicationMap.set(booking.bookingId, booking);
      } else {
        duplicateInputIds.push(booking.bookingId);
      }
    });
    
    const deduplicatedInput = Array.from(inputDeduplicationMap.values());
    
    // STEP 0.5: SECOND - Deduplicate by bookingId, ALWAYS preferring the one with customerSentStartAt
    // This prevents showing the same booking twice (once with customerSentStartAt, once without)
    const deduplicatedBookingsMap = new Map<number, Booking>();
    deduplicatedInput.forEach((booking) => {
      if (!booking.bookingId) {
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
        deduplicatedBookingsMap.set(booking.bookingId, booking);
      } else if (!hasCustomerSent && existingHasCustomerSent) {
        // Existing has customerSentStartAt, new one doesn't - keep existing
      } else if (hasCustomerSent && existingHasCustomerSent) {
        // Both have customerSentStartAt - keep the existing one (first occurrence)
      } else {
        // Neither has customerSentStartAt - keep existing (first occurrence)
      }
    });
    
    const deduplicatedBookings = Array.from(deduplicatedBookingsMap.values());
    
    // FILTER: Only keep bookings that have customer-sent times
    // CRITICAL: Reject any booking that doesn't have BOTH customerSentStartAt AND customerSentEndAt
    // We will use customerSentStartAt for display, regardless of whether it matches startAt
    // The key is: if customerSentStartAt exists, use it. If not, don't show the booking.
    const validBookings = deduplicatedBookings.filter((booking) => {
      // STEP 1: Must have both customer-sent times - if not, REJECT IMMEDIATELY
      if (!booking.customerSentStartAt || !booking.customerSentEndAt) {
        return false;
      }
      
      const customerStart = String(booking.customerSentStartAt).trim();
      const customerEnd = String(booking.customerSentEndAt).trim();
      
      // STEP 2: Must not be empty - if empty, REJECT
      if (customerStart === "" || customerEnd === "") {
        return false;
      }
      
      // STEP 3: Must be parseable as dates - if not, REJECT
      const customerStartDate = new Date(customerStart);
      const customerEndDate = new Date(customerEnd);
      if (isNaN(customerStartDate.getTime()) || isNaN(customerEndDate.getTime())) {
        return false;
      }
      
      // STEP 4: REJECT bookings that ONLY have UTC times (no customer-sent times)
      // But if customerSentStartAt exists and is valid, we KEEP it and use it for display
      // We don't care if it matches startAt - we just use customerSentStartAt for the calendar position
      
      return true;
    });
    
    // If no valid bookings, return empty array immediately
    if (validBookings.length === 0) {
      return [];
    }
    
    // Step 1: Deduplicate by bookingId (keep first occurrence)
    const uniqueBookingsMap = new Map<number, Booking>();
    validBookings.forEach((booking) => {
      if (!booking.bookingId || typeof booking.bookingId !== 'number') {
        return;
      }
      
      // If we already have this bookingId, skip it (keep first occurrence)
      if (!uniqueBookingsMap.has(booking.bookingId)) {
        uniqueBookingsMap.set(booking.bookingId, booking);
      }
    });
    
    const uniqueBookings = Array.from(uniqueBookingsMap.values());

    // Step 2: Convert to calendar events
    // CRITICAL: Use customerSentStartAt/customerSentEndAt for calendar positioning
    // Parse customer's mentioned time as-is (no UTC conversion)
    // react-big-calendar will display it in the user's local timezone
    // We want the calendar to show the booking at the customer's mentioned time
    const events = uniqueBookings.map((booking) => {
      // CRITICAL: Use customerSentStartAt/customerSentEndAt for calendar positioning
      // Parse as local time (no timezone conversion) - calendar will display it as-is
      if (!booking.customerSentStartAt || !booking.customerSentEndAt) {
        return null;
      }
      
      const startTimeString = String(booking.customerSentStartAt).trim();
      const endTimeString = String(booking.customerSentEndAt).trim();
      const bookingTimezone = booking.timezone || "UTC";
      
      // CRITICAL: Parse customer's mentioned time as naive local time (no timezone conversion)
      // react-big-calendar will convert dates to the user's local timezone for display
      // By parsing as naive local time, the calendar will show the customer's mentioned time
      // Example: Customer says "12:00 PM" -> Parse as "12:00 PM" in browser timezone -> Calendar shows "12:00 PM"
      // This ensures the calendar displays the customer's mentioned time, not a timezone-converted version
      let startDate: Date;
      let endDate: Date;
      
      // Parse as naive local time - JavaScript will interpret in browser's timezone
      // When react-big-calendar displays it, it will show the same time string (customer's mentioned time)
      if (hasTimezoneInfo(startTimeString)) {
        // Has timezone info - remove timezone and parse as local time
        const dateTimeMatch = startTimeString.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
        if (dateTimeMatch) {
          startDate = new Date(dateTimeMatch[1]); // Parse without timezone
        } else {
          startDate = new Date(startTimeString);
        }
      } else {
        // No timezone info - parse as naive local time (what customer mentioned)
        startDate = new Date(startTimeString);
      }
      
      if (hasTimezoneInfo(endTimeString)) {
        const dateTimeMatch = endTimeString.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
        if (dateTimeMatch) {
          endDate = new Date(dateTimeMatch[1]); // Parse without timezone
        } else {
          endDate = new Date(endTimeString);
        }
      } else {
        endDate = new Date(endTimeString);
      }

      // Final validation - if this fails, something is very wrong
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null;
      }
      
      // NOTE: We don't check if startDate matches booking.startAt because:
      // 1. We're creating the event from customerSentStartAt, not startAt
      // 2. If the backend calculated startAt correctly from customerSentStartAt, they will match
      // 3. The important check is that we're using customerSentStartAt (which we verify above)
      // 4. The final filters will catch any UTC-only events that slip through

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
    // CRITICAL: Also check that events are NOT positioned at UTC times (startAt/endAt)
    const finalEventsMap = new Map<number, typeof events[0]>();
    const duplicateEvents: number[] = [];
    const utcRejectedEvents: number[] = [];
    
    events.forEach((event) => {
      if (!event || !event.bookingId) {
        return;
      }
      
      const booking = event.resource as Booking;
      
      // CRITICAL: Only reject events that were created from startAt/endAt (UTC), not from customerSentStartAt
      // If the event has customerSentStartAt, it's valid even if it happens to match UTC time
      // We only reject if the event was created from UTC time (startAt) without customerSentStartAt
      if (!booking.customerSentStartAt || !booking.customerSentEndAt) {
        // This event was created from UTC time (startAt/endAt) - REJECT it
        utcRejectedEvents.push(event.bookingId);
        return;
      }
      
      // Additional safeguard: Verify the event was created from customerSentStartAt
      // by checking that the event time matches customerSentStartAt (parsed as naive local time)
      const customerStartTimeString = String(booking.customerSentStartAt).trim();
      let expectedCustomerStartTime: number;
      
      if (hasTimezoneInfo(customerStartTimeString)) {
        // Has timezone info - remove timezone and parse as local time (same as event creation)
        const dateTimeMatch = customerStartTimeString.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
        if (dateTimeMatch) {
          expectedCustomerStartTime = new Date(dateTimeMatch[1]).getTime();
        } else {
          expectedCustomerStartTime = new Date(customerStartTimeString).getTime();
        }
      } else {
        // No timezone info - parse as naive local time (same as event creation)
        expectedCustomerStartTime = new Date(customerStartTimeString).getTime();
      }
      
      const eventStartTime = event.start.getTime();
      const timeDiff = Math.abs(eventStartTime - expectedCustomerStartTime);
      
      // Event should match customerSentStartAt (parsed as naive local time) - allow 1 minute tolerance
      if (timeDiff > 60000) { // 1 minute in milliseconds
        utcRejectedEvents.push(event.bookingId);
        return;
      }
      
      // If we already have an event for this bookingId, keep the first one
      if (!finalEventsMap.has(event.bookingId)) {
        finalEventsMap.set(event.bookingId, event);
      } else {
        duplicateEvents.push(event.bookingId);
      }
    });

    const finalEvents = Array.from(finalEventsMap.values());
    
    return finalEvents;
  }, [bookings]);

  // Convert availability slots to calendar events
  // CRITICAL: Availability slots are stored in UTC, but we need to display them at the time the user entered
  // Parse UTC times as naive local time so the calendar shows the correct time
  // FILTER: Exclude blocked time slots that are labeled as "booking" since they already have booking events
  const availabilityEvents = useMemo(() => {
    // Filter out slots labeled as "booking" - these already have corresponding booking events
    const filteredSlots = availabilitySlots.filter((slot) => {
      // Check if slotType is "booking"
      if (slot.slotType?.toLowerCase() === "booking") {
        return false;
      }
      
      // Check if reason or notes contains "booking" (case-insensitive)
      const reason = (slot.reason || "").toLowerCase();
      const notes = (slot.notes || "").toLowerCase();
      if (reason.includes("booking") || notes.includes("booking")) {
        return false;
      }
      
      return true;
    });
    
    return filteredSlots.map((slot) => {
      // Parse UTC times - but we need to extract the local time component
      // If slot.startAt is "2025-12-16T19:00:00.000Z" (UTC), we want to show "2:00 PM" (local)
      // The issue is that when stored, local "2:00 PM" becomes UTC "7:00 PM" (if EST, UTC-5)
      // So we need to parse it and adjust to show the original local time
      const startDate = new Date(slot.startAt);
      const endDate = new Date(slot.endAt);
      
      // Extract the date/time components from the UTC string
      // If the user entered "2:00 PM" and it's stored as "2025-12-16T19:00:00.000Z" (UTC),
      // we need to create a Date that represents "2:00 PM" in local time
      // The calendar will then display it correctly
      
      // For availability slots, the times are already in UTC from the backend
      // We need to parse them and create dates that represent the local time the user entered
      // Since we don't know the user's timezone when they created it, we'll parse as-is
      // and let the calendar convert to the current user's timezone
      
      // Actually, the better approach: Parse the UTC time, but create a Date object
      // that represents the same time in the browser's local timezone
      // This way, if the user is in the same timezone, it will show correctly
      
      // Extract hour/minute from UTC date and create a local date with those values
      const startYear = startDate.getUTCFullYear();
      const startMonth = startDate.getUTCMonth();
      const startDay = startDate.getUTCDate();
      const startHour = startDate.getUTCHours();
      const startMinute = startDate.getUTCMinutes();
      const startSecond = startDate.getUTCSeconds();
      
      // Create a date in local timezone with the UTC hour/minute values
      // This will show the time as entered (assuming user is in same timezone as when created)
      const localStartDate = new Date(startYear, startMonth, startDay, startHour, startMinute, startSecond);
      
      const endYear = endDate.getUTCFullYear();
      const endMonth = endDate.getUTCMonth();
      const endDay = endDate.getUTCDate();
      const endHour = endDate.getUTCHours();
      const endMinute = endDate.getUTCMinutes();
      const endSecond = endDate.getUTCSeconds();
      
      const localEndDate = new Date(endYear, endMonth, endDay, endHour, endMinute, endSecond);
      
      return {
        id: `availability-${slot.id}`,
        title: slot.isFullDay 
          ? `${slot.slotType === "holiday" ? "Holiday" : slot.slotType === "off_day" ? "Off Day" : slot.slotType || "Unavailable"}: ${slot.reason || ""}`
          : `${slot.slotType || "Unavailable"}: ${slot.reason || ""}`,
        start: localStartDate,
        end: localEndDate,
        resource: { type: "availability", ...slot },
        allDay: slot.isFullDay || false,
      };
    });
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
        return false;
      }
      
      // CRITICAL: Verify event is positioned using customerSentStartAt (as local time, no UTC conversion)
      // We parse customerSentStartAt as local time, same as event creation
      if (!booking.customerSentStartAt || !booking.customerSentEndAt) {
        return false;
      }
      
      const customerStartTimeString = String(booking.customerSentStartAt).trim();
      
      // Parse customer time the SAME way we created the event - as naive local time
      // This ensures the comparison is correct
      let customerStartTime: number;
      if (hasTimezoneInfo(customerStartTimeString)) {
        // Has timezone info - remove timezone and parse as local time (same as event creation)
        const dateTimeMatch = customerStartTimeString.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
        if (dateTimeMatch) {
          customerStartTime = new Date(dateTimeMatch[1]).getTime();
        } else {
          customerStartTime = new Date(customerStartTimeString).getTime();
        }
      } else {
        // No timezone info - parse as naive local time (same as event creation)
        customerStartTime = new Date(customerStartTimeString).getTime();
      }
      
      const eventStartTime = event.start.getTime();
      const timeDiff = Math.abs(eventStartTime - customerStartTime);
      
      // Event should be positioned at customer's mentioned time (as naive local time)
      // Allow up to 1 minute difference to account for rounding/parsing differences
      if (timeDiff > 60000) { // 1 minute in milliseconds
        return false;
      }
      
      return true;
    });
    
    // Step 2: Combine all events
    const combined = [...filteredBookingEvents, ...workingHoursEvents, ...availabilityEvents];
    
    // Step 3: Final deduplication by unique ID and bookingId
    // CRITICAL: Also reject any booking events that are positioned at UTC times
    const seenIds = new Set<string>();
    const seenBookingIds = new Set<number>();
    const deduplicated: typeof combined = [];
    const utcRejectedInFinal: number[] = [];
    
    combined.forEach((event) => {
      // CRITICAL: Only check booking events - availability events are separate and should not be filtered
      // Availability events have resource.type === "availability" and no bookingId
      // They are UTC-based but that's expected for blocked slots - they are NOT booking events
      if (event.bookingId && event.resource && (!event.resource.type || (event.resource as any).type !== "availability")) {
        const booking = event.resource as Booking;
        
        // MUST have customerSentStartAt - if not, this is a UTC-only event - REJECT
        if (!booking.customerSentStartAt || !booking.customerSentEndAt) {
          utcRejectedInFinal.push(event.bookingId);
          return;
        }
        
        // Additional safeguard: Verify the event was created from customerSentStartAt
        // by checking that the event time matches customerSentStartAt (parsed as naive local time)
        // NOT by checking if it matches startAt (which is UTC and will be different)
        const customerStartTimeString = String(booking.customerSentStartAt).trim();
        let expectedCustomerStartTime: number;
        
        if (hasTimezoneInfo(customerStartTimeString)) {
          // Has timezone info - remove timezone and parse as local time (same as event creation)
          const dateTimeMatch = customerStartTimeString.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
          if (dateTimeMatch) {
            expectedCustomerStartTime = new Date(dateTimeMatch[1]).getTime();
          } else {
            expectedCustomerStartTime = new Date(customerStartTimeString).getTime();
          }
        } else {
          // No timezone info - parse as naive local time (same as event creation)
          expectedCustomerStartTime = new Date(customerStartTimeString).getTime();
        }
        
        const eventStartTime = event.start.getTime();
        const timeDiff = Math.abs(eventStartTime - expectedCustomerStartTime);
        
        // Event should match customerSentStartAt (parsed as naive local time) - allow 1 minute tolerance
        if (timeDiff > 60000) { // 1 minute in milliseconds
          utcRejectedInFinal.push(event.bookingId);
          return;
        }
      }
      
      // Use event.id if available, otherwise create one
      const eventId = event.id || (event.bookingId ? `booking-${event.bookingId}` : `event-${Math.random()}`);
      
      // Check by unique ID first
      if (seenIds.has(eventId)) {
        return;
      }
      
      // For booking events, also check by bookingId
      if (event.bookingId && typeof event.bookingId === 'number') {
        if (seenBookingIds.has(event.bookingId)) {
          return;
        }
        seenBookingIds.add(event.bookingId);
      }
      
      seenIds.add(eventId);
      deduplicated.push(event);
    });
    
    return deduplicated;
  }, [bookingEvents, workingHoursEvents, availabilityEvents]);

  // Enhanced custom toolbar with clean design
  const CustomToolbar = ({ label, onNavigate: nav, onView }: any) => {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 sm:p-6 bg-white border border-gray-200 rounded-xl shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3 sm:gap-4 relative z-10">
          <div className="p-2.5 sm:p-3 bg-amber-100 rounded-lg shadow-sm">
            <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 tracking-tight">
              {label}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 font-medium">View and manage your bookings</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap relative z-10 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => nav("PREV")}
              className="h-9 w-9 p-0 rounded-md border-gray-300 hover:bg-white hover:border-gray-400 shadow-sm transition-all"
          >
              <ChevronLeft className="h-4 w-4 text-gray-700" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => nav("TODAY")}
              className="h-9 px-3 sm:px-4 rounded-md border-gray-300 hover:bg-white hover:border-gray-400 shadow-sm font-medium transition-all text-gray-700 text-xs sm:text-sm"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => nav("NEXT")}
              className="h-9 w-9 p-0 rounded-md border-gray-300 hover:bg-white hover:border-gray-400 shadow-sm transition-all"
          >
              <ChevronRight className="h-4 w-4 text-gray-700" />
          </Button>
        </div>

          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
          <Button
            variant={view === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => onView("day")}
              className={`h-9 px-3 sm:px-4 rounded-md font-medium transition-all text-xs sm:text-sm ${
              view === "day" 
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200" 
                  : "text-gray-600 hover:bg-white hover:text-gray-900"
            }`}
          >
            Day
          </Button>
          <Button
            variant={view === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => onView("week")}
              className={`h-9 px-3 sm:px-4 rounded-md font-medium transition-all text-xs sm:text-sm ${
              view === "week" 
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200" 
                  : "text-gray-600 hover:bg-white hover:text-gray-900"
            }`}
          >
            Week
          </Button>
          <Button
            variant={view === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => onView("month")}
              className={`h-9 px-3 sm:px-4 rounded-md font-medium transition-all text-xs sm:text-sm ${
              view === "month" 
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200" 
                  : "text-gray-600 hover:bg-white hover:text-gray-900"
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

  // Clean event style getter with soft colors
  const eventStyleGetter = (event: any) => {
    // Working hours styling
    if (event.resource?.type === "working-hours") {
      return {
        style: {
          backgroundColor: "#fef3c7",
          border: "1px dashed #fbbf24",
          borderRadius: "6px",
          color: "#92400e",
          padding: "2px 4px",
          fontWeight: "500",
          opacity: 0.8,
        },
      };
    }

    // Availability slot styling
    if (event.resource?.type === "availability") {
      const slotType = event.resource.slotType || "unavailable";
      
      if (slotType === "holiday") {
        return {
          style: {
            backgroundColor: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#991b1b",
            opacity: 0.9,
            borderRadius: "6px",
            padding: "2px 4px",
            fontWeight: "500",
          },
        };
      }
      if (slotType === "off_day") {
        return {
          style: {
            backgroundColor: "#f3e8ff",
            border: "1px solid #c4b5fd",
            color: "#6b21a8",
            opacity: 0.9,
            borderRadius: "6px",
            padding: "2px 4px",
            fontWeight: "500",
          },
        };
      }
      if (slotType === "busy") {
        return {
          style: {
            backgroundColor: "#fed7aa",
            border: "1px dashed #fb923c",
            color: "#9a3412",
            opacity: 0.8,
            borderRadius: "6px",
            padding: "2px 4px",
            fontWeight: "500",
          },
        };
      }
      // unavailable, personal
      return {
        style: {
          backgroundColor: "#fee2e2",
          border: "1px solid #fca5a5",
          color: "#991b1b",
          opacity: 0.9,
          borderRadius: "6px",
          padding: "4px 8px",
          fontWeight: "600",
          boxShadow: "0 1px 3px rgba(239, 68, 68, 0.2)",
        },
      };
    }

    // Booking styling - transparent (handled by EventComponent)
    return {
      style: {
        backgroundColor: "transparent",
        border: "none",
        padding: 0,
        boxShadow: "none",
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
      const bgColor = slotType === "holiday" ? "bg-red-50" 
        : slotType === "off_day" ? "bg-purple-50"
        : slotType === "busy" ? "bg-orange-50"
        : slotType === "unavailable" ? "bg-red-50"
        : slotType === "personal" ? "bg-pink-50"
        : "bg-red-50";
      const textColor = slotType === "holiday" ? "text-red-800"
        : slotType === "off_day" ? "text-purple-800"
        : slotType === "busy" ? "text-orange-800"
        : slotType === "unavailable" ? "text-red-800"
        : slotType === "personal" ? "text-pink-800"
        : "text-red-800";
      const borderColor = slotType === "holiday" ? "border-red-200"
        : slotType === "off_day" ? "border-purple-200"
        : slotType === "busy" ? "border-orange-200"
        : slotType === "unavailable" ? "border-red-200"
        : slotType === "personal" ? "border-pink-200"
        : "border-red-200";
      
      return (
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 ${bgColor} ${textColor} rounded-md border ${borderColor} shadow-sm`}>
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
    <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden relative">
      <CardContent className="relative p-4 sm:p-6 lg:p-8">
        {calendarPreferences && (view === "day" || view === "week") && (
          <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 text-sm shadow-sm">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="p-2.5 sm:p-3 bg-amber-100 rounded-lg shadow-sm">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Working Hours</div>
                <div className="text-xs sm:text-sm text-gray-700 font-medium">
                  {calendarPreferences.start_time} - {calendarPreferences.end_time}
                  {calendarPreferences.working_days && calendarPreferences.working_days.length > 0 && (
                    <span className="ml-2 text-xs">
                      • {calendarPreferences.working_days
                        .slice()
                        .sort((a, b) => a - b)
                        .map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
                        .join(", ")}
                </span>
              )}
                </div>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-white rounded-md border border-amber-200 text-xs font-medium text-gray-700 shadow-sm">
              📅 Calendar View: 6:00 AM - 10:00 PM
            </div>
          </div>
        )}
        {(!calendarPreferences || view === "month") && (view === "day" || view === "week") && (
          <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 sm:gap-4 text-sm shadow-sm">
            <div className="p-2.5 sm:p-3 bg-blue-100 rounded-lg shadow-sm">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Calendar View</div>
              <div className="text-xs sm:text-sm text-gray-700 font-medium">Showing 16-hour day view (6:00 AM - 10:00 PM)</div>
            </div>
          </div>
        )}
        <BigCalendar
          localizer={localizer}
          events={allEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: view === "day" ? (windowWidth < 640 ? 600 : windowWidth < 768 ? 700 : 900) : view === "week" ? (windowWidth < 640 ? 500 : windowWidth < 768 ? 600 : 800) : (windowWidth < 640 ? 500 : 600) }}
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

