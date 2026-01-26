/**
 * Vendor Management Tab Component
 * 
 * Comprehensive interface for managing vendors (CRUD operations)
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Ban,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  optOutVendor,
  clearVendorOptOut,
  type Vendor,
} from "./vendorApi";
import { formatPhoneNumber } from "./utils";

interface VendorManagementTabProps {
  userType: string | null;
}

const SERVICE_TYPES = [
  { value: "electrician", label: "Electrician" },
  { value: "plumber", label: "Plumber" },
  { value: "carpenter", label: "Carpenter" },
  { value: "hvac", label: "HVAC" },
  { value: "general", label: "General" },
  { value: "emergency", label: "Emergency" },
] as const;

export const VendorManagementTab = ({ userType }: VendorManagementTabProps) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<Partial<Vendor>>({
    name: "",
    service_type: "plumber",
    phone_number: "",
    backup_phone: "",
    email: "",
    operating_hours_start: "09:00",
    operating_hours_end: "17:00",
    emergency_available: false,
    timezone: "America/New_York",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Only show for Property Managers
  if (userType !== "property_manager") {
    return (
      <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-red-100 rounded-full">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Access Restricted</h3>
            <p className="text-gray-600 max-w-md">
              Vendor management is only available to Property Managers.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (serviceTypeFilter !== "all") {
        filters.service_type = serviceTypeFilter;
      }
      if (activeFilter !== "all") {
        filters.is_active = activeFilter === "active";
      }
      const response = await fetchVendors(filters);
      setVendors(response.vendors);
    } catch (error: any) {
      toast.error(error.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = useMemo(() => {
    let filtered = vendors;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.phone_number.includes(query) ||
          v.email?.toLowerCase().includes(query) ||
          v.service_type.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [vendors, searchQuery]);

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      await createVendor(formData);
      toast.success("Vendor created successfully");
      setShowCreateModal(false);
      resetForm();
      await loadVendors();
    } catch (error: any) {
      toast.error(error.message || "Failed to create vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedVendor) return;

    try {
      setSubmitting(true);
      await updateVendor(selectedVendor.vendor_id, formData);
      toast.success("Vendor updated successfully");
      setShowEditModal(false);
      setSelectedVendor(null);
      resetForm();
      await loadVendors();
    } catch (error: any) {
      toast.error(error.message || "Failed to update vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVendor) return;

    try {
      setSubmitting(true);
      await deleteVendor(selectedVendor.vendor_id);
      toast.success("Vendor deleted successfully");
      setShowDeleteDialog(false);
      setSelectedVendor(null);
      await loadVendors();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOptOut = async (vendor: Vendor) => {
    try {
      if (vendor.opted_out) {
        await clearVendorOptOut(vendor.vendor_id);
        toast.success("Vendor opt-out cleared");
      } else {
        await optOutVendor(vendor.vendor_id);
        toast.success("Vendor opted out");
      }
      await loadVendors();
    } catch (error: any) {
      toast.error(error.message || "Failed to update opt-out status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      service_type: "plumber",
      phone_number: "",
      backup_phone: "",
      email: "",
      operating_hours_start: "09:00",
      operating_hours_end: "17:00",
      emergency_available: false,
      timezone: "America/New_York",
      notes: "",
    });
  };

  const openEditModal = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      service_type: vendor.service_type,
      phone_number: vendor.phone_number,
      backup_phone: vendor.backup_phone || "",
      email: vendor.email || "",
      operating_hours_start: vendor.operating_hours_start?.slice(0, 5) || "09:00",
      operating_hours_end: vendor.operating_hours_end?.slice(0, 5) || "17:00",
      emergency_available: vendor.emergency_available,
      timezone: vendor.timezone,
      notes: vendor.notes || "",
    });
    setShowEditModal(true);
  };

  const openDeleteDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowDeleteDialog(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                Vendor Management
              </CardTitle>
              <p className="text-gray-600 text-lg">
                Manage your vendor pool. Vendors can be assigned to multiple properties.
              </p>
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Vendors are created at the Property Manager level and can be reused across multiple properties. 
                  Assign vendors to specific properties in the property detail page.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-sm font-semibold px-4 py-2">
                {filteredVendors.length} {filteredVendors.length === 1 ? "Vendor" : "Vendors"}
              </Badge>
              <Button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search vendors by name, phone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={loadVendors}
                disabled={loading}
                className="whitespace-nowrap"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Vendor List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
          ) : filteredVendors.length === 0 ? (
            <Card className="border border-gray-200">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {searchQuery || serviceTypeFilter !== "all" || activeFilter !== "all"
                    ? "No vendors match your filters"
                    : "No vendors configured. Add your first vendor to get started."}
                </p>
                {!searchQuery && serviceTypeFilter === "all" && activeFilter === "all" && (
                  <Button
                    onClick={() => {
                      resetForm();
                      setShowCreateModal(true);
                    }}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vendor
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredVendors.map((vendor) => (
                  <motion.div
                    key={vendor.vendor_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="h-full border border-gray-200 hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate mb-1">
                              {vendor.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {vendor.service_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            {vendor.opted_out && (
                              <Badge
                                variant="outline"
                                className="border-red-300 text-red-700 text-xs"
                              >
                                <Ban className="h-3 w-3 mr-1" />
                                Opted Out
                              </Badge>
                            )}
                            {!vendor.is_active && (
                              <Badge
                                variant="outline"
                                className="border-gray-300 text-gray-600 text-xs"
                              >
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            <span className="font-mono">
                              {formatPhoneNumber(vendor.phone_number)}
                            </span>
                          </div>
                          {vendor.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-gray-400" />
                              <span className="truncate">{vendor.email}</span>
                            </div>
                          )}
                          {vendor.operating_hours_start && vendor.operating_hours_end && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              <span>
                                {vendor.operating_hours_start.slice(0, 5)} -{" "}
                                {vendor.operating_hours_end.slice(0, 5)}
                              </span>
                            </div>
                          )}
                          {vendor.emergency_available && (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                              <span className="text-orange-600">Emergency Available</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(vendor)}
                            className="flex-1"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOptOut(vendor)}
                            className={vendor.opted_out ? "text-green-700 border-green-300" : "text-red-700 border-red-300"}
                          >
                            {vendor.opted_out ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                Clear Opt-Out
                              </>
                            ) : (
                              <>
                                <Ban className="h-3.5 w-3.5 mr-1.5" />
                                Opt-Out
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(vendor)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Vendor Modal */}
      <Dialog
        open={showCreateModal || showEditModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setShowEditModal(false);
            resetForm();
            setSelectedVendor(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showEditModal ? "Edit Vendor" : "Create New Vendor"}
            </DialogTitle>
            <DialogDescription>
              {showEditModal
                ? "Update vendor information"
                : "Add a new repair vendor to the system"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Vendor Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="ABC Plumbing"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Service Type *
                </label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, service_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Phone Number * (E.164 format)
                </label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  placeholder="+14125551234"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Backup Phone
                </label>
                <Input
                  value={formData.backup_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, backup_phone: e.target.value })
                  }
                  placeholder="+14125551235"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="contact@vendor.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Operating Hours Start
                </label>
                <Input
                  type="time"
                  value={formData.operating_hours_start}
                  onChange={(e) =>
                    setFormData({ ...formData, operating_hours_start: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Operating Hours End
                </label>
                <Input
                  type="time"
                  value={formData.operating_hours_end}
                  onChange={(e) =>
                    setFormData({ ...formData, operating_hours_end: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Timezone
                </label>
                <Input
                  value={formData.timezone}
                  onChange={(e) =>
                    setFormData({ ...formData, timezone: e.target.value })
                  }
                  placeholder="America/New_York"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="emergency_available"
                checked={formData.emergency_available}
                onChange={(e) =>
                  setFormData({ ...formData, emergency_available: e.target.checked })
                }
                className="rounded"
              />
              <label
                htmlFor="emergency_available"
                className="text-sm font-medium text-gray-700"
              >
                Available for Emergency Calls
              </label>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes about this vendor..."
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
                setSelectedVendor(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={showEditModal ? handleUpdate : handleCreate}
              disabled={submitting || !formData.name || !formData.phone_number}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {showEditModal ? "Updating..." : "Creating..."}
                </>
              ) : showEditModal ? (
                "Update Vendor"
              ) : (
                "Create Vendor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedVendor?.name}"? This action
              cannot be undone. The vendor will be soft-deleted and can be restored
              if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};
