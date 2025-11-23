import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Edit2, Trash2, Volume2, Download, FileText, ChevronDown, ChevronUp, RefreshCw, Copy, Check } from "lucide-react";
import { formatPhoneNumber } from "./utils";
import { toast } from "sonner";

interface MaintenanceRequestDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMaintenanceRequest: any | null;
  userType: string | null;
  deletingMaintenanceRequest: boolean;
  onDelete: (requestId: number) => Promise<void>;
  onEdit: () => void;
  onRefresh: () => Promise<void>;
}

// Helper function to format call transcript with better styling
const formatCallTranscript = (transcript: string): JSX.Element[] => {
  if (!transcript) return [];

  const lines = transcript.split('\n').filter(line => line.trim());
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
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                currentSpeaker.toLowerCase().includes('agent') || currentSpeaker.toLowerCase().includes('assistant')
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {currentSpeaker.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-700">{currentSpeaker}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">Now</span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {currentMessage.join(' ')}
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
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            currentSpeaker.toLowerCase().includes('agent') || currentSpeaker.toLowerCase().includes('assistant')
              ? 'bg-blue-100 text-blue-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {currentSpeaker.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-700">{currentSpeaker}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400">Now</span>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                {currentMessage.join(' ')}
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
      <div key="raw-transcript" className="bg-white rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed font-mono">
          {transcript}
        </p>
      </div>
    ];
  }

  return formatted;
};

