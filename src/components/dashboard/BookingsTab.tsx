import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, RefreshCw } from "lucide-react";
import { Booking } from "./types";

interface BookingsTabProps {
  bookings: Booking[];
  loadingBookings: boolean;
  onRefresh: () => void;
}

export const BookingsTab = ({
  bookings,
  loadingBookings,
  onRefresh,
}: BookingsTabProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              Your Bookings
            </CardTitle>
            <p className="text-gray-600 text-lg">
              All your active and past bookings are listed below.
            </p>
          </motion.div>
        </CardHeader>
        <CardContent className="p-8">
          {loadingBookings ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">Loading bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium text-lg">No bookings found.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <Table>
                <TableHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50">
                  <TableRow className="border-b border-amber-200">
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Booking ID</TableHead>
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Property</TableHead>
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Date</TableHead>
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Time</TableHead>
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b, idx) => (
                    <motion.tr
                      key={b.id || idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      className="hover:bg-amber-50/50 transition-all duration-200 group border-b border-gray-100"
                    >
                      <TableCell className="font-semibold text-gray-900 py-5 px-6 group-hover:text-amber-700 transition-colors">
                        {b.id}
                      </TableCell>
                      <TableCell className="text-gray-600 py-5 px-6">{b.property || b.property_name || b.address}</TableCell>
                      <TableCell className="text-gray-600 py-5 px-6">{b.date}</TableCell>
                      <TableCell className="text-gray-600 py-5 px-6">{b.time}</TableCell>
                      <TableCell className="py-5 px-6">
                        <Badge
                          variant={b.status === "Confirmed" ? "default" : "secondary"}
                          className={`font-bold ${
                            b.status === "Confirmed"
                              ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {b.status}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

