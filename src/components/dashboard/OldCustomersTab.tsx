/**
 * Old Customers Tab Component
 * 
 * Displays previously engaged customers who didn't convert and shows
 * AI re-engagement conversations. This is a demo feature that simulates
 * how LEASAP would re-engage lost prospects.
 * 
 * @module components/dashboard/OldCustomersTab
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  RefreshCw, 
  Search, 
  ArrowLeft, 
  Bot, 
  MessageCircle,
  Clock,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Filter,
  BarChart3,
  Zap,
  UserCheck,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Ruler,
  Activity,
  Sparkles
} from "lucide-react";

// Types
export interface OldCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  property: string;
  propertyDetails?: {
    address: string;
    rent?: number;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
  };
  lastInteractionDate: string;
  dropOffReason: string;
  status: "pending_outreach" | "ai_reached_out" | "customer_responded" | "not_interested";
  pastTranscriptSnippet: string;
  brokerage?: string;
  aiConversation: Array<{
    sender: "ai" | "user";
    message: string;
    timestamp: string;
  }>;
  engagementScore?: number;
  priority?: "high" | "medium" | "low";
  lastSeen?: string;
}

interface OldCustomersTabProps {
  oldCustomers?: OldCustomer[];
  loading?: boolean;
  onRefresh?: () => void;
}

// Enhanced mock data with more customers and realistic details
const generateMockCustomers = (): OldCustomer[] => {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 30);

  return [
    {
      id: "1",
      name: "Alex Johnson",
      email: "alex.johnson@email.com",
      phone: "+1 (555) 234-5678",
      property: "2-Bedroom Apartment – Main Street",
      propertyDetails: {
        address: "123 Main Street, Apt 4B",
        rent: 2200,
        bedrooms: 2,
        bathrooms: 1,
        sqft: 950
      },
      lastInteractionDate: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Asked about property but never booked a tour",
      status: "ai_reached_out",
      brokerage: "Downtown Realty",
      engagementScore: 72,
      priority: "high",
      lastSeen: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      pastTranscriptSnippet: `"Hi, I'm calling about the apartment on Main Street."
"Great! It's a beautiful 2-bedroom unit. What would you like to know?"
"I'm interested in the rent and availability."
"The rent is $2,200 per month, and we have availability starting next month."
"Okay, I'll think about it and get back to you."
"Of course! Feel free to reach out anytime."`,
      aiConversation: [
        {
          sender: "ai",
          message: "Hi Alex! This is LEASAP from Downtown Realty 👋\nYou previously asked about the 2-bedroom unit on Main Street.\nWe have new availability and more flexible tour times this week.\nWould you like to take another look?",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Yeah, maybe. What's changed?",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 14 * 30 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Great question! The rent is the same at $2,200, but we're now offering:\n• Evening tours (6-8 PM)\n• Shorter lease options (6 months)\n• Move-in special: First month 50% off\n\nWould you like me to schedule a quick visit?",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 14 * 32 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "2",
      name: "Sarah Martinez",
      email: "sarah.martinez@email.com",
      phone: "+1 (555) 345-6789",
      property: "1-Bedroom Loft – Oak Avenue",
      propertyDetails: {
        address: "456 Oak Avenue, Loft 12",
        rent: 1850,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 750
      },
      lastInteractionDate: new Date(baseDate.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Cancelled a scheduled tour",
      status: "customer_responded",
      brokerage: "Metro Properties",
      engagementScore: 85,
      priority: "high",
      lastSeen: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      pastTranscriptSnippet: `"I'd like to schedule a tour for next Tuesday."
"Perfect! I have availability at 2 PM. Does that work?"
"Yes, that's great. I'll be there."
"Wonderful! I'll send you a confirmation email with the address."
"Actually, I need to cancel. Something came up at work."
"No problem at all. Let me know when you'd like to reschedule."`,
      aiConversation: [
        {
          sender: "ai",
          message: "Hi Sarah! This is LEASAP from Metro Properties.\nI noticed you had to cancel your tour for the 1-bedroom loft on Oak Avenue.\nWe have new availability and I'd love to help you reschedule at a time that works better for you.",
          timestamp: new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Thanks for reaching out. I'm still interested but my schedule is really tight right now.",
          timestamp: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "I understand! We now offer:\n• Virtual tours you can do from home\n• Quick 15-minute visits during lunch breaks\n• Weekend availability\n\nWhat works better for you?",
          timestamp: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000 + 18 * 15 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "A virtual tour sounds good. Can we do it this week?",
          timestamp: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Absolutely! I can set up a virtual tour for you. Would Thursday evening at 7 PM work? I'll send you a link that works on any device - phone, tablet, or computer.",
          timestamp: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000 + 10 * 10 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Perfect! That works for me.",
          timestamp: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000 + 10 * 12 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "3",
      name: "Michael Chen",
      email: "michael.chen@email.com",
      phone: "+1 (555) 456-7890",
      property: "3-Bedroom Townhouse – Riverside Drive",
      propertyDetails: {
        address: "789 Riverside Drive, Unit 5",
        rent: 3200,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1650
      },
      lastInteractionDate: new Date(baseDate.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Did not show up for a confirmed tour",
      status: "pending_outreach",
      brokerage: "Elite Real Estate",
      engagementScore: 45,
      priority: "medium",
      pastTranscriptSnippet: `"I'm interested in the townhouse on Riverside Drive."
"Great! It's a beautiful 3-bedroom, 2-bathroom unit. When would you like to see it?"
"I have availability tomorrow at 3 PM."
"Perfect, I'll be there."
"Excellent! I'll send you the address and my contact info."`,
      aiConversation: []
    },
    {
      id: "4",
      name: "Emily Rodriguez",
      email: "emily.rodriguez@email.com",
      phone: "+1 (555) 567-8901",
      property: "Studio Apartment – Park Boulevard",
      propertyDetails: {
        address: "321 Park Boulevard, Studio 8",
        rent: 1850,
        bedrooms: 0,
        bathrooms: 1,
        sqft: 550
      },
      lastInteractionDate: new Date(baseDate.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Stopped responding after pricing discussion",
      status: "ai_reached_out",
      brokerage: "City Living Properties",
      engagementScore: 58,
      priority: "medium",
      lastSeen: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      pastTranscriptSnippet: `"What's the monthly rent for the studio?"
"It's $1,850 per month, which includes utilities."
"Hmm, that's a bit higher than I was hoping for."
"I understand. We do have some flexibility. Would you like to discuss options?"
"Let me think about it."`,
      aiConversation: [
        {
          sender: "ai",
          message: "Hi Emily! This is LEASAP from City Living Properties.\nI wanted to follow up about the studio on Park Boulevard. I know pricing was a concern, and I have some good news – we're now offering a move-in special that could help make it more affordable.",
          timestamp: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "5",
      name: "David Kim",
      email: "david.kim@email.com",
      phone: "+1 (555) 678-9012",
      property: "2-Bedroom Condo – Harbor View",
      propertyDetails: {
        address: "654 Harbor View Drive, Unit 3C",
        rent: 2450,
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1100
      },
      lastInteractionDate: new Date(baseDate.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Delayed decision – asked to follow up later",
      status: "not_interested",
      brokerage: "Coastal Realty",
      engagementScore: 30,
      priority: "low",
      pastTranscriptSnippet: `"I'm interested in the condo, but I need some time to think about it."
"Of course, take your time. When would be a good time to follow up?"
"Maybe in a month or two. I'm still looking at other options."
"Understood. I'll reach out then. Good luck with your search!"`,
      aiConversation: [
        {
          sender: "ai",
          message: "Hi David! This is LEASAP from Coastal Realty.\nYou mentioned you'd like to revisit the 2-bedroom condo on Harbor View in a month or two. It's been about that time, and I wanted to check in and see if you're still interested.",
          timestamp: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Thanks, but I've actually found something else. Appreciate you following up though!",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "No problem at all! I'm glad you found something that works for you. If anything changes or you're looking again in the future, feel free to reach out. Best of luck with your new place!",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 16 * 5 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "6",
      name: "Jessica Williams",
      email: "jessica.williams@email.com",
      phone: "+1 (555) 789-0123",
      property: "1-Bedroom Apartment – Garden District",
      propertyDetails: {
        address: "890 Garden Street, Apt 15",
        rent: 1950,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 680
      },
      lastInteractionDate: new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Requested more photos but never responded",
      status: "customer_responded",
      brokerage: "Green Valley Properties",
      engagementScore: 78,
      priority: "high",
      lastSeen: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      pastTranscriptSnippet: `"Can you send me more photos of the apartment?"
"Absolutely! I'll send you a gallery with photos of every room."
"That would be great, thank you."
"I've sent them to your email. Let me know if you have any questions!"`,
      aiConversation: [
        {
          sender: "ai",
          message: "Hi Jessica! This is LEASAP from Green Valley Properties.\nI noticed you requested photos of the 1-bedroom on Garden Street but we didn't hear back. I wanted to check if you received them and if you have any questions?",
          timestamp: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Yes, I got them! The place looks nice. I'm just comparing a few options.",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "That makes sense! Since you're comparing options, I wanted to let you know we just had a unit become available with a private balcony - something that's pretty rare in this building. Would you like to see it?",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 19 * 15 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Oh interesting! Yes, I'd like to see that.",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Perfect! I can schedule a tour for you. We have availability this week - would Thursday afternoon or Saturday morning work better?",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 11 * 10 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "7",
      name: "Robert Taylor",
      email: "robert.taylor@email.com",
      phone: "+1 (555) 890-1234",
      property: "4-Bedroom House – Maple Lane",
      propertyDetails: {
        address: "147 Maple Lane",
        rent: 4200,
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2400
      },
      lastInteractionDate: new Date(baseDate.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Asked about pet policy but didn't follow up",
      status: "pending_outreach",
      brokerage: "Premier Real Estate",
      engagementScore: 52,
      priority: "medium",
      pastTranscriptSnippet: `"I'm interested in the house on Maple Lane. What's the pet policy?"
"We allow up to 2 pets, with a pet deposit of $500."
"Okay, I have two dogs. That works."
"Great! Would you like to schedule a viewing?"
"Let me check my calendar and get back to you."`,
      aiConversation: []
    },
    {
      id: "8",
      name: "Amanda Brown",
      email: "amanda.brown@email.com",
      phone: "+1 (555) 901-2345",
      property: "2-Bedroom Duplex – Elm Street",
      propertyDetails: {
        address: "258 Elm Street, Upper Unit",
        rent: 2100,
        bedrooms: 2,
        bathrooms: 1,
        sqft: 980
      },
      lastInteractionDate: new Date(baseDate.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Scheduled tour but called to cancel last minute",
      status: "ai_reached_out",
      brokerage: "Urban Living Co.",
      engagementScore: 65,
      priority: "medium",
      lastSeen: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      pastTranscriptSnippet: `"I'd like to see the duplex on Elm Street."
"Perfect! I have availability tomorrow at 2 PM."
"Sounds good, I'll be there."
"Great! See you then."
"Actually, I need to cancel. Something urgent came up."
"No worries, we can reschedule whenever you're ready."`,
      aiConversation: [
        {
          sender: "ai",
          message: "Hi Amanda! This is LEASAP from Urban Living Co.\nI know you had to cancel your tour last minute due to an urgent matter. I hope everything is okay! We still have the 2-bedroom duplex available and I'd love to help you reschedule when it's convenient.",
          timestamp: new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Thanks for understanding. Everything's fine now. I'm still interested.",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "That's great to hear! I'm glad everything worked out. Would you like to schedule a new tour? We have availability this week and next.",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 15 * 12 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "9",
      name: "Christopher Lee",
      email: "chris.lee@email.com",
      phone: "+1 (555) 012-3456",
      property: "Studio Loft – Arts District",
      propertyDetails: {
        address: "369 Arts Boulevard, Loft 7",
        rent: 1650,
        bedrooms: 0,
        bathrooms: 1,
        sqft: 600
      },
      lastInteractionDate: new Date(baseDate.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Inquired about parking but never responded",
      status: "pending_outreach",
      brokerage: "Creative Spaces Realty",
      engagementScore: 40,
      priority: "low",
      pastTranscriptSnippet: `"Does the studio have parking?"
"Yes, there's one assigned parking space included."
"That's good. What about street parking?"
"There's also street parking available, though it can be limited during peak hours."
"Okay, thanks for the info."`,
      aiConversation: []
    },
    {
      id: "10",
      name: "Maria Garcia",
      email: "maria.garcia@email.com",
      phone: "+1 (555) 123-4567",
      property: "3-Bedroom Apartment – Waterfront",
      propertyDetails: {
        address: "741 Waterfront Drive, Apt 22",
        rent: 3800,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1800
      },
      lastInteractionDate: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Discussed lease terms but wanted to think it over",
      status: "customer_responded",
      brokerage: "Luxury Living Group",
      engagementScore: 82,
      priority: "high",
      lastSeen: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      pastTranscriptSnippet: `"What's the lease term?"
"We offer 12-month and 24-month leases. The 24-month has a slightly lower rate."
"I see. And what about the security deposit?"
"It's one month's rent, which is $3,800."
"Okay, I need to think about this. Can I get back to you?"
"Of course! Take your time."`,
      aiConversation: [
        {
          sender: "ai",
          message: "Hi Maria! This is LEASAP from Luxury Living Group.\nI wanted to follow up about the 3-bedroom waterfront apartment. I know you were considering the lease terms. We've just updated our options - we now offer a 6-month lease option as well, which might be more flexible for your situation.",
          timestamp: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "That's interesting. What's the rate for the 6-month lease?",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "The 6-month lease is $3,950 per month - just $150 more than the 12-month. It gives you flexibility while you decide if you want to stay longer. Would you like to discuss this further or schedule a tour?",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 14 * 8 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Yes, I'd like to schedule a tour. This weekend would work best.",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Perfect! I have availability Saturday at 10 AM, 1 PM, or 3 PM. Which time works best for you?",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 11 * 5 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "11",
      name: "James Wilson",
      email: "james.wilson@email.com",
      phone: "+1 (555) 234-5678",
      property: "1-Bedroom Condo – Downtown",
      propertyDetails: {
        address: "852 Downtown Plaza, Unit 9",
        rent: 2250,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 720
      },
      lastInteractionDate: new Date(baseDate.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Asked about amenities but didn't book",
      status: "pending_outreach",
      brokerage: "Metro Properties",
      engagementScore: 48,
      priority: "low",
      pastTranscriptSnippet: `"What amenities does the building have?"
"We have a fitness center, rooftop terrace, and secure parking."
"That sounds nice. Is there a pool?"
"No pool, but the rooftop has great city views."
"Okay, thanks for the information."`,
      aiConversation: []
    },
    {
      id: "12",
      name: "Lisa Anderson",
      email: "lisa.anderson@email.com",
      phone: "+1 (555) 345-6789",
      property: "2-Bedroom Penthouse – Skyline Tower",
      propertyDetails: {
        address: "963 Skyline Tower, Penthouse 15",
        rent: 4500,
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1500
      },
      lastInteractionDate: new Date(baseDate.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Requested floor plan but never scheduled viewing",
      status: "ai_reached_out",
      brokerage: "Elite Real Estate",
      engagementScore: 68,
      priority: "high",
      lastSeen: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      pastTranscriptSnippet: `"Can you send me the floor plan?"
"Absolutely! I'll email it to you right away."
"Thank you, I'll review it and let you know."
"Perfect! Feel free to ask any questions."`,
      aiConversation: [
        {
          sender: "ai",
          message: "Hi Lisa! This is LEASAP from Elite Real Estate.\nI sent you the floor plan for the penthouse at Skyline Tower last week. I wanted to check if you had a chance to review it and if you have any questions?",
          timestamp: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Yes, I reviewed it. The layout looks good. I'm just checking a few other options.",
          timestamp: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "I understand! Since you're comparing options, I wanted to mention that this penthouse has some unique features - a private elevator entrance and a wraparound balcony with 360-degree views. These are pretty rare in the downtown area. Would you like to see it in person?",
          timestamp: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000 + 16 * 12 * 60 * 1000).toISOString()
        }
      ]
    }
  ];
};

const getStatusBadge = (status: OldCustomer["status"]) => {
  const badges = {
    pending_outreach: {
      label: "Pending Outreach",
      className: "bg-yellow-100 text-yellow-700 border-yellow-300",
      icon: Clock
    },
    ai_reached_out: {
      label: "AI Reached Out",
      className: "bg-blue-100 text-blue-700 border-blue-300",
      icon: MessageCircle
    },
    customer_responded: {
      label: "Customer Responded",
      className: "bg-green-100 text-green-700 border-green-300",
      icon: CheckCircle2
    },
    not_interested: {
      label: "Not Interested",
      className: "bg-gray-100 text-gray-700 border-gray-300",
      icon: XCircle
    }
  };

  const config = badges[status];
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} text-sm font-semibold flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const getPriorityBadge = (priority?: OldCustomer["priority"]) => {
  if (!priority) return null;
  
  const badges = {
    high: {
      label: "High Priority",
      className: "bg-red-100 text-red-700 border-red-300",
      icon: Zap
    },
    medium: {
      label: "Medium Priority",
      className: "bg-amber-100 text-amber-700 border-amber-300",
      icon: Activity
    },
    low: {
      label: "Low Priority",
      className: "bg-gray-100 text-gray-700 border-gray-300",
      icon: Clock
    }
  };

  const config = badges[priority];
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} text-xs font-semibold flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: "numeric" 
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleTimeString("en-US", { 
    hour: "numeric", 
    minute: "2-digit",
    hour12: true
  });
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

export const OldCustomersTab = ({
  oldCustomers: propOldCustomers,
  loading = false,
  onRefresh
}: OldCustomersTabProps) => {
  const [oldCustomers, setOldCustomers] = useState<OldCustomer[]>(
    propOldCustomers || generateMockCustomers()
  );
  const [selectedCustomer, setSelectedCustomer] = useState<OldCustomer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = oldCustomers.length;
    const pending = oldCustomers.filter(c => c.status === "pending_outreach").length;
    const reachedOut = oldCustomers.filter(c => c.status === "ai_reached_out").length;
    const responded = oldCustomers.filter(c => c.status === "customer_responded").length;
    const avgEngagement = oldCustomers.reduce((sum, c) => sum + (c.engagementScore || 0), 0) / total;
    const highPriority = oldCustomers.filter(c => c.priority === "high").length;

    return { total, pending, reachedOut, responded, avgEngagement, highPriority };
  }, [oldCustomers]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return oldCustomers.filter(customer => {
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.dropOffReason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || customer.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [oldCustomers, searchQuery, statusFilter, priorityFilter]);

  // Scroll chat to bottom when conversation changes
  useEffect(() => {
    if (chatContainerRef.current && selectedCustomer) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [selectedCustomer]);

  const handleReEngage = (customer: OldCustomer) => {
    if (customer.aiConversation.length === 0) {
      const updatedCustomer: OldCustomer = {
        ...customer,
        status: "ai_reached_out",
        aiConversation: [
          {
            sender: "ai",
            message: `Hi ${customer.name.split(' ')[0]}! This is LEASAP${customer.brokerage ? ` from ${customer.brokerage}` : ''} 👋\nYou previously inquired about ${customer.property}.\nWe have new availability and more flexible tour options.\nWould you like to take another look?`,
            timestamp: new Date().toISOString()
          }
        ]
      };
      
      // Update in the list
      setOldCustomers(prev => 
        prev.map(c => c.id === customer.id ? updatedCustomer : c)
      );
      setSelectedCustomer(updatedCustomer);
    } else {
      setSelectedCustomer(customer);
    }
  };

  if (selectedCustomer) {
    const conversationStats = {
      messageCount: selectedCustomer.aiConversation.length,
      aiMessages: selectedCustomer.aiConversation.filter(m => m.sender === "ai").length,
      userMessages: selectedCustomer.aiConversation.filter(m => m.sender === "user").length,
      lastMessage: selectedCustomer.aiConversation[selectedCustomer.aiConversation.length - 1]
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                  className="rounded-lg"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to List
                </Button>
                <div>
                  <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-2">
                    {selectedCustomer.name}
                    {selectedCustomer.engagementScore && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {selectedCustomer.engagementScore}% Engaged
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{selectedCustomer.property}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(selectedCustomer.status)}
                {getPriorityBadge(selectedCustomer.priority)}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCustomer.email && (
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{selectedCustomer.email}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {selectedCustomer.phone && (
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{selectedCustomer.phone}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Property Details */}
            {selectedCustomer.propertyDetails && (
              <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-amber-600" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Address</p>
                      <p className="text-sm font-medium text-gray-900">{selectedCustomer.propertyDetails.address}</p>
                    </div>
                    {selectedCustomer.propertyDetails.rent && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Rent
                        </p>
                        <p className="text-sm font-medium text-gray-900">${selectedCustomer.propertyDetails.rent.toLocaleString()}/mo</p>
                      </div>
                    )}
                    {selectedCustomer.propertyDetails.bedrooms !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Bed className="h-3 w-3" />
                          Bedrooms
                        </p>
                        <p className="text-sm font-medium text-gray-900">{selectedCustomer.propertyDetails.bedrooms}</p>
                      </div>
                    )}
                    {selectedCustomer.propertyDetails.bathrooms !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Bath className="h-3 w-3" />
                          Bathrooms
                        </p>
                        <p className="text-sm font-medium text-gray-900">{selectedCustomer.propertyDetails.bathrooms}</p>
                      </div>
                    )}
                    {selectedCustomer.propertyDetails.sqft && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Ruler className="h-3 w-3" />
                          Square Feet
                        </p>
                        <p className="text-sm font-medium text-gray-900">{selectedCustomer.propertyDetails.sqft.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section A: Why We're Reaching Out */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Reason for AI Re-Engagement
                    </h3>
                    <p className="text-blue-800">
                      This customer previously {selectedCustomer.dropOffReason.toLowerCase()}.
                      {selectedCustomer.brokerage && ` LEASAP from ${selectedCustomer.brokerage} is following up to share updated availability and offer flexible tour options.`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section B: Past Interaction Snapshot */}
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Previous Call (Excerpt)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-4 border border-gray-200 font-mono text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedCustomer.pastTranscriptSnippet}
                </div>
              </CardContent>
            </Card>

            {/* Section C: AI Re-Engagement Conversation */}
            <Card className="bg-white border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-amber-600" />
                  AI Re-Engagement Conversation
                </CardTitle>
                {conversationStats.messageCount > 0 && (
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {conversationStats.messageCount} messages
                    </span>
                    {selectedCustomer.lastSeen && (
                      <span className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        Last seen {formatRelativeTime(selectedCustomer.lastSeen)}
                      </span>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {/* WhatsApp-style chat container */}
                <div className="bg-[#0b141a] rounded-lg overflow-hidden border border-gray-300">
                  {/* Chat Header */}
                  <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#202c33] animate-pulse"></div>
                      </div>
                      <div>
                        <div className="text-white font-semibold">LEASAP AI</div>
                        <div className="text-green-400 text-xs flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                          Online
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div
                    ref={chatContainerRef}
                    className="h-96 bg-[#0b141a] bg-gradient-to-br from-[#0b141a] to-[#111b21] overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%231a1a1a' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`
                    }}
                  >
                    {selectedCustomer.aiConversation.length === 0 ? (
                      <div className="flex flex-col justify-center items-center h-full p-6">
                        <div className="text-center text-gray-400 mb-4">
                          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm mb-4">No conversation yet. Click "Re-Engage with AI" to start.</p>
                        </div>
                        <Button
                          onClick={() => handleReEngage(selectedCustomer)}
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Re-Engage with AI
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Date separator for first message */}
                        <div className="flex justify-center mb-3">
                          <div className="bg-[#182229] rounded-lg px-3 py-1 shadow-sm">
                            <span className="text-gray-300 text-xs">
                              {formatDate(selectedCustomer.aiConversation[0].timestamp)}
                            </span>
                          </div>
                        </div>
                        <AnimatePresence>
                          {selectedCustomer.aiConversation.map((msg, index) => {
                            const prevMsg = index > 0 ? selectedCustomer.aiConversation[index - 1] : null;
                            const showDateSeparator = prevMsg && 
                              new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();

                            return (
                              <div key={index}>
                                {showDateSeparator && (
                                  <div className="flex justify-center my-3">
                                    <div className="bg-[#182229] rounded-lg px-3 py-1 shadow-sm">
                                      <span className="text-gray-300 text-xs">
                                        {formatDate(msg.timestamp)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                >
                                  <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-lg ${
                                      msg.sender === "user"
                                        ? "bg-[#005c4b] text-white rounded-br-md"
                                        : "bg-[#202c33] text-white rounded-bl-md border border-gray-600/30"
                                    }`}
                                  >
                                    {msg.sender === "ai" && (
                                      <div className="text-xs font-semibold text-amber-400 mb-1">
                                        LEASAP AI
                                      </div>
                                    )}
                                    {msg.sender === "user" && (
                                      <div className="text-xs font-semibold text-[#99b8b1] mb-1">
                                        {selectedCustomer.name}
                                      </div>
                                    )}
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                      {msg.message}
                                    </div>
                                    <div
                                      className={`text-xs mt-2 ${
                                        msg.sender === "user"
                                          ? "text-[#99b8b1] text-right"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {formatTime(msg.timestamp)}
                                      {msg.sender === "user" && (
                                        <span className="ml-1">✓✓</span>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              </div>
                            );
                          })}
                        </AnimatePresence>
                      </>
                    )}
                  </div>

                  {/* Chat Input Area */}
                  {selectedCustomer.aiConversation.length > 0 && (
                    <div className="bg-[#202c33] px-4 py-3 border-t border-gray-700">
                      <div className="flex items-center justify-between text-gray-400 text-xs">
                        <span>Conversation in progress</span>
                        <div className="flex items-center gap-2">
                          {selectedCustomer.status === "pending_outreach" && (
                            <Button
                              size="sm"
                              onClick={() => handleReEngage(selectedCustomer)}
                              className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
                            >
                              Re-Engage with AI
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Schedule Tour
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white shadow-xl border border-amber-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <CardTitle className="text-gray-900 text-2xl font-bold flex items-center gap-4 mb-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                Old Customers
              </CardTitle>
              <p className="text-gray-600 text-lg">
                Re-engage previously interested customers with AI-powered outreach.
              </p>
            </div>
            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="outline"
                className="bg-white border-amber-300 hover:bg-amber-50 rounded-xl"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 font-medium mb-1">Total</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-yellow-600 font-medium mb-1">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 font-medium mb-1">Reached Out</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.reachedOut}</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-blue-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-600 font-medium mb-1">Responded</p>
                    <p className="text-2xl font-bold text-green-900">{stats.responded}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-600 font-medium mb-1">Avg Engagement</p>
                    <p className="text-2xl font-bold text-amber-900">{Math.round(stats.avgEngagement)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-amber-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-600 font-medium mb-1">High Priority</p>
                    <p className="text-2xl font-bold text-red-900">{stats.highPriority}</p>
                  </div>
                  <Zap className="h-8 w-8 text-red-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name, property, email, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-amber-300 rounded-xl"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-amber-300 rounded-xl">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_outreach">Pending Outreach</SelectItem>
                <SelectItem value="ai_reached_out">AI Reached Out</SelectItem>
                <SelectItem value="customer_responded">Customer Responded</SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-amber-300 rounded-xl">
                <Zap className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-10 w-10 animate-spin text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium text-xl mb-2">No customers found</p>
              <p className="text-gray-400 text-sm">
                {searchQuery || statusFilter !== "all" || priorityFilter !== "all" 
                  ? "Try adjusting your search or filter criteria." 
                  : "No old customers to display."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <Table>
                <TableHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50">
                  <TableRow className="border-b border-amber-200">
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Customer</TableHead>
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Property</TableHead>
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Last Interaction</TableHead>
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Reason</TableHead>
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Status</TableHead>
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Engagement</TableHead>
                    <TableHead className="font-bold text-gray-900 py-6 px-6 text-lg">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer, idx) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-gray-100 hover:bg-amber-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <TableCell className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-gray-900">{customer.name}</p>
                          {customer.email && (
                            <p className="text-xs text-gray-500 mt-1">{customer.email}</p>
                          )}
                          {getPriorityBadge(customer.priority)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <p className="text-gray-900 font-medium">{customer.property}</p>
                        {customer.propertyDetails?.rent && (
                          <p className="text-xs text-gray-500 mt-1">${customer.propertyDetails.rent.toLocaleString()}/mo</p>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <p className="text-sm text-gray-700">
                          {formatDate(customer.lastInteractionDate)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(customer.lastInteractionDate)}
                        </p>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <p className="text-sm text-gray-700 max-w-md">
                          {customer.dropOffReason}
                        </p>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {getStatusBadge(customer.status)}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {customer.engagementScore !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  customer.engagementScore >= 70 ? "bg-green-500" :
                                  customer.engagementScore >= 50 ? "bg-amber-500" :
                                  "bg-red-500"
                                }`}
                                style={{ width: `${customer.engagementScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{customer.engagementScore}%</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReEngage(customer);
                          }}
                          className="rounded-lg"
                        >
                          {customer.status === "pending_outreach" ? (
                            <>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Re-Engage
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
