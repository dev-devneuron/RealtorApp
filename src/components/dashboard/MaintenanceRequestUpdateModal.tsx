import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Check } from "lucide-react";

interface MaintenanceRequestUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMaintenanceRequest: any | null;
  userType: string | null;
  realtors: any[];
  updatingMaintenanceRequest: boolean;
  formData: any;
  onFormDataChange: (data: any) => void;
  onUpdate: (requestId: number, updateData: any) => Promise<void>;
  onClose: () => void;
}

export const MaintenanceRequestUpdateModal = ({
  open,
  onOpenChange,
  selectedMaintenanceRequest,
  userType,
  realtors,
  updatingMaintenanceRequest,
  formData,
  onFormDataChange,
  onUpdate,
  onClose,
}: MaintenanceRequestUpdateModalProps) => {
  const [isReady, setIsReady] = useState(false);

  // Initialize form data when modal opens and request is available
  useEffect(() => {
    if (open && selectedMaintenanceRequest) {
      // Ensure form data is initialized
      if (!formData || Object.keys(formData).length === 0) {
        onFormDataChange({
          status: selectedMaintenanceRequest.status || "pending",
          priority: selectedMaintenanceRequest.priority || "normal",
          assigned_to_realtor_id: selectedMaintenanceRequest.assigned_to_realtor_id || "",
          pm_notes: selectedMaintenanceRequest.pm_notes || "",
          resolution_notes: selectedMaintenanceRequest.resolution_notes || "",
          category: selectedMaintenanceRequest.category || "",
          location: selectedMaintenanceRequest.location || "",
        });
      }
      // Small delay to ensure state is ready
      setTimeout(() => setIsReady(true), 50);
    } else {
      setIsReady(false);
    }
  }, [open, selectedMaintenanceRequest, formData, onFormDataChange]);

  const handleUpdate = async () => {
    if (!selectedMaintenanceRequest || !isReady) return;
    try {
      await onUpdate(selectedMaintenanceRequest.maintenance_request_id, formData);
      onClose();
    } catch (err) {
      // Error already handled in function
    }
  };

  const handleClose = () => {
    setIsReady(false);
    onClose();
  };

  // Don't render until ready
  if (!open || !selectedMaintenanceRequest || !isReady) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col [&>button]:h-10 [&>button]:w-10 [&>button]:right-3 [&>button]:top-3 [&>button]:z-50 [&>button]:bg-white [&>button]:rounded-full [&>button]:shadow-lg [&>button]:border [&>button]:border-gray-300 [&>button]:hover:bg-amber-50 [&>button]:hover:border-amber-400 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:p-0 [&>button>svg]:h-5 [&>button>svg]:w-5 [&>button>svg]:text-gray-700 [&>button>svg]:hover:text-amber-600">
        <DialogHeader className="p-6 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-white flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-gray-900">Update Maintenance Request</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            {userType === "property_manager"
              ? "Update the status, priority, and assignment for this maintenance request."
              : "Update the status and priority for this maintenance request."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">Status</label>
            <Select
              value={formData?.status || "pending"}
              onValueChange={(value) => onFormDataChange({ ...formData, status: value })}
            >
              <SelectTrigger className="w-full bg-white border-amber-300 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">Priority</label>
            <Select
              value={formData?.priority || "normal"}
              onValueChange={(value) => onFormDataChange({ ...formData, priority: value })}
            >
              <SelectTrigger className="w-full bg-white border-amber-300 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {userType === "property_manager" && (
            <>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Assign to Realtor (Optional)</label>
                <Select
                  value={formData?.assigned_to_realtor_id ? String(formData.assigned_to_realtor_id) : "none"}
                  onValueChange={(value) => onFormDataChange({ ...formData, assigned_to_realtor_id: value === "none" ? "" : Number(value) })}
                >
                  <SelectTrigger className="w-full bg-white border-amber-300 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Assignment</SelectItem>
                    {realtors.map((realtor) => (
                      <SelectItem key={realtor.id} value={String(realtor.id)}>
                        {realtor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Category (Optional)</label>
                <Select
                  value={formData?.category || ""}
                  onValueChange={(value) => onFormDataChange({ ...formData, category: value })}
                >
                  <SelectTrigger className="w-full bg-white border-amber-300 rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Category</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="appliance">Appliance</SelectItem>
                    <SelectItem value="heating">Heating</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Location (Optional)</label>
                <Input
                  value={formData?.location || ""}
                  onChange={(e) => onFormDataChange({ ...formData, location: e.target.value })}
                  className="w-full bg-white border-amber-300 rounded-xl"
                  placeholder="e.g., Kitchen, Bathroom, Bedroom 2"
                />
              </div>
            </>
          )}

          {userType === "property_manager" && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">PM Notes (Optional)</label>
              <Textarea
                value={formData?.pm_notes || ""}
                onChange={(e) => onFormDataChange({ ...formData, pm_notes: e.target.value })}
                className="w-full bg-white border-amber-300 rounded-xl min-h-[100px]"
                placeholder="Add notes about this maintenance request..."
              />
            </div>
          )}

          {userType !== "property_manager" && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Notes (Optional)</label>
              <Textarea
                value={formData?.pm_notes || ""}
                onChange={(e) => onFormDataChange({ ...formData, pm_notes: e.target.value })}
                className="w-full bg-white border-amber-300 rounded-xl min-h-[100px]"
                placeholder="Add notes about this maintenance request..."
              />
            </div>
          )}

          {formData?.status === "completed" && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Resolution Notes (Optional)</label>
              <Textarea
                value={formData?.resolution_notes || ""}
                onChange={(e) => onFormDataChange({ ...formData, resolution_notes: e.target.value })}
                className="w-full bg-white border-amber-300 rounded-xl min-h-[100px]"
                placeholder="Describe how the issue was resolved..."
              />
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t border-gray-200 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="rounded-xl"
            disabled={updatingMaintenanceRequest}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl"
            disabled={updatingMaintenanceRequest || !isReady}
          >
            {updatingMaintenanceRequest ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Update Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

