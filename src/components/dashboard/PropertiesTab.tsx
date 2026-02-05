import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, RefreshCw, Bed, Bath, Square, Info, Calendar, Plus } from "lucide-react";
import { getPropertyMetadata } from "./utils";
import { Property } from "./types";
import { PropertyDetailModal } from "./PropertyDetailModal";
import { PropertyUpdateModal } from "./PropertyUpdateModal";
import { ManualBookingModal } from "./ManualBookingModal";

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
  userId?: number;
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
  userId,
}: PropertiesTabProps) => {
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  const [selectedPropertyForBooking, setSelectedPropertyForBooking] = useState<number | null>(null);

  const handleCreateBooking = (propertyId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setSelectedPropertyForBooking(propertyId);
    setShowManualBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowManualBookingModal(false);
    setSelectedPropertyForBooking(null);
    onRefresh(); // Refresh properties if needed
  };

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

      {/* Manual Booking Modal */}
      {userId && (
        <ManualBookingModal
          open={showManualBookingModal}
          onClose={() => {
            setShowManualBookingModal(false);
            setSelectedPropertyForBooking(null);
          }}
          onSuccess={handleBookingSuccess}
          userId={userId}
          initialPropertyId={selectedPropertyForBooking || undefined}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-200 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 p-4 rounded-lg shadow-sm">
                  <Building2 className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                    Properties
                  </CardTitle>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {apartments.length > 0
                      ? `Viewing ${apartments.length} propert${apartments.length !== 1 ? "ies" : "y"}`
                      : "No properties available"}
                  </p>
                </div>
              </div>
              <Button
                onClick={onRefresh}
                disabled={loadingApartments}
                variant="outline"
                className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700 font-medium shadow-sm hover:shadow transition-all rounded-lg px-4 sm:px-6 py-2 sm:py-3"
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
          [...apartments]
            .sort((a, b) => {
              const metaA = getPropertyMetadata(a);
              const metaB = getPropertyMetadata(b);
              const statusA = metaA.listing_status || "";
              const statusB = metaB.listing_status || "";

              // Priority order: Rented/Sold > For Rent > For Sale > Available
              const getStatusPriority = (status: string): number => {
                const upperStatus = status.toUpperCase();
                if (upperStatus === "RENTED" || upperStatus === "SOLD") return 1;
                if (upperStatus === "FOR RENT") return 2;
                if (upperStatus === "FOR SALE") return 3;
                if (upperStatus === "AVAILABLE") return 4;
                return 5; // Other statuses go last
              };

              const priorityA = getStatusPriority(statusA);
              const priorityB = getStatusPriority(statusB);

              if (priorityA !== priorityB) {
                return priorityA - priorityB;
              }

              // If same priority, maintain original order (or sort by ID)
              return (a.id || 0) - (b.id || 0);
            })
            .map((apt, idx) => {
            if (!apt) return null;
            const meta = getPropertyMetadata(apt);
            return (
              <motion.div
                key={apt.id || idx}
                variants={itemVariants}
                whileHover={{
                  y: -2,
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="bg-white rounded-lg shadow-sm hover:shadow transition-all duration-300 group overflow-hidden h-full border border-gray-200 hover:border-gray-300 cursor-pointer"
                  onClick={() => onPropertyClick(apt)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-200 rounded-t-lg">
                    <motion.img
                      src={meta.image_url || "/images/properties/default.jpg"}
                      alt={`Property at ${meta.address}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                    {meta.listing_status && (
                      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
                        <Badge
                          variant={meta.listing_status === "Available" ? "default" : "secondary"}
                          className={`text-xs sm:text-sm font-semibold ${
                            meta.listing_status === "Available"
                              ? "bg-amber-100 text-amber-800 border-0"
                              : meta.listing_status === "Sold" || meta.listing_status === "Rented"
                              ? "bg-gray-100 text-gray-800 border-0"
                              : "bg-gray-100 text-gray-800 border-0"
                          }`}
                        >
                          {meta.listing_status}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-4 pt-4 sm:pt-6 px-4 sm:px-6">
                    <CardTitle className="text-gray-900 text-lg sm:text-xl font-semibold group-hover:text-gray-700 transition-colors line-clamp-1">
                      {meta.address || `Property #${apt.id}`}
                    </CardTitle>
                    {meta.listing_id && (
                      <div className="flex items-center gap-2 mt-2 sm:mt-3">
                        <Info className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                        <p className="text-gray-600 bg-gray-50 px-2 sm:px-3 py-1 rounded-lg border border-gray-200 font-medium text-xs sm:text-sm">
                          MLS: {meta.listing_id}
                        </p>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                    {/* Price */}
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3 sm:pb-4">
                      <div className="text-xl sm:text-2xl font-semibold text-gray-900">
                        ${meta.price ? meta.price.toLocaleString() : "N/A"}
                      </div>
                    </div>

                    {/* Basic Specs */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm font-medium">
                      <div className="flex items-center gap-1 sm:gap-2 text-gray-700 bg-gray-50 border border-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                        <Bed className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" /> <span>{meta.bedrooms || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 text-gray-700 bg-gray-50 border border-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                        <Bath className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" /> <span>{meta.bathrooms || 0}</span>
                      </div>
                      {meta.square_feet ? (
                        <div className="flex items-center gap-1 sm:gap-2 text-gray-700 bg-gray-50 border border-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                          <Square className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" /> <span className="truncate">{meta.square_feet}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 sm:gap-2 text-gray-700 bg-gray-50 border border-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                          <Square className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" /> <span>-</span>
                        </div>
                      )}
                    </div>

                    {meta.property_type && (
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium border-gray-300 bg-gray-50 text-gray-700 w-full justify-center py-1.5 sm:py-2">
                        {meta.property_type}
                      </Badge>
                    )}

                    {/* Assignment Status (for PM) */}
                    {userType === "property_manager" && (
                      <div className="pt-2 sm:pt-3 border-t border-gray-200">
                        {meta.is_assigned && meta.assigned_to_realtor_name ? (
                          <div className="flex items-center justify-between text-xs sm:text-sm bg-amber-50 rounded-lg p-2 sm:p-3 border border-amber-200">
                            <span className="text-amber-800 font-medium">Assigned to:</span>
                            <Badge className="bg-amber-100 text-amber-800 text-xs sm:text-sm font-semibold border-0">
                              {meta.assigned_to_realtor_name}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 text-xs sm:text-sm font-medium w-full justify-center py-1.5 sm:py-2">
                            Unassigned
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-200 space-y-2">
                      <Button
                        onClick={(e) => handleCreateBooking(apt.id, e)}
                        className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 shadow-sm hover:shadow transition-all text-xs sm:text-sm"
                        size="sm"
                      >
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Create Booking
                      </Button>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium text-center">
                        Click card to view details →
                      </p>
                    </div>
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

