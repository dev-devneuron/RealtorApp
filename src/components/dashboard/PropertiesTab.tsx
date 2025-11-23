import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, RefreshCw, Bed, Bath, Square, Info } from "lucide-react";
import { getPropertyMetadata } from "./utils";
import { Property } from "./types";
import { PropertyDetailModal } from "./PropertyDetailModal";
import { PropertyUpdateModal } from "./PropertyUpdateModal";

interface PropertiesTabProps {
  apartments: Property[];
  loadingApartments: boolean;
  userType: string | null;
  onRefresh: () => void;
  onPropertyClick: (property: Property) => void;
  // Modal state and handlers
  selectedPropertyForDetail: Property | null;
  showPropertyDetailModal: boolean;
  setShowPropertyDetailModal: (show: boolean) => void;
  showPropertyUpdateModal: boolean;
  setShowPropertyUpdateModal: (show: boolean) => void;
  propertyUpdateForm: any;
  setPropertyUpdateForm: (form: any) => void;
  updatingProperty: boolean;
  deletingProperty: boolean;
  onUpdateProperty: () => Promise<void>;
  onDeleteProperty: (propertyId: number) => Promise<void>;
  onAssignTenant: (property: Property) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const PropertiesTab = ({
  apartments,
  loadingApartments,
  userType,
  onRefresh,
  onPropertyClick,
  selectedPropertyForDetail,
  showPropertyDetailModal,
  setShowPropertyDetailModal,
  showPropertyUpdateModal,
  setShowPropertyUpdateModal,
  propertyUpdateForm,
  setPropertyUpdateForm,
  updatingProperty,
  deletingProperty,
  onUpdateProperty,
  onDeleteProperty,
  onAssignTenant,
}: PropertiesTabProps) => {
  return (
    <>
      {/* Property Detail Modal */}
      <PropertyDetailModal
        open={showPropertyDetailModal}
        onOpenChange={setShowPropertyDetailModal}
        selectedProperty={selectedPropertyForDetail}
        userType={userType}
        deletingProperty={deletingProperty}
        onEdit={() => {
          setShowPropertyDetailModal(false);
          setShowPropertyUpdateModal(true);
        }}
        onDelete={() => {
          if (selectedPropertyForDetail) {
            onDeleteProperty(selectedPropertyForDetail.id);
          }
        }}
        onAssignTenant={() => {
          if (selectedPropertyForDetail) {
            onAssignTenant(selectedPropertyForDetail);
          }
        }}
      />

      {/* Property Update Modal */}
      <PropertyUpdateModal
        open={showPropertyUpdateModal}
        onOpenChange={setShowPropertyUpdateModal}
        propertyUpdateForm={propertyUpdateForm}
        onFormChange={setPropertyUpdateForm}
        updatingProperty={updatingProperty}
        onUpdate={onUpdateProperty}
        onCancel={() => {
          setShowPropertyUpdateModal(false);
          setPropertyUpdateForm({});
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-gray-900 text-xl sm:text-2xl font-bold flex items-center gap-4 mb-2">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  Properties
                </CardTitle>
                <p className="text-gray-600 text-sm sm:text-lg">
                  {apartments.length > 0
                    ? `Viewing ${apartments.length} propert${apartments.length !== 1 ? "ies" : "y"}`
                    : "No properties available"}
                </p>
              </div>
              <Button
                onClick={onRefresh}
                disabled={loadingApartments}
                variant="outline"
                className="bg-white hover:bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400 font-semibold shadow-sm hover:shadow-md transition-all rounded-xl px-4 sm:px-6 py-2 sm:py-3"
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${loadingApartments ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
      <motion.div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {loadingApartments ? (
          <div className="col-span-full text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600 font-medium text-lg">Loading apartments...</p>
          </div>
        ) : apartments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">No apartments found.</p>
          </div>
        ) : (
          Array.isArray(apartments) &&
          apartments.map((apt, idx) => {
            if (!apt) return null;
            const meta = getPropertyMetadata(apt);
            return (
              <motion.div
                key={apt.id || idx}
                variants={itemVariants}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden h-full border border-amber-100 hover:border-amber-200 cursor-pointer"
                  onClick={() => onPropertyClick(apt)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-200 rounded-t-2xl">
                    <motion.img
                      src={meta.image_url || "/images/properties/default.jpg"}
                      alt={`Property at ${meta.address}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {meta.listing_status && (
                      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
                        <Badge
                          variant={meta.listing_status === "Available" ? "default" : "secondary"}
                          className={`text-xs sm:text-sm font-bold border-2 ${
                            meta.listing_status === "Available"
                              ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-400"
                              : meta.listing_status === "Sold" || meta.listing_status === "Rented"
                              ? "bg-white/90 text-gray-900 border-gray-300"
                              : "bg-white/90 text-gray-900 border-gray-300"
                          }`}
                        >
                          {meta.listing_status}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-4 pt-4 sm:pt-6 px-4 sm:px-6">
                    <CardTitle className="text-gray-900 text-lg sm:text-xl font-bold group-hover:text-amber-700 transition-colors line-clamp-1">
                      {meta.address || `Property #${apt.id}`}
                    </CardTitle>
                    {meta.listing_id && (
                      <div className="flex items-center gap-2 mt-2 sm:mt-3">
                        <Info className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                        <p className="text-amber-600 bg-amber-50 px-2 sm:px-3 py-1 rounded-lg border border-amber-200 font-semibold text-xs sm:text-sm">
                          MLS: {meta.listing_id}
                        </p>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                    {/* Price */}
                    <div className="flex items-center justify-between border-b border-amber-200 pb-3 sm:pb-4">
                      <div className="text-xl sm:text-2xl font-bold text-amber-600">
                        ${meta.price ? meta.price.toLocaleString() : "N/A"}
                      </div>
                    </div>

                    {/* Basic Specs */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
                      <div className="flex items-center gap-1 sm:gap-2 text-gray-700 bg-amber-50 border border-amber-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                        <Bed className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" /> <span>{meta.bedrooms || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 text-gray-700 bg-amber-50 border border-amber-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                        <Bath className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" /> <span>{meta.bathrooms || 0}</span>
                      </div>
                      {meta.square_feet ? (
                        <div className="flex items-center gap-1 sm:gap-2 text-gray-700 bg-amber-50 border border-amber-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                          <Square className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" /> <span className="truncate">{meta.square_feet}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 sm:gap-2 text-gray-700 bg-amber-50 border border-amber-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                          <Square className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" /> <span>-</span>
                        </div>
                      )}
                    </div>

                    {meta.property_type && (
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium border-amber-300 bg-amber-50 text-amber-700 w-full justify-center py-1.5 sm:py-2">
                        {meta.property_type}
                      </Badge>
                    )}

                    {/* Assignment Status (for PM) */}
                    {userType === "property_manager" && (
                      <div className="pt-2 sm:pt-3 border-t border-gray-200">
                        {meta.is_assigned && meta.assigned_to_realtor_name ? (
                          <div className="flex items-center justify-between text-xs sm:text-sm bg-amber-50 rounded-lg p-2 sm:p-3 border border-amber-200">
                            <span className="text-amber-700 font-medium">Assigned to:</span>
                            <Badge className="bg-gradient-to-br from-amber-500 to-amber-600 text-white text-xs sm:text-sm font-semibold">
                              {meta.assigned_to_realtor_name}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs sm:text-sm font-medium w-full justify-center py-1.5 sm:py-2">
                            Unassigned
                          </Badge>
                        )}
                      </div>
                    )}

                    <p className="text-xs sm:text-sm text-amber-600 font-medium pt-2 border-t border-amber-200 text-center">
                      Click to view details →
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </>
  );
};

