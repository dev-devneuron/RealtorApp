import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Check } from "lucide-react";

interface TenantEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTenant: any | null;
  editTenantForm: any;
  onFormChange: (form: any) => void;
  updatingTenant: boolean;
  onUpdate: () => void;
  onCancel: () => void;
}

export const TenantEditModal = ({
  open,
  onOpenChange,
  editingTenant,
  editTenantForm,
  onFormChange,
  updatingTenant,
  onUpdate,
  onCancel,
}: TenantEditModalProps) => {
  if (!editingTenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col [&>button]:h-10 [&>button]:w-10 [&>button]:right-3 [&>button]:top-3 [&>button]:z-50 [&>button]:bg-white [&>button]:rounded-full [&>button]:shadow-lg [&>button]:border [&>button]:border-gray-300 [&>button]:hover:bg-amber-50 [&>button]:hover:border-amber-400 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:p-0 [&>button>svg]:h-5 [&>button>svg]:w-5 [&>button>svg]:text-gray-700 [&>button>svg]:hover:text-amber-600">
        <DialogHeader className="p-6 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-white flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-gray-900">Edit Tenant</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Update tenant information. Setting tenant to inactive will mark the property as "Available" if no other active tenants exist.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Tenant Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={editTenantForm.name}
              onChange={(e) => onFormChange({ ...editTenantForm, name: e.target.value })}
              className="w-full bg-white border-amber-300 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Phone Number</label>
              <Input
                value={editTenantForm.phone_number || ""}
                onChange={(e) => onFormChange({ ...editTenantForm, phone_number: e.target.value })}
                className="w-full bg-white border-amber-300 rounded-xl"
                placeholder="+14125551234"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Email</label>
              <Input
                type="email"
                value={editTenantForm.email || ""}
                onChange={(e) => onFormChange({ ...editTenantForm, email: e.target.value })}
                className="w-full bg-white border-amber-300 rounded-xl"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Unit Number</label>
              <Input
                value={editTenantForm.unit_number || ""}
                onChange={(e) => onFormChange({ ...editTenantForm, unit_number: e.target.value })}
                className="w-full bg-white border-amber-300 rounded-xl"
                placeholder="Apt 3B"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Status</label>
              <Select
                value={editTenantForm.is_active ? "active" : "inactive"}
                onValueChange={(value) => onFormChange({ ...editTenantForm, is_active: value === "active" })}
              >
                <SelectTrigger className="w-full bg-white border-amber-300 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Lease Start Date</label>
              <Input
                type="date"
                value={editTenantForm.lease_start_date || ""}
                onChange={(e) => onFormChange({ ...editTenantForm, lease_start_date: e.target.value })}
                className="w-full bg-white border-amber-300 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Lease End Date</label>
              <Input
                type="date"
                value={editTenantForm.lease_end_date || ""}
                onChange={(e) => onFormChange({ ...editTenantForm, lease_end_date: e.target.value })}
                className="w-full bg-white border-amber-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">Notes (Optional)</label>
            <Textarea
              value={editTenantForm.notes || ""}
              onChange={(e) => onFormChange({ ...editTenantForm, notes: e.target.value })}
              className="w-full bg-white border-amber-300 rounded-xl min-h-[100px]"
              placeholder="Additional notes about the tenant..."
            />
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onCancel}
            className="rounded-xl"
            disabled={updatingTenant}
          >
            Cancel
          </Button>
          <Button
            onClick={onUpdate}
            className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl"
            disabled={updatingTenant || !editTenantForm.name}
          >
            {updatingTenant ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Update Tenant
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

