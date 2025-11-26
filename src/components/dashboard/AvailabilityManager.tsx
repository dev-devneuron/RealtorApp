/**
 * Availability Management Component
 * 
 * Allows users to:
 * - Configure working hours
 * - Block time slots
 * - Manage calendar preferences
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, X, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatTime } from "./utils";
import type { CalendarPreferences, AvailabilitySlot } from "./types";

interface AvailabilityManagerProps {
  userId: number;
  userType: string;
  onSave?: () => void;
}

export const AvailabilityManager = ({
  userId,
  userType,
  onSave,
}: AvailabilityManagerProps) => {
  const [workingHours, setWorkingHours] = useState({
    start_time: "09:00",
    end_time: "17:00",
    timezone: "America/New_York",
    slot_length: 30,
    working_days: [1, 2, 3, 4, 5], // Mon-Fri
  });

  const [blockedSlots, setBlockedSlots] = useState<Array<{
    id: string;
    startAt: string;
    endAt: string;
    reason?: string;
  }>>([]);

  const [newBlock, setNewBlock] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);

  // Load preferences
  useEffect(() => {
    // TODO: Fetch from API
    // fetchCalendarPreferences(userId, userType).then(setWorkingHours);
  }, [userId, userType]);

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      // TODO: Implement API call
      // await updateCalendarPreferences(userId, userType, workingHours);
      
      toast.success("Working hours updated successfully");
      onSave?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to update preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlock = () => {
    if (!newBlock.startDate || !newBlock.startTime || !newBlock.endDate || !newBlock.endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    const startAt = new Date(`${newBlock.startDate}T${newBlock.startTime}`).toISOString();
    const endAt = new Date(`${newBlock.endDate}T${newBlock.endTime}`).toISOString();

    if (new Date(endAt) <= new Date(startAt)) {
      toast.error("End time must be after start time");
      return;
    }

    setBlockedSlots([
      ...blockedSlots,
      {
        id: Date.now().toString(),
        startAt,
        endAt,
        reason: newBlock.reason || undefined,
      },
    ]);

    setNewBlock({
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      reason: "",
    });
    setShowBlockForm(false);
    toast.success("Time slot blocked");
  };

  const handleRemoveBlock = (id: string) => {
    setBlockedSlots(blockedSlots.filter((slot) => slot.id !== id));
    toast.success("Block removed");
  };

  const toggleWorkingDay = (day: number) => {
    setWorkingHours((prev) => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter((d) => d !== day)
        : [...prev.working_days, day].sort(),
    }));
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Working Hours Configuration */}
      <Card className="bg-white shadow-xl border border-amber-100 rounded-xl sm:rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl flex items-center gap-2">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 lg:h-6 lg:w-6 xl:h-7 xl:w-7" />
            Working Hours
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Configure your default working hours and availability
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time" className="text-sm sm:text-base">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={workingHours.start_time}
                onChange={(e) =>
                  setWorkingHours({ ...workingHours, start_time: e.target.value })
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="end-time" className="text-sm sm:text-base">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={workingHours.end_time}
                onChange={(e) =>
                  setWorkingHours({ ...workingHours, end_time: e.target.value })
                }
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone" className="text-sm sm:text-base">Timezone</Label>
              <Select
                value={workingHours.timezone}
                onValueChange={(value) =>
                  setWorkingHours({ ...workingHours, timezone: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="slot-length" className="text-sm sm:text-base">Slot Length (minutes)</Label>
              <Select
                value={workingHours.slot_length.toString()}
                onValueChange={(value) =>
                  setWorkingHours({ ...workingHours, slot_length: parseInt(value) })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm sm:text-base mb-3 block">Working Days</Label>
            <div className="flex flex-wrap gap-2">
              {dayNames.map((day, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${index}`}
                    checked={workingHours.working_days.includes(index)}
                    onCheckedChange={() => toggleWorkingDay(index)}
                  />
                  <Label
                    htmlFor={`day-${index}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSavePreferences}
            disabled={loading}
            className="w-full sm:w-auto min-h-[44px] lg:min-h-[48px] xl:min-h-[52px]"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Blocked Time Slots */}
      <Card className="bg-white shadow-xl border border-amber-100 rounded-xl sm:rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl flex items-center gap-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 lg:h-6 lg:w-6 xl:h-7 xl:w-7" />
                Blocked Time Slots
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Block specific time slots when you're unavailable
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowBlockForm(!showBlockForm)}
              variant="outline"
              size="sm"
              className="min-h-[44px]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Block
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {showBlockForm && (
            <Card className="bg-gray-50 p-4 border-2 border-amber-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm sm:text-base">Start Date</Label>
                  <Input
                    type="date"
                    value={newBlock.startDate}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, startDate: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm sm:text-base">Start Time</Label>
                  <Input
                    type="time"
                    value={newBlock.startTime}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, startTime: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm sm:text-base">End Date</Label>
                  <Input
                    type="date"
                    value={newBlock.endDate}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, endDate: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm sm:text-base">End Time</Label>
                  <Input
                    type="time"
                    value={newBlock.endTime}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, endTime: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm sm:text-base">Reason (optional)</Label>
                  <Textarea
                    value={newBlock.reason}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, reason: e.target.value })
                    }
                    placeholder="e.g., Personal appointment, Meeting..."
                    className="mt-2"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddBlock} size="sm">
                  Add Block
                </Button>
                <Button
                  onClick={() => {
                    setShowBlockForm(false);
                    setNewBlock({
                      startDate: "",
                      startTime: "",
                      endDate: "",
                      endTime: "",
                      reason: "",
                    });
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {blockedSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">No blocked time slots</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blockedSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm sm:text-base">
                      {formatDate(slot.startAt)} {formatTime(slot.startAt)} - {formatTime(slot.endAt)}
                    </div>
                    {slot.reason && (
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">
                        {slot.reason}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBlock(slot.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

