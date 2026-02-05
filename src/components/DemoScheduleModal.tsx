import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Phone, Mail, Building, MessageSquare } from "lucide-react";

interface DemoScheduleModalProps {
  children?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

const DemoScheduleModal = ({ children, isOpen, onClose }: DemoScheduleModalProps) => {
  const [open, setOpen] = useState(false);
  
  // Handle external control
  const isControlled = isOpen !== undefined && onClose !== undefined;
  const modalOpen = isControlled ? isOpen : open;
  const setModalOpen = isControlled ? onClose : setOpen;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: ""
  });
  const { toast } = useToast();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Store in database
      const { error: dbError } = await supabase
        .from('demo_requests')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          message: formData.message || null
        }]);

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save demo request');
      }

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke('send-demo-email', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          message: formData.message
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        // Don't throw here - the request was saved successfully
        toast({
          title: "Demo Request Received",
          description: "Your demo request has been saved. We'll contact you within 24 hours!",
        });
      } else {
        toast({
          title: "Demo Request Sent!",
          description: "Thank you! We'll contact you within 24 hours to schedule your demo.",
        });
      }

      // Reset form and close modal
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        message: ""
      });
      if (isControlled) {
        onClose!();
      } else {
        setOpen(false);
      }

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: "There was an issue sending your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-navy">
            <Calendar className="h-6 w-6 text-gold" />
            Schedule Your Demo
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <p className="text-gray-600">
            Get a personalized demo of our AI-powered real estate solutions. 
            We'll show you how to automate lead generation and boost your sales.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Full Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Company/Agency
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="ABC Realty"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Message (Optional)
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Tell us about your specific needs or questions..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                if (isControlled) {
                  onClose!();
                } else {
                  setOpen(false);
                }
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="luxury" 
              disabled={loading || !formData.name || !formData.email}
              className="flex-1"
            >
              {loading ? "Scheduling..." : "Schedule Demo"}
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-500 pt-2">
          We'll contact you within 24 hours to confirm your demo time.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoScheduleModal;