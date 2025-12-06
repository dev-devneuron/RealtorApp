/**
 * Footer Component
 * 
 * Main footer component for the application. Displays:
 * - Company information and branding
 * - Quick navigation links
 * - Service links
 * - Contact information
 * - Social media links
 * - Copyright information
 * 
 * Note: Newsletter subscription functionality is currently commented out
 * but can be re-enabled when needed.
 * 
 * @module components/Footer
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Linkedin
} from "lucide-react";

const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Newsletter subscription state (currently unused)
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  /**
   * Handles navigation to anchor links
   * If on home page, scrolls to section. Otherwise, navigates to home then scrolls.
   */
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const sectionId = href.substring(1); // Remove the #
    
    if (location.pathname === '/') {
      // Already on home page, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Navigate to home page with hash, then scroll after navigation
      navigate(`/${href}`);
      // Use setTimeout to ensure page has loaded before scrolling
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  /**
   * Newsletter subscription handler (currently disabled)
   * 
   * This function would handle newsletter subscriptions by sending the email
   * to a Supabase Edge Function. Currently commented out but can be re-enabled
   * when newsletter functionality is needed.
   */
  // const handleSubscribe = async () => {
  //   if (!email) {
  //     toast({
  //       title: "Error",
  //       description: "Please enter your email address.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setIsSubmitting(true);

  //   try {
  //     // Send notification to admin about new subscriber
  //     const { error } = await supabase.functions.invoke('send-signup-confirmation', {
  //       body: {
  //         name: "Newsletter Subscriber",
  //         email: email,
  //         adminNotification: true,
  //         subscriptionType: "newsletter"
  //       }
  //     });

  //     if (error) throw error;

  //     toast({
  //       title: "Subscribed!",
  //       description: "You've successfully subscribed to our newsletter.",
  //     });
  //     setEmail("");
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to subscribe. Please try again.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  /**
   * Footer navigation links
   * Quick links to main sections of the website
   */
  const quickLinks = [
    { name: "Home", href: "/", isRoute: true },
    { name: "Services", href: "#services", isRoute: false },
    { name: "AI Tools", href: "#ai-tools", isRoute: false },
    { name: "About", href: "/about", isRoute: true },
    { name: "Contact", href: "#contact-section", isRoute: false },
  ];

  /**
   * Service links
   * Links to various AI services offered by the platform
   */
  const services = [
    { name: "AI ChatBot", href: "#" },
    { name: "AI CallBot", href: "#" },
    { name: "Lead Management", href: "#" },
    { name: "Property Search", href: "#" },
    { name: "Analytics", href: "#" },
  ];

  /**
   * Legal links (currently disabled)
   * Can be re-enabled when legal pages are created
   */
  // const legal = [
  //   { name: "Privacy Policy", href: "#" },
  //   { name: "Terms of Service", href: "#" },
  //   { name: "Cookie Policy", href: "#" },
  //   { name: "GDPR Compliance", href: "#" },
  // ];

  /**
   * Social media links
   * Configuration for social media platform links with icons
   * Only LinkedIn is kept as per requirements
   */
  const socialLinks = [
    { icon: Linkedin, href: "https://www.linkedin.com/company/leasap", name: "LinkedIn" },
  ];

  return (
    <footer className="bg-navy text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* <div>
              <h3 className="text-2xl font-bold mb-2">Stay Updated with AI Real Estate Trends</h3>
              <p className="text-white/80">
                Get weekly insights, tips, and updates about AI in real estate delivered to your inbox.
              </p>
            </div> */}
            {/* <div className="flex space-x-4">
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
            </div> */}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center">
              <img 
                src="/images/photos/leasap logo.jpg" 
                alt="Leasap Logo" 
                className="h-14 sm:h-16 md:h-20 w-auto object-contain"
              />
            </div>
            
            <p className="text-white/80 max-w-md">
              Revolutionizing real estate with AI-powered chatbots and callbots. 
              Help realtors capture more leads, engage customers 24/7, and close deals faster.
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gold" />
                <a href="mailto:ttahir@leasap.com" className="text-white/80 hover:text-gold transition-colors">ttahir@leasap.com</a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gold" />
                <a href="tel:+15419126397" className="text-white/80 hover:text-gold transition-colors">+1 (541) 912-6397</a>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gold" />
                <span className="text-white/80">San Francisco Bay Area, CA</span>
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
                  {link.isRoute ? (
                    <Link 
                      to={link.href} 
                      className="text-white/80 hover:text-gold transition-colors"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a 
                      href={link.href} 
                      className="text-white/80 hover:text-gold transition-colors"
                      onClick={(e) => handleAnchorClick(e, link.href)}
                    >
                      {link.name}
                    </a>
                  )}
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
          {/* <div>
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
          </div> */}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-white/60 text-sm">
              © 2025 Leasap. All rights reserved.
            </p>
            
            <div className="flex items-center space-x-6 text-sm text-white/60">
              <span>Powered by Advanced AI Technology</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;