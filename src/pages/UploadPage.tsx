import React, { useState,useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

const API_BASE = "https://leasing-copilot-supabase.onrender.com";

export default function UploadPage() {
  const [ruleFiles, setRuleFiles] = useState([]);
  const [listingFiles, setListingFiles] = useState([]);
  const [uploadedRules, setUploadedRules] = useState([]);
  const [uploadedListings, setUploadedListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authLink, setAuthLink] = useState<string | null>(null);
  const { toast } = useToast();

  const getToken = () => localStorage.getItem("access_token");

  const handleRulesChange = (e) => {
    if (e.target.files) {
      setRuleFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleListingsChange = (e) => {
    if (e.target.files) {
      setListingFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  useEffect(() => {
    const link = localStorage.getItem("auth_link");
    setAuthLink(link);
  }, []);

  const uploadRules = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        toast({
          title: "Error",
          description: "You must be logged in to upload.",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      ruleFiles.forEach((file) => formData.append("files", file));

      const res = await fetch(`${API_BASE}/UploadRules`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: data.message });
        setUploadedRules((prev) => [...prev, ...ruleFiles.map((f) => f.name)]);
        setRuleFiles([]); // clear after successful upload
      } else {
        toast({
          title: "Upload Failed",
          description: data.detail || "Upload failed",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadListings = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        toast({
          title: "Error",
          description: "You must be logged in to upload.",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      listingFiles.forEach((file) => formData.append("listing_file", file));

      const res = await fetch(`${API_BASE}/UploadListings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: data.message });
        setUploadedListings((prev) => [
          ...prev,
          ...listingFiles.map((f) => f.name),
        ]);
        setListingFiles([]); // clear after successful upload
      } else {
        toast({
          title: "Upload Failed",
          description: data.detail || "Upload failed",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center flex items-center justify-center space-x-2">
              <Upload className="h-6 w-6 text-gold" />
              <span>Upload Rules & Listings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <h2 className="text-lg font-semibold text-gold mb-2">Click on this link to give access to calendar<br/>Your Auth Link:</h2>
              {authLink ? (
                <p className="text-white text-center flex items-center justify-center space-x-2"> <a href={authLink} target="_blank" rel="noopener noreferrer">{authLink}</a></p>
              ) : (
                <p className="text-white text-center flex items-center justify-center space-x-2">No Auth Link available</p>
              )}
            {/* Upload Rules */}
            <div>
              <h2 className="text-lg font-semibold text-gold mb-2">
                Upload Rules
              </h2>
              <input
                type="file"
                multiple
                onChange={handleRulesChange}
                className="block w-full text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
                           file:text-sm file:font-semibold file:bg-gold file:text-navy hover:file:bg-gold/90"
              />
              {ruleFiles.length > 0 && (
                <ul className="mt-2 text-white text-sm">
                  {ruleFiles.map((file, i) => (
                    <li key={i}>📂 {file.name}</li>
                  ))}
                </ul>
              )}
              <Button
                onClick={uploadRules}
                disabled={loading || ruleFiles.length === 0}
                className="mt-3 w-full bg-gold hover:bg-gold/90 text-navy font-semibold"
              >
                {loading ? "Uploading..." : "Upload Rules"}
              </Button>

              {/* Show uploaded rules */}
              {uploadedRules.length > 0 && (
                <ul className="mt-3 text-white text-sm">
                  {uploadedRules.map((name, i) => (
                    <li key={i}>✅ {name}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Upload Listings */}
            <div>
              <h2 className="text-lg font-semibold text-gold mb-2">
                Upload Listings
              </h2>
              <input
                type="file"
                multiple
                onChange={handleListingsChange}
                className="block w-full text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
                           file:text-sm file:font-semibold file:bg-gold file:text-navy hover:file:bg-gold/90"
              />
              {listingFiles.length > 0 && (
                <ul className="mt-2 text-white text-sm">
                  {listingFiles.map((file, i) => (
                    <li key={i}>📂 {file.name}</li>
                  ))}
                </ul>
              )}
              <Button
                onClick={uploadListings}
                disabled={loading || listingFiles.length === 0}
                className="mt-3 w-full bg-gold hover:bg-gold/90 text-navy font-semibold"
              >
                {loading ? "Uploading..." : "Upload Listings"}
              </Button>

              {/* Show uploaded listings */}
              {uploadedListings.length > 0 && (
                <ul className="mt-3 text-white text-sm">
                  {uploadedListings.map((name, i) => (
                    <li key={i}>✅ {name}</li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
