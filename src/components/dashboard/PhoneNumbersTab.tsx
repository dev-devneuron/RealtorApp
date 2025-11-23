import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, CheckCircle2, RefreshCw, CheckSquare, User, Users, Unlink } from "lucide-react";
import { Realtor } from "./types";
import { PhoneNumberRequestDialog } from "./PhoneNumberRequestDialog";

interface PhoneNumbersTabProps {
  myNumber: string | null;
  phoneNumberRequests: any[];
  loadingPhoneRequests: boolean;
  purchasedPhoneNumbers: any[];
  loadingPurchasedNumbers: boolean;
  availablePhoneNumbers: any[];
  selectedRealtorForPhone: Record<number, number>;
  assigningPhone: boolean;
  realtors: Realtor[];
  onRequestPhone: () => void;
  onAssignPhoneNumber: (phoneNumberId: number, type: "property_manager" | "realtor", realtorId?: number) => void;
  onUnassignPhoneNumber: (phoneNumberId: number) => void;
  onSelectedRealtorForPhoneChange: (phoneNumberId: number, realtorId: number) => void;
  // Modal state and handlers
  showRequestPhoneDialog: boolean;
  setShowRequestPhoneDialog: (show: boolean) => void;
  phoneRequestForm: {
    country_code: string;
    area_code: string;
    notes: string;
  };
  setPhoneRequestForm: (form: { country_code: string; area_code: string; notes: string }) => void;
  requestingPhone: boolean;
  onRequestPhoneNumber: () => Promise<void>;
}