export const MaintenanceRequestDetailModal = ({
  open,
  onOpenChange,
  selectedMaintenanceRequest,
  userType,
  deletingMaintenanceRequest,
  onDelete,
  onEdit,
  onRefresh,
}: MaintenanceRequestDetailModalProps) => {
  const [showCallTranscript, setShowCallTranscript] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  const handleCopyTranscript = async () => {
    if (!selectedMaintenanceRequest?.call_transcript) return;
    try {
      await navigator.clipboard.writeText(selectedMaintenanceRequest.call_transcript);
      setCopiedTranscript(true);
      toast.success("Transcript copied to clipboard");
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch (err) {
      toast.error("Failed to copy transcript");
    }
  };

  if (!selectedMaintenanceRequest) {
    return null;
  }

  const formattedTranscript = selectedMaintenanceRequest.call_transcript
    ? formatCallTranscript(selectedMaintenanceRequest.call_transcript)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col [&>button]:h-10 [&>button]:w-10 [&>button]:right-3 [&>button]:top-3 [&>button]:z-50 [&>button]:bg-white [&>button]:rounded-full [&>button]:shadow-lg [&>button]:border [&>button]:border-gray-300 [&>button]:hover:bg-amber-50 [&>button]:hover:border-amber-400 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:p-0 [&>button>svg]:h-5 [&>button>svg]:w-5 [&>button>svg]:text-gray-700 [&>button>svg]:hover:text-amber-600">
        <div className="flex flex-col h-full max-h-[90vh] overflow-hidden">
          <DialogHeader className="p-6 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-12">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  Maintenance Request #{selectedMaintenanceRequest.maintenance_request_id}
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2">
                  {selectedMaintenanceRequest.property_address || "Property address not available"}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={`text-sm font-semibold ${
                    selectedMaintenanceRequest.status === "completed"
                      ? "bg-green-100 text-green-700 border-green-300"
                      : selectedMaintenanceRequest.status === "in_progress"
                      ? "bg-blue-100 text-blue-700 border-blue-300"
                      : selectedMaintenanceRequest.status === "cancelled"
                      ? "bg-gray-100 text-gray-700 border-gray-300"
                      : "bg-amber-100 text-amber-700 border-amber-300"
                  }`}
                >
                  {selectedMaintenanceRequest.status || "pending"}
                </Badge>
                <Badge
                  className={`text-sm font-semibold ${
                    selectedMaintenanceRequest.priority === "urgent"
                      ? "bg-red-100 text-red-700 border-red-300"
                      : selectedMaintenanceRequest.priority === "high"
                      ? "bg-orange-100 text-orange-700 border-orange-300"
                      : selectedMaintenanceRequest.priority === "normal"
                      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                      : "bg-gray-100 text-gray-700 border-gray-300"
                  }`}
                >
                  {selectedMaintenanceRequest.priority || "normal"}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">Tenant</p>
                <p className="text-lg font-bold text-gray-900">{selectedMaintenanceRequest.tenant_name || "Unknown"}</p>
                {selectedMaintenanceRequest.tenant_unit_number && (
                  <p className="text-sm text-gray-500">Unit: {selectedMaintenanceRequest.tenant_unit_number}</p>
                )}
                {selectedMaintenanceRequest.tenant_phone && (
                  <p className="text-sm text-gray-600 mt-1">{formatPhoneNumber(selectedMaintenanceRequest.tenant_phone)}</p>
                )}
                {selectedMaintenanceRequest.tenant_email && (
                  <p className="text-sm text-gray-600">{selectedMaintenanceRequest.tenant_email}</p>
                )}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">Property</p>
                <p className="text-lg font-bold text-gray-900">{selectedMaintenanceRequest.property_address || "N/A"}</p>
                {selectedMaintenanceRequest.location && (
                  <p className="text-sm text-gray-600 mt-1">Location: {selectedMaintenanceRequest.location}</p>
                )}
                {selectedMaintenanceRequest.category && (
                  <Badge variant="outline" className="mt-2">
                    {selectedMaintenanceRequest.category}
                  </Badge>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-600 mb-2">Issue Description</p>
              <p className="text-gray-900 whitespace-pre-wrap">{selectedMaintenanceRequest.issue_description || "No description provided"}</p>
            </div>

            {(selectedMaintenanceRequest.call_recording_url || selectedMaintenanceRequest.call_transcript || selectedMaintenanceRequest.vapi_call_id) && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Volume2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-base font-bold text-gray-800">Call Information</p>
                  </div>
                  {selectedMaintenanceRequest.submitted_via === "phone" && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 font-semibold">
                      📞 Phone Submission
                    </Badge>
                  )}
                </div>
                
                {selectedMaintenanceRequest.call_recording_url && (
                  <div className="bg-white rounded-xl p-4 border border-blue-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-semibold text-gray-700">Call Recording</p>
                    </div>
                    <audio
                      controls
                      className="w-full h-10 rounded-lg"
                      src={selectedMaintenanceRequest.call_recording_url}
                    >
                      Your browser does not support the audio element.
                    </audio>
                    <a
                      href={selectedMaintenanceRequest.call_recording_url}
                      download
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download Recording
                    </a>
                  </div>
                )}
                
                {selectedMaintenanceRequest.call_transcript && (
                  <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <p className="text-sm font-bold text-gray-800">Call Transcript</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyTranscript}
                          className="h-8 px-3 text-xs"
                        >
                          {copiedTranscript ? (
                            <>
                              <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 mr-1.5" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCallTranscript(!showCallTranscript)}
                          className="h-8 px-3 text-xs"
                        >
                          {showCallTranscript ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1.5" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1.5" />
                              Show
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    {showCallTranscript && (
                      <div className="p-4 max-h-96 overflow-y-auto bg-gray-50">
                        <div className="space-y-1">
                          {formattedTranscript.length > 0 ? (
                            formattedTranscript
                          ) : (
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                                {selectedMaintenanceRequest.call_transcript}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">Submitted</p>
                <p className="text-gray-900">
                  {selectedMaintenanceRequest.submitted_at
                    ? new Date(selectedMaintenanceRequest.submitted_at).toLocaleString()
                    : "N/A"}
                </p>
                {selectedMaintenanceRequest.submitted_via && (
                  <p className="text-sm text-gray-500 mt-1">Via: {selectedMaintenanceRequest.submitted_via}</p>
                )}
              </div>
              {(selectedMaintenanceRequest.assigned_realtor?.name || selectedMaintenanceRequest.assigned_to_realtor_name) && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Assigned To</p>
                  <p className="text-gray-900">{selectedMaintenanceRequest.assigned_realtor?.name || selectedMaintenanceRequest.assigned_to_realtor_name}</p>
                  {selectedMaintenanceRequest.assigned_realtor?.email && (
                    <p className="text-sm text-gray-500 mt-1">{selectedMaintenanceRequest.assigned_realtor.email}</p>
                  )}
                </div>
              )}
              {selectedMaintenanceRequest.updated_at && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Last Updated</p>
                  <p className="text-gray-900">
                    {new Date(selectedMaintenanceRequest.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedMaintenanceRequest.completed_at && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Completed</p>
                  <p className="text-gray-900">
                    {new Date(selectedMaintenanceRequest.completed_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {selectedMaintenanceRequest.pm_notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">PM Notes</p>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedMaintenanceRequest.pm_notes}</p>
              </div>
            )}

            {selectedMaintenanceRequest.resolution_notes && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">Resolution Notes</p>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedMaintenanceRequest.resolution_notes}</p>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 border-t border-gray-200 flex flex-wrap gap-2">
            {userType === "property_manager" && (
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!confirm("Are you sure you want to delete this maintenance request? This action cannot be undone.")) {
                    return;
                  }
                  try {
                    await onDelete(selectedMaintenanceRequest.maintenance_request_id);
                  } catch (err) {
                    // Error already handled in function
                  }
                }}
                className="rounded-xl"
                disabled={deletingMaintenanceRequest}
              >
                {deletingMaintenanceRequest ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Request
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onEdit}
              className="rounded-xl"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Update Request
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

