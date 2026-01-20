/**
 * Candidates Tab Component - Modern Redesign
 * 
 * Sleek, easy-to-use interface for managing outbound calling candidates
 * with AI-powered intelligence extraction and inquiry context.
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Copy,
  AlertTriangle,
  Play,
  Loader2,
  MapPin,
  MessageSquare,
  Filter,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchCandidates,
  triggerCall,
  type Candidate,
} from "./outboundCallingApi";
import { formatPhoneNumber } from "./utils";

export const CandidatesTab = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<Set<number>>(new Set());
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null);
  const [calling, setCalling] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<"all" | "eligible" | "ineligible">("all");

  // Helper Functions
  const getDisplayName = (candidate: Candidate): string => {
    return candidate.name || candidate.inferred_name || candidate.stored_name || "N/A";
  };

  const getDisplayEmail = (candidate: Candidate): string => {
    return candidate.email || candidate.extracted_email || candidate.stored_email || "N/A";
  };

  const isNameInferred = (candidate: Candidate): boolean => {
    return !!candidate.inferred_name && !candidate.stored_name;
  };

  const isEmailExtracted = (candidate: Candidate): boolean => {
    return !!candidate.extracted_email && !candidate.stored_email;
  };

  const hasInquiryContext = (candidate: Candidate): boolean => {
    // Check ALL inquiry fields - inquiry_summary is the most important!
    return !!(
      candidate.inquiry_property || 
      candidate.inquiry_purpose || 
      candidate.inquiry_summary ||  // CRITICAL: Most important field!
      candidate.extracted_region
    );
  };

  const formatLastCalled = (candidate: Candidate): string => {
    const lastCalled = candidate.last_called_at || candidate.last_call_at;
    if (!lastCalled) return "Never called";
    
    try {
      return new Date(lastCalled).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      return "Invalid date";
    }
  };

  const getPurposeBadgeClass = (purpose?: string | null): string => {
    if (!purpose) return "bg-gray-500";
    
    const purposeKey = purpose.toLowerCase().replace(/\s+/g, '-');
    const colorMap: Record<string, string> = {
      'booking-a-tour': 'bg-green-500',
      'pricing-inquiry': 'bg-blue-500',
      'availability-inquiry': 'bg-yellow-500',
      'maintenance-request': 'bg-orange-500',
      'general-information': 'bg-gray-500',
      'viewing-request': 'bg-purple-500',
      'application-inquiry': 'bg-pink-500',
    };
    
    return colorMap[purposeKey] || 'bg-gray-500';
  };

  const canCall = (candidate: Candidate): boolean => {
    return candidate.eligible || candidate.bypassed_for_testing === true;
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  // Load candidates
  const loadCandidates = async (silent: boolean = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const data = await fetchCandidates(100);
      setCandidates(data);
    } catch (error: any) {
      // Only show error toast for non-silent refreshes
      if (!silent) {
        toast.error(error.message || "Failed to load candidates");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    loadCandidates();
  }, []);

  // Automatic polling: refresh every 7 seconds while dashboard is open
  useEffect(() => {
    const POLL_INTERVAL = 7000; // 7 seconds
    
    // Only poll when the page is visible
    const handleVisibilityChange = () => {
      // When tab becomes visible, immediately refresh (silent)
      if (!document.hidden) {
        loadCandidates(true);
      }
    };

    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up polling interval (only when page is visible, silent refresh)
    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        loadCandidates(true); // Silent refresh for polling
      }
    }, POLL_INTERVAL);

    // Cleanup
    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Filtered candidates
  const filteredCandidates = useMemo(() => {
    let filtered = candidates;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.phone_number.toLowerCase().includes(query) ||
        getDisplayName(c).toLowerCase().includes(query) ||
        getDisplayEmail(c).toLowerCase().includes(query) ||
        c.inquiry_property?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter === "eligible") {
      filtered = filtered.filter(c => canCall(c));
    } else if (statusFilter === "ineligible") {
      filtered = filtered.filter(c => !canCall(c));
    }

    return filtered;
  }, [candidates, searchQuery, statusFilter]);

  const eligibleCount = filteredCandidates.filter(c => canCall(c)).length;
  const selectedCount = selectedCandidates.size;

  // Toggle selection
  const toggleSelection = (contactId: number) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedCandidates(newSelected);
  };

  const toggleSelectAll = () => {
    const callable = filteredCandidates.filter(c => canCall(c));
    const allSelected = callable.every(c => selectedCandidates.has(c.contact_id));
    
    if (allSelected) {
      const newSelected = new Set(selectedCandidates);
      callable.forEach(c => newSelected.delete(c.contact_id));
      setSelectedCandidates(newSelected);
    } else {
      const newSelected = new Set(selectedCandidates);
      callable.forEach(c => newSelected.add(c.contact_id));
      setSelectedCandidates(newSelected);
    }
  };

  // Call functions
  const handleTriggerCall = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowCallDialog(true);
  };

  const handleViewDetails = (candidate: Candidate, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDetailCandidate(candidate);
    setShowDetailDialog(true);
  };

  const confirmCall = async () => {
    if (!selectedCandidate) return;

    setCalling(true);
    try {
      await triggerCall(selectedCandidate.phone_number);
      toast.success(`Call initiated to ${formatPhoneNumber(selectedCandidate.phone_number)}`);
      setShowCallDialog(false);
      setSelectedCandidate(null);
      await loadCandidates();
    } catch (error: any) {
      toast.error(error.message || "Failed to trigger call");
    } finally {
      setCalling(false);
    }
  };

  const handleCallSelected = async () => {
    const selected = filteredCandidates.filter(c => 
      selectedCandidates.has(c.contact_id) && canCall(c)
    );

    if (selected.length === 0) {
      toast.error("No callable candidates selected");
      return;
    }

    setCalling(true);
    let success = 0;
    let failed = 0;

    for (const candidate of selected) {
      try {
        await triggerCall(candidate.phone_number);
        success++;
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        failed++;
        console.error(`Failed to call ${candidate.phone_number}:`, error);
      }
    }

    if (success > 0) {
      toast.success(`Successfully initiated ${success} call(s)`);
    }
    if (failed > 0) {
      toast.warning(`${failed} call(s) failed`);
    }

    setSelectedCandidates(new Set());
    await loadCandidates();
    setCalling(false);
  };

  // Candidate Card Component - Simplified
  const CandidateCard = ({ candidate }: { candidate: Candidate }) => {
    const displayName = getDisplayName(candidate);
    const displayEmail = getDisplayEmail(candidate);
    const hasInquiry = hasInquiryContext(candidate);
    const callable = canCall(candidate);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        <Card 
          className={`overflow-hidden transition-all hover:shadow-lg cursor-pointer h-full flex flex-col ${
            callable ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/20"
          }`}
          onClick={() => handleViewDetails(candidate)}
        >
          <CardContent className="p-0 flex flex-col h-full" style={{ minHeight: '280px' }}>
            {/* Header */}
            <div className="p-4 border-b bg-white/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Checkbox
                    checked={selectedCandidates.has(candidate.contact_id)}
                    onCheckedChange={() => toggleSelection(candidate.contact_id)}
                    disabled={!callable}
                    className="mt-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{displayName}</h3>
                      {isNameInferred(candidate) && (
                        <Badge variant="secondary" className="text-xs">Inferred</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3.5 w-3.5" />
                      <span className="font-mono">{formatPhoneNumber(candidate.phone_number)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={callable ? "bg-green-500" : "bg-red-500"}>
                    {callable ? "Eligible" : "Not Eligible"}
                  </Badge>
                  {candidate.bypassed_for_testing && (
                    <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700">
                      Testing
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Essential Info - Compact */}
            <div className="p-4 space-y-2 flex-1">
              {/* Email */}
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                <div 
                  className={`flex-1 text-sm truncate ${
                    displayEmail !== "No email" 
                      ? "text-blue-600" 
                      : "text-gray-400"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (displayEmail !== "No email") handleCopy(displayEmail, "Email");
                  }}
                >
                  {displayEmail}
                </div>
                {isEmailExtracted(candidate) && (
                  <Badge variant="outline" className="text-xs">Extracted</Badge>
                )}
              </div>

              {/* Property - Show on Card */}
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 text-sm text-gray-700 truncate" title={candidate.inquiry_property || undefined}>
                  {candidate.inquiry_property || "N/A"}
                </div>
              </div>

              {/* Inquiry Purpose Badge - Quick View */}
              {candidate.inquiry_purpose ? (
                <div>
                  <Badge 
                    className={`${getPurposeBadgeClass(candidate.inquiry_purpose)} text-white text-xs px-2 py-1`}
                  >
                    {candidate.inquiry_purpose}
                  </Badge>
                </div>
              ) : (
                <div className="h-5" /> // Spacer to maintain height
              )}

              {/* Quick Stats */}
              <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="truncate">{formatLastCalled(candidate).split(',')[0] || "N/A"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{candidate.call_attempt_count}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t bg-gray-50/50">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(candidate);
                  }}
                  className="flex-1"
                >
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Details
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTriggerCall(candidate);
                  }}
                  disabled={!callable || calling}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  size="sm"
                >
                  {calling ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Phone className="h-3.5 w-3.5 mr-1.5" />
                      {hasInquiry ? "Re-engage" : "Call"}
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            Follow-up Candidates
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {eligibleCount} eligible • {filteredCandidates.length} total
            {selectedCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">
                • {selectedCount} selected
              </span>
            )}
            {filteredCandidates.some(c => c.bypassed_for_testing) && (
              <span className="ml-2 text-yellow-600 font-medium">
                • Testing mode active
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadCandidates()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {selectedCount > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCandidates(new Set())}
                disabled={calling}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={handleCallSelected}
                disabled={calling}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                {calling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Calling...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Selected ({selectedCount})
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, email, or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Candidates</option>
                <option value="eligible">Eligible Only</option>
                <option value="ineligible">Not Eligible</option>
              </select>
            </div>

            {/* Select All */}
            {filteredCandidates.filter(c => canCall(c)).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="whitespace-nowrap"
              >
                <Checkbox
                  checked={
                    filteredCandidates.filter(c => canCall(c)).length > 0 &&
                    filteredCandidates.filter(c => canCall(c)).every(c => selectedCandidates.has(c.contact_id))
                  }
                  className="mr-2"
                />
                Select All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Candidates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No candidates found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          <AnimatePresence>
            {filteredCandidates.map((candidate) => (
              <CandidateCard key={candidate.contact_id} candidate={candidate} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Call Confirmation Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Outbound Call</DialogTitle>
            <DialogDescription>
              Ready to call {selectedCandidate && formatPhoneNumber(selectedCandidate.phone_number)}?
            </DialogDescription>
          </DialogHeader>
          
          {selectedCandidate && (
            <div className="space-y-4 py-4">
              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{getDisplayName(selectedCandidate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{getDisplayEmail(selectedCandidate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="font-mono">{formatPhoneNumber(selectedCandidate.phone_number)}</span>
                </div>
              </div>

              {/* Testing Mode Warning */}
              {selectedCandidate.bypassed_for_testing && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <h4 className="font-semibold text-sm text-yellow-900">
                      Testing Mode Active
                    </h4>
                  </div>
                  <p className="text-xs text-yellow-800">
                    Eligibility checks are bypassed for testing purposes.
                  </p>
                </div>
              )}

              {/* Re-engagement Context */}
              {hasInquiryContext(selectedCandidate) && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-blue-200">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-sm text-blue-900">
                      Re-engagement Context
                    </h4>
                    <Badge variant="outline" className="text-xs border-blue-400 text-blue-700">
                      AI Extracted
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-800 bg-white/50 rounded p-2">
                    This context will be sent to the AI assistant to personalize the conversation.
                  </p>
                  
                  {/* Inquiry Summary - MOST IMPORTANT - Show Prominently */}
                  {selectedCandidate.inquiry_summary && (
                    <div className="bg-white rounded-lg p-3 border-2 border-blue-300 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Complete Summary</span>
                      </div>
                      <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
                        {selectedCandidate.inquiry_summary}
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <span className="text-xs text-blue-600 italic">Combined: Purpose | Property | Email</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedCandidate.inquiry_purpose && (
                    <div>
                      <span className="text-xs font-medium text-blue-900">Purpose: </span>
                      <Badge 
                        className={`${getPurposeBadgeClass(selectedCandidate.inquiry_purpose)} text-white text-xs ml-2`}
                      >
                        {selectedCandidate.inquiry_purpose}
                      </Badge>
                    </div>
                  )}
                  
                  {selectedCandidate.inquiry_property && (
                    <div className="bg-white rounded p-2 border border-blue-200">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-blue-900">Property: </span>
                          <span className="text-sm text-gray-900 font-medium">{selectedCandidate.inquiry_property}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedCandidate.extracted_region && (
                    <div className="bg-white rounded p-2 border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-900">Region: </span>
                        <span className="text-sm text-gray-900 font-medium">{selectedCandidate.extracted_region}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Full Call Summary - Show if different from inquiry_summary */}
                  {selectedCandidate.call_summary && selectedCandidate.call_summary !== selectedCandidate.inquiry_summary && (
                    <details className="bg-white rounded-lg p-3 border border-blue-200">
                      <summary className="cursor-pointer text-sm font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-2 list-none">
                        <MessageSquare className="h-4 w-4" />
                        <span>View Full Call Summary</span>
                        <span className="ml-auto text-xs text-blue-600">▼</span>
                      </summary>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {selectedCandidate.call_summary}
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCallDialog(false)} disabled={calling}>
              Cancel
            </Button>
            <Button
              onClick={confirmCall}
              disabled={calling}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
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

      {/* Candidate Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-amber-600" />
              Candidate Details
            </DialogTitle>
            <DialogDescription>
              Complete information for {detailCandidate && formatPhoneNumber(detailCandidate.phone_number)}
            </DialogDescription>
          </DialogHeader>
          
          {detailCandidate && (
            <div className="space-y-6 py-4">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Name</div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          {getDisplayName(detailCandidate)}
                          {isNameInferred(detailCandidate) && (
                            <Badge variant="secondary" className="text-xs">Inferred</Badge>
                          )}
                          {detailCandidate.stored_name && (
                            <span className="text-xs text-gray-500">(Stored: {detailCandidate.stored_name})</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Phone</div>
                        <div className="font-mono font-semibold text-gray-900 flex items-center gap-2">
                          {formatPhoneNumber(detailCandidate.phone_number)}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleCopy(detailCandidate.phone_number, "Phone")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Email</div>
                        <div 
                          className={`font-semibold flex items-center gap-2 ${
                            getDisplayEmail(detailCandidate) !== "No email" 
                              ? "text-blue-600 cursor-pointer hover:underline" 
                              : "text-gray-400"
                          }`}
                          onClick={() => {
                            if (getDisplayEmail(detailCandidate) !== "No email") {
                              handleCopy(getDisplayEmail(detailCandidate), "Email");
                            }
                          }}
                        >
                          {getDisplayEmail(detailCandidate)}
                          {isEmailExtracted(detailCandidate) && (
                            <Badge variant="outline" className="text-xs">Extracted</Badge>
                          )}
                          {detailCandidate.stored_email && (
                            <span className="text-xs text-gray-500">(Stored: {detailCandidate.stored_email})</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {detailCandidate.timezone && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-gray-500" />
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Timezone</div>
                          <div className="font-semibold text-gray-900">{detailCandidate.timezone}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Inquiry Context - Full Details */}
              {hasInquiryContext(detailCandidate) ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      Last Inquiry Context
                      <Badge variant="outline" className="text-xs border-blue-400 text-blue-700">
                        AI Extracted
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Inquiry Summary - MOST IMPORTANT */}
                    {detailCandidate.inquiry_summary && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-bold text-blue-900 uppercase tracking-wide">Complete Summary</span>
                        </div>
                        <div className="text-base text-gray-900 leading-relaxed whitespace-pre-wrap font-medium mb-2">
                          {detailCandidate.inquiry_summary}
                        </div>
                        <div className="pt-2 border-t border-blue-200">
                          <span className="text-xs text-blue-600 italic">Combined: Purpose | Property | Email</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Property Address */}
                    {detailCandidate.inquiry_property && (
                      <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                            <MapPin className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Property Address</div>
                            <div className="text-base font-semibold text-gray-900 leading-relaxed">
                              {detailCandidate.inquiry_property}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Purpose */}
                    {detailCandidate.inquiry_purpose && (
                      <div>
                        <div className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Purpose</div>
                        <Badge 
                          className={`${getPurposeBadgeClass(detailCandidate.inquiry_purpose)} text-white text-base px-4 py-2 font-semibold`}
                        >
                          {detailCandidate.inquiry_purpose}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Region */}
                    {detailCandidate.extracted_region && (
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide mr-2">Region:</span>
                          <span className="text-base font-semibold text-gray-900">{detailCandidate.extracted_region}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Full Call Summary */}
                    {detailCandidate.call_summary && detailCandidate.call_summary !== detailCandidate.inquiry_summary && (
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <details className="group">
                          <summary className="cursor-pointer text-sm font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-2 list-none mb-3">
                            <MessageSquare className="h-5 w-5" />
                            <span>View Full Call Summary</span>
                            <span className="ml-auto text-xs text-blue-600 group-open:hidden">▼</span>
                            <span className="ml-auto text-xs text-blue-600 hidden group-open:inline">▲</span>
                          </summary>
                          <div className="pt-3 border-t border-blue-200">
                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {detailCandidate.call_summary}
                            </div>
                          </div>
                        </details>
                      </div>
                    )}
                    
                    {/* Extracted Info */}
                    {(detailCandidate.extracted_email || detailCandidate.inferred_name) && (
                      <div className="bg-blue-100/50 rounded-lg p-4 border border-blue-200">
                        <div className="text-sm font-semibold text-blue-900 mb-3 uppercase tracking-wide">Extracted from Call</div>
                        <div className="space-y-2">
                          {detailCandidate.extracted_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-blue-600" />
                              <span className="font-mono text-sm">{detailCandidate.extracted_email}</span>
                              <Badge variant="outline" className="text-xs">Extracted</Badge>
                            </div>
                          )}
                          {detailCandidate.inferred_name && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="text-sm">{detailCandidate.inferred_name}</span>
                              <Badge variant="outline" className="text-xs">Inferred</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Inquiry Context</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      No inquiry context available
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Call History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Call History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Last Called</div>
                      <div className="font-semibold text-gray-900">{formatLastCalled(detailCandidate)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Call Attempts</div>
                      <div className="font-semibold text-gray-900">{detailCandidate.call_attempt_count}</div>
                    </div>
                    {detailCandidate.last_call_outcome && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Last Outcome</div>
                        <Badge 
                          variant="outline" 
                          className={`${
                            detailCandidate.last_call_outcome === "connected" 
                              ? "border-green-400 text-green-700"
                              : detailCandidate.last_call_outcome === "no_answer" || detailCandidate.last_call_outcome === "voicemail"
                              ? "border-yellow-400 text-yellow-700"
                              : "border-gray-400 text-gray-700"
                          }`}
                        >
                          {detailCandidate.last_call_outcome}
                        </Badge>
                      </div>
                    )}
                    {detailCandidate.call_direction && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Call Direction</div>
                        <div className="font-semibold text-gray-900 capitalize">{detailCandidate.call_direction}</div>
                      </div>
                    )}
                    {detailCandidate.last_call_id && (
                      <div className="md:col-span-2">
                        <div className="text-xs text-gray-500 mb-1">Last Call ID</div>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{detailCandidate.last_call_id}</code>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Eligibility Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Eligibility Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge className={canCall(detailCandidate) ? "bg-green-500" : "bg-red-500"}>
                      {canCall(detailCandidate) ? "Eligible" : "Not Eligible"}
                    </Badge>
                    {detailCandidate.bypassed_for_testing && (
                      <Badge variant="outline" className="border-yellow-400 text-yellow-700">
                        Testing Mode Active
                      </Badge>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Reason</div>
                    <div className="text-sm text-gray-700">{detailCandidate.eligibility_reason}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Eligibility Checks</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(detailCandidate.eligibility_checks).map(([key, value]) => (
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
                </CardContent>
              </Card>

              {/* Consent & Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consent & Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      {detailCandidate.consent_status ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Consent Status</div>
                        <div className="font-semibold text-gray-900">
                          {detailCandidate.consent_status ? "Has Consent" : "No Consent"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {detailCandidate.opted_out ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Opt-out Status</div>
                        <div className="font-semibold text-gray-900">
                          {detailCandidate.opted_out ? "Opted Out" : "Active"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
            {detailCandidate && canCall(detailCandidate) && (
              <Button
                onClick={() => {
                  setShowDetailDialog(false);
                  setSelectedCandidate(detailCandidate);
                  setShowCallDialog(true);
                }}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
