import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, UserPlus, RefreshCw, User, Mail, Phone, Edit2, Trash2, CheckCircle2, X } from "lucide-react";
import { Realtor } from "./types";

interface RealtorsTabProps {
  realtors: Realtor[];
  loadingRealtors: boolean;
  showAddRealtor: boolean;
  newRealtor: { name: string; email: string; password: string };
  showEditRealtor: boolean;
  editingRealtor: Realtor | null;
  editRealtorForm: { name: string; email: string; password: string; contact: string };
  updatingRealtor: boolean;
  onShowAddRealtorChange: (show: boolean) => void;
  onNewRealtorChange: (realtor: { name: string; email: string; password: string }) => void;
  onAddRealtor: () => void;
  onEditRealtor: (realtor: Realtor) => void;
  onEditRealtorFormChange: (form: { name: string; email: string; password: string; contact: string }) => void;
  onShowEditRealtorChange: (show: boolean) => void;
  onEditingRealtorChange: (realtor: Realtor | null) => void;
  onUpdateRealtor: () => void;
  onDeleteRealtor: (realtorId: number, realtorName: string) => void;
}

export const RealtorsTab = ({
  realtors,
  loadingRealtors,
  showAddRealtor,
  newRealtor,
  showEditRealtor,
  editingRealtor,
  editRealtorForm,
  updatingRealtor,
  onShowAddRealtorChange,
  onNewRealtorChange,
  onAddRealtor,
  onEditRealtor,
  onEditRealtorFormChange,
  onShowEditRealtorChange,
  onEditingRealtorChange,
  onUpdateRealtor,
  onDeleteRealtor,
}: RealtorsTabProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                Manage Realtors
              </CardTitle>
              <p className="text-gray-600 text-lg">
                Add and manage your realtor team members. Create accounts for realtors so they can access their assigned properties.
              </p>
            </div>
            <Button
              onClick={() => onShowAddRealtorChange(!showAddRealtor)}
              className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl px-6 py-3"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Add New Realtor
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {showAddRealtor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <UserPlus className="h-6 w-6 text-amber-600" />
                <h3 className="text-xl font-bold text-gray-900">Add New Realtor to Your Team</h3>
              </div>
              <p className="text-gray-600 mb-6">Fill in the details below to create a new realtor account. They'll receive login credentials.</p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Full Name</label>
                  <input
                    type="text"
                    value={newRealtor.name}
                    onChange={(e) => onNewRealtorChange({ ...newRealtor, name: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Email Address</label>
                  <input
                    type="email"
                    value={newRealtor.email}
                    onChange={(e) => onNewRealtorChange({ ...newRealtor, email: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                    placeholder="john.doe@company.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Temporary Password</label>
                  <input
                    type="password"
                    value={newRealtor.password}
                    onChange={(e) => onNewRealtorChange({ ...newRealtor, password: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                    placeholder="Choose a secure password"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={onAddRealtor}
                  className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl px-8 py-4 rounded-xl"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Create Realtor Account
                </Button>
                <Button
                  onClick={() => onShowAddRealtorChange(false)}
                  variant="outline"
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-xl"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {loadingRealtors ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading realtors...</p>
            </div>
          ) : realtors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium text-lg">No realtors found. Add your first realtor above.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <Table>
                <TableHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50">
                  <TableRow className="border-b border-amber-200">
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Name</TableHead>
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Email</TableHead>
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Contact Number</TableHead>
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {realtors.map((realtor, idx) => (
                    <motion.tr
                      key={realtor.id || idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      className="hover:bg-amber-50/50 transition-all duration-200 group border-b border-gray-100"
                    >
                      <TableCell className="font-semibold text-gray-900 py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <User className="h-5 w-5 text-amber-600" />
                          </div>
                          {realtor.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 py-5 px-6">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="truncate">{realtor.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 py-5 px-6">
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="truncate">{realtor.contact || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-6">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditRealtor(realtor)}
                            className="bg-white hover:bg-amber-50 text-amber-600 border-amber-300 hover:border-amber-400 font-medium transition-all rounded-lg"
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Dialog
                            open={showEditRealtor && editingRealtor?.id === realtor.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                onShowEditRealtorChange(false);
                                onEditingRealtorChange(null);
                                onEditRealtorFormChange({ name: "", email: "", password: "", contact: "" });
                              }
                            }}
                          >
                            <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader className="p-6 pb-4 border-b border-gray-200">
                                <DialogTitle className="text-gray-900 font-bold text-2xl flex items-center gap-3">
                                  <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                                    <Edit2 className="h-5 w-5 text-white" />
                                  </div>
                                  Edit Realtor: {editingRealtor?.name}
                                </DialogTitle>
                                <DialogDescription className="text-gray-600 mt-2 text-base">
                                  Update the realtor's information. Leave password blank if you don't want to change it.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-3 block">
                                      Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={editRealtorForm.name}
                                      onChange={(e) => onEditRealtorFormChange({ ...editRealtorForm, name: e.target.value })}
                                      className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                                      placeholder="John Doe"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-3 block">
                                      Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="email"
                                      value={editRealtorForm.email}
                                      onChange={(e) => onEditRealtorFormChange({ ...editRealtorForm, email: e.target.value })}
                                      className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                                      placeholder="john.doe@company.com"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-3 block">Contact Number</label>
                                    <input
                                      type="tel"
                                      value={editRealtorForm.contact}
                                      onChange={(e) => onEditRealtorFormChange({ ...editRealtorForm, contact: e.target.value })}
                                      className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                                      placeholder="555-0123"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-3 block">New Password</label>
                                    <input
                                      type="password"
                                      value={editRealtorForm.password}
                                      onChange={(e) => onEditRealtorFormChange({ ...editRealtorForm, password: e.target.value })}
                                      className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all"
                                      placeholder="Leave blank to keep current password"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Leave blank if you don't want to change the password</p>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter className="p-6 pt-0 border-t border-gray-200">
                                <Button
                                  onClick={() => {
                                    onShowEditRealtorChange(false);
                                    onEditingRealtorChange(null);
                                    onEditRealtorFormChange({ name: "", email: "", password: "", contact: "" });
                                  }}
                                  variant="outline"
                                  className="border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl px-6 py-3"
                                  disabled={updatingRealtor}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                                <Button
                                  onClick={onUpdateRealtor}
                                  disabled={updatingRealtor || !editRealtorForm.name || !editRealtorForm.email}
                                  className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl px-6 py-3"
                                >
                                  {updatingRealtor ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Update Realtor
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-white hover:bg-red-50 text-red-600 border-red-300 hover:border-red-500 font-medium transition-all rounded-lg"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl">
                              <AlertDialogHeader className="p-6">
                                <AlertDialogTitle className="text-gray-900 font-bold text-2xl">Delete Realtor: {realtor.name}?</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-600 mt-4 space-y-3 text-lg">
                                  <p className="font-semibold text-gray-900">This will:</p>
                                  <ul className="list-disc list-inside space-y-2 text-base ml-2">
                                    <li>Move all their properties back to you (unassigned)</li>
                                    <li>Unassign all their bookings</li>
                                    <li>Delete their sources and rule chunks</li>
                                    <li>Remove them from the system</li>
                                  </ul>
                                  <p className="mt-6 font-bold text-red-600 text-lg">⚠️ This action CANNOT be undone!</p>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="p-6 pt-0">
                                <AlertDialogCancel className="border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl px-6 py-3">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDeleteRealtor(realtor.id, realtor.name)}
                                  className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl px-6 py-3"
                                >
                                  Delete Realtor
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
  );
};

