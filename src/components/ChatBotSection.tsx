import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User,
  Sparkles,
  TrendingUp,
  Users,
  Home
} from "lucide-react";

const ChatBotSection = () => {
  const [messages, setMessages] = useState([
    {
      type: "bot",
      message: "Hi! I'm your AI real estate assistant. How can I help you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");

  const quickQuestions = [
    "Find 3-bedroom homes under $400k",
    "What's the market like in downtown?",
    "Schedule a property viewing",
    "Calculate mortgage payments"
  ];

  const features = [
    {
      icon: Sparkles,
      title: "Natural Language",
      description: "Understands complex queries in plain English"
    },
    {
      icon: TrendingUp,
      title: "Lead Qualification",
      description: "Automatically scores and qualifies potential leads"
    },
    {
      icon: Users,
      title: "24/7 Availability",
      description: "Never miss a lead, even outside business hours"
    },
    {
      icon: Home,
      title: "Property Matching",
      description: "AI-powered property recommendations based on preferences"
    }
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { type: "user", message: inputValue }]);
    
    // Simulate bot response
    setTimeout(() => {
      const responses = [
        "I found 12 properties matching your criteria. Would you like to see the top 3?",
        "Based on current market data, the average price in that area is $425,000. I can show you available properties.",
        "I've scheduled a viewing for tomorrow at 2 PM. You'll receive a confirmation email shortly.",
        "For a $400k home with 20% down, your monthly payment would be approximately $1,847. Want to see properties in this range?"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { type: "bot", message: randomResponse }]);
    }, 1000);

    setInputValue("");
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

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
                Our advanced AI chatbot handles customer inquiries 24/7, qualifies leads, 
                and provides instant property information. It's like having your best 
                agent working around the clock.
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
              <h4 className="font-bold text-navy mb-4 text-center">ChatBot Performance</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">95%</div>
                  <div className="text-gray-600 text-sm">Customer Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">3x</div>
                  <div className="text-gray-600 text-sm">Lead Generation</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">24/7</div>
                  <div className="text-gray-600 text-sm">Availability</div>
                </div>
              </div>
            </div>

            <Button variant="luxury" size="lg" className="w-full">
              <MessageCircle className="mr-2 h-5 w-5" />
              Get Your ChatBot Today
            </Button>
          </div>

          {/* Right Column - Live Demo */}
          <div className="lg:sticky lg:top-8">
            <Card className="shadow-luxury border-0">
              <CardHeader className="bg-luxury-gradient text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-6 w-6" />
                  <span>Live AI ChatBot Demo</span>
                  <div className="ml-auto w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Chat Messages */}
                <div className="h-80 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-lg ${
                        msg.type === "user"
                          ? "bg-navy text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        <div className="flex items-start space-x-2">
                          {msg.type === "bot" && (
                            <Bot className="h-4 w-4 mt-1 text-gold" />
                          )}
                          {msg.type === "user" && (
                            <User className="h-4 w-4 mt-1" />
                          )}
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Questions */}
                <div className="px-4 py-2 border-t">
                  <p className="text-sm text-gray-600 mb-2">Try asking:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickQuestion(question)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 rounded-lg p-2 text-left transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type your message..."
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      size="sm"
                      variant="gold"
                      disabled={!inputValue.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
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