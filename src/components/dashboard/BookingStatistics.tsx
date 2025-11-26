/**
 * Booking Statistics Component with Charts
 * 
 * Enhanced statistics dashboard with visualizations
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import type { Booking } from "./types";

interface BookingStatisticsProps {
  bookings: Booking[];
}

const COLORS = {
  pending: "#fbbf24",
  approved: "#10b981",
  denied: "#ef4444",
  cancelled: "#6b7280",
  rescheduled: "#3b82f6",
};

export const BookingStatistics = ({ bookings }: BookingStatisticsProps) => {
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const approved = bookings.filter((b) => b.status === "approved").length;
    const denied = bookings.filter((b) => b.status === "denied").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const rescheduled = bookings.filter((b) => b.status === "rescheduled").length;

    const approvalRate = total > 0
      ? Math.round((approved / (approved + denied)) * 100)
      : 0;

    // Calculate average response time
    const respondedBookings = bookings.filter(
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

    // Bookings by status for pie chart
    const statusData = [
      { name: "Pending", value: pending, color: COLORS.pending },
      { name: "Approved", value: approved, color: COLORS.approved },
      { name: "Denied", value: denied, color: COLORS.denied },
      { name: "Cancelled", value: cancelled, color: COLORS.cancelled },
      { name: "Rescheduled", value: rescheduled, color: COLORS.rescheduled },
    ].filter((item) => item.value > 0);

    // Bookings over time (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    const bookingsOverTime = last7Days.map((date) => {
      const dayBookings = bookings.filter((b) => {
        const bookingDate = new Date(b.startAt).toISOString().split("T")[0];
        return bookingDate === date;
      });
      return {
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        bookings: dayBookings.length,
        approved: dayBookings.filter((b) => b.status === "approved").length,
        pending: dayBookings.filter((b) => b.status === "pending").length,
      };
    });

    // Most requested properties
    const propertyCounts = bookings.reduce((acc, booking) => {
      const key = booking.propertyAddress || `Property #${booking.propertyId}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topProperties = Object.entries(propertyCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      total,
      pending,
      approved,
      denied,
      cancelled,
      rescheduled,
      approvalRate,
      avgResponseTime,
      statusData,
      bookingsOverTime,
      topProperties,
    };
  }, [bookings]);

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-blue-700 font-medium mb-1">Total</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-900">{stats.total}</div>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-yellow-700 font-medium mb-1">Pending</div>
          <div className="text-xl sm:text-2xl font-bold text-yellow-900">{stats.pending}</div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-green-700 font-medium mb-1">Approved</div>
          <div className="text-xl sm:text-2xl font-bold text-green-900">{stats.approved}</div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-red-700 font-medium mb-1">Denied</div>
          <div className="text-xl sm:text-2xl font-bold text-red-900">{stats.denied}</div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-purple-700 font-medium mb-1">Approval Rate</div>
          <div className="text-xl sm:text-2xl font-bold text-purple-900">{stats.approvalRate}%</div>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-indigo-700 font-medium mb-1">Avg Response</div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-900">{stats.avgResponseTime}m</div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        {/* Status Distribution Pie Chart */}
        {stats.statusData.length > 0 && (
          <Card className="bg-white shadow-xl border border-amber-100 rounded-xl sm:rounded-2xl">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl lg:text-xl xl:text-2xl">Bookings by Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Bookings Over Time Line Chart */}
        {stats.bookingsOverTime.length > 0 && (
          <Card className="bg-white shadow-xl border border-amber-100 rounded-xl sm:rounded-2xl">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl lg:text-xl xl:text-2xl">Bookings Over Time (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.bookingsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="bookings" stroke="#3b82f6" name="Total" />
                  <Line type="monotone" dataKey="approved" stroke="#10b981" name="Approved" />
                  <Line type="monotone" dataKey="pending" stroke="#fbbf24" name="Pending" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Properties Bar Chart */}
        {stats.topProperties.length > 0 && (
          <Card className="bg-white shadow-xl border border-amber-100 rounded-xl sm:rounded-2xl lg:col-span-2">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl lg:text-xl xl:text-2xl">Most Requested Properties</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.topProperties}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

