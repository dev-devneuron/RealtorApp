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
import { UserPlus, RefreshCw } from "lucide-react";
import { getPropertyMetadata } from "./utils";

interface TenantAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newTenant: any;
  onFormChange: (tenant: any) => void;
  apartments: any[];
  realtors: any[];
  creatingTenant: boolean;
  onCreate: () => void;
  onCancel: () => void;
}

export const TenantAddModal = ({
  open,
  onOpenChange,
  newTenant,
  onFormChange,
  apartments,
  realtors,
  creatingTenant,
  onCreate,
  onCancel,
}: TenantAddModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col [&>button]:h-10 [&>button]:w-10 [&>button]:right-3 [&>button]:top-3 [&>button]:z-50 [&>button]:bg-white [&>button]:rounded-full [&>button]:shadow-lg [&>button]:border [&>button]:border-gray-300 [&>button]:hover:bg-amber-50 [&>button]:hover:border-amber-400 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:p-0 [&>button>svg]:h-5 [&>button>svg]:w-5 [&>button>svg]:text-gray-700 [&>button>svg]:hover:text-amber-600">
        <DialogHeader className="p-6 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-white flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-gray-900">Add New Tenant</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Create a new tenant record. The property will be marked as "Rented" automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Tenant Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={newTenant.name}
              onChange={(e) => onFormChange({ ...newTenant, name: e.target.value })}
              className="w-full bg-white border-amber-300 rounded-xl"
              placeholder="John Smith"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Property <span className="text-red-500">*</span>
            </label>
            <Select
              value={newTenant.property_id}
              onValueChange={(value) => onFormChange({ ...newTenant, property_id: value })}
            >
              <SelectTrigger className="w-full bg-white border-amber-300 rounded-xl">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {apartments.map((apt) => (
                  <SelectItem key={apt.id} value={String(apt.id)}>
                    {getPropertyMetadata(apt).address || `Property #${apt.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Phone Number</label>
              <Input
                value={newTenant.phone_number}
                onChange={(e) => onFormChange({ ...newTenant, phone_number: e.target.value })}
                className="w-full bg-white border-amber-300 rounded-xl"
                placeholder="+14125551234"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Email</label>
              <Input
                type="email"
                value={newTenant.email}
                onChange={(e) => onFormChange({ ...newTenant, email: e.target.value })}
                className="w-full bg-white border-amber-300 rounded-xl"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Unit Number</label>
              <Input
                value={newTenant.unit_number}
                onChange={(e) => onFormChange({ ...newTenant, unit_number: e.target.value })}
                className="w-full bg-white border-amber-300 rounded-xl"
                placeholder="Apt 3B"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Assigned Realtor (Optional)</label>
              <Select
                value={newTenant.realtor_id}
                onValueChange={(value) => onFormChange({ ...newTenant, realtor_id: value })}
              >
                <SelectTrigger className="w-full bg-white border-amber-300 rounded-xl">
                  <SelectValue placeholder="Select a realtor" />
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Lease Start Date</label>
              <Input
                type="date"
                value={newTenant.lease_start_date}
                onChange={(e) => onFormChange({ ...newTenant, lease_start_date: e.target.value })}
                className="w-full bg-white border-amber-300 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Lease End Date</label>
              <Input
                type="date"
                value={newTenant.lease_end_date}
                onChange={(e) => onFormChange({ ...newTenant, lease_end_date: e.target.value })}
                className="w-full bg-white border-amber-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">Notes (Optional)</label>
            <Textarea
              value={newTenant.notes}
              onChange={(e) => onFormChange({ ...newTenant, notes: e.target.value })}
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
            disabled={creatingTenant}
          >
            Cancel
          </Button>
          <Button
            onClick={onCreate}
            className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl"
            disabled={creatingTenant || !newTenant.name || !newTenant.property_id}
          >
            {creatingTenant ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Tenant
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

