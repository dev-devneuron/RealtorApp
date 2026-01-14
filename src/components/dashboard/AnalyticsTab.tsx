/**
 * Analytics Tab Component
 * 
 * Display performance metrics for outbound calling campaigns.
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Campaign Analytics</h3>
          <p className="text-sm text-gray-600">
            Performance metrics for the last {analytics.period_days} days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Total Calls</p>
                <p className="text-3xl font-bold text-blue-900">{analytics.total_outbound_calls}</p>
                <p className="text-xs text-blue-600 mt-1">Outbound calls made</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Phone className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Estimated Bookings</p>
                <p className="text-3xl font-bold text-green-900">{analytics.estimated_bookings}</p>
                <p className="text-xs text-green-600 mt-1">Resulting bookings</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-amber-900">{successRate}%</p>
                <p className="text-xs text-amber-600 mt-1">Calls to bookings</p>
              </div>
              <div className="p-3 bg-amber-200 rounded-full">
                <TrendingUp className="h-6 w-6 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Opt-outs</p>
                <p className="text-3xl font-bold text-red-900">{analytics.opt_outs}</p>
                <p className="text-xs text-red-600 mt-1">
                  {optOutRate}% opt-out rate
                </p>
              </div>
              <div className="p-3 bg-red-200 rounded-full">
                <XCircle className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Total Outbound Calls</p>
                <p className="text-sm text-gray-600">All calls initiated in the period</p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {analytics.total_outbound_calls}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Estimated Bookings</p>
                <p className="text-sm text-gray-600">Bookings resulting from calls</p>
              </div>
              <Badge className="bg-green-500 text-lg px-4 py-2">
                {analytics.estimated_bookings}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Success Rate</p>
                <p className="text-sm text-gray-600">Percentage of calls leading to bookings</p>
              </div>
              <Badge className="bg-amber-500 text-lg px-4 py-2">
                {successRate}%
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Opt-outs</p>
                <p className="text-sm text-gray-600">Contacts who opted out permanently</p>
              </div>
              <Badge variant="destructive" className="text-lg px-4 py-2">
                {analytics.opt_outs}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Opt-out Rate</p>
                <p className="text-sm text-gray-600">Percentage of calls resulting in opt-outs</p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {optOutRate}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
        <CardContent className="p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              Over the last {analytics.period_days} days, you've made{" "}
              <span className="font-semibold">{analytics.total_outbound_calls}</span> outbound calls,
              resulting in approximately{" "}
              <span className="font-semibold text-green-600">{analytics.estimated_bookings}</span> bookings
              ({successRate}% success rate).
            </p>
            <p>
              During this period, <span className="font-semibold text-red-600">{analytics.opt_outs}</span>{" "}
              contacts opted out ({optOutRate}% opt-out rate).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

