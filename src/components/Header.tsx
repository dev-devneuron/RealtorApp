import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Menu, X, Home } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { name: "Home", href: "/", isRoute: true },
    { name: "Dashboard", href: "/dashboard", isRoute: true },
    { name: "Services", href: "#services", isRoute: false },
    { name: "Properties", href: "/properties", isRoute: true },
    { name: "AI Tools", href: "#ai-tools", isRoute: false },
    { name: "About", href: "/about", isRoute: true },
    { name: "Contact", href: "#contact-section", isRoute: false },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-lg shadow-luxury"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-accent-gradient p-2 rounded-lg">
              <Home className="h-6 w-6 text-navy" />
            </div>
            <div className="text-xl font-bold text-navy">
              Elite<span className="text-gold">Realty AI</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              item.isRoute ? (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-navy hover:text-gold transition-colors duration-300 font-medium"
                >
                  {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-navy hover:text-gold transition-colors duration-300 font-medium"
                    onClick={(e) => {
                      if (item.href.startsWith('#')) {
                        e.preventDefault();
                        const targetId = item.href.substring(1);
                        const element = document.getElementById(targetId);
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                >
                  {item.name}
                </a>
              )
            ))}
          </nav>

          {/* Action Buttons - Removed Chat Bot and Call Bot buttons */}

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-navy hover:text-gold transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg shadow-luxury">
            <nav className="p-6 space-y-4">
              {navigation.map((item) => (
                item.isRoute ? (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="block text-navy hover:text-gold transition-colors duration-300 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block text-navy hover:text-gold transition-colors duration-300 font-medium"
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      if (item.href.startsWith('#')) {
                        e.preventDefault();
                        const targetId = item.href.substring(1);
                        const element = document.getElementById(targetId);
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    {item.name}
                  </a>
                )
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;