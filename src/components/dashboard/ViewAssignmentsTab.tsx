import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ListChecks,
  Filter,
  RefreshCw,
  Building2,
  AlertTriangle,
  CheckCircle2,
  User,
  Users,
  Mail,
  Bed,
  Bath,
  Square,
  Info,
} from "lucide-react";
import { Property } from "./types";
import { getPropertyMetadata } from "./utils";

interface ViewAssignmentsTabProps {
  assignmentsData: any;
  loadingAssignments: boolean;
  selectedRealtorFilters: Set<number | string>;
  filteredAssignedProperties: any;
  onFilterToggle: (realtorId: number | string) => void;
  onSelectAllFilters: () => void;
  onDeselectAllFilters: () => void;
  onRefresh: () => void;
  onPropertyClick: (property: Property) => void;
}

export const ViewAssignmentsTab = ({
  assignmentsData,
  loadingAssignments,
  selectedRealtorFilters,
  filteredAssignedProperties,
  onFilterToggle,
  onSelectAllFilters,
  onDeselectAllFilters,
  onRefresh,
  onPropertyClick,
}: ViewAssignmentsTabProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                  <ListChecks className="h-6 w-6 text-white" />
                </div>
                Property Assignments Overview
              </CardTitle>
              <p className="text-gray-600 text-lg">
                See which properties are assigned to which realtors, and manage unassigned properties
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Dropdown */}
              {assignmentsData && assignmentsData.assigned_properties && Object.keys(assignmentsData.assigned_properties).length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-white hover:bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400 font-medium transition-all rounded-xl"
                    >
                      <Filter className="h-5 w-5 mr-2" />
                      Filter by Realtor
                      {selectedRealtorFilters.size > 0 && (
                        <Badge className="ml-2 bg-gradient-to-br from-amber-500 to-amber-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                          {selectedRealtorFilters.size}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-80 bg-white border border-amber-200 shadow-2xl rounded-2xl p-0 overflow-hidden"
                  >
                    {/* Fixed Header */}
                    <div className="sticky top-0 bg-white z-10 p-4 pb-3 border-b border-amber-200">
                      <DropdownMenuLabel className="text-gray-900 font-bold text-lg mb-0 px-0">
                        Filter Assignments
                      </DropdownMenuLabel>
                    </div>

                    {/* Scrollable Content */}
                    <div className="max-h-[400px] overflow-y-auto overflow-x-hidden px-4 py-2 custom-scrollbar">
                      {/* Select All / Deselect All */}
                      <div className="flex gap-2 mb-3">
                        <Button
                          onClick={onSelectAllFilters}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300 font-medium rounded-xl text-xs py-2"
                        >
                          Select All
                        </Button>
                        <Button
                          onClick={onDeselectAllFilters}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300 font-medium rounded-xl text-xs py-2"
                        >
                          Clear All
                        </Button>
                      </div>

                      <DropdownMenuSeparator className="bg-amber-200 my-2" />

                      {/* Unassigned Properties Option */}
                      <DropdownMenuCheckboxItem
                        checked={selectedRealtorFilters.has("unassigned")}
                        onCheckedChange={() => onFilterToggle("unassigned")}
                        className="px-2 py-2 rounded-xl hover:bg-amber-50 focus:bg-amber-50 cursor-pointer transition-all mb-1.5"
                      >
                        <div className="flex items-center gap-2.5 w-full">
                          <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">Unassigned Properties</p>
                            <p className="text-xs text-gray-500">
                              {assignmentsData.unassigned_properties?.length || 0} properties
                            </p>
                          </div>
                        </div>
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuSeparator className="bg-amber-200 my-2" />

                      {/* Realtor Options */}
                      {Object.values(assignmentsData.assigned_properties || {}).map((realtorGroup: any) => (
                        <DropdownMenuCheckboxItem
                          key={realtorGroup.realtor_id}
                          checked={selectedRealtorFilters.has(realtorGroup.realtor_id)}
                          onCheckedChange={() => onFilterToggle(realtorGroup.realtor_id)}
                          className="px-2 py-2 rounded-xl hover:bg-amber-50 focus:bg-amber-50 cursor-pointer transition-all mb-1.5"
                        >
                          <div className="flex items-center gap-2.5 w-full">
                            <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0">
                              <User className="h-3.5 w-3.5 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">{realtorGroup.realtor_name}</p>
                              <p className="text-xs text-gray-500 truncate">{realtorGroup.realtor_email}</p>
                              <p className="text-xs font-medium text-amber-600 mt-0.5">
                                {realtorGroup.count} {realtorGroup.count === 1 ? "property" : "properties"}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                onClick={onRefresh}
                variant="outline"
                size="lg"
                className="bg-white hover:bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400 font-medium transition-all rounded-xl"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {loadingAssignments ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">Loading assignments...</p>
            </div>
          ) : !assignmentsData ? (
            <div className="text-center py-12">
              <ListChecks className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium text-lg">No assignment data available</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Enhanced Summary Cards */}
              {assignmentsData.summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="bg-white p-6 border border-amber-100 rounded-2xl hover:shadow-lg transition-all hover:border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-600 mb-2 uppercase tracking-wide">Total Properties</p>
                        <p className="text-3xl font-bold text-gray-900">{assignmentsData.summary.total_properties || 0}</p>
                        <p className="text-sm text-gray-500 mt-1">All properties</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </Card>
                  <Card className="bg-white p-6 border border-amber-100 rounded-2xl hover:shadow-lg transition-all hover:border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-600 mb-2 uppercase tracking-wide">Unassigned</p>
                        <p className="text-3xl font-bold text-gray-900">{assignmentsData.summary.unassigned_count || 0}</p>
                        <p className="text-sm text-gray-500 mt-1">Need assignment</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                        <AlertTriangle className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </Card>
                  <Card className="bg-white p-6 border border-amber-100 rounded-2xl hover:shadow-lg transition-all hover:border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-600 mb-2 uppercase tracking-wide">Assigned</p>
                        <p className="text-3xl font-bold text-gray-900">{assignmentsData.summary.assigned_count || 0}</p>
                        <p className="text-sm text-gray-500 mt-1">To realtors</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Unassigned Properties */}
              {assignmentsData.unassigned_properties &&
                assignmentsData.unassigned_properties.length > 0 &&
                selectedRealtorFilters.has("unassigned") && (
                  <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-4 flex-wrap">
                      <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                        <AlertTriangle className="h-6 w-6 text-white" />
                      </div>
                      Unassigned Properties
                      <Badge className="bg-gradient-to-br from-amber-500 to-amber-600 text-white text-lg px-4 py-2 font-bold">
                        {assignmentsData.unassigned_properties.length}
                      </Badge>
                    </h3>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {Array.isArray(assignmentsData.unassigned_properties) &&
                        assignmentsData.unassigned_properties.map((property: any, idx: number) => {
                          if (!property) return null;
                          const meta = getPropertyMetadata(property);
                          return (
                            <Card
                              key={property.id || idx}
                              className="bg-white hover:shadow-lg transition-all duration-300 border border-amber-200 rounded-2xl hover:border-amber-300 overflow-hidden cursor-pointer"
                              onClick={() => onPropertyClick(property)}
                            >
                              <CardHeader className="pb-4 p-4 sm:p-6">
                                <div className="flex items-start justify-between gap-3">
                                  <CardTitle className="text-base sm:text-lg font-bold text-gray-900">
                                    {meta.address || `Property #${property.id}`}
                                  </CardTitle>
                                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-semibold text-xs sm:text-sm">
                                    Unassigned
                                  </Badge>
                                </div>
                                {meta.listing_id && (
                                  <div className="flex items-center gap-2 mt-2 sm:mt-3">
                                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                                    <p className="text-amber-600 bg-amber-50 px-2 sm:px-3 py-1 rounded-lg border border-amber-200 font-semibold text-xs sm:text-sm">
                                      MLS: {meta.listing_id}
                                    </p>
                                  </div>
                                )}
                              </CardHeader>
                              <CardContent className="space-y-3 sm:space-y-4 text-sm p-4 sm:p-6 pt-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-amber-600 text-lg sm:text-xl">
                                    ${meta.price ? meta.price.toLocaleString() : "N/A"}
                                  </p>
                                  {meta.listing_status && (
                                    <Badge
                                      variant={meta.listing_status === "Available" ? "default" : "secondary"}
                                      className={`text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-lg ${
                                        meta.listing_status === "Available"
                                          ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                                          : "bg-gray-200 text-gray-700"
                                      }`}
                                    >
                                      {meta.listing_status}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 font-semibold text-xs sm:text-sm">
                                  <span className="border border-amber-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-amber-50 text-amber-700">
                                    <Bed className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" /> {meta.bedrooms || 0}
                                  </span>
                                  <span className="border border-amber-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-amber-50 text-amber-700">
                                    <Bath className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" /> {meta.bathrooms || 0}
                                  </span>
                                  {meta.square_feet && (
                                    <span className="border border-amber-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-amber-50 text-amber-700">
                                      <Square className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" /> {meta.square_feet} sqft
                                    </span>
                                  )}
                                </div>
                                {meta.property_type && (
                                  <Badge variant="outline" className="text-xs sm:text-sm font-medium border-amber-300 bg-amber-50 text-amber-700">
                                    {meta.property_type}
                                  </Badge>
                                )}
                                <p className="text-xs sm:text-sm text-amber-600 font-medium pt-2 border-t border-amber-200">
                                  Click to view details →
                                </p>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                )}

              {/* Assigned Properties by Realtor */}
              {filteredAssignedProperties && (
                <div className="bg-white rounded-2xl p-6 border border-amber-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    Assigned Properties by Realtor
                    {selectedRealtorFilters.size > 0 &&
                      selectedRealtorFilters.size <
                        (assignmentsData?.assigned_properties ? Object.keys(assignmentsData.assigned_properties).length + 1 : 1) && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-sm font-semibold">
                          Filtered ({selectedRealtorFilters.size} {selectedRealtorFilters.size === 1 ? "filter" : "filters"})
                        </Badge>
                      )}
                  </h3>
                  {Object.values(filteredAssignedProperties).map((realtorGroup: any) => (
                    <Card key={realtorGroup.realtor_id} className="mb-8 bg-white shadow-lg border border-amber-200 rounded-2xl overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-t-2xl border-b border-amber-200 p-6">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-gray-900 text-xl font-bold flex items-center gap-3">
                              <div className="p-2 bg-amber-100 rounded-lg">
                                <User className="h-5 w-5 text-amber-600" />
                              </div>
                              {realtorGroup.realtor_name}
                            </CardTitle>
                            <p className="text-gray-600 mt-2 flex items-center gap-2">
                              <Mail className="h-4 w-4 text-amber-600" />
                              {realtorGroup.realtor_email}
                            </p>
                          </div>
                          <Badge className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-2 border-amber-400 text-lg px-4 py-2 font-bold">
                            {realtorGroup.count} {realtorGroup.count === 1 ? "Property" : "Properties"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {Array.isArray(realtorGroup.properties) &&
                            realtorGroup.properties.map((property: any, idx: number) => {
                              if (!property) return null;
                              const meta = getPropertyMetadata(property);
                              return (
                                <Card
                                  key={property.id || idx}
                                  className="bg-white hover:shadow-lg transition-all duration-300 border border-amber-200 rounded-2xl hover:border-amber-300 overflow-hidden cursor-pointer"
                                  onClick={() => onPropertyClick(property)}
                                >
                                  <CardHeader className="pb-4 p-4 sm:p-6">
                                    <CardTitle className="text-base sm:text-lg font-bold text-gray-900">
                                      {meta.address || `Property #${property.id}`}
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
                                  <CardContent className="space-y-3 sm:space-y-4 text-sm p-4 sm:p-6 pt-0">
                                    <div className="flex items-center justify-between">
                                      <p className="font-bold text-amber-600 text-lg sm:text-xl">
                                        ${meta.price ? meta.price.toLocaleString() : "N/A"}
                                      </p>
                                      {meta.listing_status && (
                                        <Badge
                                          variant={meta.listing_status === "Available" ? "default" : "secondary"}
                                          className={`text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-lg ${
                                            meta.listing_status === "Available"
                                              ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                                              : "bg-gray-200 text-gray-700"
                                          }`}
                                        >
                                          {meta.listing_status}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 font-semibold text-xs sm:text-sm">
                                      <span className="border border-amber-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-amber-50 text-amber-700">
                                        <Bed className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" /> {meta.bedrooms || 0}
                                      </span>
                                      <span className="border border-amber-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-amber-50 text-amber-700">
                                        <Bath className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" /> {meta.bathrooms || 0}
                                      </span>
                                      {meta.square_feet && (
                                        <span className="border border-amber-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-amber-50 text-amber-700">
                                          <Square className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" /> {meta.square_feet} sqft
                                        </span>
                                      )}
                                    </div>
                                    {meta.property_type && (
                                      <Badge variant="outline" className="text-xs sm:text-sm font-medium border-amber-300 bg-amber-50 text-amber-700">
                                        {meta.property_type}
                                      </Badge>
                                    )}
                                    <p className="text-xs sm:text-sm text-amber-600 font-medium pt-2 border-t border-amber-200">
                                      Click to view details →
                                    </p>
                                  </CardContent>
                                </Card>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

