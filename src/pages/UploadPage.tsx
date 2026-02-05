import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Link as LinkIcon, Building2, CheckCircle2, AlertCircle, X, Home, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "https://leasing-copilot-mvp.onrender.com";

export default function UploadPage() {
  const navigate = useNavigate();
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
  const [listingFiles, setListingFiles] = useState<File[]>([]);
  const [apiUrl, setApiUrl] = useState("");
  const [selectedRealtorId, setSelectedRealtorId] = useState<string>("");
  const [realtors, setRealtors] = useState<any[]>([]);
  const [loadingRealtors, setLoadingRealtors] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [uploadHistory, setUploadHistory] = useState<Array<{
    id: number;
    method: string;
    count: number;
    assignedTo: string;
    timestamp: Date;
  }>>([]);

  const getToken = () => localStorage.getItem("access_token");

  useEffect(() => {
    // Check user type first
    const storedUserType = localStorage.getItem("user_type");
    setUserType(storedUserType);
    
    // Only fetch realtors if user is property manager
    if (storedUserType === "property_manager") {
      fetchRealtors();
    }
  }, []);

  const fetchRealtors = async () => {
    try {
      setLoadingRealtors(true);
      const token = getToken();
      if (!token) {
        toast.error("You must be signed in");
        navigate("/");
        return;
      }

      const res = await fetch(`${API_BASE}/property-manager/realtors`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Don't redirect, just don't show realtor assignment
          console.log("Cannot fetch realtors - not a property manager or access denied");
          return;
        }
        throw new Error("Failed to fetch realtors");
      }

      const data = await res.json();
      setRealtors(data.realtors || []);
    } catch (err: any) {
      console.error(err);
      // Don't show error for realtors, just silently fail
      const currentUserType = localStorage.getItem("user_type");
      if (currentUserType === "property_manager") {
        toast.error("Could not load realtors");
      }
    } finally {
      setLoadingRealtors(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setListingFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setListingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const token = getToken();
    if (!token) {
      toast.error("You must be signed in");
      navigate("/");
      return;
    }

    // Validation
    if (uploadMethod === "file" && listingFiles.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    if (uploadMethod === "url" && !apiUrl.trim()) {
      toast.error("Please enter a valid API URL");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      if (uploadMethod === "file") {
        // Append all files with key "listing_file"
        listingFiles.forEach((file) => {
          formData.append("listing_file", file);
        });
      } else {
        // Append API URL
        formData.append("listing_api_url", apiUrl.trim());
      }

      // Optionally assign to realtor (only for PMs)
      if (userType === "property_manager" && selectedRealtorId && selectedRealtorId !== "none") {
        formData.append("assign_to_realtor_id", selectedRealtorId);
      }

      // Use different endpoint based on user type
      const endpoint = userType === "property_manager" 
        ? `${API_BASE}/property-manager/upload-listings`
        : `${API_BASE}/UploadListings`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        let assignedTo = "Your account";
        let count = 0;
        
        if (userType === "property_manager") {
          assignedTo = data.assigned_to === "property_manager" 
            ? "Property Manager" 
            : data.realtor_name || `Realtor #${data.realtor_id}`;
          count = data.count || 0;
        } else {
          // For realtors, the response might not have count
          count = data.count || (uploadMethod === "file" ? listingFiles.length : 1);
        }

        toast.success(
          `Successfully uploaded listing${count !== 1 ? "s" : ""}!`,
          {
            description: userType === "property_manager" 
              ? `Assigned to: ${assignedTo}${count > 0 ? ` (${count} listing${count !== 1 ? "s" : ""})` : ""}` 
              : "Listings added to your account",
          }
        );

        // Add to upload history
        setUploadHistory((prev) => [
          {
            id: Date.now(),
            method: uploadMethod === "file" ? `${listingFiles.length} file(s)` : "API URL",
            count: count,
            assignedTo,
            timestamp: new Date(),
          },
          ...prev,
        ]);

        // Reset form
        setListingFiles([]);
        setApiUrl("");
        setSelectedRealtorId("");
      } else {
        toast.error("Upload failed", {
          description: data.detail || "An error occurred while uploading listings",
        });
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Upload failed", {
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/30">
      {/* Header */}
      <div className="bg-white border-b border-amber-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-amber-700 hover:text-amber-800 hover:bg-amber-50"
              >
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="h-6 w-px bg-amber-200" />
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-amber-600" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Upload Listings
                </h1>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-white hover:bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300"
            >
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Info Card */}
          <Card className="mb-6 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 shadow-md">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Upload</h3>
                  <p className="text-sm text-gray-700">
                    Upload listings in JSON, CSV, or TXT format. Our AI automatically parses and normalizes your data, 
                    handling various field names and formats. All listings are stored in your source by default and can be assigned to realtors later.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Card */}
          <Card className="shadow-lg border-amber-200 bg-white">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-amber-600" />
                Upload Property Listings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Upload Method Selection */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Upload Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setUploadMethod("file");
                      setApiUrl("");
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      uploadMethod === "file"
                        ? "border-amber-500 bg-amber-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          uploadMethod === "file" ? "bg-amber-500" : "bg-gray-200"
                        }`}
                      >
                        <FileText
                          className={`h-5 w-5 ${
                            uploadMethod === "file" ? "text-white" : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">Upload Files</div>
                        <div className="text-xs text-gray-600">JSON, CSV, or TXT</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setUploadMethod("url");
                      setListingFiles([]);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      uploadMethod === "url"
                        ? "border-amber-500 bg-amber-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          uploadMethod === "url" ? "bg-amber-500" : "bg-gray-200"
                        }`}
                      >
                        <LinkIcon
                          className={`h-5 w-5 ${
                            uploadMethod === "url" ? "text-white" : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">API URL</div>
                        <div className="text-xs text-gray-600">Fetch from API endpoint</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* File Upload Section */}
              {uploadMethod === "file" && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">
                    Select Files
                  </label>
                  <div className="border-2 border-dashed border-amber-300 rounded-xl p-6 sm:p-8 text-center hover:border-amber-400 transition-colors bg-amber-50/30">
                    <input
                      type="file"
                      multiple
                      accept=".json,.csv,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <div className="p-4 bg-amber-500 rounded-full">
                        <Upload className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">
                          Click to upload or drag and drop
                        </div>
                        <div className="text-sm text-gray-600">
                          JSON, CSV, or TXT files (multiple files supported)
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Selected Files List */}
                  {listingFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {listingFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-amber-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="p-1 hover:bg-red-100 rounded-full transition-colors ml-2 flex-shrink-0"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* API URL Section */}
              {uploadMethod === "url" && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">
                    API URL
                  </label>
                  <input
                    type="url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://api.example.com/listings"
                    className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the URL of an API endpoint that returns listing data
                  </p>
                </div>
              )}

              {/* Realtor Assignment (Optional) - Only for Property Managers */}
              {userType === "property_manager" && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">
                    Assign to Realtor (Optional)
                  </label>
                  <Select
                    value={selectedRealtorId}
                    onValueChange={setSelectedRealtorId}
                    disabled={loadingRealtors}
                  >
                    <SelectTrigger className="w-full border-2 border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 rounded-xl">
                      <SelectValue placeholder={loadingRealtors ? "Loading realtors..." : "Keep in Property Manager (default)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keep in Property Manager (default)</SelectItem>
                      {realtors.map((realtor) => (
                        <SelectItem key={realtor.id} value={String(realtor.id)}>
                          {realtor.name} {realtor.email ? `(${realtor.email})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-2">
                    Leave as default to store in your source. You can assign to realtors later from the dashboard.
                  </p>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={
                  uploading ||
                  (uploadMethod === "file" && listingFiles.length === 0) ||
                  (uploadMethod === "url" && !apiUrl.trim())
                }
                className="w-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl py-6 text-base sm:text-lg"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Uploading & Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Listings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Upload History */}
          {uploadHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="mt-6 shadow-lg border-amber-200 bg-white">
                <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Upload History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {uploadHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900">
                              {item.count} listing{item.count !== 1 ? "s" : ""} uploaded
                            </div>
                            <div className="text-sm text-gray-600">
                              Method: {item.method} • Assigned to: {item.assignedTo}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 flex-shrink-0 ml-4">
                          {item.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Supported Formats Info */}
          <Card className="mt-6 border-amber-200 bg-white shadow-md">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                Supported Formats & Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="font-semibold text-gray-900 mb-1">JSON Format</div>
                  <div className="text-gray-600 text-xs">
                    Flexible field names (address, addr, location, etc.)
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="font-semibold text-gray-900 mb-1">CSV Format</div>
                  <div className="text-gray-600 text-xs">
                    Auto-detects delimiter and maps columns
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="font-semibold text-gray-900 mb-1">TXT Format</div>
                  <div className="text-gray-600 text-xs">
                    AI-powered parsing of unstructured text
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <strong>AI-Powered:</strong> The system automatically normalizes field names, 
                    handles malformed data, and extracts information from various formats. Missing fields 
                    are handled with sensible defaults.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
