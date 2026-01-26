/**
 * Property Manager Vendor Calling Settings Component
 * 
 * Allows PMs to configure their vendor calling assistant ID (required for vendor calling)
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchPropertyManagerProfile,
  updatePropertyManagerVendorAssistant,
} from "./vendorApi";

interface PropertyManagerVendorSettingsProps {
  userType: string | null;
}

export const PropertyManagerVendorSettings = ({
  userType,
}: PropertyManagerVendorSettingsProps) => {
  const [assistantId, setAssistantId] = useState("");
  const [pmId, setPmId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalAssistantId, setOriginalAssistantId] = useState("");

  // Only show for Property Managers
  if (userType !== "property_manager") {
    return null;
  }

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    setHasChanges(assistantId !== originalAssistantId);
  }, [assistantId, originalAssistantId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const profile = await fetchPropertyManagerProfile();
      setPmId(profile.property_manager_id);
      const currentAssistantId = profile.vapi_vendor_calling_assistant_id || "";
      setAssistantId(currentAssistantId);
      setOriginalAssistantId(currentAssistantId);
    } catch (error: any) {
      toast.error(error.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pmId) {
      toast.error("Property manager ID not found");
      return;
    }

    if (!assistantId.trim()) {
      toast.error("Vendor calling assistant ID is required");
      return;
    }

    try {
      setSaving(true);
      await updatePropertyManagerVendorAssistant(pmId, assistantId.trim());
      setOriginalAssistantId(assistantId.trim());
      setHasChanges(false);
      toast.success("Vendor calling assistant ID saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-amber-600" />
            Vendor Calling Configuration
          </CardTitle>
          <CardDescription>
            Configure your VAPI assistant ID for automated vendor calling. This is required for vendor calling to work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warning if not configured */}
          {!assistantId && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">
                    Vendor Calling Assistant Not Configured
                  </p>
                  <p className="text-sm text-red-800">
                    Vendor calling will not work without this configuration. Please enter your VAPI assistant ID below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success indicator if configured */}
          {assistantId && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900 mb-1">
                    Vendor Calling Assistant Configured
                  </p>
                  <p className="text-sm text-green-800">
                    Your vendor calling assistant is set up and ready to use.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Input Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Vendor Calling Assistant ID *
            </label>
            <Input
              type="text"
              value={assistantId}
              onChange={(e) => setAssistantId(e.target.value)}
              placeholder="assistant_abc123"
              className="w-full"
            />
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">How to get your Assistant ID:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Log in to your VAPI dashboard</li>
                  <li>Navigate to your Assistants section</li>
                  <li>Find or create your vendor calling assistant</li>
                  <li>Copy the Assistant ID (format: assistant_xxxxx)</li>
                  <li>Paste it in the field above</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving || !assistantId.trim()}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>

          {/* Note about separation */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> This assistant ID is separate from your outbound calling assistant ID. 
              The vendor calling assistant is specifically used for automated vendor outreach for maintenance requests.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
