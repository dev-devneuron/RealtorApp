/**
 * Outbound Calling Tab Component
 * 
 * PM-only dashboard for managing outbound calling campaigns:
 * - Candidates: Review eligible follow-up contacts and trigger calls
 * - Contacts: Manage consent and opt-out status
 * - Analytics: View performance metrics
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Users, BarChart3 } from "lucide-react";
import { API_BASE } from "./constants";
import { CandidatesTab } from "./CandidatesTab";
import { ContactsTab } from "./ContactsTab";
import { AnalyticsTab } from "./AnalyticsTab";
import { toast } from "sonner";

interface OutboundCallingTabProps {
  userType: string | null;
}

export const OutboundCallingTab = ({ userType }: OutboundCallingTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState<string>("candidates");

  // Only show for Property Managers
  if (userType !== "property_manager") {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-red-100 rounded-full">
              <Phone className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Access Restricted</h3>
            <p className="text-gray-600 max-w-md">
              Outbound calling features are only available to Property Managers.
              Please contact your administrator if you need access.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-200 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-4 rounded-lg shadow-sm">
                <Phone className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                  Outbound Calling
                </CardTitle>
                <p className="text-gray-600 text-base">
                  Manage follow-up calls, consent, and track campaign performance.
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
            <div className="border-b border-gray-200 px-6 pt-4">
              <TabsList className="bg-transparent h-auto p-0 gap-2">
                <TabsTrigger
                  value="candidates"
                  className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 data-[state=active]:font-bold data-[state=active]:border-amber-300 rounded-lg px-4 py-2 font-medium transition-all border border-gray-200 hover:bg-gray-50"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Candidates
                </TabsTrigger>
                <TabsTrigger
                  value="contacts"
                  className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 data-[state=active]:font-bold data-[state=active]:border-amber-300 rounded-lg px-4 py-2 font-medium transition-all border border-gray-200 hover:bg-gray-50"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Contacts
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 data-[state=active]:font-bold data-[state=active]:border-amber-300 rounded-lg px-4 py-2 font-medium transition-all border border-gray-200 hover:bg-gray-50"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="candidates" className="mt-0">
              <CandidatesTab />
            </TabsContent>

            <TabsContent value="contacts" className="mt-0">
              <ContactsTab />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <AnalyticsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

