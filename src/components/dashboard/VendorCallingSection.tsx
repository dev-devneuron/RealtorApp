/**
 * Vendor Calling Section Component
 * 
 * Displays vendor call status, queue, and allows PM to start/pause/cancel calls
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Play,
  Pause,
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  startVendorCalls,
  fetchVendorCallStatus,
  pauseVendorCalls,
  cancelVendorCalls,
  type VendorCallStatus,
  type VendorCallQueue,
} from "./vendorApi";
import { VendorCallAttemptsTimeline } from "./VendorCallAttemptsTimeline";

interface VendorCallingSectionProps {
  maintenanceRequestId: number;
  propertyId: number;
  propertyAddress?: string;
  userType: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-700 border-gray-300",
  calling: "bg-blue-100 text-blue-700 border-blue-300",
  vendor_accepted: "bg-green-100 text-green-700 border-green-300",
  vendor_declined: "bg-orange-100 text-orange-700 border-orange-300",
  no_response: "bg-yellow-100 text-yellow-700 border-yellow-300",
  paused: "bg-purple-100 text-purple-700 border-purple-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  not_started: <Clock className="h-4 w-4" />,
  calling: <Loader2 className="h-4 w-4 animate-spin" />,
  vendor_accepted: <CheckCircle2 className="h-4 w-4" />,
  vendor_declined: <XCircle className="h-4 w-4" />,
  no_response: <AlertCircle className="h-4 w-4" />,
  paused: <Pause className="h-4 w-4" />,
  cancelled: <X className="h-4 w-4" />,
};

export const VendorCallingSection = ({
  maintenanceRequestId,
  propertyId,
  propertyAddress,
  userType,
}: VendorCallingSectionProps) => {
  const [callStatus, setCallStatus] = useState<VendorCallStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  // Only show for Property Managers
  if (userType !== "property_manager") {
    return null;
  }

  // Load initial status
  useEffect(() => {
    loadCallStatus();
  }, [maintenanceRequestId]);

  // Poll for updates when calling is active
  useEffect(() => {
    if (!callStatus || callStatus.vendor_call_status !== "calling") {
      setPolling(false);
      return;
    }

    setPolling(true);
    const interval = setInterval(() => {
      loadCallStatus(true); // Silent refresh
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [callStatus?.vendor_call_status, maintenanceRequestId]);

  const loadCallStatus = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const status = await fetchVendorCallStatus(maintenanceRequestId);
      setCallStatus(status);
    } catch (error: any) {
      if (!silent) {
        toast.error(error.message || "Failed to load vendor call status");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleStartCalls = async () => {
    try {
      setActionLoading(true);
      await startVendorCalls(maintenanceRequestId);
      toast.success("Vendor calls started");
      await loadCallStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to start vendor calls");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseCalls = async () => {
    try {
      setActionLoading(true);
      await pauseVendorCalls(maintenanceRequestId);
      toast.success("Vendor calls paused");
      await loadCallStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to pause vendor calls");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelCalls = async () => {
    if (!confirm("Are you sure you want to cancel vendor calls? This action cannot be undone.")) {
      return;
    }

    try {
      setActionLoading(true);
      await cancelVendorCalls(maintenanceRequestId);
      toast.success("Vendor calls cancelled");
      await loadCallStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel vendor calls");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !callStatus) {
    return (
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = callStatus?.vendor_call_status || "not_started";
  const queue = callStatus?.queue;
  const attempts = callStatus?.call_attempts || [];
  const assignedVendorId = callStatus?.assigned_vendor_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Status Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  Vendor Calling Status
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Automated vendor outreach for this maintenance request
                </p>
                {propertyAddress && (
                  <p className="text-xs text-gray-500 mt-1">
                    Property: {propertyAddress} • Vendors will be called from vendors assigned to this property
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {polling && (
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Live
                </Badge>
              )}
              <Badge className={STATUS_COLORS[status] || STATUS_COLORS.not_started}>
                <span className="flex items-center gap-1.5">
                  {STATUS_ICONS[status]}
                  {status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Assigned Vendor Info */}
          {assignedVendorId && callStatus?.call_attempts?.find(
            (a) => a.vendor_id === assignedVendorId && a.outcome === "accepted"
          ) && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">Vendor Assigned</span>
              </div>
              <p className="text-sm text-green-800">
                {
                  callStatus.call_attempts.find(
                    (a) => a.vendor_id === assignedVendorId && a.outcome === "accepted"
                  )?.vendor_name
                }
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {status === "not_started" && (
              <Button
                onClick={handleStartCalls}
                disabled={actionLoading}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Vendor Calls
                  </>
                )}
              </Button>
            )}

            {status === "calling" && (
              <>
                <Button
                  onClick={handlePauseCalls}
                  disabled={actionLoading}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Pausing...
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Calls
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancelCalls}
                  disabled={actionLoading}
                  variant="destructive"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel Calls
                    </>
                  )}
                </Button>
              </>
            )}

            {status === "paused" && (
              <>
                <Button
                  onClick={handleStartCalls}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resuming...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Resume Calls
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancelCalls}
                  disabled={actionLoading}
                  variant="destructive"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel Calls
                    </>
                  )}
                </Button>
              </>
            )}

            <Button
              onClick={() => loadCallStatus()}
              disabled={loading || actionLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Call Queue Card */}
      {queue && (
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              Call Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <Badge variant="outline">{queue.status}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current Vendor:</span>
                <span className="font-medium">
                  {queue.current_vendor_index < queue.vendor_queue.length
                    ? `${queue.current_vendor_index + 1} of ${queue.vendor_queue.length}`
                    : "Complete"}
                </span>
              </div>
              {queue.started_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Started:</span>
                  <span className="text-gray-900">
                    {new Date(queue.started_at).toLocaleString()}
                  </span>
                </div>
              )}
              {queue.vendor_queue.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Vendor Queue:</p>
                  <div className="space-y-1">
                    {queue.vendor_queue.map((vendor, idx) => (
                      <div
                        key={vendor.vendor_id}
                        className={`flex items-center justify-between p-2 rounded ${
                          idx === queue.current_vendor_index
                            ? "bg-blue-50 border border-blue-200"
                            : idx < queue.current_vendor_index
                            ? "bg-gray-50"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        <span className="text-sm">
                          <span className="font-medium">{idx + 1}.</span> {vendor.name}
                        </span>
                        {idx === queue.current_vendor_index && (
                          <Badge variant="outline" className="border-blue-300 text-blue-700">
                            Current
                          </Badge>
                        )}
                        {idx < queue.current_vendor_index && (
                          <Badge variant="outline" className="border-gray-300 text-gray-600">
                            Called
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call Attempts Timeline */}
      {attempts.length > 0 && (
        <VendorCallAttemptsTimeline attempts={attempts} />
      )}

      {/* Empty State */}
      {status === "not_started" && attempts.length === 0 && (
        <Card className="border border-gray-200 bg-gray-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              No vendor calls have been initiated yet. Click "Start Vendor Calls" to begin.
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};
