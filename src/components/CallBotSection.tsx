import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDemo, setCurrentDemo] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const [statsStarted, setStatsStarted] = useState(false);
  const [statsValues, setStatsValues] = useState({
    successRate: 0,
  });

  const demos = [
    {
      title: "Quick Leasing Call: Availability & Tour Scheduling",
      duration: "0:40",
      description: "AI efficiently checks property availability, answers questions, and schedules a tour in a quick conversation.",
      videoFile: "/demo-videos/Quick Leasing Call Availability & Tour Scheduling.mp4"
    },
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

  // Handle demo change - reset audio
  useEffect(() => {
    setIsPlaying(false);
    // Use setTimeout to ensure the audio element is ready after key change
    const timer = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.load();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentDemo]);

  // Handle play/pause state
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      // Check if audio is ready to play
      if (audioRef.current.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing audio:", error);
            console.error("Audio source:", audioRef.current?.src);
            console.error("Ready state:", audioRef.current?.readyState);
            setIsPlaying(false);
          });
        }
      } else {
        // Wait for audio to be ready
        const handleCanPlay = () => {
          if (audioRef.current && isPlaying) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.error("Error playing audio after load:", error);
                setIsPlaying(false);
              });
            }
          }
        };
        audioRef.current.addEventListener('canplay', handleCanPlay);
        audioRef.current.load(); // Force reload if needed
        
        return () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('canplay', handleCanPlay);
          }
        };
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

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

    const duration = 2200;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setStatsValues({
        successRate: Math.round(92 * progress),
      });

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [statsStarted]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto px-3 xs:px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-6 xs:gap-8 sm:gap-10 md:gap-12 items-center">
          {/* Left Column - Demo */}
          <div className="space-y-6 xs:space-y-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={itemVariants}
            >
              <Card className="shadow-luxury border-0">
              <CardHeader className="bg-navy text-white p-3 xs:p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-gold" />
                  <span className="text-sm xs:text-base sm:text-lg">AI CallBot Demo</span>
                  <div className="ml-auto flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-green-400 rounded-full animate-pulse"></div>
                    
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 xs:p-4 sm:p-6">
                {/* Current Demo Display */}
                <div className="mb-4 xs:mb-6">
                  <div className="bg-gray-100 rounded-lg xs:rounded-xl p-3 xs:p-4 sm:p-6 text-center">
                    <div className="flex items-center justify-center mb-3 xs:mb-4">
                      <div className="bg-accent-gradient w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center">
                        <Headphones className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-navy" />
                      </div>
                    </div>
                    
                    <h3 className="text-base xs:text-lg sm:text-xl font-bold text-navy mb-1.5 xs:mb-2">
                      {demos[currentDemo].title}
                    </h3>
                    <p className="text-xs xs:text-sm sm:text-base text-gray-600 mb-3 xs:mb-4">
                      {demos[currentDemo].description}
                    </p>
                    
                    {/* Audio Player (hidden) */}
                    <audio
                      ref={audioRef}
                      key={demos[currentDemo].videoFile}
                      onPlay={() => {
                        console.log("Audio playing:", demos[currentDemo].videoFile);
                        setIsPlaying(true);
                      }}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                      onError={(e) => {
                        const audio = e.currentTarget;
                        console.error("Audio error:", {
                          error: audio.error,
                          code: audio.error?.code,
                          message: audio.error?.message,
                          src: audio.src,
                          networkState: audio.networkState,
                          readyState: audio.readyState
                        });
                        setIsPlaying(false);
                      }}
                      onLoadedData={() => {
                        console.log("Audio loaded successfully:", demos[currentDemo].videoFile);
                      }}
                      onLoadStart={() => {
                        console.log("Audio loading started:", demos[currentDemo].videoFile);
                      }}
                      onCanPlay={() => {
                        console.log("Audio can play:", demos[currentDemo].videoFile);
                      }}
                      preload="auto"
                      className="hidden"
                    >
                      <source src={demos[currentDemo].videoFile} type="audio/mp4" />
                      <source src={demos[currentDemo].videoFile} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>

                    {/* Audio Visualizer */}
                    <div className="flex items-center justify-center space-x-0.5 xs:space-x-1 mb-3 xs:mb-4">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-0.5 xs:w-1 bg-gold rounded-full transition-all duration-300 ${
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
                    <div className="flex items-center justify-center space-x-3 xs:space-x-4">
                      <Button
                        onClick={togglePlay}
                        variant="gold"
                        size="lg"
                        className="rounded-full w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16"
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5 xs:h-6 xs:w-6" />
                        ) : (
                          <Play className="h-5 w-5 xs:h-6 xs:w-6" />
                        )}
                      </Button>
                      <div className="flex items-center space-x-1.5 xs:space-x-2 text-gray-600">
                        <Volume2 className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                        <span className="text-xs xs:text-sm">{demos[currentDemo].duration}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Demo Selection */}
                <div className="space-y-1.5 xs:space-y-2">
                  <p className="text-xs xs:text-sm font-medium text-gray-600 mb-2 xs:mb-3">Choose a demo:</p>
                  {demos.map((demo, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentDemo(index);
                        setIsPlaying(false);
                      }}
                      className={`w-full text-left p-2 xs:p-3 rounded-lg transition-colors ${
                        currentDemo === index
                          ? "bg-navy text-white"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs xs:text-sm sm:text-base truncate pr-2">{demo.title}</span>
                        <span className="text-xs xs:text-sm opacity-70 flex-shrink-0">{demo.duration}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Features */}
          <div className="space-y-4 xs:space-y-6 sm:space-y-8 mt-6 xs:mt-8 lg:mt-0">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={itemVariants}
            >
              <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-3 xs:mb-4 sm:mb-6">
                AI Voice Assistant That
                <span className="text-gold block">Sounds Human</span>
              </h2>
              <p className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-600 mb-4 xs:mb-6 sm:mb-8">
                Our AI callbot handles phone calls with the same professionalism as your 
                best agent. Natural conversations, smart scheduling, and lead qualification 
                all automated for maximum efficiency.
              </p>
            </motion.div>

            {/* Features */}
            <motion.div
              className="space-y-3 xs:space-y-4 sm:space-y-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-2.5 xs:space-x-3 sm:space-x-4"
                  variants={itemVariants}
                >
                  <div className="bg-accent-gradient w-10 h-10 xs:w-12 xs:h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 xs:h-6 xs:w-6 text-navy" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy mb-1 xs:mb-2 text-sm xs:text-base">{feature.title}</h3>
                    <p className="text-gray-600 text-xs xs:text-sm sm:text-base">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Call Stats */}
            <motion.div
              ref={statsRef}
              className="bg-white rounded-lg xs:rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-6 shadow-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={itemVariants}
            >
              <h4 className="font-bold text-navy mb-2 xs:mb-3 sm:mb-4 text-center text-xs xs:text-sm sm:text-base">CallBot Performance</h4>
              <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gold">
                    {statsStarted ? `${statsValues.successRate}%` : "92%"}
                  </div>
                  <div className="text-gray-600 text-[10px] xs:text-xs sm:text-sm">Call Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gold">Realtime</div>
                  <div className="text-gray-600 text-[10px] xs:text-xs sm:text-sm">Response </div>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-col xs:flex-row gap-3 xs:gap-4">
              <Link to="/book-demo" className="flex-1">   
                <Button variant="luxury" size="lg" className="w-full text-xs xs:text-sm sm:text-base">
                  <Phone className="mr-1.5 xs:mr-2 h-4 w-4 xs:h-5 xs:w-5" />
                  Get Your CallBot Companion
                </Button>
              </Link>

              <Link to="/book-demo" className="flex-1">
                <Button variant="premium" size="lg" className="w-full text-xs xs:text-sm sm:text-base">
                  <Mic className="mr-1.5 xs:mr-2 h-4 w-4 xs:h-5 xs:w-5" />
                  Schedule Demo Call
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallBotSection;