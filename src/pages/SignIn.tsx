import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Home } from "lucide-react";

const API_BASE = "https://leasing-copilot-supabase.onrender.com";

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
      console.log("data fetched:",data)
      console.log("url fetched:",data.auth_link)
      if (data.auth_link) localStorage.setItem("auth_link", data.auth_link);
      if (data.access_token) localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      if (data.realtor_id) localStorage.setItem("realtor_id", data.realtor_id);

      toast({
        title: "Login successful",
        description: `Welcome back, Realtor ID: ${data.user?.realtor_id || "Unknown"}`,
      });

      navigate("/UploadPage");
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
              Elite<span className="text-gold">Realty AI</span>
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
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white/60 text-sm">
                Don’t have an account?{" "}
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
            <div>✓ AI ChatBot 24/7</div>
            <div>✓ AI CallBot Support</div>
            <div>✓ Lead Management</div>
            <div>✓ Property Search AI</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
