/**
 * HeroSection Component
 * 
 * Main hero section for the landing page. Features:
 * - Animated chatbot conversation demonstration
 * - Call-to-action buttons
 * - Key feature highlights
 * - Responsive design with gradient backgrounds
 * 
 * The chatbot conversation auto-plays to demonstrate the platform's
 * AI capabilities in a realistic scenario.
 * 
 * @module components/HeroSection
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, TrendingUp, Users, Award, Bot, User, MoreVertical, Search, Paperclip, Mic } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { Link } from "react-router-dom";

const HeroSection = () => {
  // Chat animation state
  const [messages, setMessages] = useState([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  /**
   * Predefined chat script for demonstration
   * 
   * Simulates a realistic conversation between a user and the AI assistant,
   * showcasing the platform's property search and booking capabilities.
   */
  const chatScript = [
    { text: "Hello 👋 I'm your LEASAP Assistant. I work with property managers to help you find the perfect home.\nTell me what you're looking for, and I'll guide you step by step.", isUser: false, delay: 1500 },
    { text: "I am moving to Chicago next month. Looking for a 1 bedroom apartment under $2400", isUser: true, delay: 2000 },
    { text: "Got it ✅ 1-bedroom in Chicago, budget under $2400.\nTo narrow things down:\n\n1. Do you need it to be pet-friendly? 🐶🐱\n2. Any must-have amenities (gym, parking, in-unit laundry)?\n3. Do you want to be closer to downtown or suburbs?", isUser: false, delay: 2500 },
    { text: "Yes i have a dog. Gym + in-unit Laundry are musts. Closer to downtown is preferred", isUser: true, delay: 2000 },
    { text: "Perfect. I found 3 strong options in popular downtown buildings:\n\n🔹 Option 1: NEMA Chicago (South Loop)\nUnit: 1BR, 1BA, $2200/month\nBuilding: 76-story luxury high-rise 🏢\nAmenities: 70,000 sq ft fitness center, coworking lounge, rooftop pool, pet spa\nCommute: 12 mins walk to The Loop\nNeighborhood vibe: Active, close to Grant Park and Lake Michigan 🌳\n\n🔹 Option 2: 500 Lake Shore Drive (Streeterville)\nUnit: 1BR, 1BA, $2295/month\nBuilding: Waterfront tower with stunning skyline + lake views 🌊\nAmenities: 24/7 doorman, business center, rooftop terrace\nPet Policy: Cats + small dogs allowed\nCommute: 8 mins bus to The Loop\n\n🔹 Option 3: Landmark West Loop\nUnit: 1BR, 1BA, $2150/month\nBuilding: Trendy mid-rise, popular with young professionals\nAmenities: Fitness center, rooftop lounge, game room\nNeighborhood vibe: Foodie hotspot, walkable, lively 🍕\n\n💡 Tip: West Loop units usually rent out within 2 weeks due to high demand.\nWould you like me to:\n\n1. Compare these options side-by-side 📊\n2. Show unit & building pictures 📸\n3. Or schedule in-person/virtual tours 📅?", isUser: false, delay: 4000 },
    { text: "Compare side by side", isUser: true, delay: 1500 },
    { text: "| Building           | Rent  | Pets              | Commute      | Top Amenity         | Vibe                |\n| ------------------ | ----- | ----------------- | ------------ | ------------------- | ------------------- |\n| NEMA Chicago       | $2250 | Dogs + Cats       | 12 mins walk | Rooftop pool + gym  | Luxury, active      |\n| 500 Lake Shore     | $2350 | Cats + small dogs | 8 mins bus   | Lake views, doorman | Waterfront, upscale |\n| Landmark West Loop | $2180 | Dogs + Cats       | 15 mins walk | Rooftop lounge      | Trendy, foodie      |\n\n👉 Based on your dog + gym + downtown preference, I'd recommend NEMA Chicago.\n\nWould you like to book a tour for NEMA Chicago?\nIn-person visit 📍\nOr virtual video tour 💻\n\nAvailable slots this week:\nThursday 6 PM\nSaturday 11 AM\nSunday 2 PM", isUser: false, delay: 3500 },
    { text: "Yes Saturday 11am works", isUser: true, delay: 1500 },
    { text: "✅ Great! I've scheduled your NEMA Chicago tour for Saturday 11 AM.\nYou'll get a confirmation email + SMS reminders.\nAfter your tour, I can help you:\nStart your rental application 📝\nUpload docs (ID, pay stubs, pet vaccination papers) securely 🔐\nReview the lease contract (I'll highlight hidden fees, renewal rules, etc).\n\nWould you like me to pre-check application requirements now?", isUser: false, delay: 3000 },
    { text: "No thanks", isUser: true, delay: 1000 },
    { text: "Thank you for using LEASAP! Feel free to contact us anytime for assistance. Have a great day! 😊", isUser: false, delay: 1000 }
  ];

  /**
   * Scrolls the chat container to the bottom
   * 
   * Ensures the latest message is always visible when new messages are added.
   */
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const scrollHeight = chatContainerRef.current.scrollHeight;
      const height = chatContainerRef.current.clientHeight;
      const maxScrollTop = scrollHeight - height;
      chatContainerRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }
  };

  /**
   * Effect: Auto-scroll when messages change
   * 
   * Automatically scrolls to bottom whenever new messages are added to the chat.
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Effect: Animate chat messages
   * 
   * Sequentially adds messages from the chat script with delays to create
   * a realistic conversation flow. Cleans up timers on unmount.
   */
  useEffect(() => {
    if (currentMessageIndex < chatScript.length) {
      const currentMessage = chatScript[currentMessageIndex];
      const timer = setTimeout(() => {
        setMessages(prev => [...prev, currentMessage]);
        setCurrentMessageIndex(prev => prev + 1);
      }, currentMessage.delay);

      // Cleanup timer on unmount or when message index changes
      return () => clearTimeout(timer);
    }
  }, [currentMessageIndex]);

  /**
   * Resets the chat animation
   * 
   * Clears all messages and resets to the beginning of the script.
   * Useful for replaying the demonstration.
   */
  const resetChat = () => {
    setMessages([]);
    setCurrentMessageIndex(0);
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-hero-gradient" />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-navy/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Main Content */}
          <div className="text-white space-y-6 animate-slide-up">
            <div className="space-y-4">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium border border-white/20">
                <Award className="mr-2 h-4 w-4 text-gold" />
                #1 AI-Powered Real Estate Services
              </div>
              
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                Revolutionize Your
                <span className="text-gold block bg-gradient-to-r from-gold to-yellow-200 bg-clip-text text-transparent">
                  Real Estate Business
                </span>
                with AI
              </h1>
              
              <p className="text-lg lg:text-xl text-white/90 max-w-2xl leading-relaxed">
                Experience the future of real estate with our AI-powered chatbot and callbot. 
                Capture leads 24/7, provide instant property information, and close deals faster 
                than ever before.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="gold" 
                size="lg" 
                className="text-lg px-6 py-3 font-semibold hover:scale-105 transition-transform duration-200"
                onClick={() => {
                  const element = document.getElementById('ai-tools');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                Experience the Results
              </Button>
              <Link to="/book-demo">
                <Button 
                  variant="premium" 
                  size="lg" 
                  className="text-lg px-6 py-3 font-semibold border-2 border-gold hover:scale-105 transition-transform duration-200 w-full sm:w-auto"
                >
                  Schedule Demo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="text-center p-3 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="text-2xl font-bold text-gold">24/7</div>
                <div className="text-white/80 text-xs">AI Availability</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="text-2xl font-bold text-gold">25-30%</div>
                <div className="text-white/80 text-xs">Lead Conversion</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="text-2xl font-bold text-gold">500+</div>
                <div className="text-white/80 text-xs">Happy Realtors</div>
              </div>
            </div>
          </div>

          {/* Right Column - Premium WhatsApp Style Chat */}
          <div className="relative animate-float">
            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-2 shadow-2xl border border-white/20 relative overflow-hidden">
              {/* WhatsApp Chat Container */}
              <div className="bg-[#111b21] rounded-2xl overflow-hidden shadow-2xl border border-gray-600">
                {/* WhatsApp Header */}
                <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-gold to-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                        <Bot className="h-5 w-5 text-[#111b21]" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#202c33]"></div>
                    </div>
                    <div>
                      <div className="text-white font-semibold">Leasap Property Assistant</div>
                      <div className="text-green-400 text-xs flex items-center">
                        {/* <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div> */}
                        Online 
                        {/* • Typing... */}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Search className="h-4 w-4 text-gray-300 hover:text-white cursor-pointer transition-colors" />
                    <MoreVertical className="h-4 w-4 text-gray-300 hover:text-white cursor-pointer transition-colors" />
                  </div>
                </div>

                {/* WhatsApp Chat Area */}
                <div 
                  ref={chatContainerRef}
                  className="h-72 bg-[#0b141a] bg-gradient-to-br from-[#0b141a] to-[#111b21] overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-[#374248] scrollbar-track-[#202c33]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%231a1a1a' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`
                  }}
                >
                  {/* Welcome Message */}
                  <div className="flex justify-center mb-3">
                    <div className="bg-[#182229] rounded-lg px-3 py-1 shadow-sm">
                      <span className="text-gray-300 text-xs">Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* System Welcome */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-gradient-to-r from-[#182229] to-[#202c33] rounded-xl px-4 py-3 max-w-sm border border-gold/30 shadow-lg">
                      <p className="text-gray-300 text-sm text-center leading-relaxed">
                        <span className="text-gold font-semibold">🤖 LEASAP AI Assistant</span><br/>
                        <span className="text-gold">Connected & Ready to Help!</span>
                      </p>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.isUser ? "justify-end" : "justify-start"} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-lg ${
                          message.isUser
                            ? "bg-[#005c4b] text-white rounded-br-md"
                            : "bg-[#202c33] text-white rounded-bl-md border border-gray-600/30"
                        }`}
                      >
                        <div className="text-xs leading-relaxed" style={{ overflowWrap: 'break-word', wordWrap: 'break-word' }}>
                          {message.text.split('\n').map((line, lineIndex) => {
                            // Handle table formatting
                            if (line.includes('|') && line.includes('Building')) {
                              return (
                                <div key={lineIndex} className="overflow-x-auto my-2 -mx-1">
                                  <table className="w-full text-xs border-collapse min-w-full">
                                    <thead>
                                      <tr className="border-b border-gray-500">
                                        {line.split('|').filter(cell => cell.trim()).map((header, headerIndex) => (
                                          <th key={headerIndex} className="text-left py-1 px-1 font-semibold text-gold whitespace-nowrap">
                                            {header.trim()}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                  </table>
                                </div>
                              );
                            }
                            // Handle table data rows
                            if (line.includes('|') && !line.includes('---')) {
                              return (
                                <div key={lineIndex} className="overflow-x-auto my-1 -mx-1">
                                  <table className="w-full text-xs border-collapse min-w-full">
                                    <tbody>
                                      <tr className="border-b border-gray-600/30">
                                        {line.split('|').filter(cell => cell.trim()).map((cell, cellIndex) => (
                                          <td key={cellIndex} className="py-1 px-1 text-gray-200 whitespace-nowrap">
                                            {cell.trim()}
                                          </td>
                                        ))}
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              );
                            }
                            // Handle separator lines
                            if (line.includes('---')) {
                              return <div key={lineIndex} className="my-2 border-b border-gray-600/30"></div>;
                            }
                            // Handle regular lines with emojis and formatting
                            return (
                              <div key={lineIndex} className={lineIndex > 0 ? "mt-2" : ""}>
                                {line.split(' ').map((word, wordIndex) => {
                                  // Highlight emojis and special characters
                                  if (word.match(/[🔹💡✅👋🐶🐱🏢🌊🍕📊📸📅📍💻📝🔐]/)) {
                                    return (
                                      <span key={wordIndex} className="text-gold mr-1">
                                        {word}
                                      </span>
                                    );
                                  }
                                  // Highlight prices
                                  if (word.match(/\$\d+/)) {
                                    return (
                                      <span key={wordIndex} className="text-green-400 font-semibold mr-1">
                                        {word}
                                      </span>
                                    );
                                  }
                                  // Highlight building names
                                  if (word.match(/^(NEMA|500|Landmark)/)) {
                                    return (
                                      <span key={wordIndex} className="text-gold font-semibold mr-1">
                                        {word}
                                      </span>
                                    );
                                  }
                                  return <span key={wordIndex} className="mr-1">{word}</span>;
                                })}
                              </div>
                            );
                          })}
                        </div>
                        <div className={`text-xs mt-2 text-right ${
                          message.isUser ? "text-[#99b8b1]" : "text-gray-400"
                        }`}>
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {message.isUser && <span className="ml-1">✓✓</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {currentMessageIndex < chatScript.length && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="bg-[#202c33] rounded-2xl rounded-bl-md px-3 py-2 border border-gray-600/30">
                        <div className="flex space-x-2 items-center">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-gray-400 text-xs ml-1">AI is typing...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* WhatsApp Input Area */}
                <div className="bg-[#202c33] px-3 py-2 flex items-center space-x-2 border-t border-gray-700">
                  <div className="flex space-x-1">
                    <div className="w-8 h-8 rounded-full bg-[#2a3942] flex items-center justify-center hover:bg-[#374248] transition-colors cursor-pointer">
                      <Paperclip className="h-4 w-4 text-gray-300" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#2a3942] flex items-center justify-center hover:bg-[#374248] transition-colors cursor-pointer">
                      <Mic className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                  <div className="flex-1 bg-[#2a3942] rounded-3xl px-3 py-1 border border-transparent hover:border-gray-600 transition-colors">
                    <p className="text-gray-400 text-xs">Message</p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetChat}
                      className="text-gray-400 hover:text-gold text-xs bg-[#2a3942] hover:bg-[#374248] px-2 rounded-lg"
                    >
                      Restart
                    </Button>
                    <div className="w-10 h-10 bg-gradient-to-br from-gold to-yellow-400 rounded-full flex items-center justify-center hover:from-yellow-400 hover:to-gold transition-all cursor-pointer shadow-lg hover:scale-105">
                      <MessageCircle className="h-4 w-4 text-[#111b21]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Call Demo */}
              <div className="mt-3 bg-gradient-to-r from-[#005c4b] to-[#202c33] rounded-xl p-3 border border-gold/40 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-gold to-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                      <Phone className="h-4 w-4 text-[#111b21]" />
                    </div>
                    <div>
                      <span className="text-white font-semibold text-sm">AI Voice Assistant</span>
                      <div className="text-green-300 text-xs">Live call simulation</div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-3 bg-gold rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-4 bg-gold rounded-full animate-pulse" style={{ animationDelay: '100ms' }}></div>
                    <div className="w-1.5 h-2 bg-gold rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                    <div className="w-1.5 h-3.5 bg-gold rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
                <p className="text-white/90 text-xs bg-black/20 rounded-lg p-2 border border-gold/20">
                  "Hello! I can help you schedule viewings, answer property questions, 
                  and connect you with the right agent in real-time."
                </p>
              </div>

              {/* Enhanced Action Button */}
              <Button 
                className="w-full mt-3 bg-gradient-to-r from-gold to-yellow-500 hover:from-yellow-400 hover:to-gold text-[#111b21] font-bold py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-xl border-2 border-gold/50 text-sm"
                onClick={() => {
                  const element = document.getElementById('ai-tools');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Experience the Results
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-24 right-8 w-16 h-16 bg-gold/20 rounded-full animate-float delay-1000 backdrop-blur-sm"></div>
      <div className="absolute bottom-32 left-8 w-12 h-12 bg-white/10 rounded-full animate-float delay-2000 backdrop-blur-sm"></div>
      <div className="absolute top-36 left-16 w-10 h-10 bg-gold/30 rounded-full animate-float delay-1500 backdrop-blur-sm"></div>
      
    </section>
  );
};

export default HeroSection;