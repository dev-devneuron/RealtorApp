import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DemoEmailRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, company, message }: DemoEmailRequest = await req.json();

    console.log("Sending demo request email for:", { name, email, company });

    const emailResponse = await resend.emails.send({
      from: "RealtyAgent AI <onboarding@resend.dev>",
      to: ["dev.devneuron@gmail.com"],
      subject: `New Demo Request from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a8a; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
            New Demo Request - RealtyAgent AI
          </h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Contact Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Name:</td>
                <td style="padding: 8px 0; color: #1f2937;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Email:</td>
                <td style="padding: 8px 0; color: #1f2937;">${email}</td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Phone:</td>
                <td style="padding: 8px 0; color: #1f2937;">${phone}</td>
              </tr>` : ''}
              ${company ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Company:</td>
                <td style="padding: 8px 0; color: #1f2937;">${company}</td>
              </tr>` : ''}
            </table>
          </div>
          
          ${message ? `
          <div style="background-color: #fff; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Message</h3>
            <p style="color: #1f2937; line-height: 1.6;">${message}</p>
          </div>` : ''}
          
          <div style="margin-top: 30px; padding: 20px; background-color: #1e3a8a; color: white; border-radius: 8px;">
            <p style="margin: 0; text-align: center;">
              <strong>Action Required:</strong> Please reach out to schedule the demo call within 24 hours.
            </p>
          </div>
          
          <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>This email was automatically generated from the RealtyAgent AI demo request form.</p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Demo request email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-demo-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);