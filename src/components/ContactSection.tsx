import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Backend API base URL
const API_BASE = "https://leasing-copilot-mvp.onrender.com";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    phone: "",
    subject: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    <section id="contact-section" className="py-20 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Contact Us</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get in touch with our team for any questions or support
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Get in Touch</h3>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-4">
                <Mail className="h-6 w-6 text-primary" />
                <a href="mailto:ttahir@leasap.com" className="hover:text-primary transition-colors">ttahir@leasap.com</a>
              </div>
              <div className="flex items-center space-x-4">
                <Phone className="h-6 w-6 text-primary" />
                <a href="tel:+15419126397" className="hover:text-primary transition-colors">+1 (541) 912-6397</a>
              </div>
              <div className="flex items-center space-x-4">
                <MapPin className="h-6 w-6 text-primary" />
                <span>San Francisco Bay Area, CA</span>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="text-sm font-medium mb-1 block">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    minLength={2}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="text-sm font-medium mb-1 block">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="text-sm font-medium mb-1 block">
                    Phone <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="text-sm font-medium mb-1 block">
                    Subject <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <Input
                    id="subject"
                    placeholder="General Inquiry"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="text-sm font-medium mb-1 block">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Your Message"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                    minLength={10}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.name.trim() || !formData.email.trim() || !formData.message.trim()} 
                  className="w-full"
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
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;