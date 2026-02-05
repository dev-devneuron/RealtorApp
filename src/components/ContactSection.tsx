import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Mail, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

// Backend API base URL
const API_BASE = "http://127.0.0.1:8000";

const ContactSection = () => {
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    phone: "",
    subject: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare payload - only include optional fields if they have values
      const payload: {
        name: string;
        email: string;
        message: string;
        phone?: string;
        subject?: string;
      } = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      };

      // Add optional fields only if they have values
      if (formData.phone.trim()) {
        payload.phone = formData.phone.trim();
      }
      if (formData.subject.trim()) {
        payload.subject = formData.subject.trim();
      }

      // Send POST request to backend API
      const response = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          detail: `HTTP ${response.status}: ${response.statusText}` 
        }));
        throw new Error(errorData.detail || "Failed to submit contact form");
      }

      // Handle successful response
      const data = await response.json();

      toast({
        title: "Message sent!",
        description: data.message || "Thank you for contacting us! We'll get back to you soon.",
      });
      setShowSuccess(true);

      // Reset form
      setFormData({
        name: "",
        email: "",
        message: "",
        phone: "",
        subject: ""
      });
    } catch (error: any) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact-section" className="py-12 xs:py-16 sm:py-20 bg-muted/20">
      <div className="container mx-auto px-3 xs:px-4">
        <motion.div
          className="text-center mb-8 xs:mb-12 sm:mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={itemVariants}
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-3 xs:mb-4">Contact Us</h2>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Get in touch with our team for any questions or support
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 xs:gap-8 sm:gap-12 max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={itemVariants}
          >
            <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold mb-3 xs:mb-4 sm:mb-6">Get in Touch</h3>
            <div className="space-y-3 xs:space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-2.5 xs:space-x-3 sm:space-x-4">
                <Mail className="h-5 w-5 xs:h-6 xs:w-6 text-primary flex-shrink-0" />
                <a href="mailto:ttahir@leasap.com" className="hover:text-primary transition-colors text-sm xs:text-base break-all">ttahir@leasap.com</a>
              </div>
              <div className="flex items-center space-x-2.5 xs:space-x-3 sm:space-x-4">
                <Phone className="h-5 w-5 xs:h-6 xs:w-6 text-primary flex-shrink-0" />
                <a href="tel:+15419126397" className="hover:text-primary transition-colors text-sm xs:text-base">+1 (541) 912-6397</a>
              </div>
              <div className="flex items-center space-x-2.5 xs:space-x-3 sm:space-x-4">
                <MapPin className="h-5 w-5 xs:h-6 xs:w-6 text-primary flex-shrink-0" />
                <span className="text-sm xs:text-base">San Francisco Bay Area, CA</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={itemVariants}
          >
            <Card>
              <CardContent className="p-3 xs:p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-3 xs:space-y-4">
                <div>
                  <label htmlFor="name" className="text-xs xs:text-sm font-medium mb-1 block">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setShowSuccess(false);
                    }}
                    required
                    minLength={2}
                    className="text-sm xs:text-base"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="text-xs xs:text-sm font-medium mb-1 block">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setShowSuccess(false);
                    }}
                    required
                    className="text-sm xs:text-base"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="text-xs xs:text-sm font-medium mb-1 block">
                    Phone <span className="text-gray-500 text-[10px] xs:text-xs">(Optional)</span>
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      setShowSuccess(false);
                    }}
                    className="text-sm xs:text-base"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="text-xs xs:text-sm font-medium mb-1 block">
                    Subject <span className="text-gray-500 text-[10px] xs:text-xs">(Optional)</span>
                  </label>
                  <Input
                    id="subject"
                    placeholder="General Inquiry"
                    value={formData.subject}
                    onChange={(e) => {
                      setFormData({ ...formData, subject: e.target.value });
                      setShowSuccess(false);
                    }}
                    className="text-sm xs:text-base"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="text-xs xs:text-sm font-medium mb-1 block">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Your Message"
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      setShowSuccess(false);
                    }}
                    required
                    minLength={10}
                    rows={4}
                    className="resize-none text-sm xs:text-base"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.name.trim() || !formData.email.trim() || !formData.message.trim()} 
                  className="w-full text-sm xs:text-base"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </Button>
                {showSuccess && (
                  <div className="flex items-center justify-center text-xs xs:text-sm text-green-600">
                    <CheckCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-2" />
                    Message sent, we will contact you soon.
                  </div>
                )}
              </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;