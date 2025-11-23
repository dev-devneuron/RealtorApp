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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PhoneIncoming, Clock, Calendar, User, Volume2, Download, FileText, Phone, Info, RefreshCw, Trash2, Copy, Check } from "lucide-react";
import { formatPhoneNumber, formatCallDuration } from "./utils";
import { CallRecord } from "./types";
import { toast } from "sonner";

type TranscriptSegment = {
  speaker: "user" | "bot" | "summary" | "other";
  content: string;
};

interface CallRecordDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCallRecord: CallRecord | null;
  userType: string | null;
  deletingCallRecord: boolean;
  onDelete: (callId: string, hardDelete: boolean) => Promise<void>;
  onClose: () => void;
}

const formatSegmentsAsText = (segments?: TranscriptSegment[]) => {
  if (!segments || segments.length === 0) {
    return "";
  }
  return segments
    .map((segment) => {
      const speakerLabel =
        segment.speaker === "user"
          ? "User"
          : segment.speaker === "bot"
          ? "AI"
          : segment.speaker === "summary"
          ? "Summary"
          : "Note";
      return `${speakerLabel}: ${segment.content}`;
    })
    .join("\n\n");
};

export const CallRecordDetailModal = ({
  open,
  onOpenChange,
  selectedCallRecord,
  userType,
  deletingCallRecord,
  onDelete,
  onClose,
}: CallRecordDetailModalProps) => {
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  if (!selectedCallRecord) return null;

  const handleCopyTranscript = async (
    transcript?: string | null,
    segments?: TranscriptSegment[]
  ) => {
    try {
      const textToCopy = transcript && transcript.trim().length > 0
        ? transcript
        : formatSegmentsAsText(segments);
      if (!textToCopy) {
        throw new Error("No transcript available to copy");
      }
      await navigator.clipboard.writeText(textToCopy);
      setCopiedTranscript(true);
      toast.success("Transcript copied to clipboard");
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch (err) {
      console.error("Error copying transcript:", err);
      toast.error("Failed to copy transcript");
    }
  };

  const handleDownloadRecording = (recordingUrl: string, callId: string) => {
    try {
      const link = document.createElement("a");
      link.href = recordingUrl;
      link.download = `call-${callId}.mp3`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    } catch (err) {
      console.error("Error downloading recording:", err);
      toast.error("Failed to download recording");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col [&>button]:h-10 [&>button]:w-10 [&>button]:right-3 [&>button]:top-3 [&>button]:z-50 [&>button]:bg-white [&>button]:rounded-full [&>button]:shadow-lg [&>button]:border [&>button]:border-gray-300 [&>button]:hover:bg-amber-50 [&>button]:hover:border-amber-400 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:p-0 [&>button>svg]:h-5 [&>button>svg]:w-5 [&>button>svg]:text-gray-700 [&>button>svg]:hover:text-amber-600">
        <div className="flex flex-col h-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <DialogHeader className="p-6 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-12">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                    <PhoneIncoming className="h-6 w-6 text-white" />
                  </div>
                  Call Details
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2">
                  {formatPhoneNumber(selectedCallRecord.caller_number)}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  className={`text-sm font-semibold ${
                    selectedCallRecord.call_status === "ended"
                      ? "bg-green-100 text-green-700 border-green-300"
                      : selectedCallRecord.call_status === "started"
                      ? "bg-blue-100 text-blue-700 border-blue-300"
                      : "bg-red-100 text-red-700 border-red-300"
                  }`}
                >
                  {selectedCallRecord.call_status || "unknown"}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Call Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <p className="text-sm font-semibold text-gray-600">Duration</p>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCallDuration(selectedCallRecord.call_duration)}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  <p className="text-sm font-semibold text-gray-600">Date & Time</p>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {selectedCallRecord.created_at 
                    ? new Date(selectedCallRecord.created_at).toLocaleString()
                    : "Unknown"}
                </p>
              </div>
              {selectedCallRecord.realtor_number && userType === "property_manager" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-amber-600" />
                    <p className="text-sm font-semibold text-gray-600">Realtor Number</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatPhoneNumber(selectedCallRecord.realtor_number)}
                  </p>
                </div>
              )}
            </div>

            {/* Recording */}
            {selectedCallRecord.recording_url && (
              <div className="bg-white border border-amber-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                      <Volume2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Call Recording</p>
                      <p className="text-sm text-gray-500">Listen to the full conversation</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadRecording(selectedCallRecord.recording_url!, selectedCallRecord.call_id || selectedCallRecord.id)}
                    className="border-amber-300 hover:bg-amber-50 text-amber-600 rounded-lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="mt-4">
                  <audio controls className="w-full h-10">
                    <source src={selectedCallRecord.recording_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            )}

            {/* Transcript */}
            <div className="bg-white border border-amber-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Full Transcript</p>
                    <p className="text-sm text-gray-500">Complete conversation text</p>
                  </div>
                </div>
                {(selectedCallRecord.transcript || (selectedCallRecord as any).transcript_segments?.length) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopyTranscript(
                        selectedCallRecord.transcript,
                        (selectedCallRecord as any).transcript_segments
                      )
                    }
                    className="border-amber-300 hover:bg-amber-50 text-amber-600 rounded-lg"
                  >
                    {copiedTranscript ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
              </div>
              {(selectedCallRecord as any).transcript_segments?.length ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {(selectedCallRecord as any).transcript_segments.map((segment: TranscriptSegment, idx: number) => (
                    <div
                      key={idx}
                      className={`flex ${segment.speaker === "user" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm shadow-sm border whitespace-pre-wrap ${
                          segment.speaker === "user"
                            ? "bg-white border-amber-100 text-gray-900 rounded-bl-none"
                            : "bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-400 rounded-br-none"
                        }`}
                      >
                        <p className="font-semibold text-xs mb-1 uppercase tracking-wide opacity-80">
                          {segment.speaker === "user"
                            ? "User"
                            : segment.speaker === "bot"
                            ? "AI Assistant"
                            : "Note"}
                        </p>
                        <p>{segment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedCallRecord.transcript ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-gray-900 leading-relaxed">
                  {selectedCallRecord.transcript}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No transcript available</p>
                  <p className="text-sm text-gray-400 mt-1">Transcript may still be processing</p>
                </div>
              )}
            </div>

            {(selectedCallRecord as any).transcript_summary && (
              <div className="bg-white border border-amber-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Call Summary</p>
                    <p className="text-sm text-gray-500">High-level recap for quick review</p>
                  </div>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {(selectedCallRecord as any).transcript_summary}
                </p>
              </div>
            )}

            {/* Live Transcript Chunks (if available) */}
            {(selectedCallRecord as any).live_transcript_chunks && 
             Array.isArray((selectedCallRecord as any).live_transcript_chunks) && 
             (selectedCallRecord as any).live_transcript_chunks.length > 0 && (
              <div className="bg-white border border-amber-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Live Transcript Chunks</p>
                    <p className="text-sm text-gray-500">Real-time conversation segments</p>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(selectedCallRecord as any).live_transcript_chunks.map((chunk: string, idx: number) => (
                    <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{chunk}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {(selectedCallRecord as any).metadata && (
              <div className="bg-white border border-amber-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Call Metadata</p>
                    <p className="text-sm text-gray-500">Additional call information</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {(selectedCallRecord as any).metadata.last_event_type && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Last Event Type</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {(selectedCallRecord as any).metadata.last_event_type}
                      </p>
                    </div>
                  )}
                  {(selectedCallRecord as any).metadata.last_event_at && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Last Event Time</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {new Date((selectedCallRecord as any).metadata.last_event_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {Object.keys((selectedCallRecord as any).metadata).filter(
                    (key: string) => key !== 'last_event_type' && key !== 'last_event_at'
                  ).length > 0 && (
                    <details className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <summary className="text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-900">
                        View Raw Metadata
                      </summary>
                      <pre className="text-xs text-gray-500 overflow-x-auto mt-2 pt-2 border-t border-gray-200">
                        {JSON.stringify((selectedCallRecord as any).metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Privacy & Delete Controls */}
            <div className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-gray-900">Privacy Controls</p>
                  <p className="text-sm text-gray-600">
                    Remove sensitive transcript/audio or delete the record entirely.
                  </p>
                </div>
                <Badge className="bg-red-100 text-red-700 border-red-300">Danger zone</Badge>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl flex-1"
                      disabled={deletingCallRecord}
                    >
                      {deletingCallRecord ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Transcript & Audio
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove transcript & audio?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This keeps the call record for auditing but permanently removes the
                        transcript, live transcript chunks, and recording URL.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deletingCallRecord}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(selectedCallRecord.call_id || selectedCallRecord.id, false)}
                        disabled={deletingCallRecord}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {deletingCallRecord ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          "Remove Transcript & Audio"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="rounded-xl flex-1"
                      disabled={deletingCallRecord}
                    >
                      {deletingCallRecord ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Record
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete call record permanently?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the entire record and all assets. This action cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deletingCallRecord}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(selectedCallRecord.call_id || selectedCallRecord.id, true)}
                        disabled={deletingCallRecord}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {deletingCallRecord ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete Record"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="p-6 border-t border-amber-200 bg-gray-50">
            <Button
              onClick={onClose}
              className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl px-6 py-3"
            >
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

