import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PhoneForwarded,
  RefreshCw,
  AlertTriangle,
  Phone,
  PhoneOff,
  X,
  ShieldCheck,
  Moon,
  Sun,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Realtor } from "./types";

interface CallForwardingTabProps {
  userType: string | null;
  loadingCallForwarding: boolean;
  callForwardingState: any;
  hasBotNumber: boolean;
  showCarrierSelection: boolean;
  currentCarrier: string | null;
  selectedCarrier: string;
  forwardingCarriers: string[];
  forwardingTarget: string;
  businessForwardingEnabled: boolean;
  afterHoursEnabled: boolean;
  supports25SecondForwarding: boolean;
  businessDialCode: string | null;
  businessDisableDialCode: string | null;
  afterHoursEnableDialCode: string | null;
  afterHoursDisableDialCode: string | null;
  forwardingCodes: any;
  isAppOnly: boolean;
  botNumberDisplay: string | null;
  lastAfterHoursUpdate: string | null;
  forwardingFailure: string | null;
  forwardingNotes: string;
  forwardingFailureReason: string;
  carrierDetails: any[];
  updatingCallForwarding: boolean;
  realtors: Realtor[];
  onForwardingTargetChange: (target: string) => void;
  onShowCarrierSelectionChange: (show: boolean) => void;
  onSelectedCarrierChange: (carrier: string) => void;
  onCarrierUpdate: (carrier: string) => void;
  onBusinessForwardingDial: () => void;
  onBusinessForwardingConfirmation: () => void;
  onBusinessForwardingDisable: () => void;
  onAfterHoursToggle: (enabled: boolean) => void;
  onForwardingFailureReport: () => void;
  onForwardingNotesChange: (notes: string) => void;
  onForwardingFailureReasonChange: (reason: string) => void;
  onNavigateToPhoneNumbers: () => void;
}

