/**
 * Analytics Tab Component - Modern Redesign
 * 
 * Beautiful analytics dashboard for outbound calling campaigns
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Phone,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Target,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAnalytics, type Analytics } from "./outboundCallingApi";

export const AnalyticsTab = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await fetchAnalytics(days);
      setAnalytics(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  if (loading && !analytics) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const successRate = analytics.total_outbound_calls > 0
    ? ((analytics.estimated_bookings / analytics.total_outbound_calls) * 100).toFixed(1)
    : "0.0";

  const optOutRate = analytics.total_outbound_calls > 0
    ? ((analytics.opt_outs / analytics.total_outbound_calls) * 100).toFixed(1)
    : "0.0";

  const conversionRate = analytics.total_outbound_calls > 0
    ? ((analytics.estimated_bookings / analytics.total_outbound_calls) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-amber-500" />
            Campaign Analytics
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Performance metrics for the last {analytics.period_days} days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Phone className="h-6 w-6" />
                </div>
                <TrendingUp className="h-5 w-5 opacity-80" />
              </div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Calls</p>
              <p className="text-4xl font-bold">{analytics.total_outbound_calls}</p>
              <p className="text-blue-100 text-xs mt-2">Outbound calls made</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <Target className="h-5 w-5 opacity-80" />
              </div>
              <p className="text-green-100 text-sm font-medium mb-1">Bookings</p>
              <p className="text-4xl font-bold">{analytics.estimated_bookings}</p>
              <p className="text-green-100 text-xs mt-2">Resulting bookings</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <Sparkles className="h-5 w-5 opacity-80" />
              </div>
              <p className="text-amber-100 text-sm font-medium mb-1">Success Rate</p>
              <p className="text-4xl font-bold">{successRate}%</p>
              <p className="text-amber-100 text-xs mt-2">Calls to bookings</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-red-500 to-red-600 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <XCircle className="h-6 w-6" />
                </div>
                <TrendingDown className="h-5 w-5 opacity-80" />
              </div>
              <p className="text-red-100 text-sm font-medium mb-1">Opt-outs</p>
              <p className="text-4xl font-bold">{analytics.opt_outs}</p>
              <p className="text-red-100 text-xs mt-2">{optOutRate}% opt-out rate</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Breakdown */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-600" />
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Total Outbound Calls</p>
                    <p className="text-sm text-gray-600">All calls initiated</p>
                  </div>
                </div>
                <Badge className="bg-blue-500 text-lg px-4 py-2 font-bold">
                  {analytics.total_outbound_calls}
                </Badge>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Estimated Bookings</p>
                    <p className="text-sm text-gray-600">Bookings from calls</p>
                  </div>
                </div>
                <Badge className="bg-green-500 text-lg px-4 py-2 font-bold">
                  {analytics.estimated_bookings}
                </Badge>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Conversion Rate</p>
                    <p className="text-sm text-gray-600">Calls to bookings</p>
                  </div>
                </div>
                <Badge className="bg-amber-500 text-lg px-4 py-2 font-bold">
                  {conversionRate}%
                </Badge>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <XCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Opt-outs</p>
                    <p className="text-sm text-gray-600">Permanent opt-outs</p>
                  </div>
                </div>
                <Badge variant="destructive" className="text-lg px-4 py-2 font-bold">
                  {analytics.opt_outs}
                </Badge>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="shadow-lg bg-gradient-to-br from-amber-50 via-white to-blue-50 border-amber-200">
          <CardHeader className="border-b border-amber-200">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              Campaign Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="bg-white/80 rounded-lg p-4 border border-amber-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Over the last <span className="font-bold text-amber-700">{analytics.period_days} days</span>, 
                  you've made <span className="font-bold text-blue-700">{analytics.total_outbound_calls}</span> outbound calls,
                  resulting in approximately{" "}
                  <span className="font-bold text-green-700">{analytics.estimated_bookings}</span> bookings
                  ({successRate}% success rate).
                </p>
              </div>
              
              <div className="bg-white/80 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  During this period, <span className="font-bold text-red-700">{analytics.opt_outs}</span> contacts
                  opted out permanently ({optOutRate}% opt-out rate).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white/80 rounded-lg p-3 border border-blue-200 text-center">
                  <div className="text-2xl font-bold text-blue-700">{successRate}%</div>
                  <div className="text-xs text-gray-600 mt-1">Success Rate</div>
                </div>
                <div className="bg-white/80 rounded-lg p-3 border border-red-200 text-center">
                  <div className="text-2xl font-bold text-red-700">{optOutRate}%</div>
                  <div className="text-xs text-gray-600 mt-1">Opt-out Rate</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
