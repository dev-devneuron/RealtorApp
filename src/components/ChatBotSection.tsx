import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Bot,
  Sparkles,
  TrendingUp,
  Users,
  Home,
  Calendar,
  Wrench,
  Building,
  Shield,
  FileText,
  Search,
  Paperclip,
  Mic
} from "lucide-react";

const ChatBotSection = () => {
  const statsRef = useRef<HTMLDivElement | null>(null);
  const [statsStarted, setStatsStarted] = useState(false);
  const [statsValues, setStatsValues] = useState({
    satisfaction: 0,
    availability: 0,
  });
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
  const [activeFeature, setActiveFeature] = useState('apartment');
  const [messages, setMessages] = useState([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [chatPaused, setChatPaused] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const features = [
    {
      id: 'apartment',
      icon: Building,
      title: "Apartment Information",
      description: "Get detailed property details and policies",
      color: "bg-green-500"
    },
    {
      id: 'booking',
      icon: Calendar,
      title: "Tour Booking",
      description: "Schedule property viewings instantly",
      color: "bg-blue-500"
    },
    {
      id: 'safety',
      icon: Shield,
      title: "Neighborhood Safety",
      description: "Safety analysis and crime statistics",
      color: "bg-red-500"
    },
    {
      id: 'application',
      icon: FileText,
      title: "Application Forms",
      description: "AI-assisted form filling and submission",
      color: "bg-purple-500"
    },
    {
      id: 'maintenance',
      icon: Wrench,
      title: "Maintenance Requests",
      description: "Report and track maintenance issues",
      color: "bg-orange-500"
    }
  ];

  const chatScripts = {
    booking: [
      { text: "Hello 👋 I'm your LEASAP Assistant.\nTell me what you need, and I'll guide you step by step.", isUser: false, delay: 1500 },
      { text: "Hi! I'd like to schedule a tour for the 2BR apartment at 123 Main St.", isUser: true, delay: 2000 },
      { text: "Hello! I'd be happy to help you schedule a tour. I can see you're interested in the 2BR at 123 Main St.\n\nLet me check our available time slots for this week...", isUser: false, delay: 2000, typing: 3000 },
      { text: "Here are the available time slots:\n\n📅 Tuesday: 2:00 PM, 4:30 PM\n📅 Wednesday: 10:00 AM, 3:00 PM\n📅 Thursday: 11:30 AM, 5:00 PM\n📅 Friday: 9:00 AM, 2:00 PM\n\nWhich day and time works best for you?", isUser: false, delay: 2500 },
      { text: "Wednesday at 3:00 PM works for me", isUser: true, delay: 1800 },
      { text: "Perfect! Let me reserve that slot for you...", isUser: false, delay: 1500, typing: 2000 },
      { text: "Excellent! I've reserved Wednesday at 3:00 PM for you.\n\n📋 Tour Details:\n📍 Address: 123 Main St, Unit 2B\n⏰ Date: Wednesday, 3:00 PM\n👤 Agent: Sarah Johnson\n📱 Contact: (555) 123-4567\n\nYou'll receive a confirmation email and SMS reminder 24 hours before the tour.\n\nIs there anything specific you'd like to see during the tour?", isUser: false, delay: 3000 },
      { text: "Yes, I'd like to see the kitchen and check the storage space", isUser: true, delay: 2000 },
      { text: "Great! I've noted your preferences:\n\n✅ Kitchen walkthrough\n✅ Storage space inspection\n\nSarah will make sure to highlight these areas during your tour. She'll also show you the building amenities and answer any questions about the neighborhood.\n\nIs there anything else I can help you with today?", isUser: false, delay: 2500 },
      { text: "Thank you for choosing LEASAP! Feel free to contact us anytime for assistance. Have a great day! 😊", isUser: false, delay: 2000 }
    ],
    maintenance: [
      { text: "Hello 👋 I'm your LEASAP Assistant.\nTell me what you need, and I'll guide you step by step.", isUser: false, delay: 1500 },
      { text: "I need to report a maintenance issue in my apartment", isUser: true, delay: 2000 },
      { text: "I'm here to help! What type of maintenance issue are you experiencing?\n\nLet me show you the common categories...", isUser: false, delay: 1500, typing: 2000 },
      { text: "🔧 Common issues:\n• Plumbing (leaks, clogs, water pressure)\n• Electrical (outlets, lighting, appliances)\n• HVAC (heating, cooling, air quality)\n• Appliances (dishwasher, washer/dryer)\n• General repairs (doors, windows, locks)\n\nPlease describe the issue and I'll create a work order for you.", isUser: false, delay: 2000 },
      { text: "The kitchen faucet is leaking and the water pressure is very low", isUser: true, delay: 1800 },
      { text: "I understand - kitchen faucet leak and low water pressure. Let me create a work order for you...", isUser: false, delay: 1500, typing: 2500 },
      { text: "📋 Maintenance Request Created:\n🏠 Unit: 2B, 123 Main St\n🔧 Issue: Kitchen faucet leak + low water pressure\n⚡ Priority: High (water damage risk)\n👨‍🔧 Assigned: Mike's Plumbing\n📅 Estimated: Within 24 hours\n\nI've also sent you a confirmation email with request #MT-2024-001.\n\nWould you like me to schedule a specific time window for the repair?", isUser: false, delay: 3000 },
      { text: "Yes, preferably in the morning between 9-11 AM", isUser: true, delay: 1500 },
      { text: "Perfect! Let me schedule that for you...", isUser: false, delay: 1200, typing: 2000 },
      { text: "Excellent! I've scheduled the repair for tomorrow morning between 9-11 AM.\n\n📅 Confirmed Schedule:\n• Date: Tomorrow (Tuesday)\n• Time: 9:00 AM - 11:00 AM\n• Technician: Mike's Plumbing\n• Contact: (555) 987-6543\n\nYou'll receive a text 30 minutes before arrival. The technician will call when they're on their way.\n\nIs there anything else I can help you with?", isUser: false, delay: 2500 },
      { text: "Thank you for using LEASAP! Feel free to contact us anytime for assistance. Have a great day! 😊", isUser: false, delay: 2000 }
    ],
    apartment: [
      { text: "Hello 👋 I'm your LEASAP Assistant.\nTell me what you need, and I'll guide you step by step.", isUser: false, delay: 1500 },
      { text: "Can you tell me about the apartment details and policies?", isUser: true, delay: 2000 },
      { text: "Absolutely! Let me pull up the comprehensive information for you...", isUser: false, delay: 1500, typing: 2500 },
      { text: "🏠 **Apartment Details:**\n• Unit: 2BR/2BA, 1,200 sq ft\n• Floor: 3rd floor, corner unit\n• Layout: Open concept living/dining\n• Windows: Floor-to-ceiling, south-facing\n• Parking: 1 assigned space included\n\n🐕 **Pet Policy:**\n• Dogs: Allowed (max 2, under 50 lbs each)\n• Cats: Allowed (max 2)\n• Pet deposit: $500 (refundable)\n• Pet rent: $50/month per pet\n• Breed restrictions: None\n\nWhat specific information would you like to know more about?", isUser: false, delay: 2000 },
      { text: "What amenities are available?", isUser: true, delay: 1500 },
      { text: "Great question! Let me get the complete amenities list for you...", isUser: false, delay: 1200, typing: 2000 },
      { text: "🏢 **Building Amenities:**\n• 24/7 Fitness center with cardio & weights\n• Rooftop pool with city views\n• Co-working space with WiFi\n• Package receiving room\n• Bike storage room\n• Laundry room (coin-operated)\n• Rooftop terrace with grills\n\n🏠 **In-Unit Features:**\n• In-unit washer/dryer\n• Central AC/Heat\n• Dishwasher & garbage disposal\n• Walk-in closets\n• Private balcony\n• Hardwood floors\n\n🔒 **Security & Safety:**\n• Key fob entry system\n• Security cameras in common areas\n• Intercom system\n• Smoke detectors in each room\n\nWould you like to know about neighborhood amenities or policies?", isUser: false, delay: 2500 },
      { text: "Thank you for using LEASAP! Feel free to contact us anytime for assistance. Have a great day! 😊", isUser: false, delay: 2000 }
    ],
    safety: [
      { text: "Hello 👋 I'm your LEASAP Assistant.\nTell me what you need, and I'll guide you step by step.", isUser: false, delay: 1500 },
      { text: "How safe is the neighborhood around this apartment?", isUser: true, delay: 2000 },
      { text: "I'll provide you with a comprehensive safety analysis of the neighborhood.\n\n🛡️ **Safety Overview:**\n• Overall Safety Score: 8.5/10 (Very Safe)\n• Crime Rate: 15% below city average\n• Walk Score: 92/100 (Walker's Paradise)\n• Transit Score: 88/100 (Excellent)\n\n📊 **Crime Statistics (Last 6 months):**\n• Violent Crime: 2 incidents (0.3 per 1,000 residents)\n• Property Crime: 8 incidents (1.2 per 1,000 residents)\n• Theft: 5 incidents\n• Vandalism: 3 incidents\n\nWhat specific safety concerns do you have?", isUser: false, delay: 2500 },
      { text: "Is it safe to walk around at night?", isUser: true, delay: 1500 },
      { text: "Yes, the area is generally safe for nighttime walking, but here are the details:\n\n🌙 **Nighttime Safety (6 PM - 6 AM):**\n• Safety Rating: 7.5/10\n• Well-lit streets: 95% coverage\n• Police patrol frequency: Every 2-3 hours\n• Emergency response time: 4-6 minutes\n\n✅ **Safe Areas Nearby:**\n• Main Street (0.2 miles) - Well-lit, busy\n• Central Park (0.3 miles) - Security patrols\n• Shopping district (0.4 miles) - 24/7 activity\n\n⚠️ **Areas to Avoid at Night:**\n• Industrial zone (0.8 miles away)\n• Unlit side streets after 11 PM\n\n🚨 **Safety Tips:**\n• Use main streets when possible\n• Walk with others when possible\n• Keep phone charged and accessible\n• Trust your instincts\n\nWould you like information about local emergency services?", isUser: false, delay: 3000 },
      { text: "Thank you for using LEASAP! Feel free to contact us anytime for assistance. Have a great day! 😊", isUser: false, delay: 2000 }
    ],
    application: [
      { text: "Hello 👋 I'm your LEASAP Assistant.\nTell me what you need, and I'll guide you step by step.", isUser: false, delay: 1500 },
      { text: "I'd like to apply for this apartment. Can you help me with the application?", isUser: true, delay: 2000 },
      { text: "Absolutely! I'll guide you through the application process step by step.\n\n📋 **Application Requirements:**\n• Government-issued ID\n• Proof of income (last 2 pay stubs)\n• Bank statements (last 3 months)\n• Employment verification\n• References (2 personal, 1 professional)\n• Credit check authorization\n• Pet documentation (if applicable)\n\n💰 **Fees:**\n• Application fee: $50 (non-refundable)\n• Security deposit: $2,400 (1 month rent)\n• First month rent: $2,400\n\nLet's start with your personal information. What's your full name?", isUser: false, delay: 2500 },
      { text: "John Smith", isUser: true, delay: 1500 },
      { text: "Great! I've entered John Smith.\n\n📝 **Personal Information:**\n✅ Full Name: John Smith\n\nNext, I need your contact information:\n• Phone number\n• Email address\n• Current address\n• Emergency contact name and phone\n\nWhat's your phone number?", isUser: false, delay: 1500 },
      { text: "(555) 123-4567", isUser: true, delay: 1200 },
      { text: "Perfect! I've added your phone number.\n\n📱 **Contact Information:**\n✅ Name: John Smith\n✅ Phone: (555) 123-4567\n\nNow I need your email address and current address to continue the application.\n\nWhat's your email address?", isUser: false, delay: 1500 },
      { text: "john.smith@email.com", isUser: true, delay: 1200 },
      { text: "Excellent! I've captured your email.\n\n📧 **Updated Contact Info:**\n✅ Name: John Smith\n✅ Phone: (555) 123-4567\n✅ Email: john.smith@email.com\n\nNow I need your current address and then we'll move on to income verification.\n\nWhat's your current address?", isUser: false, delay: 1500 },
      { text: "456 Oak Street, Apt 2B, City, State 12345", isUser: true, delay: 2000 },
      { text: "Perfect! I've completed the personal information section.\n\n📋 **Application Progress:**\n✅ Personal Information: Complete\n⏳ Income Verification: Pending\n⏳ References: Pending\n⏳ Documentation: Pending\n\nNext, I'll help you upload your income documents. You can either:\n• Take photos of your pay stubs\n• Upload PDF files\n• Email them to applications@leasap.com\n\nWhich method would you prefer?", isUser: false, delay: 2000 },
      { text: "Thank you for using LEASAP! Feel free to contact us anytime for assistance. Have a   great day! 😊", isUser: false, delay: 2000 }
    ]
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const scrollHeight = chatContainerRef.current.scrollHeight;
      const height = chatContainerRef.current.clientHeight;
      const maxScrollTop = scrollHeight - height;
      chatContainerRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Reset chat when feature changes
    setMessages([]);
    setCurrentMessageIndex(0);
    setIsTyping(false);
    setChatPaused(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [activeFeature]);

  useEffect(() => {
    if (currentMessageIndex < chatScripts[activeFeature].length && !chatPaused) {
      const currentMessage = chatScripts[activeFeature][currentMessageIndex];
      
      // Show typing indicator if message has typing property
      if (currentMessage.typing) {
        setIsTyping(true);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, currentMessage.typing);
      }

      const timer = setTimeout(() => {
        setMessages(prev => [...prev, currentMessage]);
        setCurrentMessageIndex(prev => prev + 1);
        setIsTyping(false);
      }, currentMessage.delay);

      return () => clearTimeout(timer);
    }
  }, [currentMessageIndex, activeFeature, chatPaused]);

  useEffect(() => {
    const element = statsRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!statsStarted) return;

    const duration = 2000;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setStatsValues({
        satisfaction: Math.round(95 * progress),
        availability: Math.round(24 * progress),
      });

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [statsStarted]);

  // Auto-restart chat after completion
  useEffect(() => {
    if (currentMessageIndex >= chatScripts[activeFeature].length && !chatPaused) {
      const restartTimer = setTimeout(() => {
        setMessages([]);
        setCurrentMessageIndex(0);
        setIsTyping(false);
      }, 8000); // Wait 8 seconds before restarting

      return () => clearTimeout(restartTimer);
    }
  }, [currentMessageIndex, activeFeature, chatPaused]);

  const resetChat = () => {
    setMessages([]);
    setCurrentMessageIndex(0);
  };

  return (
    <section id="ai-tools" className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-8 sm:mb-12 md:mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={itemVariants}
        >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-4 sm:mb-6">
                AI ChatBot That
                <span className="text-gold block">Never Sleeps</span>
              </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Experience our AI-powered chatbot in action. Click on any feature below to see how it handles different scenarios 24/7.
              </p>
            </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-start">
          {/* Left Column - Feature Tabs */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-navy mb-4 sm:mb-6">Try Our AI Features</h3>
            
            {/* Feature Tabs */}
            <motion.div
              className="grid grid-cols-1 gap-3 sm:gap-4"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              {features.map((feature, index) => (
                <motion.button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-300 text-left ${
                    activeFeature === feature.id
                      ? 'border-gold bg-gold/10 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gold/50 hover:shadow-md'
                  }`}
                  variants={itemVariants}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${feature.color} ${
                      activeFeature === feature.id ? 'scale-110' : ''
                    } transition-transform duration-300`}>
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-navy text-base sm:text-lg">{feature.title}</h4>
                      <p className="text-gray-600 text-xs sm:text-sm">{feature.description}</p>
                    </div>
                    {activeFeature === feature.id && (
                      <div className="ml-auto flex-shrink-0">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gold rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {/* Stats */}
            <motion.div
              ref={statsRef}
              className="bg-gradient-to-r from-navy to-navy/90 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={itemVariants}
            >
              <h4 className="font-bold mb-3 sm:mb-4 text-center text-base sm:text-lg">
                ChatBot Performance
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gold">
                    {statsStarted ? `${statsValues.satisfaction}%` : "95%"}
                  </div>
                  <div className="text-white/80 text-xs sm:text-sm mt-1">
                    Customer Satisfaction
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gold">
                    {statsStarted ? `${statsValues.availability}/7` : "24/7"}
                  </div>
                  <div className="text-white/80 text-xs sm:text-sm mt-1">Availability</div>
                </div>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={itemVariants}
              className="mt-4 sm:mt-0"
            >
              <Link to="/book-demo" className="inline-block w-full">
              <Button variant="luxury" size="lg" className="w-full text-base sm:text-lg py-3 sm:py-4">
                <MessageCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Get Your ChatBot Today
              </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right Column - Interactive Chat Demo */}
          <div className="lg:sticky lg:top-8 w-full">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={itemVariants}
            >
              <Card className="shadow-xl sm:shadow-2xl border-0 overflow-hidden w-full">
              <CardHeader className="bg-gradient-to-r from-navy to-navy/90 text-white p-3 sm:p-6">
                <CardTitle className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-navy" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-base sm:text-lg font-bold block truncate">LEASAP AI Assistant</span>
                    <div className="text-green-300 text-xs sm:text-sm flex items-center">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-1.5 sm:mr-2 animate-pulse"></div>
                      Online
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* WhatsApp Style Chat Container */}
                <div className="bg-[#111b21] rounded-b-lg overflow-hidden">
                  {/* Chat Area */}
                  <div 
                    ref={chatContainerRef}
                    className="h-[20rem] xs:h-[24rem] sm:h-[28rem] md:h-[32rem] bg-gradient-to-br from-[#0b141a] to-[#111b21] overflow-y-auto overflow-x-hidden no-scrollbar p-2 xs:p-3 sm:p-4 space-y-2 sm:space-y-3"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%231a1a1a' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`
                    }}
                  >
                    {/* Chat Messages */}
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.isUser ? "justify-end" : "justify-start"} animate-fade-in`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[80%] rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg break-words ${
                            message.isUser
                              ? "bg-[#005c4b] text-white rounded-br-md"
                              : "bg-[#202c33] text-white rounded-bl-md border border-gray-600/30"
                          }`}
                          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                        >
                          <div className="text-[10px] xs:text-xs leading-relaxed break-words" style={{ overflowWrap: 'anywhere', wordWrap: 'break-word', wordBreak: 'break-word', hyphens: 'auto' }}>
                            {message.text.split('\n').map((line, lineIndex) => (
                              <div key={lineIndex} className={`${lineIndex > 0 ? "mt-1" : ""} break-words`}>
                                {line.split(' ').map((word, wordIndex) => {
                                  // Highlight emojis and special characters
                                  if (word.match(/[🔧📋⚡👨‍🔧📅✅⏳📝📱📧🏠🐕🏢🔒🛡️📊🌙🚨💰📋]/)) {
                                    return (
                                      <span key={wordIndex} className="text-gold mr-1 inline-block">
                                        {word}
                                      </span>
                                    );
                                  }
                                  // Highlight prices
                                  if (word.match(/\$\d+/)) {
                                    return (
                                      <span key={wordIndex} className="text-green-400 font-semibold mr-1 inline-block">
                                        {word}
                                      </span>
                                    );
                                  }
                                  return <span key={wordIndex} className="mr-1 inline-block">{word}</span>;
                                })}
                              </div>
                            ))}
                          </div>
                          <div className={`text-[9px] xs:text-[10px] mt-0.5 sm:mt-1 text-right ${
                            message.isUser ? "text-[#99b8b1]" : "text-gray-400"
                          }`}>
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {message.isUser && <span className="ml-1">✓✓</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex justify-start animate-fade-in">
                        <div className="bg-[#202c33] rounded-xl sm:rounded-2xl rounded-bl-md px-2.5 py-1.5 sm:px-3 sm:py-2 border border-gray-600/30">
                          <div className="flex space-x-1.5 sm:space-x-2 items-center">
                            <div className="flex space-x-0.5 sm:space-x-1">
                              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-gold text-[10px] xs:text-xs ml-0.5 sm:ml-1 font-medium">AI is typing...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="bg-[#202c33] px-2 sm:px-3 py-1.5 sm:py-2 flex items-center space-x-1.5 sm:space-x-2 border-t border-gray-700">
                    <div className="hidden xs:flex space-x-1">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2a3942] flex items-center justify-center hover:bg-[#374248] transition-colors cursor-pointer">
                        <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-300" />
                      </div>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2a3942] flex items-center justify-center hover:bg-[#374248] transition-colors cursor-pointer">
                        <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-300" />
                      </div>
                    </div>
                    <div className="flex-1 bg-[#2a3942] rounded-2xl sm:rounded-3xl px-2.5 sm:px-3 py-1.5 sm:py-2 border border-transparent hover:border-gray-600 transition-colors">
                      <p className="text-gray-400 text-[10px] xs:text-xs">Message</p>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetChat}
                        className="text-gray-400 hover:text-gold text-[10px] xs:text-xs bg-[#2a3942] hover:bg-[#374248] px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg h-7 sm:h-8"
                      >
                        Restart
                      </Button>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gold to-yellow-400 rounded-full flex items-center justify-center hover:from-yellow-400 hover:to-gold transition-all cursor-pointer shadow-lg hover:scale-105 flex-shrink-0">
                        <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-navy" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatBotSection;
