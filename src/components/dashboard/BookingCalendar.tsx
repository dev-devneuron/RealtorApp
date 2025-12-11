/**
 * Booking Calendar Component
 * 
 * Beautiful, modern calendar display for bookings with enhanced styling
 * Includes working hours visualization for PMs
 */

import { useMemo, useEffect, useState, useCallback } from "react";
import { Calendar as BigCalendar, momentLocalizer, View, SlotInfo } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { formatTime, fetchCalendarEvents, fetchUnavailableSlots } from "./utils";
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
const EventComponent = ({ event }: { event: Booking }) => {
  const getStatusGradient = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gradient-to-br from-amber-500 via-amber-500 to-amber-600 border-amber-700 shadow-amber-500/30";
      case "approved":
        return "bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-600 border-emerald-700 shadow-emerald-500/30";
      case "denied":
        return "bg-gradient-to-br from-red-500 via-red-500 to-red-600 border-red-700 shadow-red-500/30";
      case "cancelled":
        return "bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 border-gray-700 shadow-gray-500/30";
      case "rescheduled":
        return "bg-gradient-to-br from-blue-500 via-blue-500 to-blue-600 border-blue-700 shadow-blue-500/30";
      default:
        return "bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 border-gray-700 shadow-gray-500/30";
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

  const startTime = formatTime(event.startAt);
  const endTime = formatTime(event.endAt);

  return (
    <div className={`${getStatusGradient(event.status)} text-white p-2.5 rounded-xl shadow-lg border-l-4 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group relative overflow-hidden`}>
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm leading-tight truncate mb-0.5 flex items-center gap-1.5">
              <span className="text-base">{getStatusIcon(event.status)}</span>
              <span className="truncate">{event.visitor.name}</span>
            </div>
            <div className="text-xs opacity-95 truncate font-medium mb-1">
              {event.propertyAddress || `Property #${event.propertyId}`}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-white/20">
          <div className="text-xs opacity-90 flex items-center gap-1.5 font-medium">
            <Clock className="h-3 w-3" />
            <span>{startTime}</span>
            {startTime !== endTime && (
              <>
                <span className="opacity-70">-</span>
                <span>{endTime}</span>
              </>
            )}
          </div>
          <div className="w-2 h-2 bg-white rounded-full animate-pulse opacity-80" />
        </div>
      </div>
    </div>
  );
};

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

  // Load preferences from localStorage and listen for updates
  const loadPreferences = () => {
    if (userType === "property_manager" && userId) {
      try {
        const stored = localStorage.getItem(`calendar_preferences_${userId}`);
        if (stored) {
          const prefs = JSON.parse(stored);
          setCalendarPreferences({
            start_time: prefs.start_time || "09:00",
            end_time: prefs.end_time || "17:00",
            timezone: prefs.timezone || "America/New_York",
            slot_length: prefs.slot_length || 30,
            working_days: prefs.working_days || [1, 2, 3, 4, 5],
          });
          return;
        }
      } catch (error) {
        console.error("Error loading preferences from localStorage:", error);
      }

      // Try to fetch from API if not in localStorage
      const fetchFromAPI = async () => {
        try {
          const token = localStorage.getItem("access_token");
          if (!token) return;

          const endpoints = [
            `${API_BASE}/calendar-preferences?user_id=${userId}&user_type=${userType}`,
            `${API_BASE}/api/calendar-preferences?user_id=${userId}&user_type=${userType}`,
            `${API_BASE}/property-manager/calendar-preferences`,
          ];

          let preferences = null;
          for (const endpoint of endpoints) {
            try {
              const response = await fetch(endpoint, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.ok) {
                const data = await response.json();
                if (data.start_time && data.end_time) {
                  preferences = data;
                } else if (data.workingHours) {
                  preferences = {
                    start_time: data.workingHours.start || "09:00",
                    end_time: data.workingHours.end || "17:00",
                    timezone: data.workingHours.timezone || "America/New_York",
                    slot_length: data.workingHours.defaultSlotLength || 30,
                    working_days: data.working_days || [1, 2, 3, 4, 5],
                  };
                }
                if (preferences) {
                  // Save to localStorage for future use
                  localStorage.setItem(`calendar_preferences_${userId}`, JSON.stringify(preferences));
                }
                break;
              }
            } catch (e) {
              continue;
            }
          }

          if (preferences) {
            setCalendarPreferences(preferences);
          } else {
            // Use defaults
            const defaults = {
              start_time: "09:00",
              end_time: "17:00",
              timezone: "America/New_York",
              slot_length: 30,
              working_days: [1, 2, 3, 4, 5],
            };
            setCalendarPreferences(defaults);
            localStorage.setItem(`calendar_preferences_${userId}`, JSON.stringify(defaults));
          }
        } catch (error) {
          console.error("Error fetching calendar preferences:", error);
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

      fetchFromAPI();
    }
  };

  // Load preferences on mount and when userId/userType changes
  useEffect(() => {
    if (userType === "property_manager" && userId) {
      loadPreferences();
    }
  }, [userId, userType]);

  // Listen for preference updates from AvailabilityManager
  useEffect(() => {
    const handlePreferenceUpdate = (e: CustomEvent) => {
      if (e.detail?.userId === userId) {
        setCalendarPreferences(e.detail.preferences);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `calendar_preferences_${userId}` && e.newValue) {
        try {
          const prefs = JSON.parse(e.newValue);
          setCalendarPreferences({
            start_time: prefs.start_time || "09:00",
            end_time: prefs.end_time || "17:00",
            timezone: prefs.timezone || "America/New_York",
            slot_length: prefs.slot_length || 30,
            working_days: prefs.working_days || [1, 2, 3, 4, 5],
          });
        } catch (error) {
          console.error("Error parsing preferences:", error);
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
  }, [userId]);

  const [availabilitySlots, setAvailabilitySlots] = useState<Array<{
    id: number | string;
    startAt: string;
    endAt: string;
    slotType?: string;
    isFullDay?: boolean;
    reason?: string;
  }>>([]);

  // Fetch calendar events (bookings + availability slots) when view or date changes
  useEffect(() => {
    const loadCalendarEvents = async () => {
      if (!userId || !userType) return;

      try {
        // Calculate date range based on current view
        let fromDate: Date;
        let toDate: Date;

        if (view === "day") {
          fromDate = moment(date).startOf("day").toDate();
          toDate = moment(date).endOf("day").toDate();
        } else if (view === "week") {
          fromDate = moment(date).startOf("week").toDate();
          toDate = moment(date).endOf("week").toDate();
        } else if (view === "month") {
          fromDate = moment(date).startOf("month").toDate();
          toDate = moment(date).endOf("month").toDate();
        } else {
          return; // List view doesn't need calendar events
        }

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
              id: slot.slotId || slot.id || `slot-${slot.startAt}`,
              startAt: slot.startAt,
              endAt: slot.endAt,
              slotType: slot.slotType,
              isFullDay: slot.isFullDay,
              reason: slot.notes || slot.reason,
            })));
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
  }, [userId, userType, view, date]);

  // Convert bookings to calendar events
  const bookingEvents = useMemo(() => {
    return bookings.map((booking) => ({
      ...booking,
      title: `${booking.visitor.name} - ${booking.propertyAddress || `Property #${booking.propertyId}`}`,
      start: new Date(booking.startAt),
      end: new Date(booking.endAt),
      resource: booking,
    }));
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

  // Generate working hours events for day/week views
  const workingHoursEvents = useMemo(() => {
    if (!calendarPreferences || (view !== "day" && view !== "week")) {
      return [];
    }

    const events: any[] = [];
    const startDate = view === "day" ? moment(date).startOf("day") : moment(date).startOf("week");
    const endDate = view === "day" ? moment(date).endOf("day") : moment(date).endOf("week");

    let currentDate = startDate.clone();
    while (currentDate.isSameOrBefore(endDate, "day")) {
      const dayOfWeek = currentDate.day(); // 0 = Sunday, 1 = Monday, etc.
      
      // Check if this day is a working day
      if (calendarPreferences.working_days.includes(dayOfWeek)) {
        const [startHour, startMinute] = calendarPreferences.start_time.split(":").map(Number);
        const [endHour, endMinute] = calendarPreferences.end_time.split(":").map(Number);

        const workingStart = currentDate.clone().hour(startHour).minute(startMinute).second(0);
        const workingEnd = currentDate.clone().hour(endHour).minute(endMinute).second(0);

        events.push({
          id: `working-hours-${currentDate.format("YYYY-MM-DD")}`,
          title: `Working Hours: ${calendarPreferences.start_time} - ${calendarPreferences.end_time}`,
          start: workingStart.toDate(),
          end: workingEnd.toDate(),
          resource: { type: "working-hours", date: currentDate.toDate() },
          allDay: false,
        });
      }

      currentDate.add(1, "day");
    }

    return events;
  }, [calendarPreferences, view, date]);

  // Combine bookings, working hours, and availability slots
  const allEvents = useMemo(() => {
    return [...bookingEvents, ...workingHoursEvents, ...availabilityEvents];
  }, [bookingEvents, workingHoursEvents, availabilityEvents]);

  // Enhanced custom toolbar with beautiful design
  const CustomToolbar = ({ label, onNavigate: nav, onView }: any) => {
    return (
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 p-5 bg-gradient-to-br from-white via-amber-50/30 to-white rounded-2xl border border-amber-100/50 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl blur-md opacity-50" />
            <div className="relative p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 bg-clip-text text-transparent">
              {label}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">View and manage your bookings</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm p-1 rounded-xl border border-amber-200 shadow-md">
            <Button
              variant="outline"
              size="sm"
              onClick={() => nav("PREV")}
              className="h-9 w-9 p-0 rounded-lg border-amber-200 hover:bg-amber-50 hover:border-amber-300 shadow-sm transition-all hover:scale-105"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => nav("TODAY")}
              className="h-9 px-4 rounded-lg border-amber-200 hover:bg-amber-50 hover:border-amber-300 shadow-sm font-medium transition-all hover:scale-105"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => nav("NEXT")}
              className="h-9 w-9 p-0 rounded-lg border-amber-200 hover:bg-amber-50 hover:border-amber-300 shadow-sm transition-all hover:scale-105"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm p-1 rounded-xl border border-amber-200 shadow-md">
            <Button
              variant={view === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => onView("day")}
              className={`h-9 px-4 rounded-lg font-semibold transition-all ${
                view === "day" 
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:shadow-lg hover:scale-105" 
                  : "hover:bg-amber-50 text-gray-700"
              }`}
            >
              Day
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => onView("week")}
              className={`h-9 px-4 rounded-lg font-semibold transition-all ${
                view === "week" 
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:shadow-lg hover:scale-105" 
                  : "hover:bg-amber-50 text-gray-700"
              }`}
            >
              Week
            </Button>
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => onView("month")}
              className={`h-9 px-4 rounded-lg font-semibold transition-all ${
                view === "month" 
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:shadow-lg hover:scale-105" 
                  : "hover:bg-amber-50 text-gray-700"
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
      // unavailable, personal
      return {
        style: {
          backgroundColor: "rgba(107, 114, 128, 0.15)",
          border: "1px dashed #6b7280",
          color: "#374151",
          opacity: 0.6,
          borderRadius: "4px",
          padding: "2px 4px",
          fontWeight: "500",
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
      const bgColor = slotType === "holiday" ? "bg-red-100" 
        : slotType === "off_day" ? "bg-purple-100"
        : slotType === "busy" ? "bg-orange-100"
        : "bg-gray-100";
      const textColor = slotType === "holiday" ? "text-red-800"
        : slotType === "off_day" ? "text-purple-800"
        : slotType === "busy" ? "text-orange-800"
        : "text-gray-800";
      
      return (
        <div className={`flex items-center gap-1 text-xs font-medium px-1 ${bgColor} ${textColor} rounded border border-current/20`}>
          <span className="truncate">{isFullDay ? event.title : event.title.split(":")[0]}</span>
        </div>
      );
    }
    return <EventComponent event={event.resource} />;
  };

  // Calculate min/max times - 14-hour day view (6 AM - 8 PM)
  const minTime = useMemo(() => {
    // Always show 6 AM to 8 PM (14 hours) for day and week views
    if (view === "day" || view === "week") {
      return new Date(2024, 0, 1, 6, 0); // 6:00 AM
    }
    return new Date(2024, 0, 1, 6, 0);
  }, [view]);

  const maxTime = useMemo(() => {
    // Always show 6 AM to 8 PM (14 hours) for day and week views
    if (view === "day" || view === "week") {
      return new Date(2024, 0, 1, 20, 0); // 8:00 PM
    }
    return new Date(2024, 0, 1, 20, 0);
  }, [view]);

  return (
    <Card className="bg-gradient-to-br from-white via-amber-50/30 to-white border-0 shadow-2xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-blue-500/5 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
      <CardContent className="relative p-6 lg:p-8">
        {calendarPreferences && (view === "day" || view === "week") && (
          <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-sm text-amber-800 shadow-sm">
            <div className="p-2 bg-amber-500 rounded-lg shadow-md">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-amber-900 mb-0.5">Working Hours</div>
              <div className="text-xs text-amber-700">
                {calendarPreferences.start_time} - {calendarPreferences.end_time}
                {calendarPreferences.working_days.length > 0 && (
                  <span className="ml-2">
                    • {calendarPreferences.working_days.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")}
                  </span>
                )}
              </div>
            </div>
            <div className="px-3 py-1.5 bg-white/60 rounded-lg border border-amber-200 text-xs font-medium text-amber-900">
              Calendar View: 6:00 AM - 8:00 PM
            </div>
          </div>
        )}
        {(!calendarPreferences || view === "month") && (view === "day" || view === "week") && (
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-sm text-blue-800 shadow-sm">
            <div className="p-2 bg-blue-500 rounded-lg shadow-md">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-blue-900 mb-0.5">Calendar View</div>
              <div className="text-xs text-blue-700">Showing 14-hour day view (6:00 AM - 8:00 PM)</div>
            </div>
          </div>
        )}
        <BigCalendar
          localizer={localizer}
          events={allEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: view === "day" ? 900 : view === "week" ? 800 : 700 }}
          view={view}
          date={date}
          onView={onViewChange}
          onNavigate={onNavigate}
          onSelectEvent={(event) => {
            // Don't trigger for working hours or availability slot events
            if (event.resource?.type === "working-hours" || event.resource?.type === "availability") {
              return;
            }
            if (event.resource?.bookingId) {
              onSelectEvent?.(event.resource);
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
          popup
          step={30}
          timeslots={2}
          min={minTime}
          max={maxTime}
          className="booking-calendar-enhanced"
          dayPropGetter={(date) => {
            // Make whole day clickable in month view
            if (view === "month") {
              return {
                className: "rbc-day-bg cursor-pointer hover:bg-amber-50/50 transition-colors",
              };
            }
            return {};
          }}
        />
      </CardContent>
    </Card>
  );
};
