/**
 * Candidates Tab Component
 * 
 * Displays eligible follow-up candidates with eligibility checks,
 * allows triggering calls, and shows call history.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
} from "@/components/ui/alert-dialog";
import {
  Phone,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Globe,
  ChevronDown,
  ChevronUp,
  Copy,
  AlertTriangle,
  Play,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchCandidates,
  processQueue,
  triggerCall,
  type Candidate,
  type ProcessQueueResponse,
} from "./outboundCallingApi";
import { formatPhoneNumber } from "./utils";

export const CandidatesTab = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [calling, setCalling] = useState(false);
  const [batchSize, setBatchSize] = useState(10);
  const [processingBatch, setProcessingBatch] = useState(false);
  const [batchResults, setBatchResults] = useState<ProcessQueueResponse | null>(null);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const data = await fetchCandidates(100);
      setCandidates(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const toggleRowExpansion = (contactId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(contactId)) {
      newExpanded.delete(contactId);
    } else {
      newExpanded.add(contactId);
    }
    setExpandedRows(newExpanded);
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    toast.success("Phone number copied");
  };

  const handleTriggerCall = async (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowCallDialog(true);
  };

  const confirmCall = async () => {
    if (!selectedCandidate) return;

    setCalling(true);
    try {
      const result = await triggerCall(selectedCandidate.phone_number);
      toast.success(`Call initiated to ${formatPhoneNumber(selectedCandidate.phone_number)}`);
      setShowCallDialog(false);
      setSelectedCandidate(null);
      // Refresh candidates to update attempt counts
      await loadCandidates();
    } catch (error: any) {
      toast.error(error.message || "Failed to trigger call");
    } finally {
      setCalling(false);
    }
  };

  const handleProcessBatch = async () => {
    setProcessingBatch(true);
    try {
      const results = await processQueue(batchSize);
      setBatchResults(results);
      toast.success(`Processed batch: ${results.called} called, ${results.skipped} skipped`);
      await loadCandidates();
    } catch (error: any) {
      toast.error(error.message || "Failed to process batch");
    } finally {
      setProcessingBatch(false);
    }
  };

  const getOutcomeBadge = (outcome?: string) => {
    if (!outcome) return null;

    const badges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      no_answer: { label: "No Answer", variant: "secondary" },
      voicemail: { label: "Voicemail", variant: "secondary" },
      hangup: { label: "Hangup", variant: "destructive" },
      opt_out: { label: "Opted Out", variant: "destructive" },
      connected: { label: "Connected", variant: "default" },
      connected_and_declined: { label: "Declined", variant: "outline" },
    };

    const badge = badges[outcome] || { label: outcome, variant: "outline" };
    return (
      <Badge variant={badge.variant} className="text-xs">
        {badge.label}
      </Badge>
    );
  };

  const getRetryStatus = (outcome?: string) => {
    if (!outcome) return { allowed: false, reason: "No previous call" };
    const retryable = ["no_answer", "voicemail"];
    return {
      allowed: retryable.includes(outcome),
      reason: retryable.includes(outcome) ? "Retry allowed" : "Retry blocked",
    };
  };

  const filteredCandidates = candidates.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.phone_number.toLowerCase().includes(query) ||
      c.name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    );
  });

  // Helper to check if candidate can be called (eligible OR bypassed for testing)
  const canCall = (candidate: Candidate) => {
    return candidate.eligible || candidate.bypassed_for_testing === true;
  };

  const eligibleCount = filteredCandidates.filter((c) => canCall(c)).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Follow-up Candidates</h3>
          <p className="text-sm text-gray-600">
            {eligibleCount} callable out of {filteredCandidates.length} candidates
            {filteredCandidates.some(c => c.bypassed_for_testing) && (
              <span className="ml-2 text-yellow-600">
                (Testing mode active)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCandidates}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowBatchDialog(true)}
            disabled={processingBatch || eligibleCount === 0}
            className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Run Batch
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by phone, name, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Candidates Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Name / Email</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Last Called</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Eligible</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-600" />
                    </TableCell>
                  </TableRow>
                ) : filteredCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No candidates found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidates.map((candidate) => {
                    const isExpanded = expandedRows.has(candidate.contact_id);
                    const retryStatus = getRetryStatus(candidate.last_call_outcome);

                    return (
                      <>
                        <TableRow
                          key={candidate.contact_id}
                          className={canCall(candidate) ? "bg-green-50/50" : "bg-red-50/30"}
                        >
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(candidate.contact_id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">
                                {formatPhoneNumber(candidate.phone_number)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleCopyPhone(candidate.phone_number)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {candidate.name && (
                                <div className="flex items-center gap-1 text-sm font-medium">
                                  <User className="h-3 w-3" />
                                  {candidate.name}
                                </div>
                              )}
                              {candidate.email && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Mail className="h-3 w-3" />
                                  {candidate.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {candidate.timezone ? (
                              <div className="flex items-center gap-1 text-xs">
                                <Globe className="h-3 w-3" />
                                {candidate.timezone}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{candidate.call_attempt_count}</Badge>
                          </TableCell>
                          <TableCell>
                            {candidate.last_called_at ? (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Clock className="h-3 w-3" />
                                {new Date(candidate.last_called_at).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getOutcomeBadge(candidate.last_call_outcome)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {candidate.eligible ? (
                                <Badge className="bg-green-500">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Eligible
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Not Eligible
                                </Badge>
                              )}
                              {candidate.bypassed_for_testing && (
                                <Badge className="bg-yellow-500 text-white text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Testing Mode
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => handleTriggerCall(candidate)}
                              disabled={!canCall(candidate) || calling}
                              className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Call
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-gray-50 p-4">
                              <div className="space-y-4">
                                {candidate.bypassed_for_testing && (
                                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                      <h4 className="font-semibold text-sm text-yellow-900">
                                        ⚠️ Testing Mode: Eligibility checks bypassed
                                      </h4>
                                    </div>
                                    <p className="text-xs text-yellow-800 mb-2">
                                      The backend has bypassed eligibility checks for testing purposes.
                                    </p>
                                    {candidate.eligibility_reason && (
                                      <div className="mt-2 pt-2 border-t border-yellow-300">
                                        <p className="text-xs font-medium text-yellow-900 mb-1">Original Eligibility Reason:</p>
                                        <p className="text-xs text-yellow-800">{candidate.eligibility_reason}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">Eligibility Details</h4>
                                  <p className="text-sm text-gray-600 mb-3">{candidate.eligibility_reason}</p>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {Object.entries(candidate.eligibility_checks).map(([key, value]) => (
                                      <div
                                        key={key}
                                        className={`flex items-center gap-2 p-2 rounded ${
                                          value ? "bg-green-100" : "bg-red-100"
                                        }`}
                                      >
                                        {value ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-red-600" />
                                        )}
                                        <span className="text-xs capitalize">
                                          {key.replace(/_/g, " ")}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {candidate.last_call_id && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-gray-600">Last Call ID:</span>
                                    <code className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">
                                      {candidate.last_call_id}
                                    </code>
                                    <span className="text-xs text-gray-500">
                                      (View in Call Records tab)
                                    </span>
                                  </div>
                                )}
                                {retryStatus && (
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle
                                      className={`h-4 w-4 ${
                                        retryStatus.allowed ? "text-green-600" : "text-red-600"
                                      }`}
                                    />
                                    <span className="text-sm">{retryStatus.reason}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Call Confirmation Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Outbound Call</DialogTitle>
            <DialogDescription>
              This will place an outbound call to {selectedCandidate && formatPhoneNumber(selectedCandidate.phone_number)} now.
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-3 py-4">
              {selectedCandidate.bypassed_for_testing && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <h4 className="font-semibold text-sm text-yellow-900">
                      ⚠️ Testing Mode: Eligibility checks bypassed
                    </h4>
                  </div>
                  <p className="text-xs text-yellow-800 mb-2">
                    The backend has bypassed eligibility checks for testing purposes. This call will proceed even though eligibility checks failed.
                  </p>
                  {selectedCandidate.eligibility_reason && (
                    <div className="mt-2 pt-2 border-t border-yellow-300">
                      <p className="text-xs font-medium text-yellow-900 mb-1">Original Eligibility Reason:</p>
                      <p className="text-xs text-yellow-800">{selectedCandidate.eligibility_reason}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-2">Eligibility Checks:</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {selectedCandidate.eligibility_checks.has_consent ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span>Has consent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCandidate.eligibility_checks.not_opted_out ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span>Not opted out</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCandidate.eligibility_checks.within_time_window ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span>Within time window</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCandidate.eligibility_checks.cooldown_passed ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span>Cooldown passed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCandidate.eligibility_checks.under_attempt_limit ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span>Under attempt limit</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCallDialog(false)} disabled={calling}>
              Cancel
            </Button>
            <Button
              onClick={confirmCall}
              disabled={calling}
              className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              {calling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calling...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Place Call
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Process Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Batch</DialogTitle>
            <DialogDescription>
              Process a batch of eligible candidates automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Batch Size</label>
              <Input
                type="number"
                min="1"
                max="50"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                {eligibleCount} callable candidates available
                {filteredCandidates.some(c => c.bypassed_for_testing) && (
                  <span className="ml-1 text-yellow-600">(includes testing mode bypasses)</span>
                )}
              </p>
            </div>
            {batchResults && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-2">Last Batch Results:</h4>
                <div className="space-y-1 text-xs">
                  <div>Called: {batchResults.called}</div>
                  <div>Skipped: {batchResults.skipped}</div>
                  <div>Errors: {batchResults.errors}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDialog(false)} disabled={processingBatch}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessBatch}
              disabled={processingBatch || eligibleCount === 0}
              className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              {processingBatch ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Batch
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

