import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Award, Users, Building, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  const stats = [
    { icon: Building, label: "Properties Managed", value: "500+" },
    { icon: Users, label: "Happy Clients", value: "500+" },
    { icon: TrendingUp, label: "Years Experience", value: "3+" }
  ];

  const team = [
    {
      name: "Tayyab Tahir",
      role: "CEO & Founder",
      image:"/images/photos/ceo.jpg",
      description: "3+ years in real estate with a vision for AI-powered property solutions."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/5">
      <div className="container mx-auto px-6 py-24">
        <div className="mb-12">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-navy mb-6">About EliteRealty AI</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-semibold text-navy mb-6">Revolutionizing Real Estate with AI</h2>
              <p className="text-navy/70 mb-6 leading-relaxed">
                At EliteRealty AI, we combine cutting-edge artificial intelligence with deep real estate expertise to deliver unparalleled service to our clients. Our innovative platform transforms how properties are bought, sold, and managed.
              </p>
              <p className="text-navy/70 mb-6 leading-relaxed">
                Founded in 2009, we've grown from a small boutique agency to a technology-driven powerhouse, serving thousands of satisfied clients across the region. Our AI-powered tools provide market insights, property valuations, and personalized recommendations that give our clients a competitive edge.
              </p>
              <Link to="/signup">
                <Button variant="luxury" size="lg">
                  Schedule Consultation
                </Button>
              </Link>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop" 
                alt="Modern office building"
                className="rounded-lg shadow-luxury w-full"
              />
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center p-6 bg-white/80 backdrop-blur-sm border-0 hover:shadow-luxury transition-all duration-300">
                <CardContent className="p-0">
                  <stat.icon className="h-8 w-8 text-gold mx-auto mb-4" />
                  <div className="text-2xl font-bold text-navy mb-2">{stat.value}</div>
                  <div className="text-navy/60 text-sm">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <Card className="p-8 bg-luxury-gradient text-white border-0">
              <h3 className="text-2xl font-semibold mb-4">Our Mission</h3>
              <p className="leading-relaxed">
                To democratize access to premium real estate services through innovative AI technology, making luxury property transactions seamless and accessible for everyone.
              </p>
            </Card>
            <Card className="p-8 bg-accent-gradient text-navy border-0">
              <h3 className="text-2xl font-semibold mb-4">Our Vision</h3>
              <p className="leading-relaxed">
                To become the world's leading AI-powered real estate platform, setting new standards for transparency, efficiency, and client satisfaction in property markets globally.
              </p>
            </Card>
          </div>

          {/* Team Section */}
          <div>
            <h2 className="text-3xl font-semibold text-navy mb-8 text-center">Meet Our Team</h2>
            <div className="flex justify-center grid-cols-1 md:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <Card key={index} className="text-center bg-luxury-gradient backdrop-blur-sm border-0 text-white hover:shadow-luxury transition-all duration-300 transform hover:-translate-y-2">
                  <CardContent className="p-6">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                    <h3 className="text-xl font-semibold text-white mb-2">{member.name}</h3>
                    <div className="text-gold font-medium mb-3">{member.role}</div>
                    <p className="text-white text-sm leading-relaxed">{member.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;