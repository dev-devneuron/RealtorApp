import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, User, RefreshCw, CheckCircle2, Building2, Bed, Bath, Square, Info, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Property, Realtor } from "./types";
import { getPropertyMetadata } from "./utils";

interface AssignPropertiesTabProps {
  realtors: Realtor[];
  availablePropertiesForAssignment: Property[];
  loadingAssignmentProperties: boolean;
  selectedRealtor: number | null;
  selectedProperties: number[];
  currentPage: number;
  itemsPerPage: number;
  pageJumpValue: string;
  assigningProperties: boolean;
  onRealtorChange: (realtorId: number | null) => void;
  onPropertyToggle: (propertyId: number) => void;
  onSelectAll: () => void;
  onSelectAllProperties: () => void;
  onBulkSelect: (count: number, fromStart: boolean) => void;
  onAssign: () => void;
  onPropertyClick: (property: Property) => void;
  onItemsPerPageChange: (value: number) => void;
  onPageChange: (page: number) => void;
  onPageJumpValueChange: (value: string) => void;
}

export const AssignPropertiesTab = ({
  realtors,
  availablePropertiesForAssignment,
  loadingAssignmentProperties,
  selectedRealtor,
  selectedProperties,
  currentPage,
  itemsPerPage,
  pageJumpValue,
  assigningProperties,
  onRealtorChange,
  onPropertyToggle,
  onSelectAll,
  onSelectAllProperties,
  onBulkSelect,
  onAssign,
  onPropertyClick,
  onItemsPerPageChange,
  onPageChange,
  onPageJumpValueChange,
}: AssignPropertiesTabProps) => {
  const totalPages = Math.ceil((availablePropertiesForAssignment?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = useMemo(() => {
    if (!Array.isArray(availablePropertiesForAssignment) || availablePropertiesForAssignment.length === 0) {
      return [];
    }
    return availablePropertiesForAssignment.slice(startIndex, endIndex);
  }, [availablePropertiesForAssignment, startIndex, endIndex]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      onPageJumpValueChange("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-8">
          <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            Assign Properties to Realtors
          </CardTitle>
          <p className="text-gray-600 text-lg">
            Select properties and assign them to a realtor. Assigned properties will appear on the realtor's dashboard.
          </p>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {/* Realtor Selection */}
          <div className="space-y-4 bg-amber-50 p-6 rounded-2xl border border-amber-200">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-amber-600" />
              <label className="text-xl font-semibold text-gray-900">Select Realtor to Assign Properties:</label>
            </div>
            <select
              value={selectedRealtor || ""}
              onChange={(e) => onRealtorChange(e.target.value ? Number(e.target.value) : null)}
              className="w-full p-4 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg font-medium transition-all"
            >
              <option value="">Choose a realtor from the list...</option>
              {realtors.map((realtor) => (
                <option key={realtor.id} value={realtor.id}>
                  {realtor.name} - {realtor.email}
                </option>
              ))}
            </select>
            {selectedRealtor && (
              <div className="flex items-center gap-3 bg-green-50 p-4 rounded-xl border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-700 text-lg">
                  Selected: {realtors.find((r) => r.id === selectedRealtor)?.name}
                </span>
              </div>
            )}
          </div>

          {/* Properties Section */}
          <div className="space-y-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Available Properties <span className="text-amber-600">({selectedProperties.length} selected)</span>
                  </h3>
                  <p className="text-gray-600 text-lg">
                    Properties you own that haven't been assigned to realtors yet
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap items-center">
                  <Button
                    onClick={onSelectAll}
                    variant="outline"
                    size="lg"
                    className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-amber-300 font-medium transition-all rounded-xl"
                  >
                    {Array.isArray(paginatedProperties) &&
                    paginatedProperties.length > 0 &&
                    paginatedProperties.every((p: any) => p?.id && selectedProperties.includes(p.id))
                      ? "Deselect Page"
                      : "Select Page"}
                  </Button>
                  <Button
                    onClick={onSelectAllProperties}
                    variant="outline"
                    size="lg"
                    className="bg-white hover:bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400 font-medium transition-all rounded-xl"
                  >
                    {Array.isArray(availablePropertiesForAssignment) &&
                    selectedProperties.length === availablePropertiesForAssignment.length
                      ? "Deselect All"
                      : "Select All Properties"}
                  </Button>
                  <div className="flex items-center gap-2 ml-auto">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Items per page:</label>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(Number(value))}>
                      <SelectTrigger className="w-24 bg-white border-gray-300 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="24">24</SelectItem>
                        <SelectItem value="48">48</SelectItem>
                        <SelectItem value="96">96</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Enhanced Bulk Selection Buttons */}
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                <p className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-3">
                  <CheckSquare className="h-5 w-5 text-amber-600" />
                  Quick Selection Tools:
                </p>
                <div className="flex flex-wrap gap-3">
                  {[10, 20, 50].map((count) => (
                    <Button
                      key={count}
                      onClick={() => onBulkSelect(count, true)}
                      variant="outline"
                      size="lg"
                      className="bg-white hover:bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400 font-medium transition-all rounded-xl"
                    >
                      First {count}
                    </Button>
                  ))}
                  <div className="w-px bg-amber-300 mx-2"></div>
                  {[10, 20, 50].map((count) => (
                    <Button
                      key={count}
                      onClick={() => onBulkSelect(count, false)}
                      variant="outline"
                      size="lg"
                      className="bg-white hover:bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400 font-medium transition-all rounded-xl"
                    >
                      Last {count}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {loadingAssignmentProperties ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
                <p className="text-gray-600 font-medium text-lg">Loading properties...</p>
              </div>
            ) : !Array.isArray(availablePropertiesForAssignment) || availablePropertiesForAssignment.length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium text-lg">
                  No properties available to assign. All properties may already be assigned to realtors.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.isArray(paginatedProperties) &&
                    paginatedProperties.map((property, idx) => {
                      if (!property) return null;
                      const meta = getPropertyMetadata(property);
                      return (
                        <motion.div
                          key={property.id || idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: idx * 0.05 }}
                          whileHover={{ y: -8 }}
                        >
                          <Card
                            className={`transition-all duration-300 rounded-2xl bg-white border-2 overflow-hidden ${
                              selectedProperties.includes(property.id)
                                ? "border-amber-500 bg-amber-50 shadow-xl"
                                : "border-gray-200 hover:border-amber-300 hover:shadow-lg"
                            }`}
                          >
                            <div className="flex items-start p-4 sm:p-5 gap-3 sm:gap-4">
                              <div className="flex-shrink-0 mt-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedProperties.includes(property.id)}
                                  onChange={() => onPropertyToggle(property.id)}
                                  className="h-5 w-5 sm:h-6 sm:w-6 cursor-pointer accent-amber-500 rounded-lg border-gray-300"
                                />
                              </div>
                              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPropertyClick(property)}>
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-bold text-base sm:text-lg text-gray-900 truncate mb-1">
                                      {meta.address || `Property #${property.id}`}
                                    </h4>
                                    {meta.listing_id && (
                                      <p className="text-xs sm:text-sm text-amber-600 font-medium">MLS: {meta.listing_id}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
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
                                  <div className="flex flex-wrap gap-2 text-xs sm:text-sm font-medium">
                                    <span className="flex items-center gap-1 sm:gap-2 bg-gray-50 border border-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-gray-700">
                                      <Bed className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" /> {meta.bedrooms || 0} Beds
                                    </span>
                                    <span className="flex items-center gap-1 sm:gap-2 bg-gray-50 border border-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-gray-700">
                                      <Bath className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" /> {meta.bathrooms || 0} Baths
                                    </span>
                                    {meta.square_feet && (
                                      <span className="flex items-center gap-1 sm:gap-2 bg-gray-50 border border-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-gray-700">
                                        <Square className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" /> {meta.square_feet} sqft
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-amber-600 font-medium pt-2 border-t border-gray-200">
                                    Click to view details →
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                </div>

                {/* Modern Pagination Component */}
                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 bg-gradient-to-r from-amber-50 to-white p-6 rounded-2xl border border-amber-200"
                  >
                    {/* Page Info */}
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="text-sm font-medium">
                        Showing <span className="font-bold text-amber-600">{startIndex + 1}</span> to{" "}
                        <span className="font-bold text-amber-600">
                          {Math.min(endIndex, Array.isArray(availablePropertiesForAssignment) ? availablePropertiesForAssignment.length : 0)}
                        </span>{" "}
                        of <span className="font-bold text-amber-600">{Array.isArray(availablePropertiesForAssignment) ? availablePropertiesForAssignment.length : 0}</span> properties
                      </span>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center gap-2">
                      {/* First Page Button */}
                      <Button
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-amber-50 text-gray-700 border-gray-300 hover:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xl"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>

                      {/* Previous Page Button */}
                      <Button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-amber-50 text-gray-700 border-gray-300 hover:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xl"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Prev</span>
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((page, idx) => {
                          if (page === "...") {
                            return (
                              <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 font-semibold">
                                ...
                              </span>
                            );
                          }
                          const pageNum = page as number;
                          return (
                            <Button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className={`min-w-[40px] transition-all rounded-xl ${
                                currentPage === pageNum
                                  ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-500 shadow-lg scale-105 font-bold"
                                  : "bg-white hover:bg-amber-50 text-gray-700 border-gray-300 hover:border-amber-400 font-medium"
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      {/* Next Page Button */}
                      <Button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-amber-50 text-gray-700 border-gray-300 hover:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xl"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>

                      {/* Last Page Button */}
                      <Button
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-amber-50 text-gray-700 border-gray-300 hover:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xl"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Page Jump (Optional - for larger datasets) */}
                    {totalPages > 10 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 font-medium">Go to:</span>
                        <input
                          type="number"
                          min={1}
                          max={totalPages}
                          value={pageJumpValue || currentPage}
                          onChange={(e) => onPageJumpValueChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const page = parseInt(pageJumpValue || currentPage.toString());
                              if (!isNaN(page) && page >= 1 && page <= totalPages) {
                                goToPage(page);
                              } else {
                                onPageJumpValueChange("");
                              }
                            }
                          }}
                          onBlur={() => onPageJumpValueChange("")}
                          className="w-20 p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 text-center font-medium"
                          placeholder="Page"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Assign Button Section */}
          <div className="pt-6 border-t border-gray-200 bg-amber-50 p-6 rounded-2xl border border-amber-200">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <p className="text-lg font-medium text-gray-700">
                  {selectedProperties.length > 0 && selectedRealtor ? (
                    <span className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Ready to assign <strong className="text-amber-600 text-xl">{selectedProperties.length}</strong>{" "}
                      {selectedProperties.length === 1 ? "property" : "properties"} to{" "}
                      <strong className="text-amber-600 text-xl">{realtors.find((r) => r.id === selectedRealtor)?.name}</strong>
                    </span>
                  ) : (
                    <span className="text-gray-600 text-lg">
                      {!selectedRealtor && selectedProperties.length > 0
                        ? "⚠️ Please select a realtor to assign properties"
                        : selectedRealtor && selectedProperties.length === 0
                        ? "⚠️ Please select at least one property to assign"
                        : "Select a realtor and properties to begin"}
                    </span>
                  )}
                </p>
              </div>
              <Button
                onClick={onAssign}
                disabled={assigningProperties || !selectedRealtor || selectedProperties.length === 0}
                className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl w-full lg:w-auto"
                size="lg"
              >
                {assigningProperties ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-5 w-5 mr-3" />
                    Assign {selectedProperties.length} {selectedProperties.length === 1 ? "Property" : "Properties"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

