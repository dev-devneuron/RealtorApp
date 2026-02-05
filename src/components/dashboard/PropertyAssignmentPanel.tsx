/**
 * Property Assignment Panel Component
 * 
 * Allows Property Managers to assign properties to realtors
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Search, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { assignProperty, fetchPropertiesForAssignment } from "./utils";
import type { Property, Realtor } from "./types";

interface PropertyAssignmentPanelProps {
  pmId: number;
  realtors: Realtor[];
  properties?: Property[];
  onAssignmentChange?: () => void;
}

export const PropertyAssignmentPanel = ({
  pmId,
  realtors,
  properties: initialProperties,
  onAssignmentChange,
}: PropertyAssignmentPanelProps) => {
  const [properties, setProperties] = useState<Property[]>(initialProperties || []);
  const [selectedRealtor, setSelectedRealtor] = useState<number | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "assigned" | "unassigned">("all");

  // Load properties if not provided
  useEffect(() => {
    if (!initialProperties || initialProperties.length === 0) {
      loadProperties();
    }
  }, [pmId]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const props = await fetchPropertiesForAssignment(pmId);
      setProperties(props);
    } catch (error: any) {
      console.error("Error loading properties:", error);
      toast.error(error.message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProperty = (propertyId: number) => {
    setSelectedProperties((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const filtered = getFilteredProperties();
    if (selectedProperties.size === filtered.length) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleAssign = async () => {
    if (!selectedRealtor) {
      toast.error("Please select a realtor");
      return;
    }
    if (selectedProperties.size === 0) {
      toast.error("Please select at least one property");
      return;
    }

    try {
      setLoading(true);
      const propertyIds = Array.from(selectedProperties);
      
      // Assign properties one by one
      for (const propertyId of propertyIds) {
        await assignProperty(propertyId, selectedRealtor, "realtor");
      }

      toast.success(`Successfully assigned ${propertyIds.length} property(ies) to realtor`);
      setSelectedProperties(new Set());
      setSelectedRealtor(null);
      onAssignmentChange?.();
      loadProperties();
    } catch (error: any) {
      console.error("Error assigning properties:", error);
      toast.error(error.message || "Failed to assign properties");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProperties = () => {
    let filtered = properties;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.address?.toLowerCase().includes(query) ||
          p.id.toString().includes(query)
      );
    }

    // Filter by assignment status
    if (filterStatus === "assigned") {
      filtered = filtered.filter((p) => {
        const meta = p.listing_metadata || {};
        return meta.assigned_to_realtor_id || p.assigned_to_realtor_id;
      });
    } else if (filterStatus === "unassigned") {
      filtered = filtered.filter((p) => {
        const meta = p.listing_metadata || {};
        return !meta.assigned_to_realtor_id && !p.assigned_to_realtor_id;
      });
    }

    return filtered;
  };

  const filteredProperties = getFilteredProperties();

  const getAssignedRealtor = (property: Property) => {
    const meta = property.listing_metadata || {};
    const realtorId = meta.assigned_to_realtor_id || property.assigned_to_realtor_id;
    if (realtorId) {
      return realtors.find((r) => r.id === realtorId);
    }
    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-white via-amber-50/30 to-white border-0 shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-blue-500/5 pointer-events-none" />
      <CardHeader className="relative p-6 lg:p-8 border-b border-amber-100/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl blur-lg opacity-50" />
            <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-2xl shadow-xl">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent">
              Property Assignment
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              Assign properties to realtors for booking management
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative p-6 lg:p-8 space-y-6">
        {/* Realtor Selection */}
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-2 block">
            Select Realtor
          </Label>
          <Select
            value={selectedRealtor?.toString() || ""}
            onValueChange={(value) => setSelectedRealtor(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl">
              <SelectValue placeholder="Choose a realtor..." />
            </SelectTrigger>
            <SelectContent>
              {realtors.map((realtor) => (
                <SelectItem key={realtor.id} value={realtor.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-amber-600" />
                    <span>{realtor.name}</span>
                    {realtor.email && (
                      <span className="text-xs text-gray-500">({realtor.email})</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              Search Properties
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by address or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              Filter by Status
            </Label>
            <Select
              value={filterStatus}
              onValueChange={(value: any) => setFilterStatus(value)}
            >
              <SelectTrigger className="h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Properties List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-gray-700">
              Properties ({filteredProperties.length})
            </Label>
            {filteredProperties.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="border-amber-300 hover:bg-amber-50"
              >
                {selectedProperties.size === filteredProperties.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600 mr-2" />
              <span className="text-sm text-gray-600">Loading properties...</span>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No properties found</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto border border-amber-200 rounded-lg p-3">
              {filteredProperties.map((property) => {
                const isSelected = selectedProperties.has(property.id);
                const assignedRealtor = getAssignedRealtor(property);
                const isAssigned = !!assignedRealtor;

                return (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
                    }`}
                    onClick={() => handleSelectProperty(property.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectProperty(property.id)}
                      className="flex-shrink-0 border-amber-400 data-[state=checked]:bg-amber-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm sm:text-base text-gray-900 truncate">
                          {property.address || `Property #${property.id}`}
                        </span>
                        {isAssigned && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800 border-blue-200">
                            Assigned to {assignedRealtor?.name}
                          </Badge>
                        )}
                        {!isAssigned && (
                          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                            Unassigned
                          </Badge>
                        )}
                      </div>
                      {property.price && (
                        <div className="text-xs sm:text-sm text-gray-600">
                          ${property.price.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Assign Button */}
        <Button
          onClick={handleAssign}
          disabled={loading || !selectedRealtor || selectedProperties.size === 0}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all h-12 px-8 text-base font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Assigning...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Assign {selectedProperties.size} Property{selectedProperties.size !== 1 ? "ies" : ""} to Realtor
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

