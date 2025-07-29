import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import ChatBotSection from "@/components/ChatBotSection";
import CallBotSection from "@/components/CallBotSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <ServicesSection />
      <ChatBotSection />
      <CallBotSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
