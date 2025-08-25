import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DemoScheduleModal from "@/components/DemoScheduleModal";
import { 
  MessageCircle, 
  Phone, 
  Search, 
  BarChart3, 
  Users, 
  Calendar,
  Zap,
  Shield,
  Clock
} from "lucide-react";

const ServicesSection = () => {
  const services = [
    {
      icon: MessageCircle,
      title: "AI Chatbot",
      description: "24/7 customer support that never sleeps. Handle inquiries, qualify leads, and provide instant property information.",
      features: ["Lead Qualification", "Property Search", "Instant Responses", "Multi-language Support"],
      color: "bg-blue-500"
    },
    {
      icon: Phone,
      title: "AI Call Bot",
      description: "Voice-powered assistant that handles calls professionally. Schedule appointments and answer questions naturally.",
      features: ["Call Scheduling", "Property Details", "Natural Conversation", "Call Transcription"],
      color: "bg-green-500"
    },
    {
      icon: Search,
      title: "Smart Property Search",
      description: "AI-powered search that understands natural language queries and finds perfect property matches.",
      features: ["Natural Language Search", "Smart Filtering", "Preference Learning", "Market Analysis"],
      color: "bg-purple-500"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive insights into your leads, conversions, and market trends powered by AI analytics.",
      features: ["Lead Analytics", "Conversion Tracking", "Market Insights", "Performance Reports"],
      color: "bg-orange-500"
    },
    {
      icon: Users,
      title: "Lead Management",
      description: "Intelligent lead scoring and nurturing system that helps you focus on the most promising prospects.",
      features: ["Lead Scoring", "Automated Follow-up", "CRM Integration", "Pipeline Management"],
      color: "bg-red-500"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "AI-powered scheduling system that optimizes your calendar and reduces no-shows.",
      features: ["Auto Scheduling", "Reminder Systems", "Calendar Sync", "Availability Management"],
      color: "bg-indigo-500"
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "10x Faster Response",
      description: "Instant responses to customer inquiries"
    },
    {
      icon: Shield,
      title: "Never Miss a Lead",
      description: "24/7 availability ensures every opportunity is captured"
    },
    {
      icon: Clock,
      title: "Save 20+ Hours/Week",
      description: "Automate routine tasks and focus on closing deals"
    }
  ];

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-navy mb-6">
            AI-Powered Real Estate Solutions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your real estate business with cutting-edge AI technology. 
            Our comprehensive suite of tools helps you capture leads, engage clients, 
            and close deals more efficiently than ever before.
          </p>
        </div>

        {/* Benefits Row */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              <div className="bg-accent-gradient w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="h-8 w-8 text-navy" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <Card key={index} className="group hover:shadow-luxury transition-all duration-300 hover:-translate-y-2 border-0">
              <CardHeader>
                <div className={`w-12 h-12 ${service.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-navy">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-gold rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-luxury-gradient rounded-3xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Transform Your Business?
          </h3>
          <p className="text-xl mb-8 text-white/90">
            Join 500+ realtors already using our AI solutions to grow their business
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* <Button variant="gold" size="lg">
              Start Free Trial
            </Button> */}
            <DemoScheduleModal>
              <Button variant="premium" size="lg">
                Schedule Demo
              </Button>
            </DemoScheduleModal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;