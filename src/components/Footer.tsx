import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Home, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram 
} from "lucide-react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Send notification to admin about new subscriber
      const { error } = await supabase.functions.invoke('send-signup-confirmation', {
        body: {
          name: "Newsletter Subscriber",
          email: email,
          adminNotification: true,
          subscriptionType: "newsletter"
        }
      });

      if (error) throw error;

      toast({
        title: "Subscribed!",
        description: "You've successfully subscribed to our newsletter.",
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const quickLinks = [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "AI Tools", href: "#ai-tools" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
  ];

  const services = [
    { name: "AI ChatBot", href: "#" },
    { name: "AI CallBot", href: "#" },
    { name: "Lead Management", href: "#" },
    { name: "Property Search", href: "#" },
    { name: "Analytics", href: "#" },
  ];

  const legal = [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Cookie Policy", href: "#" },
    { name: "GDPR Compliance", href: "#" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", name: "Facebook" },
    { icon: Twitter, href: "#", name: "Twitter" },
    { icon: Linkedin, href: "#", name: "LinkedIn" },
    { icon: Instagram, href: "#", name: "Instagram" },
  ];

  return (
    <footer className="bg-navy text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2">Stay Updated with AI Real Estate Trends</h3>
              <p className="text-white/80">
                Get weekly insights, tips, and updates about AI in real estate delivered to your inbox.
              </p>
            </div>
            <div className="flex space-x-4">
              <Input 
                placeholder="Enter your email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Button 
                variant="gold" 
                onClick={handleSubscribe}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-2">
              <div className="bg-accent-gradient p-2 rounded-lg">
                <Home className="h-6 w-6 text-navy" />
              </div>
              <div className="text-xl font-bold">
                Elite<span className="text-gold">Realty AI</span>
              </div>
            </div>
            
            <p className="text-white/80 max-w-md">
              Revolutionizing real estate with AI-powered chatbots and callbots. 
              Help realtors capture more leads, engage customers 24/7, and close deals faster.
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gold" />
                <span className="text-white/80">hello@eliterealtyai.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gold" />
                <span className="text-white/80">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gold" />
                <span className="text-white/80">123 Tech Street, San Francisco, CA 94105</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="bg-white/10 hover:bg-gold/20 p-2 rounded-lg transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href} 
                    className="text-white/80 hover:text-gold transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-lg mb-6">AI Services</h4>
            <ul className="space-y-3">
              {services.map((service, index) => (
                <li key={index}>
                  <a 
                    href={service.href} 
                    className="text-white/80 hover:text-gold transition-colors"
                  >
                    {service.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-lg mb-6">Legal</h4>
            <ul className="space-y-3">
              {legal.map((item, index) => (
                <li key={index}>
                  <a 
                    href={item.href} 
                    className="text-white/80 hover:text-gold transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-white/60 text-sm">
              © 2024 EliteRealty AI. All rights reserved.
            </p>
            
            <div className="flex items-center space-x-6 text-sm text-white/60">
              <span>Powered by Advanced AI Technology</span>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-gold" />
                <Phone className="h-4 w-4 text-gold" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;