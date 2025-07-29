import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupRequest {
  name: string;
  email: string;
  adminNotification?: boolean;
  subscriptionType?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, adminNotification, subscriptionType }: SignupRequest = await req.json();

    if (adminNotification) {
      // Send notification to admin
      const notificationType = subscriptionType === "newsletter" ? "Newsletter Subscription" : "New Signup";
      const adminEmailResponse = await resend.emails.send({
        from: "EliteRealty AI <onboarding@resend.dev>",
        to: ["dev.devneuron@gmail.com"],
        subject: `${notificationType} - ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e40af;">New ${notificationType}</h1>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Type:</strong> ${notificationType}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `,
      });
    } else {
      // Send confirmation email to user
      const userEmailResponse = await resend.emails.send({
        from: "EliteRealty AI <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to EliteRealty AI - Your Free Trial Starts Now!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e40af; text-align: center;">Welcome to EliteRealty AI, ${name}!</h1>
            
            <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; border-radius: 10px; color: white; text-align: center; margin: 20px 0;">
              <h2 style="margin: 0 0 10px 0;">🎉 Your Free Trial is Now Active!</h2>
              <p style="margin: 0; font-size: 18px;">Start using our AI tools immediately</p>
            </div>

            <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af;">What's included in your free trial:</h3>
              <ul style="color: #374151;">
                <li>✅ AI ChatBot - 24/7 lead capture</li>
                <li>✅ AI CallBot - Automated phone support</li>
                <li>✅ Lead Management Dashboard</li>
                <li>✅ Property Search AI</li>
                <li>✅ Analytics & Insights</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')}" 
                 style="background: #eab308; color: #1e40af; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Need help? Reply to this email or contact us at dev.devneuron@gmail.com
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px;">
                © 2024 EliteRealty AI. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });

      // Also send notification to admin for new signups
      const adminEmailResponse = await resend.emails.send({
        from: "EliteRealty AI <onboarding@resend.dev>",
        to: ["dev.devneuron@gmail.com"],
        subject: `New Free Trial Signup: ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e40af;">New Free Trial Signup</h1>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);