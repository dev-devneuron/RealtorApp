import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, RefreshCw, X, Info } from "lucide-react";

interface PhoneNumberRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneRequestForm: {
    country_code: string;
    area_code: string;
    notes: string;
  };
  onFormChange: (form: { country_code: string; area_code: string; notes: string }) => void;
  requestingPhone: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export const PhoneNumberRequestDialog = ({
  open,
  onOpenChange,
  phoneRequestForm,
  onFormChange,
  requestingPhone,
  onSubmit,
  onCancel,
}: PhoneNumberRequestDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 sm:p-8 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-white flex-shrink-0">
          <DialogTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
              <Phone className="h-6 w-6 text-white" />
            </div>
            Request New Phone Number
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2 text-base">
            Submit a request for a new phone number. A new number will be available in your portal within 24 hours.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">
                Country Code (Optional)
              </label>
              <input
                type="text"
                value={phoneRequestForm.country_code}
                onChange={(e) => onFormChange({...phoneRequestForm, country_code: e.target.value})}
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                placeholder="e.g., +1, +44, +61"
                maxLength={5}
              />
              <p className="text-xs text-gray-500 mt-2">Enter country code with or without + (e.g., +1, 1, +44)</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">
                Preferred Area Code (Optional)
              </label>
              <input
                type="text"
                value={phoneRequestForm.area_code}
                onChange={(e) => onFormChange({...phoneRequestForm, area_code: e.target.value})}
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                placeholder="e.g., 412, 415, 206"
                maxLength={3}
                pattern="[0-9]{3}"
              />
              <p className="text-xs text-gray-500 mt-2">Enter a 3-digit area code if you have a preference</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Additional Notes (Optional)
            </label>
            <textarea
              value={phoneRequestForm.notes}
              onChange={(e) => onFormChange({...phoneRequestForm, notes: e.target.value})}
              className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all min-h-[100px] resize-y"
              placeholder="Any additional information about your phone number request..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-2">{phoneRequestForm.notes.length}/500 characters</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-gray-900 mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Your request will be submitted to the tech team</li>
                  <li>A new phone number will be purchased and configured</li>
                  <li>The number will appear in your portal within 24 hours</li>
                  <li>You can then assign it to yourself or your realtors</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="p-6 sm:p-8 pt-0 border-t border-gray-200 flex-shrink-0">
          <Button 
            onClick={onCancel}
            variant="outline"
            className="border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl px-6 py-3"
            disabled={requestingPhone}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={onSubmit}
            disabled={requestingPhone}
            className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl px-6 py-3"
          >
            {requestingPhone ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Phone className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

