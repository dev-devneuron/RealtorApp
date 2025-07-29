import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, TrendingUp, Users, Award } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import DemoScheduleModal from "./DemoScheduleModal";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-hero-gradient" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Main Content */}
          <div className="text-white space-y-8 animate-slide-up">
            <div className="space-y-4">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
                <Award className="mr-2 h-4 w-4 text-gold" />
                #1 AI-Powered Real Estate Services
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Revolutionize Your
                <span className="text-gold block">Real Estate Business</span>
                with AI
              </h1>
              
              <p className="text-xl text-white/90 max-w-2xl">
                Experience the future of real estate with our AI-powered chatbot and callbot. 
                Capture leads 24/7, provide instant property information, and close deals faster 
                than ever before.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="gold" 
                size="lg" 
                className="text-lg px-8 py-4"
                onClick={() => navigate('/signup')}
              >
                Start Free Trial
              </Button>
              <DemoScheduleModal>
                <Button 
                  variant="premium" 
                  size="lg" 
                  className="text-lg px-8 py-4"
                >
                  Schedule Demo
                </Button>
              </DemoScheduleModal>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gold">24/7</div>
                <div className="text-white/80">AI Availability</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gold">85%</div>
                <div className="text-white/80">Lead Conversion</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gold">500+</div>
                <div className="text-white/80">Happy Realtors</div>
              </div>
            </div>
          </div>

          {/* Right Column - Interactive Demo */}
          <div className="relative animate-float">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-luxury border border-white/20">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Live AI Demo
                  </h3>
                  <p className="text-white/80">
                    See our AI in action
                  </p>
                </div>

                {/* Chat Demo Preview */}
                <div className="bg-white/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-gold rounded-full p-2">
                      <MessageCircle className="h-4 w-4 text-navy" />
                    </div>
                    <div className="bg-white/90 rounded-lg p-3 flex-1">
                      <p className="text-navy text-sm">
                        "Hi! I'm looking for a 3-bedroom house under $500k in downtown..."
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-navy rounded-full p-2">
                      <Users className="h-4 w-4 text-gold" />
                    </div>
                    <div className="bg-gold/90 rounded-lg p-3 flex-1">
                      <p className="text-navy text-sm">
                        "I found 12 perfect matches! Here are the top 3 properties that fit your criteria..."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Call Demo Preview */}
                <div className="bg-white/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-5 w-5 text-gold" />
                      <span className="text-white font-medium">AI Call Assistant</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-6 bg-gold rounded animate-pulse"></div>
                      <div className="w-2 h-4 bg-gold/60 rounded animate-pulse delay-100"></div>
                      <div className="w-2 h-8 bg-gold rounded animate-pulse delay-200"></div>
                      <div className="w-2 h-3 bg-gold/60 rounded animate-pulse delay-300"></div>
                    </div>
                  </div>
                  <p className="text-white/90 text-sm italic">
                    "Hello! I can help you schedule viewings, answer property questions, 
                    and connect you with the right agent..."
                  </p>
                </div>

                {/* Action Button */}
                <Button 
                  variant="luxury" 
                  className="w-full"
                  onClick={() => navigate('/signup')}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Start Your AI Journey
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-10 w-20 h-20 bg-gold/20 rounded-full animate-float delay-1000"></div>
      <div className="absolute bottom-32 left-10 w-16 h-16 bg-white/10 rounded-full animate-float delay-2000"></div>
      
      <DemoScheduleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};

export default HeroSection;