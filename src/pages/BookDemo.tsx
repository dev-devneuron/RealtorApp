/**
 * BookDemo Page Component
 * 
 * Public-facing page that allows potential customers to book a demo of the platform.
 * Features a comprehensive form for collecting contact information, preferred scheduling
 * details, and optional notes. Includes form validation, error handling, and a success
 * confirmation screen.
 * 
 * @module pages/BookDemo
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Calendar, Clock, Phone, Mail, User, Building2, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

// Backend API base URL
const API_BASE = "https://leasing-copilot-mvp.onrender.com";

/**
 * List of common timezones for the timezone selector
 * Includes major US, Canadian, European, and Asia-Pacific timezones
 */
const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

/**
 * BookDemo Component
 * 
 * Main component for the demo booking page. Manages form state, submission,
 * and displays either the booking form or success confirmation screen.
 */
const BookDemo = () => {
  const navigate = useNavigate();
  
  // Form state management
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    preferred_date: "",
    preferred_time: "",
    timezone: "",
    notes: "",
  });
  
  // UI state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * Handles form submission
   * 
   * Validates the form, sends the demo request to the backend API,
   * and handles success/error responses with appropriate user feedback.
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare payload - convert empty strings to null for optional fields
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company_name: formData.company_name || null,
        preferred_date: formData.preferred_date || null,
        preferred_time: formData.preferred_time || null,
        timezone: formData.timezone || null,
        notes: formData.notes || null,
      };

      // Log request details for debugging
      console.log("🔄 Submitting demo request to:", `${API_BASE}/book-demo`);
      console.log("📦 Payload:", payload);

      // Send POST request to backend API
      const response = await fetch(`${API_BASE}/book-demo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Log response details for debugging
      console.log("📡 Response status:", response.status);
      console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()));

      // Handle error responses
      if (!response.ok) {
        const responseText = await response.text();
        console.error("❌ Error response text:", responseText);
        
        // Try to parse error response as JSON, fallback to plain text
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { detail: responseText || `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error("❌ Error data:", errorData);
        
        // Special handling for 404 errors (endpoint not found)
        if (response.status === 404) {
          throw new Error(
            `Endpoint not found (404). The /book-demo endpoint may not be implemented on the backend yet. ` +
            `Please check with your backend developer. Error: ${errorData.detail || responseText}`
          );
        }
        
        // Throw error with message from API or default message
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: Failed to submit demo request`);
      }

      // Handle successful response
      const responseText = await response.text();
      console.log("✅ Success response text:", responseText);
      
      // Parse response data
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        // If parsing fails, use default success message
        data = { message: "Demo request submitted successfully!" };
      }
      
      console.log("✅ Success data:", data);
      
      // Show success state and notification
      setIsSuccess(true);
      toast.success(data.message || "Thank you! We've received your demo request and will contact you soon.");

      // Reset form to initial state
      setFormData({
        name: "",
        email: "",
        phone: "",
        company_name: "",
        preferred_date: "",
        preferred_time: "",
        timezone: "",
        notes: "",
      });
    } catch (error: any) {
      // Handle any errors during submission
      console.error("Error booking demo:", error);
      toast.error(error.message || "Failed to submit demo request. Please try again.");
    } finally {
      // Always reset submitting state
      setIsSubmitting(false);
    }
  };

  /**
   * Success Screen
   * 
   * Displays a confirmation message after successful demo request submission.
   * Provides options to return home or book another demo.
   */

  // Render success screen if submission was successful
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy via-navy/95 to-navy/90 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
            <CardContent className="p-8 sm:p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-12 w-12 text-white" />
                </div>
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Demo Request Submitted!
              </h2>
              <p className="text-white/80 text-lg mb-8">
                Thank you for your interest! We've received your demo request and will contact you soon to schedule a time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => {
                    setIsSuccess(false);
                    navigate("/");
                  }}
                  className="bg-gold hover:bg-gold/90 text-navy font-semibold"
                >
                  Return to Home
                </Button>
                <Button
                  onClick={() => {
                    setIsSuccess(false);
                    setFormData({
                      name: "",
                      email: "",
                      phone: "",
                      company_name: "",
                      preferred_date: "",
                      preferred_time: "",
                      timezone: "",
                      notes: "",
                    });
                  }}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Book Another Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  /**
   * Main Booking Form
   * 
   * Renders the demo booking form with all input fields, validation,
   * and submission handling. Includes a features preview section at the bottom.
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy/95 to-navy/90 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        {/* Page Header with Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-white/80 hover:text-gold transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-gradient-to-br from-gold to-amber-500 p-3 rounded-xl shadow-lg">
              <Sparkles className="h-6 w-6 text-navy" />
            </div>
            <div className="text-2xl font-bold text-white">
              Leasap
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            Book a Demo
          </h1>
          <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto">
            Experience the power of AI-driven property management. Schedule a personalized demo and see how we can transform your business.
          </p>
        </motion.div>

        {/* Demo Booking Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-white text-2xl sm:text-3xl text-center">
                Schedule Your Demo
              </CardTitle>
              <p className="text-white/70 text-center mt-2">
                Fill out the form below and our team will contact you to schedule a convenient time
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Required Fields Section */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg border-b border-white/20 pb-2">
                    Contact Information <span className="text-red-400">*</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white/90 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="John Smith"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-gold focus:ring-gold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/90 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-gold focus:ring-gold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white/90 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-gold focus:ring-gold"
                    />
                  </div>
                </div>

                {/* Optional Fields Section */}
                <div className="space-y-4 pt-4 border-t border-white/20">
                  <h3 className="text-white/80 font-semibold text-lg">
                    Additional Information (Optional)
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="company_name" className="text-white/90 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company Name
                    </Label>
                    <Input
                      id="company_name"
                      placeholder="ABC Properties"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-gold focus:ring-gold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="preferred_date" className="text-white/90 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Preferred Date
                      </Label>
                      <Input
                        id="preferred_date"
                        type="date"
                        value={formData.preferred_date}
                        onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-gold focus:ring-gold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferred_time" className="text-white/90 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Preferred Time
                      </Label>
                      <Input
                        id="preferred_time"
                        type="time"
                        value={formData.preferred_time}
                        onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-gold focus:ring-gold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-white/90">
                      Timezone
                    </Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-gold focus:ring-gold">
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                      <SelectContent className="bg-navy border-white/20">
                        {TIMEZONES.map((tz) => (
                          <SelectItem
                            key={tz}
                            value={tz}
                            className="text-white hover:bg-white/10 focus:bg-white/10"
                          >
                            {tz.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-white/90">
                      Additional Notes or Questions
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Tell us about your specific needs or any questions you have..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-gold focus:ring-gold resize-none"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-gold to-amber-500 hover:from-gold/90 hover:to-amber-500/90 text-navy font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-navy mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-5 w-5 mr-2" />
                      Book Demo
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-white/60 text-sm">
                  Already have an account?{" "}
                  <Link to="/signin" className="text-gold hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { icon: "🤖", title: "AI ChatBot 24/7", desc: "Round-the-clock support" },
              { icon: "📞", title: "AI CallBot", desc: "Automated call handling" },
              { icon: "👥", title: "Lead Management", desc: "Streamlined workflows" },
              { icon: "🏠", title: "Property Search AI", desc: "Smart property discovery" },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-all duration-300"
              >
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h4 className="text-white font-semibold mb-1">{feature.title}</h4>
                <p className="text-white/60 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookDemo;