export const PhoneNumbersTab = ({
  myNumber,
  phoneNumberRequests,
  loadingPhoneRequests,
  purchasedPhoneNumbers,
  loadingPurchasedNumbers,
  availablePhoneNumbers,
  selectedRealtorForPhone,
  assigningPhone,
  realtors,
  onRequestPhone,
  onAssignPhoneNumber,
  onUnassignPhoneNumber,
  onSelectedRealtorForPhoneChange,
  showRequestPhoneDialog,
  setShowRequestPhoneDialog,
  phoneRequestForm,
  setPhoneRequestForm,
  requestingPhone,
  onRequestPhoneNumber,
}: PhoneNumbersTabProps) => {
  return (
    <>
      {/* Request Phone Number Dialog */}
      <PhoneNumberRequestDialog
        open={showRequestPhoneDialog}
        onOpenChange={setShowRequestPhoneDialog}
        phoneRequestForm={phoneRequestForm}
        onFormChange={setPhoneRequestForm}
        requestingPhone={requestingPhone}
        onSubmit={onRequestPhoneNumber}
        onCancel={() => {
          setShowRequestPhoneDialog(false);
          setPhoneRequestForm({ country_code: "", area_code: "", notes: "" });
        }}
      />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
      {/* Current Phone Number Display */}
      <Card className="bg-gradient-to-br from-amber-50 to-white shadow-xl border border-amber-200 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 sm:p-8">
          <CardTitle className="text-white text-2xl font-bold flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Phone className="h-6 w-6 text-white" />
            </div>
            Your Current Phone Number
          </CardTitle>
          <p className="text-amber-50 text-lg">This is the phone number currently assigned to your account</p>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {myNumber && myNumber.trim() !== "" ? (
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Assigned Number</p>
                  <p className="text-3xl font-bold text-gray-900">{myNumber}</p>
                </div>
              </div>
              <Badge className="bg-gradient-to-br from-green-500 to-green-600 text-white text-lg px-4 py-2 font-semibold">Active</Badge>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gray-200 rounded-xl">
                  <Phone className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">No Number Assigned</p>
                  <p className="text-xl font-semibold text-gray-500">Request a phone number to get started</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Phone Number Section */}
      <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                Request New Phone Number
              </CardTitle>
              <p className="text-gray-600 text-lg">Request a new phone number. A new number will be available in your portal within 24 hours.</p>
            </div>
            <Button
              onClick={onRequestPhone}
              className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl px-6 py-3"
            >
              <Phone className="h-5 w-5 mr-2" />
              Request
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {/* Phone Number Requests List */}
          {loadingPhoneRequests ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading requests...</p>
            </div>
          ) : phoneNumberRequests.length === 0 ? (
            <div className="text-center py-8 bg-amber-50 rounded-xl border border-amber-200">
              <Phone className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">No phone number requests yet</p>
              <p className="text-gray-500 text-sm mt-2">Click "Request" to submit your first request</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Requests</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {phoneNumberRequests.map((request: any) => (
                  <Card key={request.request_id} className="bg-white border border-amber-200 rounded-xl hover:shadow-lg transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <Badge
                          className={`text-sm font-semibold px-3 py-1 ${
                            request.status === "fulfilled"
                              ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                              : request.status === "pending"
                              ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : "NA"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {request.requested_at ? new Date(request.requested_at).toLocaleDateString() : "NA"}
                        </span>
                      </div>
                      {request.country_code && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-semibold">Country Code:</span> {request.country_code}
                        </p>
                      )}
                      {request.area_code && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-semibold">Area Code:</span> {request.area_code}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">Notes:</span> {request.notes || "NA"}
                      </p>
                      {request.fulfilled_at && (
                        <p className="text-xs text-green-600 font-medium mt-2">
                          Fulfilled: {new Date(request.fulfilled_at).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchased Phone Numbers & Assignment Section */}
      <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-6 sm:p-8">
          <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            Manage Phone Numbers
          </CardTitle>
          <p className="text-gray-600 text-lg">Assign purchased phone numbers to yourself or your realtors</p>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {loadingPurchasedNumbers ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading phone numbers...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Available Numbers */}
              {availablePhoneNumbers.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    Available for Assignment ({availablePhoneNumbers.length || 0})
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {availablePhoneNumbers.map((number: any) => (
                      <Card key={number.purchased_phone_number_id} className="bg-green-50 border-2 border-green-200 rounded-xl hover:shadow-lg transition-all">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-2xl font-bold text-gray-900">{number.phone_number || "NA"}</p>
                            <Badge className="bg-gradient-to-br from-green-500 to-green-600 text-white">Available</Badge>
                          </div>
                          <div className="space-y-3">
                            <Button
                              onClick={() => onAssignPhoneNumber(number.purchased_phone_number_id, "property_manager")}
                              disabled={assigningPhone}
                              className="w-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl"
                            >
                              {assigningPhone ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Assigning...
                                </>
                              ) : (
                                <>
                                  <User className="h-4 w-4 mr-2" />
                                  Assign to Me
                                </>
                              )}
                            </Button>
                            <div className="flex gap-2">
                              <Select
                                value={selectedRealtorForPhone[number.purchased_phone_number_id]?.toString() || ""}
                                onValueChange={(value) => onSelectedRealtorForPhoneChange(number.purchased_phone_number_id, Number(value))}
                              >
                                <SelectTrigger className="flex-1 bg-white border-amber-300 rounded-xl">
                                  <SelectValue placeholder="Select Realtor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {realtors.map((realtor) => (
                                    <SelectItem key={realtor.id} value={realtor.id.toString()}>
                                      {realtor.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                onClick={() => {
                                  const realtorId = selectedRealtorForPhone[number.purchased_phone_number_id];
                                  if (realtorId) {
                                    onAssignPhoneNumber(number.purchased_phone_number_id, "realtor", realtorId);
                                  }
                                }}
                                disabled={assigningPhone || !selectedRealtorForPhone[number.purchased_phone_number_id]}
                                className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl"
                              >
                                {assigningPhone ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Numbers */}
              {purchasedPhoneNumbers.filter((n: any) => n.status === "assigned").length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    </div>
                    Assigned Numbers ({purchasedPhoneNumbers.filter((n: any) => n.status === "assigned").length || 0})
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {purchasedPhoneNumbers
                      .filter((n: any) => n.status === "assigned")
                      .map((number: any) => (
                        <Card key={number.purchased_phone_number_id} className="bg-blue-50 border-2 border-blue-200 rounded-xl">
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-2xl font-bold text-gray-900">{number.phone_number || "NA"}</p>
                              <Badge className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">Assigned</Badge>
                            </div>
                            <div className="space-y-3 text-sm">
                              <div className="space-y-2">
                                <p className="text-gray-600">
                                  <span className="font-semibold">Assigned to:</span>{" "}
                                  {number.assigned_to_type === "property_manager" ? (
                                    <span className="font-semibold text-amber-700">Property Manager (You)</span>
                                  ) : number.assigned_to_type === "realtor" && number.assigned_to_id ? (
                                    <span className="font-semibold text-blue-700">
                                      {realtors.find((r) => r.id === number.assigned_to_id)?.name || `Realtor #${number.assigned_to_id}`}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">NA</span>
                                  )}
                                </p>
                                {number.assigned_to_type === "realtor" && number.assigned_to_id && (
                                  <p className="text-gray-500 text-xs">
                                    {realtors.find((r) => r.id === number.assigned_to_id)?.email || "NA"}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  Assigned: {number.assigned_at ? new Date(number.assigned_at).toLocaleDateString() : "NA"}
                                </p>
                              </div>
                              <Button
                                onClick={() => onUnassignPhoneNumber(number.purchased_phone_number_id)}
                                disabled={assigningPhone}
                                variant="outline"
                                className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-semibold rounded-xl"
                              >
                                {assigningPhone ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Unassigning...
                                  </>
                                ) : (
                                  <>
                                    <Unlink className="h-4 w-4 mr-2" />
                                    Unassign
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}

              {/* All Numbers Empty State */}
              {availablePhoneNumbers.length === 0 && purchasedPhoneNumbers.filter((n: any) => n.status === "assigned").length === 0 && (
                <div className="text-center py-12 bg-amber-50 rounded-xl border border-amber-200">
                  <Phone className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium text-xl mb-2">No phone numbers available</p>
                  <p className="text-gray-500 text-sm">Request a phone number to get started</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
    </>
  );
};

