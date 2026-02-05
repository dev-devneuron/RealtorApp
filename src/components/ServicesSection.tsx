import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };
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
    <section id="services" className="py-12 xs:py-16 sm:py-20 bg-gray-50">
      <div className="container mx-auto px-3 xs:px-4 sm:px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-8 xs:mb-12 sm:mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={itemVariants}
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-3 xs:mb-4 sm:mb-6">
            AI-Powered Real Estate Solutions
          </h2>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your real estate business with cutting-edge AI technology. 
            Our comprehensive suite of tools helps you capture leads, engage clients, 
            and close deals more efficiently than ever before.
          </p>
        </motion.div>

        {/* Benefits Row */}
        <motion.div
          className="grid grid-cols-1 xs:grid-cols-3 gap-4 xs:gap-6 sm:gap-8 mb-8 xs:mb-12 sm:mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {benefits.map((benefit, index) => (
            <motion.div key={index} className="text-center" variants={itemVariants}>
              <div className="bg-accent-gradient w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-2 xs:mb-3 sm:mb-4">
                <benefit.icon className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-navy" />
              </div>
              <h3 className="text-base xs:text-lg sm:text-xl font-bold text-navy mb-1 xs:mb-2">{benefit.title}</h3>
              <p className="text-xs xs:text-sm sm:text-base text-gray-600">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Services Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 sm:gap-8 mb-8 xs:mb-10 sm:mb-12 md:mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {services.map((service, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="group hover:shadow-luxury transition-all duration-300 hover:-translate-y-2 border-0 h-full">
              <CardHeader className="p-4 xs:p-5 sm:p-6">
                <div className={`w-10 h-10 xs:w-12 xs:h-12 ${service.color} rounded-lg flex items-center justify-center mb-3 xs:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="h-5 w-5 xs:h-6 xs:w-6 text-white" />
                </div>
                <CardTitle className="text-lg xs:text-xl text-navy">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                <p className="text-xs xs:text-sm sm:text-base text-gray-600 mb-4 xs:mb-6">{service.description}</p>
                <ul className="space-y-1.5 xs:space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-xs xs:text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-gold rounded-full mr-2 xs:mr-3 flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center bg-luxury-gradient rounded-xl xs:rounded-2xl sm:rounded-3xl p-4 xs:p-6 sm:p-8 md:p-12 text-white"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={itemVariants}
        >
          <h3 className="text-xl xs:text-2xl sm:text-3xl font-bold mb-2 xs:mb-3 sm:mb-4">
            Ready to Transform Your Business?
          </h3>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl mb-4 xs:mb-6 sm:mb-8 text-white/90">
            Join 500+ realtors already using our AI solutions to grow their business
          </p>
          <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 justify-center">
            {/* <Button variant="gold" size="lg">
              Start Free Trial
            </Button> */}
            <Link to="/book-demo" className="w-full xs:w-auto">
              <Button variant="premium" size="lg" className="w-full xs:w-auto text-sm xs:text-base">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;