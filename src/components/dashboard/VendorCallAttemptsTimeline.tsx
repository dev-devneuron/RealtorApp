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
} from "lucide-react";
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

export const VendorCallAttemptsTimeline = ({
  attempts,
}: VendorCallAttemptsTimelineProps) => {
  const [expandedAttempt, setExpandedAttempt] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState<VendorCallAttempt | null>(null);

  // Sort attempts by attempt_number (newest first)
  const sortedAttempts = [...attempts].sort((a, b) => b.attempt_number - a.attempt_number);

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
              const hasDetails =
                attempt.is_available !== null ||
                attempt.earliest_available_time ||
                attempt.estimated_cost_range ||
                attempt.vendor_notes;

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
                            {new Date(attempt.initiated_at).toLocaleString()}
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
                        {attempt.is_available !== null && (
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

                        {/* Earliest Available Time */}
                        {attempt.earliest_available_time && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Earliest Available:{" "}
                              <span className="font-medium text-gray-900">
                                {new Date(
                                  attempt.earliest_available_time
                                ).toLocaleString()}
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

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                          {attempt.call_transcript && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowTranscript(attempt)}
                              className="text-xs"
                            >
                              <FileText className="h-3.5 w-3.5 mr-1.5" />
                              View Transcript
                            </Button>
                          )}
                          {attempt.call_recording_url && (
                            <>
                              <audio
                                controls
                                className="h-8 flex-1 min-w-[200px]"
                                src={attempt.call_recording_url}
                              >
                                Your browser does not support the audio element.
                              </audio>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="text-xs"
                              >
                                <a
                                  href={attempt.call_recording_url}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="h-3.5 w-3.5 mr-1.5" />
                                  Download
                                </a>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
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
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Call Transcript - {showTranscript.vendor_name}
              </DialogTitle>
              <DialogDescription>
                Attempt #{showTranscript.attempt_number} •{" "}
                {new Date(showTranscript.initiated_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">
                {showTranscript.call_transcript || "No transcript available"}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
