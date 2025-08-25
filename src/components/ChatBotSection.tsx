import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  MessageCircle,
  Bot,
  Sparkles,
  TrendingUp,
  Users,
  Home
} from "lucide-react";

const ChatBotSection = () => {
  const features = [
    {
      icon: Sparkles,
      title: "Natural Language",
      description: "Understands complex queries in plain English",
    },
    {
      icon: TrendingUp,
      title: "Lead Qualification",
      description: "Automatically scores and qualifies potential leads",
    },
    {
      icon: Users,
      title: "24/7 Availability",
      description: "Never miss a lead, even outside business hours",
    },
    {
      icon: Home,
      title: "Property Matching",
      description: "AI-powered property recommendations based on preferences",
    },
  ];

  return (
    <section id="ai-tools" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Features */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-navy mb-6">
                AI ChatBot That
                <span className="text-gold block">Never Sleeps</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our advanced AI chatbot handles customer inquiries 24/7,
                qualifies leads, and provides instant property information.
                It's like having your best agent working around the clock.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="space-y-3">
                  <div className="bg-accent-gradient w-12 h-12 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-navy" />
                  </div>
                  <h3 className="font-bold text-navy">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="font-bold text-navy mb-4 text-center">
                ChatBot Performance
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">95%</div>
                  <div className="text-gray-600 text-sm">
                    Customer Satisfaction
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">24/7</div>
                  <div className="text-gray-600 text-sm">Availability</div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Link to="/signup">
              <Button variant="luxury" size="lg" className="w-full">
                <MessageCircle className="mr-2 h-5 w-5" />
                Get Your ChatBot Today
              </Button>
            </Link>
          </div>

          {/* Right Column - Demo Video */}
          <div className="lg:sticky lg:top-8">
            <Card className="shadow-luxury border-0">
              <CardHeader className="bg-luxury-gradient text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-6 w-6" />
                  <span>AI ChatBot Demo</span>
                  <div className="ml-auto w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4">
                  <video controlsList="nodownload" controls className="w-1/2 rounded-lg shadow-md mx-auto">
                    <source
                      src="/demo-videos/ChatBotDemo.mp4"
                      type="video/mp4"
                    />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatBotSection;
