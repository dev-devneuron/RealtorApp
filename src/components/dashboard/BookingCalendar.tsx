/**
 * Booking Calendar Component
 * 
 * Displays bookings in day/week/month views using react-big-calendar
 */

import { useMemo } from "react";
import { Calendar as BigCalendar, momentLocalizer, View, SlotInfo } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatTime } from "./utils";
import type { Booking } from "./types";

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

// Custom event component
const EventComponent = ({ event }: { event: Booking }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 border-yellow-600";
      case "approved":
        return "bg-green-500 border-green-600";
      case "denied":
        return "bg-red-500 border-red-600";
      case "cancelled":
        return "bg-gray-500 border-gray-600";
      case "rescheduled":
        return "bg-blue-500 border-blue-600";
      default:
        return "bg-gray-500 border-gray-600";
    }
  };

  return (
    <div className={`${getStatusColor(event.status)} text-white p-1 rounded text-xs border-l-4`}>
      <div className="font-semibold truncate">{event.visitor.name}</div>
      <div className="text-xs opacity-90 truncate">{event.propertyAddress || `Property #${event.propertyId}`}</div>
      <div className="text-xs opacity-75">{formatTime(event.startAt)}</div>
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

  // Custom toolbar
  const CustomToolbar = ({ label, onNavigate: nav, onView }: any) => {
    return (
      <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => nav("PREV")}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => nav("TODAY")}
            className="h-8 px-3"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => nav("NEXT")}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-4 font-semibold text-lg">{label}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => onView("day")}
            className="h-8"
          >
            Day
          </Button>
          <Button
            variant={view === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => onView("week")}
            className="h-8"
          >
            Week
          </Button>
          <Button
            variant={view === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => onView("month")}
            className="h-8"
          >
            Month
          </Button>
        </div>
      </div>
    );
  };

  // Event style getter
  const eventStyleGetter = (event: any) => {
    const status = event.resource?.status || "pending";
    let backgroundColor = "#fbbf24"; // yellow for pending
    
    switch (status) {
      case "approved":
        backgroundColor = "#10b981"; // green
        break;
      case "denied":
        backgroundColor = "#ef4444"; // red
        break;
      case "cancelled":
        backgroundColor = "#6b7280"; // gray
        break;
      case "rescheduled":
        backgroundColor = "#3b82f6"; // blue
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  return (
    <Card className="bg-white shadow-xl border border-amber-100 rounded-xl sm:rounded-2xl">
      <CardContent className="p-4 sm:p-6">
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
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
          min={new Date(2024, 0, 1, 8, 0)} // 8 AM
          max={new Date(2024, 0, 1, 20, 0)} // 8 PM
        />
      </CardContent>
    </Card>
  );
};

