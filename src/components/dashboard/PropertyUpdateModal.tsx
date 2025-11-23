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
import { Edit2, RefreshCw, CheckCircle2, X } from "lucide-react";

interface PropertyUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyUpdateForm: any;
  onFormChange: (form: any) => void;
  updatingProperty: boolean;
  onUpdate: () => void;
  onCancel: () => void;
}

export const PropertyUpdateModal = ({
  open,
  onOpenChange,
  propertyUpdateForm,
  onFormChange,
  updatingProperty,
  onUpdate,
  onCancel,
}: PropertyUpdateModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-4 border-b border-gray-200">
          <DialogTitle className="text-gray-900 font-bold text-2xl flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
              <Edit2 className="h-5 w-5 text-white" />
            </div>
            Update Property
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2 text-base">
            Update the property details below. All fields are optional.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Address</label>
              <input
                type="text"
                value={propertyUpdateForm.address || ""}
                onChange={(e) => onFormChange({...propertyUpdateForm, address: e.target.value})}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                placeholder="123 Main St, City, State"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Price</label>
              <input
                type="number"
                value={propertyUpdateForm.price || ""}
                onChange={(e) => onFormChange({...propertyUpdateForm, price: e.target.value})}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                placeholder="2500"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Bedrooms</label>
              <input
                type="number"
                value={propertyUpdateForm.bedrooms || ""}
                onChange={(e) => onFormChange({...propertyUpdateForm, bedrooms: e.target.value})}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                placeholder="3"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Bathrooms</label>
              <input
                type="number"
                step="0.5"
                value={propertyUpdateForm.bathrooms || ""}
                onChange={(e) => onFormChange({...propertyUpdateForm, bathrooms: e.target.value})}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                placeholder="2.5"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Square Feet</label>
              <input
                type="number"
                value={propertyUpdateForm.square_feet || ""}
                onChange={(e) => onFormChange({...propertyUpdateForm, square_feet: e.target.value})}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                placeholder="1200"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Lot Size (sqft)</label>
              <input
                type="number"
                value={propertyUpdateForm.lot_size_sqft || ""}
                onChange={(e) => onFormChange({...propertyUpdateForm, lot_size_sqft: e.target.value})}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                placeholder="5000"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Year Built</label>
              <input
                type="number"
                value={propertyUpdateForm.year_built || ""}
                onChange={(e) => onFormChange({...propertyUpdateForm, year_built: e.target.value})}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                placeholder="2020"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Property Type</label>
              <input
                type="text"
                value={propertyUpdateForm.property_type || ""}
                onChange={(e) => onFormChange({...propertyUpdateForm, property_type: e.target.value})}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                placeholder="Apartment"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Listing Status</label>
              <Select 
                value={propertyUpdateForm.listing_status || "Available"} 
                onValueChange={(value) => onFormChange({...propertyUpdateForm, listing_status: value})}
              >
                <SelectTrigger className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl bg-white text-gray-900 text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="For Sale">For Sale</SelectItem>
                  <SelectItem value="For Rent">For Rent</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Rented">Rented</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Days on Market</label>
              <input
                type="number"
                value={propertyUpdateForm.days_on_market || ""}
                onChange={(e) => onFormChange({...propertyUpdateForm, days_on_market: e.target.value})}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                placeholder="25"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Listing Date</label>
              <input
                type="date"
                value={propertyUpdateForm.listing_date || ""}
                onChange={(e) => onFormChange({...propertyUpdateForm, listing_date: e.target.value})}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Listing ID (MLS)</label>
              <input
                type="text"
                value={propertyUpdateForm.listing_id || ""}
                onChange={(e) => onFormChange({...propertyUpdateForm, listing_id: e.target.value})}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                placeholder="MLS000123"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Image URL</label>
              <input
                type="url"
                value={propertyUpdateForm.image_url || ""}
                onChange={(e) => onFormChange({...propertyUpdateForm, image_url: e.target.value})}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Features (comma-separated)</label>
              <input
                type="text"
                value={propertyUpdateForm.features || ""}
                onChange={(e) => onFormChange({...propertyUpdateForm, features: e.target.value})}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                placeholder="Pool, Gym, Parking, Elevator"
              />
              <p className="text-xs text-gray-500 mt-2">Separate multiple features with commas</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Description</label>
              <textarea
                value={propertyUpdateForm.description || ""}
                onChange={(e) => onFormChange({...propertyUpdateForm, description: e.target.value})}
                rows={4}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base resize-none"
                placeholder="Beautiful property description..."
              />
            </div>
          </div>
        </div>
        <DialogFooter className="p-6 pt-0 border-t border-gray-200">
          <Button 
            onClick={onCancel}
            variant="outline"
            className="border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl px-6 py-3"
            disabled={updatingProperty}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={onUpdate}
            disabled={updatingProperty}
            className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl px-6 py-3"
          >
            {updatingProperty ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Update Property
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

