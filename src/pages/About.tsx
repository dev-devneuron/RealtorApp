import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Award, Users, Building, TrendingUp, Target, Lightbulb, Zap, Rocket, Shield, Globe, Heart, Sparkles, Linkedin, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const About = () => {
  const stats = [
    { icon: Building, label: "Properties Managed", value: "500+", color: "from-blue-500 to-blue-600" },
    { icon: Users, label: "Happy Clients", value: "500+", color: "from-green-500 to-green-600" },
    { icon: TrendingUp, label: "Years Experience", value: "3+", color: "from-purple-500 to-purple-600" },
    { icon: Zap, label: "Lead Conversion", value: "25-30%", color: "from-amber-500 to-amber-600" },
  ];

  const values = [
    {
      icon: Target,
      title: "Innovation First",
      description: "We constantly push boundaries to deliver cutting-edge AI solutions that transform the real estate industry.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Heart,
      title: "Client Success",
      description: "Your success is our mission. We're committed to helping realtors achieve their goals and grow their business.",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      icon: Shield,
      title: "Reliability",
      description: "Trusted by 500+ realtors. We provide stable, secure, and dependable AI solutions you can count on 24/7.",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: Rocket,
      title: "Growth Focused",
      description: "We're not just a tool—we're your growth partner, helping you scale and succeed in the competitive real estate market.",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const team = [
    {
      name: "Tayyab Tahir",
      role: "CEO & Founder",
      image: "/images/photos/ceo.jpg",
      description: "Tayyab Tahir is the visionary CEO and Founder of Leasap, bringing over 3 years of hands-on experience in the real estate industry. With a deep understanding of the challenges faced by property managers and realtors, Tayyab founded Leasap to revolutionize the industry through AI-powered solutions. His expertise spans property management, client relations, and technology innovation, making him uniquely positioned to bridge the gap between traditional real estate practices and cutting-edge AI technology. Under his leadership, Leasap has grown into a trusted platform that empowers realtors to automate routine tasks, enhance client engagement, and significantly increase lead conversions.",
      linkedin: "https://www.linkedin.com/in/tayyabtahir",
      email: "ttahir@leasap.com"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-28 sm:pb-20 md:pt-32 md:pb-24 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-navy/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-gold/5 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center bg-gold/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium border border-gold/20 mb-6">
              <Sparkles className="mr-2 h-4 w-4 text-gold" />
              About Leasap AI
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-navy mb-6 leading-tight">
              Revolutionizing Real Estate
              <span className="block text-gold bg-gradient-to-r from-gold to-yellow-400 bg-clip-text text-transparent">
                Through AI Innovation
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              We empower realtors with cutting-edge AI technology to automate workflows, 
              enhance client engagement, and drive unprecedented growth in the real estate industry.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-demo">
                <Button variant="luxury" size="lg" className="text-lg px-8 py-6">
                  <Rocket className="mr-2 h-5 w-5" />
                  Schedule a Demo
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-navy text-navy hover:bg-navy hover:text-white">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="text-center p-6 sm:p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="p-0">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${stat.color} mb-4 shadow-lg`}>
                      <stat.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-navy mb-2">{stat.value}</div>
                    <div className="text-gray-600 text-sm sm:text-base font-medium">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center bg-gold/10 rounded-full px-4 py-2 text-sm font-medium text-gold mb-4">
                <Lightbulb className="mr-2 h-4 w-4" />
                Our Story
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy mb-6 leading-tight">
                From Vision to
                <span className="block text-gold">Reality</span>
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p className="text-base sm:text-lg">
                  At Leasap, we empower realtors with cutting-edge AI and real estate expertise to simplify their daily challenges. 
                  Our platform automates client chats, calls, and bookings, helping agents close deals faster, boost leads, 
                  and focus on what they do best: selling homes.
                </p>
                <p className="text-base sm:text-lg">
                  Since our founding, Leasap has evolved from a small real estate venture into a powerful AI-driven platform 
                  built for realtors. What started as a vision to simplify property transactions has grown into a mission to 
                  empower agents with tools that handle client inquiries, schedule visits, and generate actionable market insights.
                </p>
                <p className="text-base sm:text-lg">
                  Today, we partner with realtors across the region, helping them save time, win more clients, and close deals 
                  with confidence. Our AI solutions are trusted by 500+ professionals who rely on us to drive their success.
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop" 
                  alt="Modern real estate office"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-gold p-6 rounded-2xl shadow-xl hidden lg:block">
                <div className="text-4xl font-bold text-navy">500+</div>
                <div className="text-navy/80 text-sm">Happy Realtors</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy mb-4">
              Our Mission & Vision
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Driving innovation and excellence in real estate technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="p-8 sm:p-10 bg-gradient-to-br from-navy to-navy/90 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 h-full">
                <div className="inline-flex p-3 bg-gold/20 rounded-xl mb-6">
                  <Target className="h-6 w-6 text-gold" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">Our Mission</h3>
                <p className="text-white/90 leading-relaxed text-base sm:text-lg">
                  Our mission is to revolutionize the real estate industry by automating the daily challenges faced by realtors, 
                  such as booking property visits, managing endless chats and calls, and handling client queries. Through AI-powered 
                  solutions, we aim to simplify operations, enhance client engagement, and increase lead conversions by 
                  <strong className="text-gold"> 30% or more</strong>.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="p-8 sm:p-10 bg-gradient-to-br from-gold to-amber-500 text-navy border-0 shadow-xl hover:shadow-2xl transition-all duration-300 h-full">
                <div className="inline-flex p-3 bg-navy/20 rounded-xl mb-6">
                  <Globe className="h-6 w-6 text-navy" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">Our Vision</h3>
                <p className="text-navy/90 leading-relaxed text-base sm:text-lg">
                  To be the world's leading AI-powered real estate platform, empowering realtors to sell smarter and faster. 
                  By automating routine tasks, streamlining client communication, and offering data-driven insights, we enable 
                  realtors to focus on relationships and closing deals, setting new standards of transparency, efficiency, and 
                  client satisfaction in global property markets.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
          >
            {values.map((value, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-6 sm:p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white h-full">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${value.gradient} mb-6 shadow-lg`}>
                    <value.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-navy mb-3">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{value.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The visionaries behind Leasap AI
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="p-6 sm:p-8 md:p-10 bg-gradient-to-br from-navy via-navy/95 to-navy text-white border-0 shadow-2xl overflow-hidden relative">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/5 rounded-full blur-2xl -ml-24 -mb-24"></div>
                  
                  <div className="relative z-10 grid md:grid-cols-[200px_1fr] gap-6 md:gap-8 items-start">
                    <div className="mx-auto md:mx-0">
                      <div className="relative">
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl object-cover shadow-2xl border-4 border-gold/30"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-gold p-3 rounded-full shadow-lg">
                          <Award className="h-5 w-5 text-navy" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center md:text-left">
                      <div className="inline-flex items-center bg-gold/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-3">
                        <Sparkles className="mr-2 h-4 w-4 text-gold" />
                        {member.role}
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">{member.name}</h3>
                      <p className="text-white/90 leading-relaxed text-sm sm:text-base mb-6">
                        {member.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        {member.linkedin && (
                          <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm border border-white/20"
                          >
                            <Linkedin className="h-4 w-4 mr-2" />
                            LinkedIn
                          </a>
                        )}
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm border border-white/20"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-navy via-navy/95 to-navy relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join 500+ realtors already using Leasap AI to grow their business and close more deals.
            </p>
            <Link to="/book-demo">
              <Button variant="gold" size="lg" className="text-lg px-8 py-6">
                <Rocket className="mr-2 h-5 w-5" />
                Schedule Your Demo Today
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
