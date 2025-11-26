/**
 * Booking Export Component
 * 
 * Handles CSV and PDF export of bookings
 */

import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import type { Booking } from "./types";
import { formatDate, formatTime, formatDateTime } from "./utils";

interface BookingExportProps {
  bookings: Booking[];
  filters?: {
    status?: string;
    search?: string;
  };
}

export const exportToCSV = (bookings: Booking[], filename: string = "bookings") => {
  if (bookings.length === 0) {
    toast.error("No bookings to export");
    return;
  }

  // CSV headers
  const headers = [
    "Booking ID",
    "Property Address",
    "Visitor Name",
    "Visitor Phone",
    "Visitor Email",
    "Start Date",
    "Start Time",
    "End Date",
    "End Time",
    "Status",
    "Timezone",
    "Notes",
    "Created At",
    "Updated At",
  ];

  // CSV rows
  const rows = bookings.map((booking) => [
    booking.bookingId.toString(),
    booking.propertyAddress || `Property #${booking.propertyId}`,
    booking.visitor.name,
    booking.visitor.phone,
    booking.visitor.email || "",
    formatDate(booking.startAt),
    formatTime(booking.startAt),
    formatDate(booking.endAt),
    formatTime(booking.endAt),
    booking.status,
    booking.timezone || "",
    booking.notes || "",
    booking.createdAt ? formatDateTime(booking.createdAt) : "",
    booking.updatedAt ? formatDateTime(booking.updatedAt) : "",
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.success(`Exported ${bookings.length} bookings to CSV`);
};

export const exportToPDF = async (bookings: Booking[], filename: string = "bookings") => {
  if (bookings.length === 0) {
    toast.error("No bookings to export");
    return;
  }

  // For PDF, we'll use a simple HTML-to-PDF approach
  // In production, you might want to use a library like jsPDF or pdfmake
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bookings Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f59e0b; color: white; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .status-pending { color: #fbbf24; font-weight: bold; }
          .status-approved { color: #10b981; font-weight: bold; }
          .status-denied { color: #ef4444; font-weight: bold; }
          .status-cancelled { color: #6b7280; font-weight: bold; }
          .status-rescheduled { color: #3b82f6; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Bookings Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Bookings: ${bookings.length}</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Property</th>
              <th>Visitor</th>
              <th>Phone</th>
              <th>Date/Time</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${bookings
              .map(
                (booking) => `
              <tr>
                <td>${booking.bookingId}</td>
                <td>${booking.propertyAddress || `Property #${booking.propertyId}`}</td>
                <td>${booking.visitor.name}</td>
                <td>${booking.visitor.phone}</td>
                <td>${formatDate(booking.startAt)} ${formatTime(booking.startAt)}</td>
                <td class="status-${booking.status}">${booking.status}</td>
                <td>${booking.notes || "-"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  // Open in new window for printing/saving as PDF
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    toast.success("Opening PDF preview. Use your browser's print dialog to save as PDF.");
  } else {
    toast.error("Please allow popups to export PDF");
  }
};

export const BookingExport = ({ bookings, filters }: BookingExportProps) => {
  const handleCSVExport = () => {
    exportToCSV(bookings, "bookings");
  };

  const handlePDFExport = () => {
    exportToPDF(bookings, "bookings");
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleCSVExport}
        variant="outline"
        size="sm"
        className="min-h-[44px]"
        disabled={bookings.length === 0}
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <Button
        onClick={handlePDFExport}
        variant="outline"
        size="sm"
        className="min-h-[44px]"
        disabled={bookings.length === 0}
      >
        <FileText className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
    </div>
  );
};

