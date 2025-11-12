import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Menu, X, Home, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    // Check if user is logged in
    const checkAuthStatus = () => {
      const token = localStorage.getItem("access_token");
      setIsLoggedIn(!!token);
    };

    checkAuthStatus();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { name: "Home", href: "/", isRoute: true },
    { name: "Services", href: "#services", isRoute: false },
    { name: "Properties", href: "/properties", isRoute: true },
    { name: "AI Tools", href: "#ai-tools", isRoute: false },
    { name: "About", href: "/about", isRoute: true },
    { name: "Contact", href: "#contact-section", isRoute: false },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("realtor_id");
    localStorage.removeItem("auth_link");
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-lg shadow-luxury"
          : "bg-gold backdrop-blur-md"
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-accent-gradient p-2 rounded-lg">
              <Link to="/"
               onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
              <Home className="h-6 w-6 text-navy" />
              </Link>
            </div>
            <Link to="/"
               onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
            <div className="text-xl font-bold text-navy">
              Leasap
            </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              item.isRoute ? (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-navy hover:text-orange-700 transition-colors duration-300 font-medium"
                >
                  {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-navy hover:text-orange-700 transition-colors duration-300 font-medium"
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

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Link to="/dashboard">
                  <Button 
                    variant="outline" 
                    className="bg-transparent border-navy text-navy hover:bg-navy hover:text-white transition-all duration-300"
                  >
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="bg-transparent border-navy text-navy hover:bg-navy hover:text-white transition-all duration-300"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <Button 
                    variant="outline" 
                    className="bg-transparent border-navy text-navy hover:bg-navy hover:text-white transition-all duration-300"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/book-demo">
                  <Button 
                    className="bg-gold hover:bg-gold/90 text-navy font-semibold transition-all duration-300"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Book a Demo
                  </Button>
                </Link>
              </>
            )}
          </div>

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
              
              {/* Mobile Auth Buttons */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                {isLoggedIn ? (
                  <>
                    <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button 
                        variant="outline" 
                        className="w-full bg-transparent border-navy text-navy hover:bg-navy hover:text-white transition-all duration-300"
                      >
                        Dashboard
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      variant="outline" 
                      className="w-full bg-transparent border-navy text-navy hover:bg-navy hover:text-white transition-all duration-300"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button 
                        variant="outline" 
                        className="w-full bg-transparent border-navy text-navy hover:bg-navy hover:text-white transition-all duration-300"
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/book-demo" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button 
                        className="w-full bg-gold hover:bg-gold/90 text-navy font-semibold transition-all duration-300"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Book a Demo
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;