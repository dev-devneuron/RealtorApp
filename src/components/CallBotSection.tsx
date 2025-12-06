import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Phone, 
  Play, 
  Pause, 
  Volume2,
  PhoneCall,
  Clock,
  Calendar,
  CheckCircle,
  Mic,
  Headphones
} from "lucide-react";

const CallBotSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDemo, setCurrentDemo] = useState(0);

  const demos = [
    {
      title: "Book a visit",
      duration: "2:34",
      description: "AI handles a customer asking about property details and scheduling a viewing.",
      videoFile: "/demo-videos/book-visit.mp4"
    },
    {
      title: "Find an Appartment",
      duration: "3:12", 
      description: "AI qualifies a potential buyer and gathers necessary information.",
      videoFile: "/demo-videos/find-apartment.mp4"
    },
    {
      title: "General Queries",
      duration: "1:45",
      description: "AI schedules a property viewing and sends confirmation details.",
      videoFile: "/demo-videos/general-queries.mp4"
    }
  ];

  const features = [
    {
      icon: PhoneCall,
      title: "Natural Conversations",
      description: "Human-like voice interactions that feel completely natural"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Automatically schedules appointments and sends confirmations"
    },
    {
      icon: CheckCircle,
      title: "Lead Qualification",
      description: "Qualifies leads and gathers important customer information"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Never miss a call, even during nights and weekends"
    }
  ];

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
          {/* Left Column - Demo */}
          <div className="space-y-8">
            <Card className="shadow-luxury border-0">
              <CardHeader className="bg-navy text-white">
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-6 w-6 text-gold" />
                  <span>AI CallBot Demo</span>
                  <div className="ml-auto flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Current Demo Display */}
                <div className="mb-6">
                  <div className="bg-gray-100 rounded-xl p-6 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-accent-gradient w-16 h-16 rounded-full flex items-center justify-center">
                        <Headphones className="h-8 w-8 text-navy" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-navy mb-2">
                      {demos[currentDemo].title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {demos[currentDemo].description}
                    </p>
                    
                    {/* Audio Player (hidden) */}
                    <audio
                      key={demos[currentDemo].videoFile}
                      ref={(audio) => {
                        if (audio) {
                          if (isPlaying) {
                            audio.play();
                          } else {
                            audio.pause();
                          }
                        }
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    >
                      <source src={demos[currentDemo].videoFile} type="audio/mp4" />
                    </audio>

                    {/* Audio Visualizer */}
                    <div className="flex items-center justify-center space-x-1 mb-4">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 bg-gold rounded-full transition-all duration-300 ${
                            isPlaying 
                              ? `h-${Math.floor(Math.random() * 8) + 4} animate-pulse` 
                              : 'h-2'
                          }`}
                          style={{
                            animationDelay: `${i * 100}ms`
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center justify-center space-x-4">
                      <Button
                        onClick={togglePlay}
                        variant="gold"
                        size="lg"
                        className="rounded-full w-16 h-16"
                      >
                        {isPlaying ? (
                          <Pause className="h-6 w-6" />
                        ) : (
                          <Play className="h-6 w-6" />
                        )}
                      </Button>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Volume2 className="h-4 w-4" />
                        <span className="text-sm">{demos[currentDemo].duration}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Demo Selection */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 mb-3">Choose a demo:</p>
                  {demos.map((demo, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentDemo(index);
                        setIsPlaying(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        currentDemo === index
                          ? "bg-navy text-white"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{demo.title}</span>
                        <span className="text-sm opacity-70">{demo.duration}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Features */}
          <div className="space-y-6 sm:space-y-8 mt-8 lg:mt-0">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-4 sm:mb-6">
                AI Voice Assistant That
                <span className="text-gold block">Sounds Human</span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
                Our AI callbot handles phone calls with the same professionalism as your 
                best agent. Natural conversations, smart scheduling, and lead qualification 
                all automated for maximum efficiency.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="bg-accent-gradient w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-6 w-6 text-navy" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Call Stats */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-card">
              <h4 className="font-bold text-navy mb-3 sm:mb-4 text-center text-sm sm:text-base">CallBot Performance</h4>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">92%</div>
                  <div className="text-gray-600 text-sm">Call Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">Realtime</div>
                  <div className="text-gray-600 text-sm">Response </div>
                </div>
                {/* <div className="text-center">
                  <div className="text-2xl font-bold text-gold">85%</div>
                  <div className="text-gray-600 text-sm">Lead Conversion</div>
                </div> */}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/book-demo">   
              <Button variant="luxury" size="lg" className="flex-1">
                <Phone className="mr-2 h-5 w-5" />
                Get Your CallBot Companion
              </Button>
              </Link>

              <DemoScheduleModal>
                <Button variant="premium" size="lg" className="flex-1">
                  <Mic className="mr-2 h-5 w-5" />
                  Schedule Demo Call
                </Button>
              </DemoScheduleModal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallBotSection;