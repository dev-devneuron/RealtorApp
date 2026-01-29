/**
 * Property Vendor Configuration Component
 * 
 * Allows PMs to link vendors to properties, set priorities, and configure settings
 */

import { useState, useEffect, useCallback } from "react";
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
  const [callWindowStart, setCallWindowStart] = useState<number>(8);
  const [callWindowEnd, setCallWindowEnd] = useState<number>(21);
  const [callWindowTimezone, setCallWindowTimezone] = useState<string>("America/New_York");
  const [priorityUpdatingId, setPriorityUpdatingId] = useState<number | null>(null);

  // Only show for Property Managers
  if (userType !== "property_manager") {
    return null;
  }

  const loadPropertyVendors = useCallback(async () => {
    try {
      const response = await fetchPropertyVendors(propertyId);
      setPropertyVendors(response.property_vendors);
    } catch (error: any) {
      toast.error(error.message || "Failed to load property vendors");
    }
  }, [propertyId]);

  const loadAllVendors = useCallback(async () => {
    try {
      const response = await fetchVendors({ is_active: true });
      setAllVendors(response.vendors);
    } catch (error: any) {
      toast.error(error.message || "Failed to load vendors");
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const settingsData = await fetchPropertyVendorSettings(propertyId);
      setSettings(settingsData);
      if (settingsData?.call_time_restrictions) {
        setCallWindowStart(settingsData.call_time_restrictions.start_hour);
        setCallWindowEnd(settingsData.call_time_restrictions.end_hour);
        setCallWindowTimezone(settingsData.call_time_restrictions.timezone);
      } else {
        // Reset local inputs when no restrictions exist (prevents leaking previous property's values)
        setCallWindowStart(8);
        setCallWindowEnd(21);
        setCallWindowTimezone("America/New_York");
      }
    } catch (error: any) {
      // Settings might not exist yet, use defaults
      setSettings({
        settings_id: 0,
        property_id: propertyId,
        auto_call_enabled: false,
        emergency_only: false,
      });
      setCallWindowStart(8);
      setCallWindowEnd(21);
      setCallWindowTimezone("America/New_York");
    }
  }, [propertyId]);

  const loadData = useCallback(async () => {
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
  }, [loadPropertyVendors, loadAllVendors, loadSettings]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleSwapPriority = async (a: PropertyVendor, b: PropertyVendor) => {
    // NOTE: Backend does not expose a "PATCH priority" endpoint yet.
    // We simulate reorder by unlinking and re-linking both items with swapped priorities.
    try {
      setPriorityUpdatingId(a.property_vendor_id);
      await unlinkVendorFromProperty(propertyId, a.property_vendor_id);
      await unlinkVendorFromProperty(propertyId, b.property_vendor_id);

      await linkVendorToProperty(propertyId, {
        vendor_id: a.vendor_id,
        service_type: a.service_type,
        priority: b.priority,
        notes: a.notes,
      });
      await linkVendorToProperty(propertyId, {
        vendor_id: b.vendor_id,
        service_type: b.service_type,
        priority: a.priority,
        notes: b.notes,
      });

      toast.success("Priority updated");
      await loadPropertyVendors();
    } catch (error: any) {
      toast.error(error.message || "Failed to update priority");
      // Best-effort refresh in case one unlink succeeded
      await loadPropertyVendors().catch(() => {});
    } finally {
      setPriorityUpdatingId(null);
    }
  };

  const handleUpdateSettings = async (updates: Partial<PropertyVendorSettings>) => {
    try {
      setUpdatingSettings(true);
      const nextCallTimeRestrictions =
        updates.call_time_restrictions === null
          ? null
          : updates.call_time_restrictions === undefined
            ? settings?.call_time_restrictions
            : updates.call_time_restrictions;

      const updated = await updatePropertyVendorSettings(propertyId, {
        auto_call_enabled: updates.auto_call_enabled ?? settings?.auto_call_enabled ?? false,
        emergency_only: updates.emergency_only ?? settings?.emergency_only ?? false,
        // Preserve existing unless explicitly set; allow explicit clear via null.
        call_time_restrictions: nextCallTimeRestrictions,
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

          {/* Call time restrictions (optional) */}
          <div className="pt-4 border-t border-blue-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-gray-900">Call Time Window (Optional)</p>
                <p className="text-sm text-gray-600">
                  Limit automated vendor calls to a specific time window for this property (uses the selected timezone).
                </p>
              </div>
              <Badge variant="outline" className="border-blue-300 text-blue-800 bg-white">
                {settings?.call_time_restrictions
                  ? "Configured"
                  : "Not set"}
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Start hour</p>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={callWindowStart}
                  onChange={(e) => setCallWindowStart(Number(e.target.value))}
                  className="bg-white"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">End hour</p>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={callWindowEnd}
                  onChange={(e) => setCallWindowEnd(Number(e.target.value))}
                  className="bg-white"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Timezone</p>
                <Select value={callWindowTimezone} onValueChange={setCallWindowTimezone}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                    <SelectItem value="America/Chicago">America/Chicago</SelectItem>
                    <SelectItem value="America/Denver">America/Denver</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={updatingSettings}
                onClick={() => {
                  const start = Math.max(0, Math.min(23, Number(callWindowStart)));
                  const end = Math.max(0, Math.min(23, Number(callWindowEnd)));
                  if (Number.isNaN(start) || Number.isNaN(end)) {
                    toast.error("Please enter valid hours (0–23).");
                    return;
                  }
                  if (start === end) {
                    toast.error("Start and end hour cannot be the same.");
                    return;
                  }
                  handleUpdateSettings({
                    call_time_restrictions: {
                      start_hour: start,
                      end_hour: end,
                      timezone: callWindowTimezone,
                    },
                  });
                }}
                className="border-blue-300 text-blue-800 hover:bg-blue-50"
              >
                Save Call Window
              </Button>
              {settings?.call_time_restrictions && (
                <Button
                  variant="outline"
                  disabled={updatingSettings}
                  onClick={() => handleUpdateSettings({ call_time_restrictions: null })}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Clear
                </Button>
              )}
              <Button
                variant="ghost"
                disabled={updatingSettings}
                onClick={() => {
                  const existing = settings?.call_time_restrictions;
                  if (!existing) {
                    toast.message("No saved call window yet.");
                    return;
                  }
                  setCallWindowStart(existing.start_hour);
                  setCallWindowEnd(existing.end_hour);
                  setCallWindowTimezone(existing.timezone);
                  toast.success("Loaded saved call window.");
                }}
                className="text-gray-600"
              >
                Load saved
              </Button>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Tip: The backend enforces the window; this UI only configures it. Manual “Start Vendor Calls” can still be used anytime.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Configuration by Service Type */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                Configured Vendors
              </CardTitle>
              {propertyAddress && (
                <p className="text-sm text-gray-600">{propertyAddress}</p>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Assign vendors from your vendor pool to this property. Configure priority and service types per property. 
              The same vendor can be assigned multiple times with different service types.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap w-full gap-3 p-2 h-auto bg-gray-100/50">
              {SERVICE_TYPES.map((type) => {
                const count = vendorsByServiceType[type.value]?.length || 0;
                return (
                  <TabsTrigger 
                    key={type.value} 
                    value={type.value} 
                    className="flex flex-col items-center justify-center gap-2 min-w-[100px] sm:min-w-[120px] px-4 py-3 text-sm sm:text-base font-semibold rounded-lg border-2 border-transparent bg-white shadow-sm hover:border-amber-300 hover:shadow-md transition-all data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 data-[state=active]:border-amber-400 data-[state=active]:shadow-md"
                  >
                    <span className="text-center leading-tight">{type.label}</span>
                    {count > 0 && (
                      <Badge 
                        variant="outline" 
                        className="text-xs font-bold px-2.5 py-1 border-amber-400 text-amber-700 bg-amber-100 whitespace-nowrap"
                      >
                        {count} {count === 1 ? "vendor" : "vendors"}
                      </Badge>
                    )}
                    {count === 0 && (
                      <span className="text-xs text-gray-400 font-normal">No vendors</span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {SERVICE_TYPES.map((type) => {
              const vendors = vendorsByServiceType[type.value] || [];
              const availableVendors = getAvailableVendors(type.value);

              return (
                <TabsContent key={type.value} value={type.value} className="mt-6">
                  <div className="space-y-4">
                    {vendors.length === 0 && availableVendors.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No {type.label.toLowerCase()} vendors available</p>
                      </div>
                    ) : (
                      <>
                        {vendors.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-3">
                              {vendors.length} {vendors.length === 1 ? "Vendor" : "Vendors"} Configured (Priority Order)
                            </p>
                          </div>
                        )}
                        {vendors.map((pv, index) => (
                          <motion.div
                            key={pv.property_vendor_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 hover:border-amber-300 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-md">
                                  <span className="text-base font-bold text-white">
                                    {pv.priority}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <p className="font-bold text-lg text-gray-900">
                                      {pv.vendor_name}
                                    </p>
                                    <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                                      Priority {pv.priority}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1.5">
                                      <Phone className="h-4 w-4 text-gray-500" />
                                      <span className="font-medium">{formatPhoneNumber(pv.vendor_phone)}</span>
                                    </span>
                                    {pv.vendor_email && (
                                      <span className="flex items-center gap-1.5">
                                        <Mail className="h-4 w-4 text-gray-500" />
                                        <span className="font-medium">{pv.vendor_email}</span>
                                      </span>
                                    )}
                                  </div>
                                  {pv.notes && (
                                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                      <p className="text-xs text-amber-800 font-medium">{pv.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (index === 0) return;
                                    const above = vendors[index - 1];
                                    if (!above) return;
                                    handleSwapPriority(pv, above);
                                  }}
                                  disabled={index === 0 || priorityUpdatingId === pv.property_vendor_id}
                                  className="h-9 w-9 p-0 border-gray-300 hover:border-amber-400 hover:bg-amber-50"
                                  title="Move up in priority"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (index === vendors.length - 1) return;
                                    const below = vendors[index + 1];
                                    if (!below) return;
                                    handleSwapPriority(pv, below);
                                  }}
                                  disabled={index === vendors.length - 1 || priorityUpdatingId === pv.property_vendor_id}
                                  className="h-9 w-9 p-0 border-gray-300 hover:border-amber-400 hover:bg-amber-50"
                                  title="Move down in priority"
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnlinkVendor(pv.property_vendor_id)}
                                  className="h-9 w-9 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                                  title="Remove vendor from property"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        <div className="mt-6 pt-6 border-t-2 border-gray-300">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-sm font-semibold text-blue-900 mb-1">
                              Add Vendor to {type.label}
                            </p>
                            <p className="text-xs text-blue-700">
                              Select a vendor from your vendor pool to assign to this property.
                              {availableVendors.length === 0 &&
                                " No available vendors in your pool (create vendors or unlink an existing one to reassign)."}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => openLinkModal(type.value)}
                            disabled={availableVendors.length === 0}
                            className="w-full border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 text-blue-700 font-medium py-3 disabled:opacity-60"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            {availableVendors.length === 0 ? "No vendors available" : `Add ${type.label} Vendor`}
                          </Button>
                        </div>
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
                      {vendor.name} • {vendor.service_type.toUpperCase()} •{" "}
                      {formatPhoneNumber(vendor.phone_number)}
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
