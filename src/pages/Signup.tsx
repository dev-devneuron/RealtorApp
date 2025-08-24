// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { useToast } from "@/hooks/use-toast";
// import { supabase } from "@/integrations/supabase/client";
// import { Link, useNavigate } from "react-router-dom";
// import { ArrowLeft, Home } from "lucide-react";

// const Signup = () => {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: ""
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const { toast } = useToast();
//   const navigate = useNavigate();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);

//     try {
//       // Sign up the user (Supabase will send a confirmation email if enabled)
//       const { error: authError } = await supabase.auth.signUp({
//         email: formData.email,
//         password: formData.password,
//         options: {
//           emailRedirectTo: `${window.location.origin}/`,
//         },
//       });

//       if (authError) {
//         // If the user already exists, attempt to resend the confirmation email
//         // @ts-ignore Supabase error may include a status code
//         if ((authError as any)?.status === 422) {
//           const { error: resendError } = await supabase.auth.resend({
//             type: 'signup',
//             email: formData.email,
//             options: { emailRedirectTo: `${window.location.origin}/` },
//           });
//           if (resendError) throw resendError;

//           toast({
//             title: "Confirmation email re-sent",
//             description: "Please check your inbox to confirm your email.",
//           });

//           // Best-effort notifications (non-blocking)
//           await supabase.functions.invoke('send-signup-confirmation', {
//             body: { name: formData.name, email: formData.email }
//           }).catch(() => {});
//           await supabase.functions.invoke('send-signup-confirmation', {
//             body: { name: formData.name, email: formData.email, adminNotification: true }
//           }).catch(() => {});

//           setTimeout(() => {
//             navigate('/dashboard');
//           }, 2000);

//           return;
//         }
//         throw authError;
//       }

//       // Success path - Supabase has sent a confirmation email automatically
//       const { error: userEmailError } = await supabase.functions.invoke('send-signup-confirmation', {
//         body: {
//           name: formData.name,
//           email: formData.email
//         }
//       });

//       const { error: adminEmailError } = await supabase.functions.invoke('send-signup-confirmation', {
//         body: {
//           name: formData.name,
//           email: formData.email,
//           adminNotification: true
//         }
//       });

//       if (userEmailError || adminEmailError) {
//         console.error('Email sending error:', userEmailError || adminEmailError);
//       }

//       toast({
//         title: "Welcome to your free trial!",
//         description: "We sent a confirmation email. Please check your inbox.",
//       });

//       setFormData({ name: "", email: "", password: "" });
      
//       // Redirect to dashboard after 2 seconds
//       setTimeout(() => {
//         navigate('/dashboard');
//       }, 2000);
//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: error.message || "Failed to create account. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center px-4">
//       <div className="w-full max-w-md">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <Link to="/" className="inline-flex items-center space-x-2 text-white hover:text-gold transition-colors mb-6">
//             <ArrowLeft className="h-4 w-4" />
//             <span>Back to Home</span>
//           </Link>
          
//           <div className="flex items-center justify-center space-x-2 mb-4">
//             <div className="bg-accent-gradient p-2 rounded-lg">
//               <Home className="h-6 w-6 text-navy" />
//             </div>
//             <div className="text-xl font-bold text-white">
//               Elite<span className="text-gold">Realty AI</span>
//             </div>
//           </div>
          
//           <h1 className="text-3xl font-bold text-white mb-2">Start Your Free Trial</h1>
//           <p className="text-white/80">Join thousands of realtors using AI to grow their business</p>
//         </div>

//         {/* Signup Form */}
//         <Card className="bg-white/10 backdrop-blur-lg border-white/20">
//           <CardHeader>
//             <CardTitle className="text-white text-center">Create Your Account</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <Input
//                 placeholder="Your Full Name"
//                 value={formData.name}
//                 onChange={(e) => setFormData({...formData, name: e.target.value})}
//                 required
//                 className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
//               />
//               <Input
//                 type="email"
//                 placeholder="Your Email Address"
//                 value={formData.email}
//                 onChange={(e) => setFormData({...formData, email: e.target.value})}
//                 required
//                 className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
//               />
//               <Input
//                 type="password"
//                 placeholder="Create a Password"
//                 value={formData.password}
//                 onChange={(e) => setFormData({...formData, password: e.target.value})}
//                 required
//                 minLength={6}
//                 className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
//               />
//               <Button 
//                 type="submit" 
//                 disabled={isSubmitting} 
//                 className="w-full bg-gold hover:bg-gold/90 text-navy font-semibold py-3"
//               >
//                 {isSubmitting ? "Creating Account..." : "Start Free Trial"}
//               </Button>
//             </form>
            
//             <div className="mt-6 text-center">
//               <p className="text-white/60 text-sm">
//                 Already have an account?{" "}
//                 <Link to="/" className="text-gold hover:underline">
//                   Sign in
//                 </Link>
//               </p>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Features Preview */}
//         <div className="mt-8 text-center">
//           <h3 className="text-white font-semibold mb-4">What you'll get:</h3>
//           <div className="grid grid-cols-2 gap-4 text-sm text-white/80">
//             <div>✓ AI ChatBot 24/7</div>
//             <div>✓ AI CallBot Support</div>
//             <div>✓ Lead Management</div>
//             <div>✓ Property Search AI</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Signup;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("email", formData.email);
      payload.append("contact", formData.contact);
      payload.append("password", formData.password);

      const response = await fetch("https://leasing-copilot-supabase.onrender.com/CreateRealtor", {
        method: "POST",
        body: payload,
        mode: "cors",
        credentials: "omit",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      toast({
        title: "Realtor created successfully!",
        description: "Please authenticate using the link sent to your email.",
      });

      console.log("Response:", data);

      setFormData({ name: "", email: "", contact: "", password: "" });
      navigate("/SignIn");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
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

          <h1 className="text-3xl font-bold text-white mb-2">Start Your Free Trial</h1>
          <p className="text-white/80">Join thousands of realtors using AI to grow their business</p>
        </div>

        {/* Signup Form */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">Create Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Your Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Input
                type="email"
                placeholder="Your Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Input
                type="text"
                placeholder="Your Contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Input
                type="password"
                placeholder="Create a Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gold hover:bg-gold/90 text-navy font-semibold py-3"
              >
                {isSubmitting ? "Creating Account..." : "Start Free Trial"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white/60 text-sm">
                Already have an account?{" "}
                <Link to="/SignIn" className="text-gold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="mt-8 text-center">
          <h3 className="text-white font-semibold mb-4">What you'll get:</h3>
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

export default Signup;
