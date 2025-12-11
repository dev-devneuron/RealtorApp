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

  // Calculate statistics
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    approved: bookings.filter(b => b.status === "approved").length,
    denied: bookings.filter(b => b.status === "denied").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
    rescheduled: bookings.filter(b => b.status === "rescheduled").length,
  };

  // Group bookings by status for better organization
  const groupedByStatus = {
    pending: bookings.filter(b => b.status === "pending"),
    approved: bookings.filter(b => b.status === "approved"),
    denied: bookings.filter(b => b.status === "denied"),
    cancelled: bookings.filter(b => b.status === "cancelled"),
    rescheduled: bookings.filter(b => b.status === "rescheduled"),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#fbbf24";
      case "approved": return "#10b981";
      case "denied": return "#ef4444";
      case "cancelled": return "#6b7280";
      case "rescheduled": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  const formatBookingRow = (booking: Booking) => {
    const startDateTime = formatDateTime(booking.startAt);
    const endDateTime = formatDateTime(booking.endAt);
    const customerTime = booking.customerSentStartAt 
      ? `${booking.customerSentStartAt} - ${booking.customerSentEndAt || booking.endAt}`
      : "";
    
    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600;">${booking.bookingId}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">${(booking.propertyAddress || `Property #${booking.propertyId}`).replace(/"/g, '&quot;')}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">
          <strong>${(booking.visitor.name || "").replace(/"/g, '&quot;')}</strong><br>
          <small style="color: #6b7280;">${(booking.visitor.email || "").replace(/"/g, '&quot;')}</small>
        </td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">${(booking.visitor.phone || "").replace(/"/g, '&quot;')}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">
          <strong>Start:</strong> ${startDateTime}<br>
          <strong>End:</strong> ${endDateTime}<br>
          ${customerTime ? `<small style="color: #6b7280;"><strong>Customer Time:</strong> ${customerTime.replace(/"/g, '&quot;')}</small>` : ""}
        </td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">
          <span style="color: ${getStatusColor(booking.status)}; font-weight: bold; text-transform: capitalize;">
            ${booking.status}
          </span>
        </td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">
          <strong>Timezone:</strong> ${(booking.timezone || "N/A").replace(/"/g, '&quot;')}<br>
          <strong>Created:</strong> ${booking.createdBy || "N/A"}<br>
          ${booking.requestedAt ? `<strong>Requested:</strong> ${formatDateTime(booking.requestedAt)}<br>` : ""}
          ${booking.createdAt ? `<strong>Created At:</strong> ${formatDateTime(booking.createdAt)}<br>` : ""}
          ${booking.updatedAt ? `<strong>Updated At:</strong> ${formatDateTime(booking.updatedAt)}` : ""}
        </td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; max-width: 200px; word-wrap: break-word;">
          ${(booking.notes || "-").replace(/"/g, '&quot;').replace(/\n/g, '<br>')}
        </td>
      </tr>
    `;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bookings Report - ${new Date().toLocaleDateString()}</title>
        <meta charset="UTF-8">
        <style>
          @media print {
            body { margin: 0; padding: 15px; }
            .page-break { page-break-after: always; }
          }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 30px; 
            color: #1f2937;
            line-height: 1.6;
          }
          .header {
            border-bottom: 3px solid #f59e0b;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 { 
            color: #1f2937; 
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .meta-info {
            color: #6b7280;
            font-size: 14px;
            margin: 10px 0;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 25px 0;
          }
          .stat-card {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #fbbf24;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #92400e;
            margin: 5px 0;
          }
          .stat-label {
            font-size: 12px;
            color: #78350f;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          th { 
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white; 
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
            border: 1px solid #b45309;
          }
          td { 
            border: 1px solid #e5e7eb; 
            padding: 10px; 
            vertical-align: top;
          }
          tr:nth-child(even) { 
            background-color: #f9fafb; 
          }
          tr:hover {
            background-color: #fef3c7;
          }
          .status-section {
            margin: 40px 0;
            page-break-inside: avoid;
          }
          .status-header {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 12px 15px;
            border-radius: 6px 6px 0 0;
            font-weight: 600;
            color: #92400e;
            border: 1px solid #fbbf24;
            border-bottom: none;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          small {
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📅 Bookings Report</h1>
          <div class="meta-info">
            <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
            <strong>Total Bookings:</strong> ${bookings.length}
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total</div>
            <div class="stat-value">${stats.total}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pending</div>
            <div class="stat-value">${stats.pending}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Approved</div>
            <div class="stat-value">${stats.approved}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Denied</div>
            <div class="stat-value">${stats.denied}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Cancelled</div>
            <div class="stat-value">${stats.cancelled}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Rescheduled</div>
            <div class="stat-value">${stats.rescheduled}</div>
          </div>
        </div>

        ${Object.entries(groupedByStatus).map(([status, statusBookings]) => {
          if (statusBookings.length === 0) return "";
          return `
            <div class="status-section">
              <div class="status-header">
                ${status.charAt(0).toUpperCase() + status.slice(1)} Bookings (${statusBookings.length})
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Property Address</th>
                    <th>Visitor Information</th>
                    <th>Contact</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Details</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${statusBookings.map(formatBookingRow).join("")}
                </tbody>
              </table>
            </div>
          `;
        }).join("")}

        <div class="footer">
          <p>This report was generated on ${new Date().toLocaleString()}</p>
          <p>Leasap Booking Management System</p>
        </div>
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

