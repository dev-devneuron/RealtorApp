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
import { RefreshCw, Check, AlertCircle } from "lucide-react";

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
  // Local state to ensure we have form data ready
  const [localFormData, setLocalFormData] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (open && selectedMaintenanceRequest) {
      setIsInitializing(true);
      
      // Initialize form data from selectedMaintenanceRequest if formData is empty
      const initialData = formData && Object.keys(formData).length > 0 
        ? formData 
        : {
            status: selectedMaintenanceRequest.status || "pending",
            priority: selectedMaintenanceRequest.priority || "normal",
            assigned_to_realtor_id: selectedMaintenanceRequest.assigned_to_realtor_id || "",
            pm_notes: selectedMaintenanceRequest.pm_notes || "",
            resolution_notes: selectedMaintenanceRequest.resolution_notes || "",
            category: selectedMaintenanceRequest.category || "",
            location: selectedMaintenanceRequest.location || "",
          };
      
      setLocalFormData(initialData);
      // Also update parent form data
      onFormDataChange(initialData);
      
      // Small delay to ensure state is set
      setTimeout(() => {
        setIsInitializing(false);
      }, 10);
    } else if (!open) {
      // Reset when modal closes
      setLocalFormData(null);
      setIsInitializing(false);
    }
  }, [open, selectedMaintenanceRequest, onFormDataChange]);

  // Sync local form data with parent form data when it changes externally
  useEffect(() => {
    if (open && formData && Object.keys(formData).length > 0) {
      setLocalFormData(formData);
      setIsInitializing(false);
    }
  }, [formData, open]);

  // Use formData if localFormData isn't ready yet
  const currentFormData = localFormData || formData;

  const handleFormChange = (updates: any) => {
    const baseData = localFormData || formData || {};
    const newData = { ...baseData, ...updates };
    setLocalFormData(newData);
    onFormDataChange(newData);
  };

  const handleUpdate = async () => {
    if (!selectedMaintenanceRequest || !currentFormData) return;
    try {
      await onUpdate(selectedMaintenanceRequest.maintenance_request_id, currentFormData);
      onClose();
    } catch (err) {
      // Error already handled in function
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Show loading state if form data isn't ready
  const isReady = !isInitializing && currentFormData && Object.keys(currentFormData).length > 0 && selectedMaintenanceRequest;

  // ALWAYS render Dialog - never return null to prevent white screen
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

        {!isReady ? (
          <div className="flex-1 flex items-center justify-center p-12 min-h-[300px]">
            <div className="text-center">
              {!selectedMaintenanceRequest ? (
                <>
                  <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No request selected</p>
                  <p className="text-gray-500 text-sm mt-2">Please select a maintenance request to update.</p>
                </>
              ) : (
                <>
                  <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Loading request details...</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Status</label>
              <Select
                value={currentFormData.status || "pending"}
                onValueChange={(value) => handleFormChange({ status: value })}
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
                value={currentFormData.priority || "normal"}
                onValueChange={(value) => handleFormChange({ priority: value })}
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
                    value={currentFormData.assigned_to_realtor_id ? String(currentFormData.assigned_to_realtor_id) : "none"}
                    onValueChange={(value) => handleFormChange({ assigned_to_realtor_id: value === "none" ? "" : Number(value) })}
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
                    value={currentFormData.category || ""}
                    onValueChange={(value) => handleFormChange({ category: value })}
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
                    value={currentFormData.location || ""}
                    onChange={(e) => handleFormChange({ location: e.target.value })}
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
                  value={currentFormData.pm_notes || ""}
                  onChange={(e) => handleFormChange({ pm_notes: e.target.value })}
                  className="w-full bg-white border-amber-300 rounded-xl min-h-[100px]"
                  placeholder="Add notes about this maintenance request..."
                />
              </div>
            )}

            {userType !== "property_manager" && (
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Notes (Optional)</label>
                <Textarea
                  value={currentFormData.pm_notes || ""}
                  onChange={(e) => handleFormChange({ pm_notes: e.target.value })}
                  className="w-full bg-white border-amber-300 rounded-xl min-h-[100px]"
                  placeholder="Add notes about this maintenance request..."
                />
              </div>
            )}

            {currentFormData.status === "completed" && (
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Resolution Notes (Optional)</label>
                <Textarea
                  value={currentFormData.resolution_notes || ""}
                  onChange={(e) => handleFormChange({ resolution_notes: e.target.value })}
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
