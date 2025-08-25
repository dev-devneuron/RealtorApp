import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

const EmailConfirmation = () => {
  const location = useLocation();
  const email = location.state?.email || "your email address";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-900 to-blue-700">
      <Card className="w-full max-w-md bg-gold border-2 border-gold-700 shadow-xl rounded-2xl">
        <CardHeader className="text-center">
          <Mail className="w-12 h-12 mx-auto text-navy-900 mb-3" />
          <CardTitle className="text-2xl font-bold text-navy-900">
            Confirm Your Email
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-navy-900">
            We’ve sent a confirmation link to:
            <span className="block font-semibold text-black">{email}</span>
          </p>
          <p className="text-sm text-navy-900">
            Please check your inbox and click the link to Login to your account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmation;
