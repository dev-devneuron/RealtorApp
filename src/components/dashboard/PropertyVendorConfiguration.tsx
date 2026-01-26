/**
 * Property Vendor Configuration Component
 * 
 * Allows PMs to link vendors to properties, set priorities, and configure settings
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Loader2,
  Phone,
  Mail,
  Settings,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchPropertyVendors,
  linkVendorToProperty,
  unlinkVendorFromProperty,
  fetchVendors,
  fetchPropertyVendorSettings,
  updatePropertyVendorSettings,
  type PropertyVendor,
  type Vendor,
  type PropertyVendorSettings,
} from "./vendorApi";
import { formatPhoneNumber } from "./utils";

interface PropertyVendorConfigurationProps {
  propertyId: number;
  propertyAddress?: string;
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

export const PropertyVendorConfiguration = ({
  propertyId,
  propertyAddress,
  userType,
}: PropertyVendorConfigurationProps) => {
  const [propertyVendors, setPropertyVendors] = useState<PropertyVendor[]>([]);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [settings, setSettings] = useState<PropertyVendorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("electrician");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("plumber");
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [priority, setPriority] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Only show for Property Managers
  if (userType !== "property_manager") {
    return null;
  }

  useEffect(() => {
    loadData();
  }, [propertyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPropertyVendors(),
        loadAllVendors(),
        loadSettings(),
      ]);
    } catch (error: any) {
      toast.error(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadPropertyVendors = async () => {
    try {
      const response = await fetchPropertyVendors(propertyId);
      setPropertyVendors(response.property_vendors);
    } catch (error: any) {
      toast.error(error.message || "Failed to load property vendors");
    }
  };

  const loadAllVendors = async () => {
    try {
      const response = await fetchVendors({ is_active: true });
      setAllVendors(response.vendors);
    } catch (error: any) {
      toast.error(error.message || "Failed to load vendors");
    }
  };

  const loadSettings = async () => {
    try {
      const settingsData = await fetchPropertyVendorSettings(propertyId);
      setSettings(settingsData);
    } catch (error: any) {
      // Settings might not exist yet, use defaults
      setSettings({
        settings_id: 0,
        property_id: propertyId,
        auto_call_enabled: false,
        emergency_only: false,
      });
    }
  };

  const handleLinkVendor = async () => {
    if (!selectedVendorId) {
      toast.error("Please select a vendor");
      return;
    }

    try {
      setSubmitting(true);
      await linkVendorToProperty(propertyId, {
        vendor_id: selectedVendorId,
        service_type: selectedServiceType,
        priority,
        notes: notes || undefined,
      });
      toast.success("Vendor linked successfully");
      setShowLinkModal(false);
      resetLinkForm();
      await loadPropertyVendors();
    } catch (error: any) {
      toast.error(error.message || "Failed to link vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlinkVendor = async (propertyVendorId: number) => {
    if (!confirm("Are you sure you want to unlink this vendor?")) {
      return;
    }

    try {
      await unlinkVendorFromProperty(propertyId, propertyVendorId);
      toast.success("Vendor unlinked successfully");
      await loadPropertyVendors();
    } catch (error: any) {
      toast.error(error.message || "Failed to unlink vendor");
    }
  };

  const handleUpdatePriority = async (
    propertyVendorId: number,
    newPriority: number
  ) => {
    // For now, we'll need to unlink and re-link with new priority
    // In a full implementation, you'd have an update endpoint
    const vendor = propertyVendors.find((pv) => pv.property_vendor_id === propertyVendorId);
    if (!vendor) return;

    try {
      await unlinkVendorFromProperty(propertyId, propertyVendorId);
      await linkVendorToProperty(propertyId, {
        vendor_id: vendor.vendor_id,
        service_type: vendor.service_type,
        priority: newPriority,
        notes: vendor.notes,
      });
      toast.success("Priority updated");
      await loadPropertyVendors();
    } catch (error: any) {
      toast.error(error.message || "Failed to update priority");
    }
  };

  const handleUpdateSettings = async (updates: Partial<PropertyVendorSettings>) => {
    try {
      setUpdatingSettings(true);
      const updated = await updatePropertyVendorSettings(propertyId, {
        auto_call_enabled: updates.auto_call_enabled ?? settings?.auto_call_enabled ?? false,
        emergency_only: updates.emergency_only ?? settings?.emergency_only ?? false,
        call_time_restrictions: updates.call_time_restrictions,
      });
      setSettings(updated);
      toast.success("Settings updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setUpdatingSettings(false);
    }
  };

  const resetLinkForm = () => {
    setSelectedVendorId(null);
    setPriority(1);
    setNotes("");
  };

  const openLinkModal = (serviceType: string) => {
    setSelectedServiceType(serviceType);
    const existingVendors = propertyVendors.filter((pv) => pv.service_type === serviceType);
    setPriority(existingVendors.length + 1);
    setShowLinkModal(true);
  };

  // Group vendors by service type
  const vendorsByServiceType = propertyVendors.reduce((acc, pv) => {
    if (!acc[pv.service_type]) {
      acc[pv.service_type] = [];
    }
    acc[pv.service_type].push(pv);
    return acc;
  }, {} as Record<string, PropertyVendor[]>);

  // Sort vendors by priority within each service type
  Object.keys(vendorsByServiceType).forEach((serviceType) => {
    vendorsByServiceType[serviceType].sort((a, b) => a.priority - b.priority);
  });

  // Get available vendors for a service type (not already linked)
  const getAvailableVendors = (serviceType: string): Vendor[] => {
    const linkedVendorIds = propertyVendors
      .filter((pv) => pv.service_type === serviceType)
      .map((pv) => pv.vendor_id);
    return allVendors.filter(
      (v) =>
        v.service_type === serviceType &&
        !linkedVendorIds.includes(v.vendor_id) &&
        v.is_active &&
        !v.opted_out
    );
  };

  if (loading) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Settings Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Vendor Calling Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Auto-Call Enabled</p>
              <p className="text-sm text-gray-600">
                Automatically call vendors when maintenance requests are submitted
              </p>
            </div>
            <Button
              variant={settings?.auto_call_enabled ? "default" : "outline"}
              onClick={() =>
                handleUpdateSettings({ auto_call_enabled: !settings?.auto_call_enabled })
              }
              disabled={updatingSettings}
              className={
                settings?.auto_call_enabled
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }
            >
              {settings?.auto_call_enabled ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Enabled
                </>
              ) : (
                "Disabled"
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Emergency Only</p>
              <p className="text-sm text-gray-600">
                Only auto-call for emergency priority requests
              </p>
            </div>
            <Button
              variant={settings?.emergency_only ? "default" : "outline"}
              onClick={() =>
                handleUpdateSettings({ emergency_only: !settings?.emergency_only })
              }
              disabled={updatingSettings}
              className={
                settings?.emergency_only
                  ? "bg-orange-600 hover:bg-orange-700"
                  : ""
              }
            >
              {settings?.emergency_only ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Enabled
                </>
              ) : (
                "Disabled"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Configuration by Service Type */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
              Configured Vendors
            </CardTitle>
            {propertyAddress && (
              <p className="text-sm text-gray-600">{propertyAddress}</p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              {SERVICE_TYPES.map((type) => {
                const count = vendorsByServiceType[type.value]?.length || 0;
                return (
                  <TabsTrigger key={type.value} value={type.value} className="text-xs sm:text-sm">
                    {type.label}
                    {count > 0 && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {SERVICE_TYPES.map((type) => {
              const vendors = vendorsByServiceType[type.value] || [];
              const availableVendors = getAvailableVendors(type.value);

              return (
                <TabsContent key={type.value} value={type.value} className="mt-4">
                  <div className="space-y-3">
                    {vendors.length === 0 && availableVendors.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No {type.label.toLowerCase()} vendors available</p>
                      </div>
                    ) : (
                      <>
                        {vendors.map((pv, index) => (
                          <motion.div
                            key={pv.property_vendor_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="border border-gray-200 rounded-lg p-4 bg-white"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-semibold text-amber-700">
                                    {pv.priority}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 truncate">
                                    {pv.vendor_name}
                                  </p>
                                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3.5 w-3.5" />
                                      {formatPhoneNumber(pv.vendor_phone)}
                                    </span>
                                    {pv.vendor_email && (
                                      <span className="flex items-center gap-1">
                                        <Mail className="h-3.5 w-3.5" />
                                        {pv.vendor_email}
                                      </span>
                                    )}
                                  </div>
                                  {pv.notes && (
                                    <p className="text-xs text-gray-500 mt-1">{pv.notes}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdatePriority(pv.property_vendor_id, pv.priority - 1)
                                  }
                                  disabled={index === 0}
                                  className="h-8 w-8 p-0"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdatePriority(pv.property_vendor_id, pv.priority + 1)
                                  }
                                  disabled={index === vendors.length - 1}
                                  className="h-8 w-8 p-0"
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleUnlinkVendor(pv.property_vendor_id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        {availableVendors.length > 0 && (
                          <Button
                            variant="outline"
                            onClick={() => openLinkModal(type.value)}
                            className="w-full border-dashed"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add {type.label} Vendor
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Link Vendor Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Vendor to Property</DialogTitle>
            <DialogDescription>
              Add a vendor for {SERVICE_TYPES.find((t) => t.value === selectedServiceType)?.label}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Select Vendor *
              </label>
              <Select
                value={selectedVendorId?.toString() || ""}
                onValueChange={(value) => setSelectedVendorId(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableVendors(selectedServiceType).map((vendor) => (
                    <SelectItem key={vendor.vendor_id} value={vendor.vendor_id.toString()}>
                      {vendor.name} - {formatPhoneNumber(vendor.phone_number)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Priority *
              </label>
              <Input
                type="number"
                min="1"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Lower numbers are called first (1 = highest priority)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this vendor for this property..."
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLinkVendor}
              disabled={submitting || !selectedVendorId}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Linking...
                </>
              ) : (
                "Link Vendor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
