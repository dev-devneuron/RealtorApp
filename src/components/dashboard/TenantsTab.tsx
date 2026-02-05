import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, UserPlus, RefreshCw, Edit2 } from "lucide-react";
import { formatPhoneNumber, getPropertyMetadata } from "./utils";
import { TenantAddModal } from "./TenantAddModal";
import { TenantEditModal } from "./TenantEditModal";

interface TenantsTabProps {
  tenants: any[];
  loadingTenants: boolean;
  tenantFilterProperty: string;
  tenantFilterActive: string;
  apartments: any[];
  onShowAddTenant: () => void;
  onFilterPropertyChange: (property: string) => void;
  onFilterActiveChange: (active: string) => void;
  onRefresh: () => void;
  onEditTenant: (tenant: any) => void;
  // Modal state and handlers
  showAddTenant: boolean;
  setShowAddTenant: (show: boolean) => void;
  newTenant: any;
  setNewTenant: (tenant: any) => void;
  showEditTenant: boolean;
  setShowEditTenant: (show: boolean) => void;
  editingTenant: any | null;
  editTenantForm: any;
  setEditTenantForm: (form: any) => void;
  creatingTenant: boolean;
  updatingTenant: boolean;
  realtors: any[];
  onCreateTenant: () => Promise<void>;
  onUpdateTenant: () => Promise<void>;
}

export const TenantsTab = ({
  tenants,
  loadingTenants,
  tenantFilterProperty,
  tenantFilterActive,
  apartments,
  onShowAddTenant,
  onFilterPropertyChange,
  onFilterActiveChange,
  onRefresh,
  onEditTenant,
  showAddTenant,
  setShowAddTenant,
  newTenant,
  setNewTenant,
  showEditTenant,
  setShowEditTenant,
  editingTenant,
  editTenantForm,
  setEditTenantForm,
  creatingTenant,
  updatingTenant,
  realtors,
  onCreateTenant,
  onUpdateTenant,
}: TenantsTabProps) => {
  return (
    <>
      {/* Add Tenant Modal */}
      <TenantAddModal
        open={showAddTenant}
        onOpenChange={setShowAddTenant}
        newTenant={newTenant}
        onFormChange={setNewTenant}
        apartments={apartments}
        realtors={realtors}
        creatingTenant={creatingTenant}
        onCreate={onCreateTenant}
        onCancel={() => {
          setShowAddTenant(false);
          setNewTenant({
            name: "",
            property_id: "",
            phone_number: "",
            email: "",
            realtor_id: "",
            unit_number: "",
            lease_start_date: "",
            lease_end_date: "",
            notes: ""
          });
        }}
      />

      {/* Edit Tenant Modal */}
      <TenantEditModal
        open={showEditTenant}
        onOpenChange={setShowEditTenant}
        editingTenant={editingTenant}
        editTenantForm={editTenantForm}
        onFormChange={setEditTenantForm}
        updatingTenant={updatingTenant}
        onUpdate={onUpdateTenant}
        onCancel={() => {
          setShowEditTenant(false);
          setEditingTenant(null);
        }}
      />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-200 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-4 rounded-lg shadow-sm">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                  Tenant Management
                </CardTitle>
                <p className="text-gray-600 text-base">Manage your tenants and their lease information.</p>
              </div>
            </div>
            <Button
              onClick={onShowAddTenant}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded-lg px-6 py-3"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {/* Filter Bar */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <Select value={tenantFilterProperty} onValueChange={onFilterPropertyChange}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-gray-300 rounded-lg">
                <SelectValue placeholder="Filter by property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {apartments.map((apt) => (
                  <SelectItem key={apt.id} value={String(apt.id)}>
                    {getPropertyMetadata(apt).address || `Property #${apt.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tenantFilterActive} onValueChange={onFilterActiveChange}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-gray-300 rounded-lg">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onRefresh} variant="outline" className="bg-white border-gray-300 hover:bg-gray-50 rounded-lg">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Loading State */}
          {loadingTenants ? (
            <div className="text-center py-12">
              <RefreshCw className="h-10 w-10 animate-spin text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">Loading tenants...</p>
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium text-xl mb-2">No tenants found</p>
              <p className="text-gray-400 text-sm mb-4">Add your first tenant to get started.</p>
              <Button
                onClick={onShowAddTenant}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded-lg"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Tenant
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-900 py-6 px-6 text-lg">Name</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-6 px-6 text-lg">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-6 px-6 text-lg">Property</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-6 px-6 text-lg">Unit</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-6 px-6 text-lg">Lease Period</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-6 px-6 text-lg">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-6 px-6 text-lg">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant, idx) => (
                    <motion.tr
                      key={tenant.tenant_id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="py-4 px-6">
                        <p className="font-semibold text-gray-900">{tenant.name || "Unknown"}</p>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div>
                          {tenant.phone_number && <p className="text-sm text-gray-900">{formatPhoneNumber(tenant.phone_number)}</p>}
                          {tenant.email && <p className="text-sm text-gray-500">{tenant.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <p className="text-gray-900">{tenant.property_address || "N/A"}</p>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <p className="text-gray-900">{tenant.unit_number || "N/A"}</p>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {tenant.lease_start_date || tenant.lease_end_date ? (
                          <div>
                            <p className="text-sm text-gray-900">
                              {tenant.lease_start_date ? new Date(tenant.lease_start_date).toLocaleDateString() : "N/A"} -{" "}
                              {tenant.lease_end_date ? new Date(tenant.lease_end_date).toLocaleDateString() : "Ongoing"}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Not specified</p>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge
                          className={`text-sm font-semibold ${
                            tenant.is_active ? "bg-green-100 text-green-700 border-green-300" : "bg-gray-100 text-gray-700 border-gray-300"
                          }`}
                        >
                          {tenant.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Button variant="outline" size="sm" onClick={() => onEditTenant(tenant)} className="rounded-lg">
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
    </>
  );
};

