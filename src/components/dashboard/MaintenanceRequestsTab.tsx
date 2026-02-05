import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, RefreshCw, ArrowUp, ArrowDown, Eye, Edit2 } from "lucide-react";
import { formatPhoneNumber } from "./utils";

interface MaintenanceRequestsTabProps {
  userType: string | null;
  maintenanceRequests: any[];
  maintenanceRequestsTotal: number;
  loadingMaintenanceRequests: boolean;
  maintenanceRequestFilterStatus: string;
  maintenanceRequestFilterProperty: string;
  maintenanceRequestFilterPriority: string;
  maintenanceRequestFilterCategory: string;
  maintenanceRequestSortBy: string;
  maintenanceRequestSortOrder: "asc" | "desc";
  apartments: any[];
  onFilterStatusChange: (status: string) => void;
  onFilterPropertyChange: (property: string) => void;
  onFilterPriorityChange: (priority: string) => void;
  onFilterCategoryChange: (category: string) => void;
  onSortByChange: (sortBy: string) => void;
  onSortOrderChange: (order: "asc" | "desc") => void;
  onRefresh: () => void;
  onViewRequest: (request: any) => Promise<void>;
  onEditRequest: (request: any) => void;
}

export const MaintenanceRequestsTab = ({
  userType,
  maintenanceRequests,
  maintenanceRequestsTotal,
  loadingMaintenanceRequests,
  maintenanceRequestFilterStatus,
  maintenanceRequestFilterProperty,
  maintenanceRequestFilterPriority,
  maintenanceRequestFilterCategory,
  maintenanceRequestSortBy,
  maintenanceRequestSortOrder,
  apartments,
  onFilterStatusChange,
  onFilterPropertyChange,
  onFilterPriorityChange,
  onFilterCategoryChange,
  onSortByChange,
  onSortOrderChange,
  onRefresh,
  onViewRequest,
  onEditRequest,
}: MaintenanceRequestsTabProps) => {
  const quickFilterValue =
    maintenanceRequestFilterPriority !== "all" && maintenanceRequestFilterCategory !== "all"
      ? "custom"
      : maintenanceRequestFilterPriority !== "all"
        ? `priority:${maintenanceRequestFilterPriority}`
        : maintenanceRequestFilterCategory !== "all"
          ? `category:${maintenanceRequestFilterCategory}`
          : "all";

  const handleQuickFilterChange = (value: string) => {
    if (value === "all") {
      onFilterPriorityChange("all");
      onFilterCategoryChange("all");
      return;
    }
    if (value.startsWith("priority:")) {
      onFilterPriorityChange(value.replace("priority:", ""));
      onFilterCategoryChange("all");
      return;
    }
    if (value.startsWith("category:")) {
      onFilterCategoryChange(value.replace("category:", ""));
      onFilterPriorityChange("all");
      return;
    }
  };

  const sortValue = `${maintenanceRequestSortBy}:${maintenanceRequestSortOrder}`;
  const handleSortChange = (value: string) => {
    const [by, order] = value.split(":");
    if (!by || (order !== "asc" && order !== "desc")) return;
    onSortByChange(by);
    onSortOrderChange(order);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-200 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-4 rounded-lg shadow-sm">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                  Maintenance Requests
                </CardTitle>
                <p className="text-gray-600 text-base">View and manage maintenance requests from tenants.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-100 text-amber-800 border-0 text-sm font-semibold px-4 py-2">
                {maintenanceRequestsTotal} {maintenanceRequestsTotal === 1 ? "Request" : "Requests"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {/* Filter Bar */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              <Select value={maintenanceRequestFilterStatus} onValueChange={onFilterStatusChange}>
                <SelectTrigger className="w-full sm:w-48 bg-white border-gray-300 rounded-lg">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {userType === "property_manager" && (
                <Select value={maintenanceRequestFilterProperty} onValueChange={onFilterPropertyChange}>
                  <SelectTrigger className="w-full sm:w-48 bg-white border-gray-300 rounded-lg">
                    <SelectValue placeholder="Filter by property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {apartments.map((apt) => (
                      <SelectItem key={apt.id} value={String(apt.id)}>
                        {apt.address || `Property ${apt.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={quickFilterValue} onValueChange={handleQuickFilterChange}>
                <SelectTrigger className="w-full sm:w-56 bg-white border-gray-300 rounded-lg">
                  <SelectValue placeholder="Quick filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All (no extra filters)</SelectItem>
                  <SelectItem value="custom" disabled>
                    Custom (Priority + Category)
                  </SelectItem>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Priority</SelectLabel>
                    <SelectItem value="priority:low">Low</SelectItem>
                    <SelectItem value="priority:normal">Normal</SelectItem>
                    <SelectItem value="priority:high">High</SelectItem>
                    <SelectItem value="priority:urgent">Urgent</SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Category</SelectLabel>
                    <SelectItem value="category:plumbing">Plumbing</SelectItem>
                    <SelectItem value="category:electrical">Electrical</SelectItem>
                    <SelectItem value="category:heating">Heating</SelectItem>
                    <SelectItem value="category:hvac">HVAC</SelectItem>
                    <SelectItem value="category:appliance">Appliance</SelectItem>
                    <SelectItem value="category:other">Other</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={sortValue} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-56 bg-white border-gray-300 rounded-lg">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Date</SelectLabel>
                    <SelectItem value="submitted_at:desc">Newest first</SelectItem>
                    <SelectItem value="submitted_at:asc">Oldest first</SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Priority</SelectLabel>
                    <SelectItem value="priority:desc">High → Low</SelectItem>
                    <SelectItem value="priority:asc">Low → High</SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem value="status:asc">A → Z</SelectItem>
                    <SelectItem value="status:desc">Z → A</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Button onClick={onRefresh} variant="outline" className="bg-white border-gray-300 hover:bg-gray-50 rounded-lg">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loadingMaintenanceRequests ? (
            <div className="text-center py-12">
              <RefreshCw className="h-10 w-10 animate-spin text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">Loading maintenance requests...</p>
            </div>
          ) : maintenanceRequests.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium text-xl mb-2">No maintenance requests found</p>
              <p className="text-gray-400 text-sm">Maintenance requests will appear here when tenants submit them.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-900 py-6 px-6 text-lg">ID</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-6 px-6 text-lg">Tenant</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-6 px-6 text-lg">Property</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-6 px-6 text-lg">Issue</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-6 px-6 text-lg">Priority</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-6 px-6 text-lg">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-6 px-6 text-lg">Submitted</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-6 px-6 text-lg">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceRequests.map((request, idx) => (
                    <motion.tr
                      key={request.maintenance_request_id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="py-4 px-6">
                        <span className="font-semibold text-gray-900">#{request.maintenance_request_id}</span>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-gray-900">{request.tenant_name || "Unknown"}</p>
                          {request.tenant_phone && <p className="text-sm text-gray-500">{formatPhoneNumber(request.tenant_phone)}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <p className="text-gray-900">{request.property_address || "N/A"}</p>
                        {request.location && <p className="text-sm text-gray-500">{request.location}</p>}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <p className="text-gray-900 line-clamp-2">{request.issue_description || "N/A"}</p>
                        {request.category && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {request.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge
                          className={`text-sm font-semibold ${
                            request.priority === "urgent"
                              ? "bg-red-100 text-red-700 border-red-300"
                              : request.priority === "high"
                              ? "bg-orange-100 text-orange-700 border-orange-300"
                              : request.priority === "normal"
                              ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                              : "bg-gray-100 text-gray-700 border-gray-300"
                          }`}
                        >
                          {request.priority || "normal"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge
                          className={`text-sm font-semibold ${
                            request.status === "completed"
                              ? "bg-green-100 text-green-700 border-green-300"
                              : request.status === "in_progress"
                              ? "bg-blue-100 text-blue-700 border-blue-300"
                              : request.status === "cancelled"
                              ? "bg-gray-100 text-gray-700 border-gray-300"
                              : "bg-amber-100 text-amber-700 border-amber-300"
                          }`}
                        >
                          {request.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <p className="text-sm text-gray-900">
                          {request.submitted_at ? new Date(request.submitted_at).toLocaleDateString() : "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {request.submitted_at ? new Date(request.submitted_at).toLocaleTimeString() : ""}
                        </p>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => onViewRequest(request)} className="rounded-lg">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => onEditRequest(request)} className="rounded-lg">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
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

