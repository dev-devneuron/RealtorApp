/**
 * Contacts Tab Component - Modern Redesign
 * 
 * Sleek interface for managing consent and opt-out status
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Shield,
  Ban,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Phone,
  Filter,
  AlertTriangle,
  MapPin,
  Globe,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchContacts,
  optOutContact,
  recordConsent,
  type Contact,
} from "./outboundCallingApi";
import { formatPhoneNumber } from "./utils";

export const ContactsTab = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [optedOutFilter, setOptedOutFilter] = useState<string>("all");
  const [consentFilter, setConsentFilter] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showOptOutDialog, setShowOptOutDialog] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [consentSource, setConsentSource] = useState("manual");
  const [processing, setProcessing] = useState(false);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const optedOut = optedOutFilter === "opted_out" ? true : optedOutFilter === "not_opted_out" ? false : undefined;
      const data = await fetchContacts(limit, offset, optedOut);
      setContacts(data.contacts || []);
      setTotal(data.total || data.contacts?.length || 0);
    } catch (error: any) {
      toast.error(error.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [offset, optedOutFilter]);

  const handleOptOut = async () => {
    if (!selectedContact) return;

    setProcessing(true);
    try {
      await optOutContact(selectedContact.contact_id);
      toast.success("Contact opted out permanently");
      setShowOptOutDialog(false);
      setSelectedContact(null);
      await loadContacts();
    } catch (error: any) {
      toast.error(error.message || "Failed to opt out contact");
    } finally {
      setProcessing(false);
    }
  };

  const handleRecordConsent = async () => {
    if (!selectedContact) return;

    setProcessing(true);
    try {
      await recordConsent(selectedContact.contact_id, consentSource);
      toast.success("Consent recorded");
      setShowConsentDialog(false);
      setSelectedContact(null);
      await loadContacts();
    } catch (error: any) {
      toast.error(error.message || "Failed to record consent");
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "Invalid date";
    }
  };

  // Helper functions for inquiry context
  const hasInquiryContext = (contact: Contact): boolean => {
    return !!(
      contact.inquiry_property || 
      contact.inquiry_purpose || 
      contact.inquiry_summary ||
      contact.extracted_region
    );
  };

  const getPurposeBadgeClass = (purpose?: string | null): string => {
    if (!purpose) return "bg-gray-500";
    
    const purposeKey = purpose.toLowerCase().replace(/\s+/g, '-');
    const colorMap: Record<string, string> = {
      'booking-a-tour': 'bg-green-500',
      'pricing-inquiry': 'bg-blue-500',
      'availability-inquiry': 'bg-yellow-500',
      'maintenance-request': 'bg-orange-500',
      'general-information': 'bg-gray-500',
      'viewing-request': 'bg-purple-500',
      'application-inquiry': 'bg-pink-500',
    };
    
    return colorMap[purposeKey] || 'bg-gray-500';
  };

  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.phone_number.toLowerCase().includes(query) ||
        c.name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.inquiry_property?.toLowerCase().includes(query)
      );
    }

    if (consentFilter === "has_consent" && !filtered.some(c => c.consent_status)) {
      filtered = filtered.filter(c => c.consent_status);
    } else if (consentFilter === "no_consent" && !filtered.some(c => !c.consent_status)) {
      filtered = filtered.filter(c => !c.consent_status);
    }

    return filtered;
  }, [contacts, searchQuery, consentFilter]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const handleViewDetails = (contact: Contact, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDetailContact(contact);
    setShowDetailDialog(true);
  };

  // Contact Card Component - Simplified
  const ContactCard = ({ contact }: { contact: Contact }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        <Card 
          className={`overflow-hidden transition-all hover:shadow-lg cursor-pointer h-full flex flex-col ${
            contact.opted_out ? "border-red-200 bg-red-50/30" : "border-gray-200"
          }`}
          onClick={() => handleViewDetails(contact)}
        >
          <CardContent className="p-0 flex flex-col h-full" style={{ minHeight: '280px' }}>
            {/* Header */}
            <div className="p-4 border-b bg-white/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {contact.name || "N/A"}
                    </h3>
                    {contact.opted_out && (
                      <Badge variant="destructive" className="text-xs">
                        <Ban className="h-3 w-3 mr-1" />
                        Opted Out
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="font-mono">{formatPhoneNumber(contact.phone_number)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {contact.consent_status ? (
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Has Consent
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      No Consent
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Essential Info - Compact */}
            <div className="p-4 space-y-2 flex-1">
              {/* Email */}
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                <div 
                  className={`flex-1 text-sm truncate ${
                    contact.email 
                      ? "text-blue-600 cursor-pointer hover:underline" 
                      : "text-gray-400"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (contact.email) handleCopy(contact.email, "Email");
                  }}
                >
                  {contact.email || "N/A"}
                </div>
              </div>

              {/* Property - Show on Card */}
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 text-sm text-gray-700 truncate" title={contact.inquiry_property || undefined}>
                  {contact.inquiry_property || "N/A"}
                </div>
              </div>

              {/* Purpose Badge - Quick View */}
              {contact.inquiry_purpose && (
                <div>
                  <Badge 
                    className={`${getPurposeBadgeClass(contact.inquiry_purpose)} text-white text-xs px-2 py-1`}
                  >
                    {contact.inquiry_purpose}
                  </Badge>
                </div>
              )}

              {/* Quick Stats */}
              <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="truncate">{formatDate(contact.last_called_at).split(',')[0] || "N/A"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{contact.call_attempt_count}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t bg-gray-50/50">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(contact);
                  }}
                  className="flex-1"
                >
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Details
                </Button>
                {!contact.opted_out && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContact(contact);
                      setShowConsentDialog(true);
                    }}
                    disabled={processing}
                    className="flex-1"
                  >
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    Consent
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={contact.opted_out ? "outline" : "destructive"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedContact(contact);
                    setShowOptOutDialog(true);
                  }}
                  disabled={processing || contact.opted_out}
                  className="flex-1"
                >
                  <Ban className="h-3.5 w-3.5 mr-1.5" />
                  {contact.opted_out ? "Opted Out" : "Opt Out"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-500" />
            Contact Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {total} total contacts • {filteredContacts.length} shown
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadContacts}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by phone, name, email, or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Opt-out Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={optedOutFilter} onValueChange={setOptedOutFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Opt-out Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="opted_out">Opted Out</SelectItem>
                  <SelectItem value="not_opted_out">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Consent Filter */}
            <Select value={consentFilter} onValueChange={setConsentFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Consent Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Consent</SelectItem>
                <SelectItem value="has_consent">Has Consent</SelectItem>
                <SelectItem value="no_consent">No Consent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No contacts found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          <AnimatePresence>
            {filteredContacts.map((contact) => (
              <ContactCard key={contact.contact_id} contact={contact} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} • {total} total contacts
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opt-out Confirmation Dialog */}
      <AlertDialog open={showOptOutDialog} onOpenChange={setShowOptOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Permanent Opt-Out
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-semibold text-red-700 text-sm">
                  ⚠️ This action is PERMANENT and cannot be undone.
                </p>
              </div>
              <p>
                Are you sure you want to opt out{" "}
                <span className="font-mono font-semibold">
                  {selectedContact && formatPhoneNumber(selectedContact.phone_number)}
                </span>?
              </p>
              <p className="text-sm text-gray-600">
                This contact will no longer receive outbound calls from your system.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleOptOut}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Opt-Out"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Consent Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Record Consent
            </DialogTitle>
            <DialogDescription>
              Record consent for{" "}
              <span className="font-mono font-semibold">
                {selectedContact && formatPhoneNumber(selectedContact.phone_number)}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Consent Source</label>
              <Select value={consentSource} onValueChange={setConsentSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConsentDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordConsent}
              disabled={processing}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Record Consent
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-amber-600" />
              Contact Details
            </DialogTitle>
            <DialogDescription>
              Complete information for {detailContact && formatPhoneNumber(detailContact.phone_number)}
            </DialogDescription>
          </DialogHeader>
          
          {detailContact && (
            <div className="space-y-6 py-4">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Name</div>
                        <div className="font-semibold text-gray-900">
                          {detailContact.name || "N/A"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Phone</div>
                        <div className="font-mono font-semibold text-gray-900 flex items-center gap-2">
                          {formatPhoneNumber(detailContact.phone_number)}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleCopy(detailContact.phone_number, "Phone")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Email</div>
                        <div 
                          className={`font-semibold flex items-center gap-2 ${
                            detailContact.email 
                              ? "text-blue-600 cursor-pointer hover:underline" 
                              : "text-gray-400"
                          }`}
                          onClick={() => {
                            if (detailContact.email) handleCopy(detailContact.email, "Email");
                          }}
                        >
                          {detailContact.email || "N/A"}
                        </div>
                      </div>
                    </div>
                    {detailContact.timezone && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-gray-500" />
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Timezone</div>
                          <div className="font-semibold text-gray-900">{detailContact.timezone}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Property Inquiry Context - Full Details */}
              {hasInquiryContext(detailContact) ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      Property Inquiry Context
                      <Badge variant="outline" className="text-xs border-blue-400 text-blue-700">
                        AI Extracted
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Inquiry Summary - MOST IMPORTANT */}
                    {detailContact.inquiry_summary && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-bold text-blue-900 uppercase tracking-wide">Complete Summary</span>
                        </div>
                        <div className="text-base text-gray-900 leading-relaxed whitespace-pre-wrap font-medium mb-2">
                          {detailContact.inquiry_summary}
                        </div>
                        <div className="pt-2 border-t border-blue-200">
                          <span className="text-xs text-blue-600 italic">Combined: Purpose | Property | Email</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Property Address */}
                    {detailContact.inquiry_property && (
                      <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                            <MapPin className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Property Address</div>
                            <div className="text-base font-semibold text-gray-900 leading-relaxed">
                              {detailContact.inquiry_property}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Purpose */}
                    {detailContact.inquiry_purpose && (
                      <div>
                        <div className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Purpose</div>
                        <Badge 
                          className={`${getPurposeBadgeClass(detailContact.inquiry_purpose)} text-white text-base px-4 py-2 font-semibold`}
                        >
                          {detailContact.inquiry_purpose}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Region */}
                    {detailContact.extracted_region && (
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide mr-2">Region:</span>
                          <span className="text-base font-semibold text-gray-900">{detailContact.extracted_region}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Full Call Summary */}
                    {detailContact.call_summary && detailContact.call_summary !== detailContact.inquiry_summary && (
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <details className="group">
                          <summary className="cursor-pointer text-sm font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-2 list-none mb-3">
                            <MessageSquare className="h-5 w-5" />
                            <span>View Full Call Summary</span>
                            <span className="ml-auto text-xs text-blue-600 group-open:hidden">▼</span>
                            <span className="ml-auto text-xs text-blue-600 hidden group-open:inline">▲</span>
                          </summary>
                          <div className="pt-3 border-t border-blue-200">
                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {detailContact.call_summary}
                            </div>
                          </div>
                        </details>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Property Inquiry Context</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      No property inquiries available
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Call History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Call History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Last Called</div>
                      <div className="font-semibold text-gray-900">{formatDate(detailContact.last_called_at) || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Call Attempts</div>
                      <div className="font-semibold text-gray-900">{detailContact.call_attempt_count}</div>
                    </div>
                    {detailContact.last_call_outcome && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Last Outcome</div>
                        <Badge variant="outline">
                          {detailContact.last_call_outcome}
                        </Badge>
                      </div>
                    )}
                    {detailContact.last_booking_at && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Last Booking</div>
                        <div className="font-semibold text-gray-900">{formatDate(detailContact.last_booking_at)}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Consent & Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consent & Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      {detailContact.consent_status ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Consent Status</div>
                        <div className="font-semibold text-gray-900">
                          {detailContact.consent_status ? "Has Consent" : "No Consent"}
                        </div>
                        {detailContact.consent_source && (
                          <div className="text-xs text-gray-500 mt-1">Source: {detailContact.consent_source}</div>
                        )}
                        {detailContact.consent_timestamp && (
                          <div className="text-xs text-gray-500 mt-1">Date: {formatDate(detailContact.consent_timestamp)}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {detailContact.opted_out ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Opt-out Status</div>
                        <div className="font-semibold text-gray-900">
                          {detailContact.opted_out ? "Opted Out" : "Active"}
                        </div>
                        {detailContact.opt_out_method && (
                          <div className="text-xs text-gray-500 mt-1">Method: {detailContact.opt_out_method}</div>
                        )}
                        {detailContact.opt_out_timestamp && (
                          <div className="text-xs text-gray-500 mt-1">Date: {formatDate(detailContact.opt_out_timestamp)}</div>
                        )}
                      </div>
                    </div>
                    {detailContact.dnc_flag && (
                      <div className="md:col-span-2">
                        <div className="text-xs text-gray-500 mb-1">DNC Flag</div>
                        <Badge variant="destructive">Do Not Call</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
            {detailContact && !detailContact.opted_out && (
              <Button
                onClick={() => {
                  setShowDetailDialog(false);
                  setSelectedContact(detailContact);
                  setShowConsentDialog(true);
                }}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Shield className="h-4 w-4 mr-2" />
                Record Consent
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
