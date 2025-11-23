import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Phone, RefreshCw, Search, PhoneIncoming, Clock, User, Play, Pause, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { CallRecord } from "./types";
import { formatPhoneNumber, formatCallDuration } from "./utils";
import { CallRecordDetailModal } from "./CallRecordDetailModal";

interface ChatsTabProps {
  callRecords: CallRecord[];
  loadingCallRecords: boolean;
  callRecordsTotal: number;
  callRecordsLimit: number;
  callRecordsOffset: number;
  callRecordSearch: string;
  callRecordFilterStatus: string;
  playingRecordingId: string | null;
  userType: string | null;
  onSearchChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onRefresh: () => void;
  onViewRecord: (record: CallRecord) => void;
  onPlayRecording: (recordId: string | null) => void;
  onPagination: (offset: number) => void;
  // Modal state and handlers
  selectedCallRecord: CallRecord | null;
  showCallRecordDetail: boolean;
  setShowCallRecordDetail: (show: boolean) => void;
  deletingCallRecord: boolean;
  onDeleteCallRecord: (callId: string, hardDelete: boolean) => Promise<void>;
}

export const ChatsTab = ({
  callRecords,
  loadingCallRecords,
  callRecordsTotal,
  callRecordsLimit,
  callRecordsOffset,
  callRecordSearch,
  callRecordFilterStatus,
  playingRecordingId,
  userType,
  onSearchChange,
  onFilterStatusChange,
  onRefresh,
  onViewRecord,
  onPlayRecording,
  onPagination,
  selectedCallRecord,
  showCallRecordDetail,
  setShowCallRecordDetail,
  deletingCallRecord,
  onDeleteCallRecord,
}: ChatsTabProps) => {
  return (
    <>
      {/* Call Record Detail Modal */}
      <CallRecordDetailModal
        open={showCallRecordDetail}
        onOpenChange={setShowCallRecordDetail}
        selectedCallRecord={selectedCallRecord}
        userType={userType}
        deletingCallRecord={deletingCallRecord}
        onDelete={onDeleteCallRecord}
        onClose={() => {
          setShowCallRecordDetail(false);
        }}
      />
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                Call Records & Transcripts
              </CardTitle>
              <p className="text-gray-600 text-lg">
                View all your call history with transcripts, recordings, and detailed analytics.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-sm font-semibold px-4 py-2">
                {callRecordsTotal} {callRecordsTotal === 1 ? "Call" : "Calls"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {/* Search and Filter Bar */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by caller number or transcript..."
                  value={callRecordSearch}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                />
              </div>
              <Select value={callRecordFilterStatus} onValueChange={onFilterStatusChange}>
                <SelectTrigger className="w-full sm:w-48 bg-white border-amber-300 rounded-xl">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Calls</SelectItem>
                  <SelectItem value="ended">Completed</SelectItem>
                  <SelectItem value="started">In Progress</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={onRefresh}
                variant="outline"
                className="bg-white border-amber-300 hover:bg-amber-50 rounded-xl"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loadingCallRecords ? (
            <div className="text-center py-12">
              <RefreshCw className="h-10 w-10 animate-spin text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">Loading call records...</p>
            </div>
          ) : callRecords.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium text-xl mb-2">No call records found</p>
              <p className="text-gray-400 text-sm">Call records will appear here once calls are received.</p>
            </div>
          ) : (
            <>
              {/* Call Records Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                {callRecords
                  .filter((record) => {
                    // Apply search filter
                    if (callRecordSearch) {
                      const searchLower = callRecordSearch.toLowerCase();
                      const matchesSearch =
                        formatPhoneNumber(record.caller_number).toLowerCase().includes(searchLower) ||
                        (record.transcript && record.transcript.toLowerCase().includes(searchLower));
                      if (!matchesSearch) return false;
                    }
                    // Apply status filter
                    if (callRecordFilterStatus !== "all") {
                      if (record.call_status !== callRecordFilterStatus) return false;
                    }
                    return true;
                  })
                  .map((record, idx) => (
                    <motion.div
                      key={record.id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="bg-white border border-amber-200 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                      onClick={() => onViewRecord(record)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                            <PhoneIncoming className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-lg">
                              {formatPhoneNumber(record.caller_number)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {record.created_at
                                ? new Date(record.created_at).toLocaleString()
                                : "Unknown date"}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={`text-xs font-semibold ${
                            record.call_status === "ended"
                              ? "bg-green-100 text-green-700 border-green-300"
                              : record.call_status === "started"
                              ? "bg-blue-100 text-blue-700 border-blue-300"
                              : "bg-red-100 text-red-700 border-red-300"
                          }`}
                        >
                          {record.call_status || "unknown"}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4 text-amber-600" />
                          <span className="font-medium">
                            {formatCallDuration((record as any).call_duration)}
                          </span>
                        </div>

                        {(record as any).realtor_number && userType === "property_manager" && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-4 w-4 text-amber-600" />
                            <span className="font-medium">
                              {formatPhoneNumber((record as any).realtor_number)}
                            </span>
                          </div>
                        )}

                        {((record as any).transcript_segments?.length || record.transcript) && (
                          <div className="mt-3 pt-3 border-t border-amber-100">
                            <p className="text-xs text-gray-500 line-clamp-3 whitespace-pre-line">
                              {(record as any).transcript_segments?.length
                                ? (record as any).transcript_segments
                                    .slice(0, 2)
                                    .map((segment: any) => {
                                      const speakerLabel = segment.speaker === "user" ? "User" : "AI";
                                      return `${speakerLabel}: ${segment.content}`;
                                    })
                                    .join("\n")
                                : (record.transcript || "").substring(0, 140)}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                          {(record as any).recording_url && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-amber-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const recordId = record.call_id || record.id;
                                      onPlayRecording(recordId === playingRecordingId ? null : recordId);
                                    }}
                                  >
                                    {playingRecordingId === record.id ? (
                                      <Pause className="h-4 w-4 text-amber-600" />
                                    ) : (
                                      <Play className="h-4 w-4 text-amber-600" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{playingRecordingId === record.id ? "Pause" : "Play"} Recording</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs hover:bg-amber-100 text-amber-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewRecord(record);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>

                        {((record.call_id || record.id) === playingRecordingId) && (record as any).recording_url && (
                          <div className="mt-2 pt-2 border-t border-amber-100">
                            <audio
                              controls
                              autoPlay
                              className="w-full h-8"
                              onEnded={() => onPlayRecording(null)}
                            >
                              <source src={(record as any).recording_url} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </div>

              {/* Pagination */}
              {callRecordsTotal > callRecordsLimit && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-amber-200">
                  <p className="text-sm text-gray-600">
                    Showing {callRecordsOffset + 1} to{" "}
                    {Math.min(callRecordsOffset + callRecordsLimit, callRecordsTotal)} of{" "}
                    {callRecordsTotal} calls
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOffset = Math.max(0, callRecordsOffset - callRecordsLimit);
                        onPagination(newOffset);
                      }}
                      disabled={callRecordsOffset === 0 || loadingCallRecords}
                      className="rounded-lg"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOffset = callRecordsOffset + callRecordsLimit;
                        onPagination(newOffset);
                      }}
                      disabled={
                        callRecordsOffset + callRecordsLimit >= callRecordsTotal || loadingCallRecords
                      }
                      className="rounded-lg"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
    </>
  );
};

