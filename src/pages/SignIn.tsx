import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Home, Users, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE = "https://leasing-copilot-mvp.onrender.com";

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userType, setUserType] = useState<"property_manager" | "realtor">("realtor");
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const endpoint = userType === "property_manager" ? "/property-manager-login" : "/login";
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, user_type: userType }),
        credentials: "include",
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Server returned invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Login failed");
      }
      
      console.log("Full login response data:", JSON.stringify(data, null, 2));
      console.log("data.user:", data.user);
      console.log("url fetched:", data.auth_link);
      
      // Store authentication data
      if (data.auth_link) localStorage.setItem("auth_link", data.auth_link);
      if (data.access_token) localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      if (data.realtor_id) localStorage.setItem("realtor_id", data.realtor_id);
      if (data.property_manager_id) localStorage.setItem("property_manager_id", data.property_manager_id);
      if (data.user_type) localStorage.setItem("user_type", data.user_type);
      
      // Store user name and gender for personalized welcome message
      // Check multiple possible locations for the name
      let userNameToStore = null;
      if (data.user?.name) {
        userNameToStore = data.user.name;
        console.log("Found user name in data.user.name:", userNameToStore);
      } else if (data.name) {
        userNameToStore = data.name;
        console.log("Found user name in data.name:", userNameToStore);
      } else if (data.user?.email) {
        // Extract name from email as fallback
        const emailParts = data.user.email.split('@');
        userNameToStore = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
        console.log("Extracting user name from email:", userNameToStore);
      } else if (data.email) {
        const emailParts = data.email.split('@');
        userNameToStore = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
        console.log("Extracting user name from data.email:", userNameToStore);
      }
      
      if (userNameToStore) {
        console.log("Storing user name:", userNameToStore);
        localStorage.setItem("user_name", userNameToStore);
      } else {
        console.warn("Could not find user name in login response. Available keys:", Object.keys(data));
        // Use the email that was entered as a last resort
        if (email && email.includes('@')) {
          const emailName = email.split('@')[0];
          const formattedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          console.log("Using login email as fallback name:", formattedName);
          localStorage.setItem("user_name", formattedName);
        }
      }
      
      if (data.user?.gender) localStorage.setItem("user_gender", data.user.gender);
      // Also store email if available for fallback
      if (data.user?.email || data.email) {
        localStorage.setItem("user_email", data.user?.email || data.email);
      } else if (email) {
        localStorage.setItem("user_email", email);
      }

      const userDisplayName = userType === "property_manager" 
        ? `Property Manager: ${data.user?.name || "Unknown"}`
        : `Realtor ID: ${data.user?.realtor_id || "Unknown"}`;

      toast({
        title: "Login successful",
        description: `Welcome back, ${userDisplayName}`,
      });

      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-white hover:text-gold transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-accent-gradient p-2 rounded-lg">
              <Home className="h-6 w-6 text-navy" />
            </div>
            <div className="text-xl font-bold text-white">
              Leasap
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/80">Sign in to continue to your dashboard</p>
        </div>

        {/* Login Form */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={userType} onValueChange={(value) => setUserType(value as "property_manager" | "realtor")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger value="realtor" className="data-[state=active]:bg-gold data-[state=active]:text-navy">
                  <User className="h-4 w-4 mr-2" />
                  Realtor
                </TabsTrigger>
                <TabsTrigger value="property_manager" className="data-[state=active]:bg-gold data-[state=active]:text-navy">
                  <Users className="h-4 w-4 mr-2" />
                  Property Manager
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="realtor" className="mt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Your Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                  <Input
                    type="password"
                    placeholder="Your Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gold hover:bg-gold/90 text-navy font-semibold py-3"
                  >
                    {isSubmitting ? "Signing in..." : "Sign In as Realtor"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="property_manager" className="mt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Property Manager Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                  <Input
                    type="password"
                    placeholder="Property Manager Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gold hover:bg-gold/90 text-navy font-semibold py-3"
                  >
                    {isSubmitting ? "Signing in..." : "Sign In as Property Manager"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-white/60 text-sm">
                Don't have an account?{" "}
                <Link to="/signup" className="text-gold hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="mt-8 text-center">
          <h3 className="text-white font-semibold mb-4">What you can access:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-white/80">
            {userType === "property_manager" ? (
              <>
                <div>✓ Manage Realtors</div>
                <div>✓ Assign Passwords</div>
                <div>✓ Team Analytics</div>
                <div>✓ Property Portfolio</div>
                <div>✓ AI ChatBot 24/7</div>
                <div>✓ Lead Management</div>
              </>
            ) : (
              <>
                <div>✓ AI ChatBot 24/7</div>
                <div>✓ AI CallBot Support</div>
                <div>✓ Lead Management</div>
                <div>✓ Property Search AI</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