export const CallForwardingTab = ({
  userType,
  loadingCallForwarding,
  callForwardingState,
  hasBotNumber,
  showCarrierSelection,
  currentCarrier,
  selectedCarrier,
  forwardingCarriers,
  forwardingTarget,
  businessForwardingEnabled,
  afterHoursEnabled,
  supports25SecondForwarding,
  businessDialCode,
  businessDisableDialCode,
  afterHoursEnableDialCode,
  afterHoursDisableDialCode,
  forwardingCodes,
  isAppOnly,
  botNumberDisplay,
  lastAfterHoursUpdate,
  forwardingFailure,
  forwardingNotes,
  forwardingFailureReason,
  carrierDetails,
  updatingCallForwarding,
  realtors,
  onForwardingTargetChange,
  onShowCarrierSelectionChange,
  onSelectedCarrierChange,
  onCarrierUpdate,
  onBusinessForwardingDial,
  onBusinessForwardingConfirmation,
  onBusinessForwardingDisable,
  onAfterHoursToggle,
  onForwardingFailureReport,
  onForwardingNotesChange,
  onForwardingFailureReasonChange,
  onNavigateToPhoneNumbers,
}: CallForwardingTabProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1 space-y-3">
              <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                  <PhoneForwarded className="h-6 w-6 text-white" />
                </div>
                Call Forwarding Controls
              </CardTitle>
              <p className="text-gray-600 text-lg">
                Launch carrier dial codes, confirm forwarding state, and share carrier feedback with our support team.
              </p>
            </div>
            {userType === "property_manager" && (
              <div className="w-full lg:w-80">
                <p className="text-sm text-gray-500 font-semibold mb-2">Manage forwarding for</p>
                <Select value={forwardingTarget} onValueChange={onForwardingTargetChange}>
                  <SelectTrigger className="w-full bg-white border-amber-300 rounded-xl">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">My Number</SelectItem>
                    {realtors.map((realtor) => (
                      <SelectItem key={realtor.id} value={`realtor-${realtor.id}`}>
                        {realtor.name || `Realtor #${realtor.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {loadingCallForwarding ? (
            <div className="text-center py-12">
              <RefreshCw className="h-10 w-10 animate-spin text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold text-lg">Loading forwarding state...</p>
            </div>
          ) : callForwardingState ? (
            <div className="space-y-6">
              {/* No Number Assigned Warning */}
              {!hasBotNumber && (
                <div className="rounded-xl border-2 border-red-300 bg-red-50 p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-base font-semibold text-red-900 mb-2">No Phone Number Assigned</p>
                      <p className="text-sm text-red-800 mb-3">
                        {callForwardingState.message ||
                          (userType === "realtor"
                            ? "No phone number assigned to you. Please ask your Property manager to assign you a number."
                            : "This user doesn't have a phone number assigned yet. Please assign a phone number first to enable call forwarding.")}
                      </p>
                      {userType === "property_manager" && (
                        <Button onClick={onNavigateToPhoneNumbers} className="bg-red-600 hover:bg-red-700 text-white">
                          Go to Phone Numbers
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Carrier Selection Prompt */}
              {showCarrierSelection && (
                <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-base font-semibold text-amber-900">Select Your Mobile Carrier</p>
                        {currentCarrier && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onShowCarrierSelectionChange(false)}
                            className="text-amber-700 hover:text-amber-900"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-amber-800 mb-4">
                        We need to know your carrier to provide the correct forwarding codes. Each carrier uses different dial codes.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={selectedCarrier} onValueChange={onSelectedCarrierChange}>
                          <SelectTrigger className="w-full sm:w-64 bg-white border-amber-300">
                            <SelectValue placeholder="Select your carrier" />
                          </SelectTrigger>
                          <SelectContent>
                            {forwardingCarriers.map((carrier) => (
                              <SelectItem key={carrier} value={carrier}>
                                {carrier}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => onCarrierUpdate(selectedCarrier)}
                            disabled={!selectedCarrier}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            Save Carrier
                          </Button>
                          {currentCarrier && (
                            <Button
                              variant="outline"
                              onClick={() => onShowCarrierSelectionChange(false)}
                              className="border-amber-300 text-amber-700"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Only show forwarding controls if carrier is set AND number is assigned */}
              {!showCarrierSelection && hasBotNumber && currentCarrier && (
                <>
                  {/* Carrier Information Display */}
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900">Mobile Carrier</p>
                          <p className="text-base font-bold text-blue-700">{currentCarrier}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!supports25SecondForwarding && (
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            Limited Support
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onShowCarrierSelectionChange(true)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                    {carrierDetails.length > 0 && (
                      <div className="text-xs text-blue-800">
                        {(() => {
                          const detail = carrierDetails.find((c: any) => c.name === currentCarrier);
                          if (detail?.notes) {
                            return <p className="italic">{detail.notes}</p>;
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 p-4 sm:p-5 bg-white">
                      <p className="text-sm font-semibold text-gray-500">Bot Number</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{botNumberDisplay || "Not assigned"}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {callForwardingState.user_type === "realtor" ? "Realtor" : "Property Manager"} #
                        {callForwardingState.user_id || "N/A"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4 sm:p-5 bg-white">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-500">Business Hours Forwarding</p>
                          <p className="text-base font-bold text-gray-900">
                            {businessForwardingEnabled ? "Configured" : "Not Set"}
                          </p>
                        </div>
                        <ShieldCheck className={`h-6 w-6 ${businessForwardingEnabled ? "text-green-600" : "text-amber-500"}`} />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">One-time "no answer" failover via carrier code.</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4 sm:p-5 bg-white">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-500">After-Hours Mode</p>
                          <p className="text-base font-bold text-gray-900">
                            {afterHoursEnabled ? "Forwarding All Calls" : "Normal Carrier Routing"}
                          </p>
                        </div>
                        {afterHoursEnabled ? <Moon className="h-6 w-6 text-indigo-600" /> : <Sun className="h-6 w-6 text-amber-500" />}
                      </div>
                      {lastAfterHoursUpdate && (
                        <p className="text-xs text-gray-500 mt-2">Last updated {new Date(lastAfterHoursUpdate).toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 p-5 space-y-3 bg-white">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold text-gray-900">Enable Missed-Call Forwarding (Business Hours)</p>
                        <Badge
                          variant="outline"
                          className={businessForwardingEnabled ? "border-green-200 text-green-700" : "border-amber-200 text-amber-700"}
                        >
                          {businessForwardingEnabled ? "Complete" : "Action Needed"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Forward calls to the AI assistant only if you don't pick up within ~25 seconds. It's a one-time carrier setup.
                      </p>

                      {!businessForwardingEnabled && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-800">
                              <strong>Don't worry!</strong> You can turn this off anytime. It's fully reversible - once you enable it, a
                              disable code will appear below that you can dial whenever you want to deactivate it.
                            </p>
                          </div>
                        </div>
                      )}

                      {!supports25SecondForwarding && (
                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-orange-800">
                              <strong>{currentCarrier || "Your carrier"}</strong> doesn't support 25-second forwarding. Only unconditional
                              forwarding (forward all calls) is available.
                            </p>
                          </div>
                        </div>
                      )}

                      {isAppOnly && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-blue-800">
                              <p className="font-semibold mb-1">Google Fi Setup Required</p>
                              <p>
                                {forwardingCodes?.forward_all?.instructions ||
                                  "Configure forwarding in the Google Fi app: Settings → Calls → Call forwarding"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {!businessForwardingEnabled && (
                        <>
                          {supports25SecondForwarding && businessDialCode && businessDialCode !== "app_only" && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-gray-700">Carrier code to dial:</p>
                              <p className="text-sm font-mono font-bold text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 text-center tracking-wider">
                                {businessDialCode}
                              </p>
                              <p className="text-xs text-gray-600 italic">
                                This code will open in your dialer. Tap CALL, wait for 3 beeps, then return here to confirm.
                              </p>
                            </div>
                          )}
                          {supports25SecondForwarding && (!businessDialCode || businessDialCode === "app_only") && (
                            <p className="text-xs font-mono text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                              {businessDialCode === "app_only" ? "App configuration required" : "Code unavailable"}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3">
                            {supports25SecondForwarding && businessDialCode && businessDialCode !== "app_only" && (
                              <>
                                <Button onClick={onBusinessForwardingDial} variant="outline" disabled={!currentCarrier} className="rounded-lg">
                                  Launch Dialer
                                </Button>
                                <Button
                                  onClick={onBusinessForwardingConfirmation}
                                  disabled={updatingCallForwarding || !currentCarrier}
                                  className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                  {updatingCallForwarding ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    "Confirm Setup"
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </>
                      )}

                      {businessForwardingEnabled && supports25SecondForwarding && (
                        <div className="space-y-3">
                          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-green-800">
                                Business hours forwarding is currently active. Missed calls will be forwarded to the AI assistant.
                              </p>
                            </div>
                          </div>

                          {businessDisableDialCode && businessDisableDialCode !== "app_only" && (
                            <>
                              <p className="text-sm font-semibold text-gray-900">Disable Business Hours Forwarding</p>
                              <p className="text-xs text-gray-600">
                                Stop forwarding missed calls. Your phone will ring normally during business hours.
                              </p>
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-700">Carrier code to dial:</p>
                                <p className="text-sm font-mono font-bold text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 text-center tracking-wider">
                                  {businessDisableDialCode}
                                </p>
                                <p className="text-xs text-gray-600 italic">
                                  This code will open in your dialer. Tap CALL, wait for 3 beeps, then return here to confirm.
                                </p>
                              </div>
                              <Button
                                onClick={onBusinessForwardingDisable}
                                variant="outline"
                                disabled={updatingCallForwarding || !currentCarrier}
                                className="rounded-lg border-red-300 text-red-600 hover:bg-red-50"
                              >
                                {updatingCallForwarding ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Disabling...
                                  </>
                                ) : (
                                  "Disable Business Hours Forwarding"
                                )}
                              </Button>
                            </>
                          )}
                          {(!businessDisableDialCode || businessDisableDialCode === "app_only") && (
                            <p className="text-xs font-mono text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                              {businessDisableDialCode === "app_only" ? "App configuration required" : "Disable code unavailable"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-gray-200 p-5 space-y-4 bg-white">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-gray-900">After-Hours Forwarding Shortcuts</p>
                        <p className="text-sm text-gray-600">
                          Decide what happens after 5 PM: send every call to the assistant or let your phone ring normally.
                        </p>
                      </div>

                      {isAppOnly && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-blue-800">
                              <p className="font-semibold mb-1">Google Fi Setup Required</p>
                              <p>
                                {forwardingCodes?.forward_all?.instructions ||
                                  "Configure forwarding in the Google Fi app: Settings → Calls → Call forwarding"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                          <p className="text-base font-semibold text-gray-900">Turn On After-Hours Forwarding (All Calls)</p>
                          <p className="text-sm text-gray-600">
                            After 5 PM, send every caller straight to the AI assistant so nothing slips through the cracks.
                          </p>
                          {afterHoursEnableDialCode && afterHoursEnableDialCode !== "app_only" && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-gray-700">Carrier code to dial:</p>
                              <p className="text-sm font-mono font-bold text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 text-center tracking-wider">
                                {afterHoursEnableDialCode}
                              </p>
                              <p className="text-xs text-gray-600 italic">
                                This code will open in your dialer. Tap CALL, wait for 3 beeps, then return here.
                              </p>
                            </div>
                          )}
                          {(!afterHoursEnableDialCode || afterHoursEnableDialCode === "app_only") && (
                            <p className="text-xs font-mono text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                              {afterHoursEnableDialCode === "app_only" ? "App configuration required" : "Code unavailable"}
                            </p>
                          )}
                          <Button
                            variant="secondary"
                            onClick={() => onAfterHoursToggle(true)}
                            disabled={
                              !afterHoursEnableDialCode || afterHoursEnableDialCode === "app_only" || updatingCallForwarding || afterHoursEnabled
                            }
                            className="rounded-lg w-full sm:w-auto"
                          >
                            {isAppOnly ? "Configure in Google Fi App" : "Turn On After-Hours Forwarding"}
                          </Button>
                        </div>
                        {afterHoursEnabled ? (
                          <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                            <p className="text-base font-semibold text-gray-900">Turn Off After-Hours Forwarding</p>
                            <p className="text-sm text-gray-600">Stop forwarding all calls so your phone rings like normal again.</p>
                            {afterHoursDisableDialCode && afterHoursDisableDialCode !== "app_only" && (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-700">Carrier code to dial:</p>
                                <p className="text-sm font-mono font-bold text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 text-center tracking-wider">
                                  {afterHoursDisableDialCode}
                                </p>
                                <p className="text-xs text-gray-600 italic">
                                  This code will open in your dialer. Tap CALL, wait for 3 beeps, then return here.
                                </p>
                              </div>
                            )}
                            {(!afterHoursDisableDialCode || afterHoursDisableDialCode === "app_only") && (
                              <p className="text-xs font-mono text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                                {afterHoursDisableDialCode === "app_only" ? "App configuration required" : "Code unavailable"}
                              </p>
                            )}
                            <Button
                              variant="outline"
                              onClick={() => onAfterHoursToggle(false)}
                              disabled={!afterHoursDisableDialCode || afterHoursDisableDialCode === "app_only" || updatingCallForwarding}
                              className="rounded-lg w-full sm:w-auto"
                            >
                              {isAppOnly ? "Disable in Google Fi App" : "Turn Off After-Hours Forwarding"}
                            </Button>
                          </div>
                        ) : (
                          <div className="border border-dashed border-gray-200 rounded-lg p-4 space-y-2 bg-gray-50">
                            <p className="text-base font-semibold text-gray-900">Turn Off After-Hours Forwarding</p>
                            <p className="text-sm text-gray-600">This option appears once after-hours forwarding is turned on.</p>
                            <p className="text-xs text-gray-500">
                              Tip: tap "Turn On After-Hours Forwarding" first to activate full forwarding, then you'll be able to turn it off
                              here.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {forwardingFailure && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-red-700">Carrier reported an issue</p>
                        <p className="text-sm text-red-600 mt-1">{forwardingFailure}</p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-gray-200 p-5 space-y-4 bg-white">
                    <p className="text-lg font-semibold text-gray-900">Notes & Support</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">Internal notes (optional)</p>
                        <Textarea
                          value={forwardingNotes}
                          onChange={(event) => onForwardingNotesChange(event.target.value)}
                          placeholder="Example: Confirmed AT&T setup with Sarah on 5/10."
                          className="min-h-[110px] rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">Carrier issue details</p>
                        <Textarea
                          value={forwardingFailureReason}
                          onChange={(event) => onForwardingFailureReasonChange(event.target.value)}
                          placeholder="Tell us what you heard (busy tone, feature unavailable, etc.)."
                          className="min-h-[110px] rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-gray-500">
                        Notes are included automatically the next time you update forwarding state.
                      </p>
                      <Button
                        variant="outline"
                        onClick={onForwardingFailureReport}
                        disabled={updatingCallForwarding || !forwardingFailureReason.trim()}
                        className="rounded-lg border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Send Issue to Support
                      </Button>
                    </div>
                  </div>

                  {forwardingCarriers.length > 0 && (
                    <div className="rounded-xl border border-gray-200 p-5 bg-white">
                      <p className="text-sm font-semibold text-gray-900 mb-3">Carrier QA checklist</p>
                      <div className="flex flex-wrap gap-2">
                        {forwardingCarriers.map((carrier) => (
                          <Badge key={carrier} variant="outline" className="rounded-full px-4 py-1 text-gray-700">
                            {carrier}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        Run the dial codes with each carrier your team uses and log any differences for Support.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <PhoneOff className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg text-gray-600 font-semibold">Assign a phone number to unlock forwarding controls</p>
              <p className="text-sm text-gray-500 mt-2">
                Once a Twilio bot number is assigned, you can run the dial codes directly from this dashboard.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

