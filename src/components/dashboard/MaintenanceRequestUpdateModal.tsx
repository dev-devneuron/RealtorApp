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
  // Ensure formData is always an object
  const safeFormData = formData || {};

  const handleUpdate = async () => {
    if (!selectedMaintenanceRequest || !safeFormData || Object.keys(safeFormData).length === 0) {
      return;
    }
    try {
      // Filter out null values for optional fields - convert to undefined so they're omitted from JSON
      const updateData: any = { ...safeFormData };
      if (updateData.assigned_to_realtor_id === null) {
        updateData.assigned_to_realtor_id = undefined;
      }
      if (updateData.category === null) {
        updateData.category = undefined;
      }
      await onUpdate(selectedMaintenanceRequest.maintenance_request_id, updateData);
      onClose();
    } catch (err) {
      // Error already handled in function
    }
  };

  // Check if we have the minimum required data
  const hasData = selectedMaintenanceRequest && safeFormData && Object.keys(safeFormData).length > 0;

  // Don't render anything if modal is closed
  if (!open) {
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

        {!hasData ? (
          <div className="flex-1 flex items-center justify-center p-12 min-h-[300px]">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading request details...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Status</label>
              <Select
                value={safeFormData.status || "pending"}
                onValueChange={(value) => onFormDataChange({ ...safeFormData, status: value })}
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
                value={safeFormData.priority || "normal"}
                onValueChange={(value) => onFormDataChange({ ...safeFormData, priority: value })}
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
                    value={safeFormData.assigned_to_realtor_id ? String(safeFormData.assigned_to_realtor_id) : "none"}
                    onValueChange={(value) => onFormDataChange({ ...safeFormData, assigned_to_realtor_id: value === "none" ? null : Number(value) })}
                  >
                    <SelectTrigger className="w-full bg-white border-amber-300 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Assignment</SelectItem>
                      {realtors && realtors.map((realtor) => (
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
                    value={safeFormData.category && safeFormData.category !== "" ? safeFormData.category : "none"}
                    onValueChange={(value) => onFormDataChange({ ...safeFormData, category: value === "none" ? null : value })}
                  >
                    <SelectTrigger className="w-full bg-white border-amber-300 rounded-xl">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
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
                    value={safeFormData.location || ""}
                    onChange={(e) => onFormDataChange({ ...safeFormData, location: e.target.value })}
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
                  value={safeFormData.pm_notes || ""}
                  onChange={(e) => onFormDataChange({ ...safeFormData, pm_notes: e.target.value })}
                  className="w-full bg-white border-amber-300 rounded-xl min-h-[100px]"
                  placeholder="Add notes about this maintenance request..."
                />
              </div>
            )}

            {userType !== "property_manager" && (
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Notes (Optional)</label>
                <Textarea
                  value={safeFormData.pm_notes || ""}
                  onChange={(e) => onFormDataChange({ ...safeFormData, pm_notes: e.target.value })}
                  className="w-full bg-white border-amber-300 rounded-xl min-h-[100px]"
                  placeholder="Add notes about this maintenance request..."
                />
              </div>
            )}

            {safeFormData.status === "completed" && (
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Resolution Notes (Optional)</label>
                <Textarea
                  value={safeFormData.resolution_notes || ""}
                  onChange={(e) => onFormDataChange({ ...safeFormData, resolution_notes: e.target.value })}
                  className="w-full bg-white border-amber-300 rounded-xl min-h-[100px]"
                  placeholder="Describe how the issue was resolved..."
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter className="p-6 border-t border-gray-200 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
            disabled={updatingMaintenanceRequest}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl"
            disabled={updatingMaintenanceRequest || !hasData}
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
