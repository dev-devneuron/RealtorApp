/**
 * Vendor Call Attempts Timeline Component
 * 
 * Displays a timeline of all vendor call attempts with status, outcomes, and details
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Volume2,
  Download,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { type VendorCallAttempt } from "./vendorApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VendorCallAttemptsTimelineProps {
  attempts: VendorCallAttempt[];
}

const CALL_STATUS_COLORS: Record<string, string> = {
  initiated: "bg-blue-100 text-blue-700 border-blue-300",
  answered: "bg-green-100 text-green-700 border-green-300",
  declined: "bg-orange-100 text-orange-700 border-orange-300",
  no_answer: "bg-yellow-100 text-yellow-700 border-yellow-300",
  voicemail: "bg-purple-100 text-purple-700 border-purple-300",
  failed: "bg-red-100 text-red-700 border-red-300",
};

const OUTCOME_COLORS: Record<string, string> = {
  accepted: "bg-green-100 text-green-700 border-green-300",
  declined: "bg-orange-100 text-orange-700 border-orange-300",
  no_response: "bg-yellow-100 text-yellow-700 border-yellow-300",
  voicemail: "bg-purple-100 text-purple-700 border-purple-300",
};

// Helper to format transcripts similar to Call Records tab
const formatCallTranscriptBubbles = (transcript: string): JSX.Element[] => {
  if (!transcript) return [];

  const lines = transcript.split("\n").filter((line) => line.trim());
  const formatted: JSX.Element[] = [];
  let currentSpeaker: string | null = null;
  let currentMessage: string[] = [];

  lines.forEach((line, index) => {
    // Check if line looks like a speaker label (e.g., "Agent:", "Caller:", "User:")
    const speakerMatch = line.match(/^([A-Za-z\s]+):\s*(.*)$/);

    if (speakerMatch) {
      // Save previous message if exists
      if (currentSpeaker && currentMessage.length > 0) {
        formatted.push(
          <div key={`message-${index}-prev`} className="mb-4">
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentSpeaker.toLowerCase().includes("agent") ||
                  currentSpeaker.toLowerCase().includes("assistant")
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {currentSpeaker.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-700">
                    {currentSpeaker}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">Now</span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {currentMessage.join(" ")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Start new message
      currentSpeaker = speakerMatch[1].trim();
      currentMessage = [speakerMatch[2].trim()];
    } else {
      // Continuation of current message
      if (currentSpeaker) {
        currentMessage.push(line.trim());
      } else {
        // No speaker identified, treat as general text
        if (currentMessage.length === 0) {
          currentSpeaker = "System";
        }
        currentMessage.push(line.trim());
      }
    }
  });

  // Add last message
  if (currentSpeaker && currentMessage.length > 0) {
    formatted.push(
      <div key={`message-final`} className="mb-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              currentSpeaker.toLowerCase().includes("agent") ||
              currentSpeaker.toLowerCase().includes("assistant")
                ? "bg-blue-100 text-blue-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {currentSpeaker.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-700">
                {currentSpeaker}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400">Now</span>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                {currentMessage.join(" ")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no formatted messages, return original transcript
  if (formatted.length === 0) {
    return [
      <div
        key="raw-transcript"
        className="bg-white rounded-lg p-4 border border-gray-200"
      >
        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed font-mono">
          {transcript}
        </p>
      </div>,
    ];
  }

  return formatted;
};

const formatMaybeDateTime = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const formatMaybeDateTimeInTimeZone = (iso?: string | null, timeZone?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  if (!timeZone) return d.toLocaleString();
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    // If timezone is invalid, fall back to local formatting.
    return d.toLocaleString();
  }
};

const pickFirst = <T,>(...values: Array<T | null | undefined>): T | undefined => {
  for (const v of values) {
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
};

export const VendorCallAttemptsTimeline = ({
  attempts,
}: VendorCallAttemptsTimelineProps) => {
  const [expandedAttempt, setExpandedAttempt] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState<VendorCallAttempt | null>(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<number>>(new Set());
  const [expandedMetadataAttempts, setExpandedMetadataAttempts] = useState<Set<number>>(
    new Set()
  );
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Sort attempts by attempt_number (newest first)
  const sortedAttempts = [...attempts].sort((a, b) => b.attempt_number - a.attempt_number);

  const toggleTranscript = (attemptId: number) => {
    const newExpanded = new Set(expandedTranscripts);
    if (newExpanded.has(attemptId)) {
      newExpanded.delete(attemptId);
    } else {
      newExpanded.add(attemptId);
    }
    setExpandedTranscripts(newExpanded);
  };

  const toggleMetadata = (attemptId: number) => {
    const next = new Set(expandedMetadataAttempts);
    if (next.has(attemptId)) next.delete(attemptId);
    else next.add(attemptId);
    setExpandedMetadataAttempts(next);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTranscript(true);
      toast.success("Transcript copied to clipboard!");
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch (err) {
      toast.error("Failed to copy transcript");
    }
  };

  if (attempts.length === 0) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-6 w-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No call attempts yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-600" />
            Call Attempts ({attempts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedAttempts.map((attempt, index) => {
              const isExpanded = expandedAttempt === attempt.attempt_id;
              const isTranscriptExpanded = expandedTranscripts.has(attempt.attempt_id);
              const isMetadataExpanded = expandedMetadataAttempts.has(attempt.attempt_id);
              const meta = attempt.call_metadata ?? undefined;

              const toolCapture = (meta as any)?.tool_captureVendorResponse;
              const toolEscalate = (meta as any)?.tool_escalateToNextVendor;

              const requiresAccess = pickFirst<boolean>(
                (meta as any)?.requires_access_instructions,
                toolCapture?.requires_access_instructions
              );
              const emergencySurcharge = pickFirst<string>(
                (meta as any)?.emergency_surcharge,
                toolCapture?.emergency_surcharge
              );
              const preferredContactMethod = pickFirst<string>(
                (meta as any)?.preferred_contact_method,
                toolCapture?.preferred_contact_method
              );
              const availableDate = pickFirst<string>((meta as any)?.available_date, toolCapture?.available_date);
              const availableWindow = pickFirst<string>(
                (meta as any)?.available_time_window,
                toolCapture?.available_time_window
              );

              // Prefer normalized ISO availability fields from call_metadata, per guide.
              // earliest_available_time should be treated as a raw fallback string only (not parsed).
              const availabilityTimezone = pickFirst<string>(
                (meta as any)?.availability_timezone,
                toolCapture?.availability_timezone
              );
              const availabilityStartIso = pickFirst<string>(
                (meta as any)?.availability_start_at_local,
                (meta as any)?.availability_start_at_utc,
                toolCapture?.availability_start_at_local,
                toolCapture?.availability_start_at_utc
              );
              const availabilityEndIso = pickFirst<string>(
                (meta as any)?.availability_end_at_local,
                (meta as any)?.availability_end_at_utc,
                toolCapture?.availability_end_at_local,
                toolCapture?.availability_end_at_utc
              );
              const hasNormalizedAvailability = !!availabilityStartIso || !!availabilityEndIso || !!availabilityTimezone;

              const declineReason = pickFirst<string>(
                (meta as any)?.decline_reason,
                toolEscalate?.decline_reason
              );
              const permanentOptOut = pickFirst<boolean>(
                (meta as any)?.permanent_opt_out,
                toolEscalate?.permanent_opt_out
              );
              const suggestedCallbackTime = pickFirst<string>(
                (meta as any)?.suggested_callback_time,
                toolEscalate?.suggested_callback_time
              );
              const retryRecommended = pickFirst<boolean>(
                (meta as any)?.retry_recommended,
                toolEscalate?.retry_recommended
              );
              const retryDelayMinutes = pickFirst<number>(
                (meta as any)?.retry_delay_minutes,
                toolEscalate?.retry_delay_minutes
              );
              const callbackScheduled = pickFirst<boolean>(
                (meta as any)?.callback_scheduled,
                toolEscalate?.callback_scheduled
              );
              const callbackScheduledAt = pickFirst<string>(
                (meta as any)?.callback_scheduled_at,
                toolEscalate?.callback_scheduled_at
              );

              const hasVendorDecisionSignals =
                requiresAccess !== undefined ||
                !!emergencySurcharge ||
                !!preferredContactMethod ||
                !!availableDate ||
                !!availableWindow;
              const hasCallbackRetrySignals =
                !!suggestedCallbackTime ||
                retryRecommended !== undefined ||
                retryDelayMinutes !== undefined ||
                callbackScheduled !== undefined ||
                !!callbackScheduledAt ||
                !!declineReason ||
                permanentOptOut !== undefined;

              const hasAvailability = attempt.is_available !== undefined && attempt.is_available !== null;
              const hasDetails =
                hasAvailability ||
                attempt.earliest_available_time ||
                attempt.estimated_cost_range ||
                attempt.vendor_notes ||
                attempt.initiated_at ||
                attempt.answered_at ||
                attempt.completed_at ||
                attempt.call_duration_seconds ||
                hasNormalizedAvailability ||
                hasVendorDecisionSignals ||
                hasCallbackRetrySignals ||
                !!meta;
              const hasRecordingOrTranscript = attempt.call_recording_url || attempt.call_transcript;

              return (
                <motion.div
                  key={attempt.attempt_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Attempt Header */}
                  <div
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isExpanded ? "bg-gray-50" : ""
                    }`}
                    onClick={() =>
                      setExpandedAttempt(isExpanded ? null : attempt.attempt_id)
                    }
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900">
                            {attempt.vendor_name}
                          </span>
                          <Badge
                            variant="outline"
                            className={CALL_STATUS_COLORS[attempt.call_status] || ""}
                          >
                            {attempt.call_status.replace(/_/g, " ")}
                          </Badge>
                          {attempt.outcome && (
                            <Badge
                              variant="outline"
                              className={OUTCOME_COLORS[attempt.outcome] || ""}
                            >
                              {attempt.outcome}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Attempt #{attempt.attempt_number}
                          </span>
                          <span>
                            {formatMaybeDateTime(attempt.initiated_at)}
                          </span>
                          {attempt.call_duration_seconds && (
                            <span>
                              {Math.floor(attempt.call_duration_seconds / 60)}m{" "}
                              {attempt.call_duration_seconds % 60}s
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {attempt.outcome === "accepted" && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        {attempt.outcome === "declined" && (
                          <XCircle className="h-5 w-5 text-orange-600" />
                        )}
                        {hasDetails && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedAttempt(isExpanded ? null : attempt.attempt_id);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Call Recording & Transcript - Prominent Display (Always Visible) */}
                  {hasRecordingOrTranscript && (
                    <div className="border-t border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                      <div className="p-4 space-y-4">
                        {/* ⭐ CALL RECORDING SECTION - CRITICAL FOR PM VERIFICATION */}
                        {attempt.call_recording_url && (
                          <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <Volume2 className="h-5 w-5 text-blue-600" />
                              <h4 className="text-sm font-bold text-gray-900">Call Recording</h4>
                            </div>
                            <div className="space-y-3">
                              <audio
                                controls
                                className="w-full h-10 rounded-lg"
                                src={attempt.call_recording_url}
                              >
                                Your browser does not support the audio element.
                              </audio>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                                >
                                  <a
                                    href={attempt.call_recording_url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                    Download Recording
                                  </a>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                                >
                                  <a
                                    href={attempt.call_recording_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Open in New Tab
                                  </a>
                                </Button>
                              </div>
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-xs text-amber-800 flex items-start gap-2">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                                  <span>
                                    <strong>Important:</strong> Listen to verify vendor acceptance and job details before confirming assignment.
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ⭐ CALL TRANSCRIPT SECTION - CRITICAL FOR PM VERIFICATION */}
                        {attempt.call_transcript && (
                          <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <h4 className="text-sm font-bold text-gray-900">Call Transcript</h4>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleTranscript(attempt.attempt_id)}
                                className="text-xs h-7"
                              >
                                {isTranscriptExpanded ? (
                                  <>
                                    <ChevronUp className="h-3.5 w-3.5 mr-1" />
                                    Collapse
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                                    Expand
                                  </>
                                )}
                              </Button>
                            </div>

                            {isTranscriptExpanded ? (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-3"
                              >
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-96 overflow-y-auto">
                                  <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                    <div className="space-y-2">
                                      {formatCallTranscriptBubbles(attempt.call_transcript)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(attempt.call_transcript!)}
                                    className="text-xs"
                                  >
                                    {copiedTranscript ? (
                                      <>
                                        <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                                        Copied!
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                                        Copy Transcript
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowTranscript(attempt)}
                                    className="text-xs"
                                  >
                                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                                    View in Dialog
                                  </Button>
                                </div>
                              </motion.div>
                            ) : (
                              <div className="space-y-2">
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                                    {attempt.call_transcript.substring(0, 200)}
                                    {attempt.call_transcript.length > 200 && "..."}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleTranscript(attempt.attempt_id)}
                                  className="text-xs w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  Read Full Transcript ({attempt.call_transcript.length} characters)
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {isExpanded && hasDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-200 bg-white"
                    >
                      <div className="p-4 space-y-3">
                        {/* Availability */}
                        {hasAvailability && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">
                              Available:
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                attempt.is_available
                                  ? "border-green-300 text-green-700"
                                  : "border-red-300 text-red-700"
                              }
                            >
                              {attempt.is_available ? "Yes" : "No"}
                            </Badge>
                          </div>
                        )}

                        {/* Availability time (prefer normalized ISO in call_metadata) */}
                        {hasNormalizedAvailability && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Availability:
                              <span className="ml-2 font-medium text-gray-900">
                                {availabilityStartIso
                                  ? formatMaybeDateTimeInTimeZone(availabilityStartIso, availabilityTimezone ?? null)
                                  : "—"}
                                {availabilityEndIso
                                  ? ` → ${formatMaybeDateTimeInTimeZone(availabilityEndIso, availabilityTimezone ?? null)}`
                                  : ""}
                              </span>
                              {availabilityTimezone && (
                                <span className="ml-2 text-xs text-gray-500">
                                  ({availabilityTimezone})
                                </span>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Raw fallback string (do not parse as Date) */}
                        {attempt.earliest_available_time && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Earliest available (raw):
                              <span className="ml-2 font-medium text-gray-900">
                                {attempt.earliest_available_time}
                              </span>
                            </span>
                          </div>
                        )}

                        {/* Estimated Cost */}
                        {attempt.estimated_cost_range && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Estimated Cost:{" "}
                              <span className="font-medium text-gray-900">
                                {attempt.estimated_cost_range}
                              </span>
                            </span>
                          </div>
                        )}

                        {/* Vendor Notes */}
                        {attempt.vendor_notes && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="h-4 w-4 text-amber-600" />
                              <span className="text-sm font-medium text-amber-900">
                                Vendor Notes
                              </span>
                            </div>
                            <p className="text-sm text-amber-800 whitespace-pre-wrap">
                              {attempt.vendor_notes}
                            </p>
                          </div>
                        )}

                        {/* Vendor Tool Signals (call_metadata) */}
                        {(hasVendorDecisionSignals || hasCallbackRetrySignals) && (
                          <div className="pt-2 border-t border-gray-200 space-y-3">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              Vendor Decision Summary (from call tools)
                            </p>

                            {hasVendorDecisionSignals && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-blue-900 mb-2">
                                  Access & emergency details
                                </p>
                                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                                  {requiresAccess !== undefined && (
                                    <div>
                                      <span className="text-blue-700">Requires access instructions:</span>
                                      <span className="ml-2 text-blue-950 font-semibold">
                                        {requiresAccess ? "Yes" : "No"}
                                      </span>
                                    </div>
                                  )}
                                  {emergencySurcharge && (
                                    <div>
                                      <span className="text-blue-700">Emergency surcharge:</span>
                                      <span className="ml-2 text-blue-950 font-semibold">{emergencySurcharge}</span>
                                    </div>
                                  )}
                                  {preferredContactMethod && (
                                    <div>
                                      <span className="text-blue-700">Preferred contact:</span>
                                      <span className="ml-2 text-blue-950 font-semibold">{preferredContactMethod}</span>
                                    </div>
                                  )}
                                  {(availableDate || availableWindow) && (
                                    <div className="sm:col-span-2">
                                      <span className="text-blue-700">Availability window:</span>
                                      <span className="ml-2 text-blue-950 font-semibold">
                                        {[availableDate, availableWindow].filter(Boolean).join(" • ")}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {hasCallbackRetrySignals && (
                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-purple-900 mb-2">
                                  Callback & retry signals
                                </p>
                                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                                  {declineReason && (
                                    <div className="sm:col-span-2">
                                      <span className="text-purple-700">Decline reason:</span>
                                      <span className="ml-2 text-purple-950 font-semibold">{declineReason}</span>
                                    </div>
                                  )}
                                  {permanentOptOut !== undefined && (
                                    <div>
                                      <span className="text-purple-700">Permanent opt-out:</span>
                                      <span className="ml-2 text-purple-950 font-semibold">
                                        {permanentOptOut ? "Yes" : "No"}
                                      </span>
                                    </div>
                                  )}
                                  {suggestedCallbackTime && (
                                    <div>
                                      <span className="text-purple-700">Callback suggested:</span>
                                      <span className="ml-2 text-purple-950 font-semibold">{suggestedCallbackTime}</span>
                                    </div>
                                  )}
                                  {callbackScheduled !== undefined && (
                                    <div>
                                      <span className="text-purple-700">Callback scheduled:</span>
                                      <span className="ml-2 text-purple-950 font-semibold">
                                        {callbackScheduled ? "Yes" : "No"}
                                      </span>
                                    </div>
                                  )}
                                  {callbackScheduledAt && (
                                    <div>
                                      <span className="text-purple-700">Scheduled at:</span>
                                      <span className="ml-2 text-purple-950 font-semibold">{callbackScheduledAt}</span>
                                    </div>
                                  )}
                                  {retryRecommended !== undefined && (
                                    <div>
                                      <span className="text-purple-700">Retry recommended:</span>
                                      <span className="ml-2 text-purple-950 font-semibold">
                                        {retryRecommended ? "Yes" : "No"}
                                      </span>
                                    </div>
                                  )}
                                  {retryDelayMinutes !== undefined && (
                                    <div>
                                      <span className="text-purple-700">Retry delay:</span>
                                      <span className="ml-2 text-purple-950 font-semibold">
                                        {retryDelayMinutes} min
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Raw call metadata (debug/verification) */}
                        {meta && (
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Raw Call Metadata
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => toggleMetadata(attempt.attempt_id)}
                              >
                                {isMetadataExpanded ? (
                                  <>
                                    <ChevronUp className="h-3.5 w-3.5 mr-1" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                                    View
                                  </>
                                )}
                              </Button>
                            </div>

                            {isMetadataExpanded && (
                              <div className="mt-2 bg-gray-50 rounded-lg border border-gray-200 p-3 max-h-72 overflow-y-auto">
                                <pre className="text-[11px] leading-relaxed text-gray-900 whitespace-pre-wrap font-mono">
                                  {JSON.stringify(meta, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Call Metadata */}
                        {(attempt.initiated_at || attempt.answered_at || attempt.completed_at || attempt.call_duration_seconds) && (
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Call Metadata</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {attempt.initiated_at && (
                                <div>
                                  <span className="text-gray-500">Initiated:</span>
                                  <span className="ml-2 text-gray-900 font-medium">
                                    {formatMaybeDateTime(attempt.initiated_at)}
                                  </span>
                                </div>
                              )}
                              {attempt.answered_at && (
                                <div>
                                  <span className="text-gray-500">Answered:</span>
                                  <span className="ml-2 text-gray-900 font-medium">
                                    {formatMaybeDateTime(attempt.answered_at)}
                                  </span>
                                </div>
                              )}
                              {attempt.completed_at && (
                                <div>
                                  <span className="text-gray-500">Completed:</span>
                                  <span className="ml-2 text-gray-900 font-medium">
                                    {formatMaybeDateTime(attempt.completed_at)}
                                  </span>
                                </div>
                              )}
                              {attempt.call_duration_seconds && (
                                <div>
                                  <span className="text-gray-500">Duration:</span>
                                  <span className="ml-2 text-gray-900 font-medium">
                                    {Math.floor(attempt.call_duration_seconds / 60)}m {attempt.call_duration_seconds % 60}s
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Show message if no recording/transcript available but call completed */}
                  {!hasRecordingOrTranscript && attempt.completed_at && (
                    <div className="border-t border-gray-200 bg-yellow-50 p-3">
                      <p className="text-xs text-yellow-800 flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Recording and transcript not available yet. They will appear after the call completes processing.
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Transcript Dialog */}
      {showTranscript && (
        <Dialog open={!!showTranscript} onOpenChange={() => setShowTranscript(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Call Transcript - {showTranscript.vendor_name}
              </DialogTitle>
              <DialogDescription>
                Attempt #{showTranscript.attempt_number} •{" "}
                {formatMaybeDateTime(showTranscript.initiated_at)}
                {showTranscript.call_duration_seconds && (
                  <> • Duration: {Math.floor(showTranscript.call_duration_seconds / 60)}m {showTranscript.call_duration_seconds % 60}s</>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="space-y-2">
                  {showTranscript.call_transcript
                    ? formatCallTranscriptBubbles(showTranscript.call_transcript)
                    : [
                        <div
                          key="no-transcript"
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <p className="text-sm text-gray-600">
                            No transcript available for this call.
                          </p>
                        </div>,
                      ]}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(showTranscript.call_transcript!)}
                disabled={!showTranscript.call_transcript}
              >
                {copiedTranscript ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Transcript
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTranscript(null)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
