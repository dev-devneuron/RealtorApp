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
  pastCallSummary: string;
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

// Enhanced mock data with realistic addresses and natural conversations
const generateMockCustomers = (): OldCustomer[] => {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 30);

  return [
    {
      id: "1",
      name: "Alex Johnson",
      email: "alex.johnson@email.com",
      phone: "+1 (555) 234-5678",
      property: "2997 Barr Gardens Apt. 284, San Francisco, CA",
      propertyDetails: {
        address: "2997 Barr Gardens Apt. 284, San Francisco, CA 94102",
        rent: 3200,
        bedrooms: 2,
        bathrooms: 1,
        sqft: 1150
      },
      lastInteractionDate: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Asked about property but never booked a tour",
      status: "ai_reached_out",
      engagementScore: 88,
      priority: "high",
      lastSeen: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      pastCallSummary: "Customer called inquiring about the 2-bedroom apartment at Barr Gardens. Showed strong interest in the location and asked about rent ($3,200/month), parking availability, and move-in dates. Mentioned they were relocating from out of state and needed something by next month. Seemed engaged but said they needed to 'think about it' and would get back. No follow-up was received.",
      aiConversation: [
        {
          sender: "ai",
          message: "Hey Alex! 👋\n\nI noticed you were interested in the apartment at 2997 Barr Gardens a few weeks ago. I wanted to reach out because we just had a similar unit become available with some great updates.\n\nAre you still looking?",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Oh hey! Yeah I'm still looking actually. What's changed?",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 14 * 30 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Great to hear! So the unit we have available now has been completely renovated - new kitchen appliances, updated bathroom, and fresh paint throughout. Plus it's on a higher floor with better city views.\n\nThe rent is still $3,200, but we're offering a move-in special: first month is 50% off if you sign by the end of this week.",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 14 * 32 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "That sounds interesting. When could I see it?",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 14 * 45 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "I can schedule a tour for you this week! We have availability:\n\n• Tomorrow (Wednesday) - 2 PM, 4 PM, or 6 PM\n• Thursday - Anytime between 10 AM - 7 PM\n• Friday - Morning slots available\n• Weekend - Saturday and Sunday both work\n\nWhat day and time works best for you?",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 14 * 47 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Thursday afternoon would work. Maybe 3 PM?",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 15 * 20 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Perfect! Thursday at 3 PM it is. I'll send you the exact address and my contact info. The building has a doorman, so just let them know you're there for a tour with LEASAP.\n\nAlso, since you mentioned you're relocating, I can help connect you with local moving companies if you need recommendations. Just let me know!",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 15 * 22 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "2",
      name: "Sarah Martinez",
      email: "sarah.martinez@email.com",
      phone: "+1 (555) 345-6789",
      property: "1842 Pacific Heights Blvd. Unit 12B, San Francisco, CA",
      propertyDetails: {
        address: "1842 Pacific Heights Blvd. Unit 12B, San Francisco, CA 94115",
        rent: 2850,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 850
      },
      lastInteractionDate: new Date(baseDate.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Cancelled a scheduled tour",
      status: "customer_responded",
      engagementScore: 91,
      priority: "high",
      lastSeen: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      pastCallSummary: "Customer scheduled a tour for the 1-bedroom unit at Pacific Heights but cancelled last minute due to a work emergency. Expressed genuine interest and apologized for the cancellation. Mentioned they work in tech and have unpredictable hours. Asked if virtual tours were available.",
      aiConversation: [
        {
          sender: "ai",
          message: "Hi Sarah! 👋\n\nI know you had to cancel your tour last week - hope everything worked out with that work emergency! I wanted to check in and see if you're still interested in the Pacific Heights unit.",
          timestamp: new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Thanks for reaching out! Yeah, I'm still interested but my schedule is really unpredictable right now. That's why I had to cancel.",
          timestamp: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "I totally understand - work can be crazy! That's actually why I'm reaching out. We now offer a few options that might work better for your schedule:\n\n• Virtual tours you can do from home anytime\n• Quick 15-minute visits during lunch breaks\n• Weekend availability (we're flexible)\n• Self-guided tours with a code if you prefer\n\nWhich of these sounds most doable for you?",
          timestamp: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000 + 18 * 15 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "A virtual tour sounds perfect actually! Can we do it this week?",
          timestamp: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Absolutely! I can set up a virtual tour for you. Would Thursday evening at 7 PM work? I'll send you a link that works on any device - phone, tablet, or computer. We can do a live walkthrough where I show you everything, or I can send you a recorded video tour you can watch whenever.\n\nWhich do you prefer?",
          timestamp: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000 + 10 * 10 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "A live walkthrough would be great! Thursday at 7 works for me.",
          timestamp: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000 + 10 * 12 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Perfect! I'll send you the Zoom link tomorrow morning. The tour usually takes about 20-30 minutes, and you can ask questions as we go. I'll also show you the building amenities, parking situation, and the neighborhood.\n\nLooking forward to showing you the place! 🏠",
          timestamp: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000 + 10 * 15 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "3",
      name: "Michael Chen",
      email: "michael.chen@email.com",
      phone: "+1 (555) 456-7890",
      property: "4521 Mission Street Apt. 7C, San Francisco, CA",
      propertyDetails: {
        address: "4521 Mission Street Apt. 7C, San Francisco, CA 94110",
        rent: 2400,
        bedrooms: 2,
        bathrooms: 1,
        sqft: 980
      },
      lastInteractionDate: new Date(baseDate.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Did not show up for a confirmed tour",
      status: "pending_outreach",
      engagementScore: 28,
      priority: "medium",
      pastCallSummary: "Customer confirmed a tour for the Mission Street apartment but didn't show up. No call or message to cancel. Had previously expressed interest in the neighborhood and asked about public transportation access. Seemed enthusiastic during initial conversation.",
      aiConversation: []
    },
    {
      id: "4",
      name: "Emily Rodriguez",
      email: "emily.rodriguez@email.com",
      phone: "+1 (555) 567-8901",
      property: "3876 Castro District Loft 5, San Francisco, CA",
      propertyDetails: {
        address: "3876 Castro District Loft 5, San Francisco, CA 94114",
        rent: 2750,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 920
      },
      lastInteractionDate: new Date(baseDate.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Stopped responding after pricing discussion",
      status: "ai_reached_out",
      engagementScore: 62,
      priority: "medium",
      lastSeen: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      pastCallSummary: "Customer inquired about the Castro District loft. Asked detailed questions about rent ($2,750/month), utilities, and neighborhood safety. Expressed concern that the rent was higher than their current budget. When asked about flexibility, customer said they needed to 'think about it' and never responded to follow-up messages.",
      aiConversation: [
        {
          sender: "ai",
          message: "Hi Emily! 👋\n\nI wanted to follow up about the loft in Castro District. I know pricing was a concern when we last talked, and I wanted to share some good news - we have some options that might work better for your budget.",
          timestamp: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Hi, yeah I remember. What options are you talking about?",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 16 * 30 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "So we're offering a few things that could help:\n\n1. Move-in special: First month is 50% off (saves you $1,375)\n2. Utilities included: We can include water, trash, and internet in the rent\n3. Flexible lease: We can do a 6-month lease instead of 12, which gives you more flexibility\n\nAlso, I should mention - the building just got approved for rent control, so your rent won't increase for at least the next year.\n\nWould any of these options make it more doable?",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 16 * 35 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "The utilities included and rent control are interesting. Let me think about it.",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 17 * 10 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Of course, take your time! I know it's a big decision.\n\nJust so you know, the move-in special is only available if you sign by this Friday - it's part of a limited promotion. But even if you decide later, the utilities included and rent control would still apply.\n\nWould it help if I sent you a breakdown of the total monthly costs with everything included? Sometimes seeing the full picture helps.",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 17 * 15 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Yes, that would be helpful. Thanks!",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 10 * 20 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Perfect! I'll put together a detailed breakdown and email it to you today. It'll show the base rent, what's included, and the total monthly cost.\n\nAlso, if you want to see the place in person, I can schedule a tour. Sometimes seeing it makes the decision easier!",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 10 * 25 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "5",
      name: "David Kim",
      email: "david.kim@email.com",
      phone: "+1 (555) 678-9012",
      property: "5210 Marina Boulevard Unit 8, San Francisco, CA",
      propertyDetails: {
        address: "5210 Marina Boulevard Unit 8, San Francisco, CA 94123",
        rent: 4200,
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1350
      },
      lastInteractionDate: new Date(baseDate.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Delayed decision – asked to follow up later",
      status: "not_interested",
      engagementScore: 22,
      priority: "low",
      pastCallSummary: "Customer viewed the Marina Boulevard unit and seemed interested. Asked about lease terms, parking, and building amenities. Said they were also looking at other properties and needed time to compare. Requested a follow-up in 'a month or two' after they finished their search.",
      aiConversation: [
        {
          sender: "ai",
          message: "Hi David! 👋\n\nYou mentioned you'd like to revisit the Marina Boulevard unit in a month or two. It's been about that time, and I wanted to check in and see if you're still looking or if you found something else.",
          timestamp: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Thanks for following up! I actually found a place that works better for me. Appreciate you checking in though!",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "No problem at all! I'm glad you found something that works for you. If anything changes or you're looking again in the future, feel free to reach out. Best of luck with your new place! 🎉",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 16 * 5 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "6",
      name: "Jessica Williams",
      email: "jessica.williams@email.com",
      phone: "+1 (555) 789-0123",
      property: "2934 Fillmore Street Apt. 3A, San Francisco, CA",
      propertyDetails: {
        address: "2934 Fillmore Street Apt. 3A, San Francisco, CA 94123",
        rent: 3100,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 750
      },
      lastInteractionDate: new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Requested more photos but never responded",
      status: "customer_responded",
      engagementScore: 93,
      priority: "high",
      lastSeen: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      pastCallSummary: "Customer requested additional photos of the Fillmore Street apartment, specifically of the kitchen, bathroom, and closet space. Photos were sent via email but no response was received. Customer had mentioned they work from home and needed good natural light.",
      aiConversation: [
        {
          sender: "ai",
          message: "Hi Jessica! 👋\n\nI noticed you requested photos of the Fillmore Street apartment last week but we didn't hear back. I wanted to check if you received them and if you have any questions about the place?",
          timestamp: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Yes, I got them! The place looks nice. I'm just comparing a few options right now.",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "That makes sense! Since you're comparing options, I wanted to mention something - we just had a unit become available in the same building with a private balcony. It's pretty rare in this area, and since you mentioned you work from home, having that outdoor space could be really nice.\n\nIt's the same price and same layout, just with the added balcony. Would you like to see it?",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 19 * 15 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Oh interesting! Yes, I'd like to see that. A balcony would be perfect for working outside.",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Perfect! I can schedule a tour for you. We have availability this week - would Thursday afternoon or Saturday morning work better? I can also send you photos of the balcony if you want to see it first.",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 11 * 10 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Saturday morning would be great. And yes, photos would be helpful!",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 11 * 25 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Awesome! I'll send the photos today and confirm Saturday morning. Does 10 AM work for you?",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 11 * 30 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "10 AM is perfect. Thanks!",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 11 * 35 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "7",
      name: "Robert Taylor",
      email: "robert.taylor@email.com",
      phone: "+1 (555) 890-1234",
      property: "6789 Presidio Avenue House, San Francisco, CA",
      propertyDetails: {
        address: "6789 Presidio Avenue, San Francisco, CA 94129",
        rent: 5500,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 2100
      },
      lastInteractionDate: new Date(baseDate.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Asked about pet policy but didn't follow up",
      status: "pending_outreach",
      engagementScore: 38,
      priority: "medium",
      pastCallSummary: "Customer inquired about the Presidio Avenue house. Showed strong interest and asked detailed questions about the pet policy (has 2 large dogs). Was informed about the pet deposit ($750) and weight restrictions. Said they would discuss with their partner and get back, but no follow-up was received.",
      aiConversation: []
    },
    {
      id: "8",
      name: "Amanda Brown",
      email: "amanda.brown@email.com",
      phone: "+1 (555) 901-2345",
      property: "4156 Hayes Valley Studio 9, San Francisco, CA",
      propertyDetails: {
        address: "4156 Hayes Valley Studio 9, San Francisco, CA 94117",
        rent: 2200,
        bedrooms: 0,
        bathrooms: 1,
        sqft: 580
      },
      lastInteractionDate: new Date(baseDate.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Scheduled tour but called to cancel last minute",
      status: "ai_reached_out",
      engagementScore: 83,
      priority: "medium",
      lastSeen: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      pastCallSummary: "Customer scheduled a tour for the Hayes Valley studio but cancelled 2 hours before due to a family emergency. Expressed sincere interest and apologized multiple times. Mentioned they're a student and budget-conscious. Asked about shorter lease terms.",
      aiConversation: [
        {
          sender: "ai",
          message: "Hi Amanda! 👋\n\nI know you had to cancel your tour last minute due to a family emergency - I hope everything is okay! I wanted to check in and see if you're still interested in the Hayes Valley studio.",
          timestamp: new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Thanks for understanding. Everything's fine now. I'm still interested, just been really busy with school.",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "That's great to hear! I'm glad everything worked out. I totally get being busy with school - that's actually why I'm reaching out.\n\nSince you mentioned you're a student, I wanted to let you know we can work with shorter lease terms if that helps. We can do 6 months, or even month-to-month after the first 3 months.\n\nWould you like to reschedule that tour? We have availability this week and next.",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 15 * 12 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "That's really helpful! Yes, I'd like to reschedule. Maybe this weekend?",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 15 * 20 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Perfect! I have availability Saturday at 11 AM, 1 PM, or 3 PM. Sunday works too - 10 AM, 12 PM, or 2 PM. Which works best for you?",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 15 * 25 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Saturday at 1 PM would be perfect!",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 15 * 30 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Great! Saturday at 1 PM it is. I'll send you a reminder on Friday with the address and my contact info. Looking forward to showing you the place!",
          timestamp: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000 + 15 * 32 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "9",
      name: "Christopher Lee",
      email: "chris.lee@email.com",
      phone: "+1 (555) 012-3456",
      property: "8923 SOMA Loft 14, San Francisco, CA",
      propertyDetails: {
        address: "8923 SOMA Loft 14, San Francisco, CA 94103",
        rent: 3800,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 1100
      },
      lastInteractionDate: new Date(baseDate.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Inquired about parking but never responded",
      status: "pending_outreach",
      engagementScore: 32,
      priority: "low",
      pastCallSummary: "Customer asked about the SOMA loft and specifically inquired about parking availability. Was told about the parking situation (limited street parking, garage available for $200/month). Customer said they would 'think about it' but never responded to follow-up questions.",
      aiConversation: []
    },
    {
      id: "10",
      name: "Maria Garcia",
      email: "maria.garcia@email.com",
      phone: "+1 (555) 123-4567",
      property: "1245 Russian Hill Penthouse 22, San Francisco, CA",
      propertyDetails: {
        address: "1245 Russian Hill Penthouse 22, San Francisco, CA 94133",
        rent: 5200,
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1650
      },
      lastInteractionDate: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Discussed lease terms but wanted to think it over",
      status: "customer_responded",
      engagementScore: 94,
      priority: "high",
      lastSeen: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      pastCallSummary: "Customer viewed the Russian Hill penthouse and was very impressed. Discussed lease terms extensively - asked about 12-month vs 24-month options, security deposit ($5,200), and early termination clauses. Expressed concern about committing to a full year. Said they needed to 'think about it' and would get back within a week.",
      aiConversation: [
        {
          sender: "ai",
          message: "Hi Maria! 👋\n\nI wanted to follow up about the Russian Hill penthouse. I know you were considering the lease terms, and I have some good news - we've updated our options to be more flexible.",
          timestamp: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Oh really? What changed?",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "So we now offer a 6-month lease option! It's $5,400 per month (just $200 more than the 12-month), but it gives you way more flexibility. After the first 6 months, you can either renew, go month-to-month, or move out with just 30 days notice.\n\nThis way you're not locked into a full year, but you still get the stability of a lease. Does that sound better?",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 14 * 8 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "That's actually much better! I was worried about committing to a full year. The 6-month option sounds perfect.",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "I'm so glad that works for you! The 6-month lease is perfect for people who want flexibility but still want the security of a lease.\n\nWould you like to move forward? I can send over the lease agreement for you to review, or if you want to see the place one more time, we can schedule another tour.",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 11 * 5 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Yes, I'd like to see it one more time. This weekend would work best.",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 11 * 15 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Perfect! I have availability Saturday at 10 AM, 1 PM, or 3 PM. Sunday works too - 11 AM, 2 PM, or 4 PM. Which time works best for you?",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 11 * 20 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Saturday at 1 PM sounds good!",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 11 * 25 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Excellent! Saturday at 1 PM it is. I'll send you a confirmation with the address and my contact info. After the tour, if you're ready to move forward, we can get the lease signed and you could potentially move in as early as next week if that works for you!",
          timestamp: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000 + 11 * 30 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: "11",
      name: "James Wilson",
      email: "james.wilson@email.com",
      phone: "+1 (555) 234-5678",
      property: "5678 North Beach Condo 6B, San Francisco, CA",
      propertyDetails: {
        address: "5678 North Beach Condo 6B, San Francisco, CA 94133",
        rent: 3400,
        bedrooms: 2,
        bathrooms: 1,
        sqft: 1050
      },
      lastInteractionDate: new Date(baseDate.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Asked about amenities but didn't book",
      status: "pending_outreach",
      engagementScore: 42,
      priority: "low",
      pastCallSummary: "Customer inquired about the North Beach condo and asked detailed questions about building amenities (gym, rooftop, parking). Was provided with a full list of amenities. Customer seemed interested but said they were 'still looking at other places' and would get back. No follow-up was received.",
      aiConversation: []
    },
    {
      id: "12",
      name: "Lisa Anderson",
      email: "lisa.anderson@email.com",
      phone: "+1 (555) 345-6789",
      property: "7890 Nob Hill Apartment 15F, San Francisco, CA",
      propertyDetails: {
        address: "7890 Nob Hill Apartment 15F, San Francisco, CA 94108",
        rent: 4800,
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1420
      },
      lastInteractionDate: new Date(baseDate.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      dropOffReason: "Requested floor plan but never scheduled viewing",
      status: "ai_reached_out",
      engagementScore: 85,
      priority: "high",
      lastSeen: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      pastCallSummary: "Customer requested a floor plan for the Nob Hill apartment. Floor plan was sent via email along with additional photos. Customer acknowledged receipt but never scheduled a viewing. Had mentioned they were looking for a 2-bedroom with good natural light.",
      aiConversation: [
        {
          sender: "ai",
          message: "Hi Lisa! 👋\n\nI sent you the floor plan for the Nob Hill apartment last week. I wanted to check if you had a chance to review it and if you have any questions?",
          timestamp: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Yes, I reviewed it. The layout looks good. I'm just checking a few other options before deciding.",
          timestamp: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "I totally understand - it's a big decision! Since you're comparing options, I wanted to mention something about this unit that's pretty special.\n\nThe apartment is on the 15th floor with floor-to-ceiling windows facing west, so you get amazing sunset views and tons of natural light throughout the day. Plus, it has a private balcony which is pretty rare in Nob Hill.\n\nWould it help to see it in person? Sometimes seeing the actual space and the views makes the decision easier.",
          timestamp: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000 + 16 * 12 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "The sunset views sound amazing. When could I see it?",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 10 * 30 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "I can schedule a tour for you! We have availability:\n\n• Tomorrow (Thursday) - 2 PM, 4 PM, or 6 PM\n• Friday - Anytime between 10 AM - 7 PM\n• Weekend - Saturday and Sunday both work\n\nAlso, if you come in the evening around 6-7 PM, you'll get to see those sunset views in person which is really something special!\n\nWhat day and time works best?",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 10 * 35 * 60 * 1000).toISOString()
        },
        {
          sender: "user",
          message: "Friday evening would be perfect! Maybe 6:30 PM?",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 11 * 15 * 60 * 1000).toISOString()
        },
        {
          sender: "ai",
          message: "Perfect! Friday at 6:30 PM it is. You'll get to see those sunset views! 🌅\n\nI'll send you the exact address and building access info tomorrow. The building has a doorman, so just let them know you're there for a tour with LEASAP.\n\nLooking forward to showing you the place!",
          timestamp: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 11 * 20 * 60 * 1000).toISOString()
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
  const [scheduledTours, setScheduledTours] = useState<Set<string>>(new Set());
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
            message: `Hey ${customer.name.split(' ')[0]}! 👋\n\nI noticed you were interested in ${customer.property} a few weeks ago. I wanted to reach out because we just had a similar unit become available with some great updates.\n\nAre you still looking?`,
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

  const handleScheduleTour = (customer: OldCustomer) => {
    if (!selectedCustomer || selectedCustomer.id !== customer.id) return;
    
    const tourScheduled = scheduledTours.has(customer.id);
    
    if (!tourScheduled) {
      // Add AI message about scheduling
      const newMessage = {
        sender: "ai" as const,
        message: "Great! I'd be happy to schedule a tour for you. What day and time works best? We have availability this week and next.\n\nJust let me know your preference and I'll confirm it right away!",
        timestamp: new Date().toISOString()
      };

      const updatedCustomer: OldCustomer = {
        ...customer,
        aiConversation: [...customer.aiConversation, newMessage],
        status: customer.status === "ai_reached_out" ? "customer_responded" : customer.status
      };

      setOldCustomers(prev => 
        prev.map(c => c.id === customer.id ? updatedCustomer : c)
      );
      setSelectedCustomer(updatedCustomer);
      setScheduledTours(prev => new Set(prev).add(customer.id));
    }
  };

  if (selectedCustomer) {
    const conversationStats = {
      messageCount: selectedCustomer.aiConversation.length,
      aiMessages: selectedCustomer.aiConversation.filter(m => m.sender === "ai").length,
      userMessages: selectedCustomer.aiConversation.filter(m => m.sender === "user").length,
      lastMessage: selectedCustomer.aiConversation[selectedCustomer.aiConversation.length - 1]
    };

    const isTourScheduled = scheduledTours.has(selectedCustomer.id);

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
                    <div className="md:col-span-2">
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
                      This customer previously {selectedCustomer.dropOffReason.toLowerCase()}. LEASAP AI is following up to share updated availability and offer flexible tour options.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section B: Past Call Summary */}
            <Card className="bg-gradient-to-br from-gray-50 to-white border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  Previous Call Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-inner">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedCustomer.pastCallSummary}
                  </p>
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
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-400 text-xs flex-1">Conversation in progress</span>
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
                            onClick={() => handleScheduleTour(selectedCustomer)}
                            disabled={isTourScheduled}
                            className={`border-gray-600 text-gray-300 hover:bg-gray-700 text-xs ${
                              isTourScheduled ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            {isTourScheduled ? "Tour Scheduled" : "Schedule Tour"}
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
