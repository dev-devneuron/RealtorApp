/**
 * Contacts Tab Component - Modern Redesign
 * 
 * Sleek interface for managing consent and opt-out status
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
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

  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.phone_number.toLowerCase().includes(query) ||
        c.name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query)
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

  // Contact Card Component
  const ContactCard = ({ contact }: { contact: Contact }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`overflow-hidden transition-all hover:shadow-lg ${
          contact.opted_out ? "border-red-200 bg-red-50/30" : "border-gray-200"
        }`}>
          <CardContent className="p-0">
            {/* Header */}
            <div className="p-4 border-b bg-white/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {contact.name || "Unknown"}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => handleCopy(contact.phone_number, "Phone")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
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

            {/* Contact Info */}
            <div className="p-4 space-y-3">
              {/* Email */}
              {contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <div 
                    className="flex-1 text-sm text-blue-600 cursor-pointer hover:underline"
                    onClick={() => handleCopy(contact.email!, "Email")}
                  >
                    {contact.email}
                  </div>
                </div>
              )}

              {/* Consent Info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                {contact.consent_status && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Consent Source:</span>
                    <span className="font-medium">{contact.consent_source || "Unknown"}</span>
                  </div>
                )}
                {contact.consent_timestamp && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Consent Date:</span>
                    <span className="font-medium">{formatDate(contact.consent_timestamp)}</span>
                  </div>
                )}
                {contact.opt_out_timestamp && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-600">Opt-out Date:</span>
                    <span className="font-medium text-red-700">{formatDate(contact.opt_out_timestamp)}</span>
                  </div>
                )}
                {contact.opt_out_method && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-600">Opt-out Method:</span>
                    <span className="font-medium text-red-700">{contact.opt_out_method}</span>
                  </div>
                )}
              </div>

              {/* Call Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{contact.call_attempt_count} {contact.call_attempt_count === 1 ? 'attempt' : 'attempts'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{formatDate(contact.last_called_at)}</span>
                </div>
                {contact.last_call_outcome && (
                  <div className="col-span-2">
                    <Badge variant="outline" className="text-xs">
                      Last: {contact.last_call_outcome}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t bg-gray-50/50">
              <div className="flex gap-2">
                {!contact.opted_out && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedContact(contact);
                      setShowConsentDialog(true);
                    }}
                    disabled={processing}
                    className="flex-1"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Record Consent
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={contact.opted_out ? "outline" : "destructive"}
                  onClick={() => {
                    setSelectedContact(contact);
                    setShowOptOutDialog(true);
                  }}
                  disabled={processing || contact.opted_out}
                  className={contact.opted_out ? "flex-1" : "flex-1"}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  {contact.opted_out ? "Already Opted Out" : "Opt Out"}
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
                placeholder="Search by phone, name, or email..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  );
};
