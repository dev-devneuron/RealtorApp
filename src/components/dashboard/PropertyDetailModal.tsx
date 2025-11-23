import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Bed, Bath, Square, Ruler, CalendarIcon, TrendingUp, User, Users, Edit2, Trash2, RefreshCw, UserPlus } from "lucide-react";
import { getPropertyMetadata } from "./utils";
import { Property } from "./types";

interface PropertyDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProperty: Property | null;
  userType: string | null;
  deletingProperty: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAssignTenant: () => void;
}

export const PropertyDetailModal = ({
  open,
  onOpenChange,
  selectedProperty,
  userType,
  deletingProperty,
  onEdit,
  onDelete,
  onAssignTenant,
}: PropertyDetailModalProps) => {
  if (!selectedProperty) return null;

  const meta = getPropertyMetadata(selectedProperty);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-6xl max-h-[95vh] p-0 overflow-hidden flex flex-col [&>button]:h-10 [&>button]:w-10 [&>button]:right-3 [&>button]:top-3 [&>button]:z-50 [&>button]:bg-white [&>button]:rounded-full [&>button]:shadow-lg [&>button]:border [&>button]:border-gray-300 [&>button]:hover:bg-amber-50 [&>button]:hover:border-amber-400 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:p-0 [&>button>svg]:h-5 [&>button>svg]:w-5 [&>button>svg]:text-gray-700 [&>button>svg]:hover:text-amber-600">
        <div className="flex flex-col lg:flex-row h-full max-h-[95vh] overflow-hidden">
          {/* Image Section */}
          <div className="w-full lg:w-1/2 bg-gray-100 rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none overflow-hidden order-2 lg:order-1 flex-shrink-0">
            <div className="relative aspect-[4/3] lg:h-full lg:min-h-[600px] max-h-[400px] lg:max-h-none flex items-center justify-center bg-gray-100">
              <img
                src={meta.image_url || "/images/properties/default.jpg"}
                alt={meta.address || `Property #${selectedProperty.id}`}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              {meta.listing_status && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge 
                    variant={meta.listing_status === 'Available' ? 'default' : 'secondary'}
                    className={`text-sm sm:text-base font-bold border-2 ${
                      meta.listing_status === 'Available' 
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-400' 
                        : 'bg-white/90 text-gray-900 border-gray-300'
                    }`}
                  >
                    {meta.listing_status}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-y-auto overflow-x-hidden order-1 lg:order-2 flex-1 min-h-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-gray-200">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                  {meta.address || `Property #${selectedProperty.id}`}
                </DialogTitle>
                {meta.listing_id && (
                  <p className="text-xs sm:text-sm lg:text-base text-amber-600 font-semibold">MLS: {meta.listing_id}</p>
                )}
              </div>
              {userType === "property_manager" && (
                <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                  <Button
                    onClick={onEdit}
                    variant="outline"
                    size="sm"
                    className="bg-white hover:bg-amber-50 text-amber-600 border-amber-300 hover:border-amber-400 font-medium transition-all rounded-xl flex-1 sm:flex-none"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    <span className="text-xs sm:text-sm">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-red-50 text-red-600 border-red-300 hover:border-red-400 font-medium transition-all rounded-xl flex-1 sm:flex-none"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span className="text-xs sm:text-sm">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl">
                      <AlertDialogHeader className="p-6">
                        <AlertDialogTitle className="text-gray-900 font-bold text-2xl">Delete Property?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 text-lg mt-4">
                          Are you sure you want to delete <span className="font-semibold text-amber-600">{meta.address || `Property #${selectedProperty.id}`}</span>? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="p-6 pt-0">
                        <AlertDialogCancel className="border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl px-6 py-3">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={onDelete}
                          disabled={deletingProperty}
                          className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl px-6 py-3"
                        >
                          {deletingProperty ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Property
                            </>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 sm:p-6 border border-amber-200">
              <p className="text-3xl sm:text-4xl font-bold text-amber-600 mb-2">
                ${meta.price ? meta.price.toLocaleString() : 'N/A'}
              </p>
              {meta.property_type && (
                <Badge variant="outline" className="text-sm font-medium border-amber-300 bg-white text-amber-700 mt-2">
                  {meta.property_type}
                </Badge>
              )}
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <Bed className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">Bedrooms</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{meta.bedrooms || 0}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <Bath className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">Bathrooms</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{meta.bathrooms || 0}</p>
              </div>
              {meta.square_feet && (
                <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Square className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                    <span className="text-xs sm:text-sm text-gray-600 font-medium">Square Feet</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{meta.square_feet.toLocaleString()}</p>
                </div>
              )}
              {meta.lot_size_sqft && (
                <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Ruler className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                    <span className="text-xs sm:text-sm text-gray-600 font-medium">Lot Size</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{meta.lot_size_sqft.toLocaleString()} sqft</p>
                </div>
              )}
              {meta.year_built && (
                <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                    <span className="text-xs sm:text-sm text-gray-600 font-medium">Year Built</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{meta.year_built}</p>
                </div>
              )}
              {meta.days_on_market !== undefined && (
                <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                    <span className="text-xs sm:text-sm text-gray-600 font-medium">Days on Market</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{meta.days_on_market}</p>
                </div>
              )}
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              {meta.listing_date && (
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-sm sm:text-base text-gray-600 font-medium">Listing Date:</span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">{new Date(meta.listing_date).toLocaleDateString()}</span>
                </div>
              )}

              {/* Features */}
              {meta.features && meta.features.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 sm:p-6 border border-amber-200">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {meta.features.map((feature: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs sm:text-sm font-medium border-amber-300 bg-white text-amber-700 px-3 py-1.5">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {meta.description && (
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Description</h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{meta.description}</p>
                </div>
              )}

              {/* Assignment Status (for PM) */}
              {userType === "property_manager" && (
                <div className="bg-amber-50 rounded-xl p-4 sm:p-6 border border-amber-200">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Assignment Status</h3>
                  {meta.is_assigned && meta.assigned_to_realtor_name ? (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Assigned to:</p>
                        <p className="text-base sm:text-lg font-bold text-amber-700">{meta.assigned_to_realtor_name}</p>
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-white text-amber-700 border-amber-300 text-sm font-medium px-4 py-2">
                      Unassigned
                    </Badge>
                  )}
                </div>
              )}

              {/* Tenant Assignment Section (for PM) */}
              {userType === "property_manager" && (
                <div className="bg-green-50 rounded-xl p-4 sm:p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      Tenant Management
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Assign a tenant to this property. The property will be marked as "Rented" automatically.
                  </p>
                  <Button
                    onClick={onAssignTenant}
                    className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl w-full sm:w-auto"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Tenant to This Property
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

