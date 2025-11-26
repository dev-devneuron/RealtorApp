/**
 * Booking Calendar Component
 * 
 * Beautiful, modern calendar display for bookings with enhanced styling
 */

import { useMemo } from "react";
import { Calendar as BigCalendar, momentLocalizer, View, SlotInfo } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { formatTime } from "./utils";
import type { Booking } from "./types";
import "./BookingCalendar.css";

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
}

// Enhanced event component with beautiful styling
const EventComponent = ({ event }: { event: Booking }) => {
  const getStatusGradient = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gradient-to-r from-amber-400 to-amber-500 border-amber-600";
      case "approved":
        return "bg-gradient-to-r from-emerald-400 to-emerald-500 border-emerald-600";
      case "denied":
        return "bg-gradient-to-r from-red-400 to-red-500 border-red-600";
      case "cancelled":
        return "bg-gradient-to-r from-gray-400 to-gray-500 border-gray-600";
      case "rescheduled":
        return "bg-gradient-to-r from-blue-400 to-blue-500 border-blue-600";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 border-gray-600";
    }
  };

  return (
    <div className={`${getStatusGradient(event.status)} text-white p-2 rounded-lg shadow-lg border-l-4 hover:shadow-xl transition-all cursor-pointer group`}>
      <div className="font-bold text-sm truncate mb-1">{event.visitor.name}</div>
      <div className="text-xs opacity-95 truncate mb-1">{event.propertyAddress || `Property #${event.propertyId}`}</div>
      <div className="text-xs opacity-90 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        {formatTime(event.startAt)}
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
}: BookingCalendarProps) => {
  // Convert bookings to calendar events
  const events = useMemo(() => {
    return bookings.map((booking) => ({
      ...booking,
      title: `${booking.visitor.name} - ${booking.propertyAddress || `Property #${booking.propertyId}`}`,
      start: new Date(booking.startAt),
      end: new Date(booking.endAt),
      resource: booking,
    }));
  }, [bookings]);

  // Enhanced custom toolbar with beautiful design
  const CustomToolbar = ({ label, onNavigate: nav, onView }: any) => {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-gradient-to-r from-amber-50 via-white to-blue-50 rounded-2xl border border-amber-100 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-md">
            <CalendarIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent">
              {label}
            </h3>
            <p className="text-sm text-gray-500">View and manage your bookings</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => nav("PREV")}
            className="h-10 w-10 p-0 rounded-xl border-amber-200 hover:bg-amber-50 hover:border-amber-300 shadow-sm"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => nav("TODAY")}
            className="h-10 px-4 rounded-xl border-amber-200 hover:bg-amber-50 hover:border-amber-300 shadow-sm font-medium"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => nav("NEXT")}
            className="h-10 w-10 p-0 rounded-xl border-amber-200 hover:bg-amber-50 hover:border-amber-300 shadow-sm"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-xl border border-amber-200 shadow-sm">
          <Button
            variant={view === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => onView("day")}
            className={`h-9 px-4 rounded-lg font-medium transition-all ${
              view === "day" 
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md" 
                : "hover:bg-amber-50"
            }`}
          >
            Day
          </Button>
          <Button
            variant={view === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => onView("week")}
            className={`h-9 px-4 rounded-lg font-medium transition-all ${
              view === "week" 
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md" 
                : "hover:bg-amber-50"
            }`}
          >
            Week
          </Button>
          <Button
            variant={view === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => onView("month")}
            className={`h-9 px-4 rounded-lg font-medium transition-all ${
              view === "month" 
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md" 
                : "hover:bg-amber-50"
            }`}
          >
            Month
          </Button>
        </div>
      </div>
    );
  };

  // Enhanced event style getter with gradients
  const eventStyleGetter = (event: any) => {
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

  return (
    <Card className="bg-gradient-to-br from-white via-amber-50/20 to-white border-0 shadow-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-blue-500/5 pointer-events-none" />
      <CardContent className="relative p-6 lg:p-8">
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          view={view}
          date={date}
          onView={onViewChange}
          onNavigate={onNavigate}
          onSelectSlot={onSelectSlot}
          onSelectEvent={(event) => onSelectEvent?.(event.resource)}
          components={{
            toolbar: CustomToolbar,
            event: EventComponent,
          }}
          eventPropGetter={eventStyleGetter}
          selectable
          popup
          step={30}
          timeslots={2}
          min={new Date(2024, 0, 1, 8, 0)}
          max={new Date(2024, 0, 1, 20, 0)}
          className="booking-calendar-enhanced"
        />
      </CardContent>
    </Card>
  );
};
