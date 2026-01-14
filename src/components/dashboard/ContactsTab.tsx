/**
 * Contacts Tab Component
 * 
 * Manage consent and opt-out status for contacts.
 * Compliance-focused interface with permanent opt-out warnings.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    toast.success("Phone number copied");
  };

  const filteredContacts = contacts.filter((c) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        c.phone_number.toLowerCase().includes(query) ||
        c.name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Consent filter
    if (consentFilter === "has_consent" && !c.consent_status) return false;
    if (consentFilter === "no_consent" && c.consent_status) return false;

    return true;
  });

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Contact Management</h3>
          <p className="text-sm text-gray-600">
            Manage consent and opt-out status for {total} contacts
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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by phone, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={optedOutFilter} onValueChange={setOptedOutFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Opt-out Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Opt-out Status</SelectItem>
            <SelectItem value="opted_out">Opted Out</SelectItem>
            <SelectItem value="not_opted_out">Not Opted Out</SelectItem>
          </SelectContent>
        </Select>
        <Select value={consentFilter} onValueChange={setConsentFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Consent Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Consent</SelectItem>
            <SelectItem value="has_consent">Has Consent</SelectItem>
            <SelectItem value="no_consent">No Consent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>Name / Email</TableHead>
                  <TableHead>Consent</TableHead>
                  <TableHead>Opt-out</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Last Called</TableHead>
                  <TableHead>Last Outcome</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-600" />
                    </TableCell>
                  </TableRow>
                ) : filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No contacts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow
                      key={contact.contact_id}
                      className={contact.opted_out ? "bg-red-50/30" : ""}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {formatPhoneNumber(contact.phone_number)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleCopyPhone(contact.phone_number)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {contact.name && (
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <User className="h-3 w-3" />
                              {contact.name}
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.consent_status ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            No
                          </Badge>
                        )}
                        {contact.consent_source && (
                          <div className="text-xs text-gray-500 mt-1">
                            {contact.consent_source}
                          </div>
                        )}
                        {contact.consent_timestamp && (
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(contact.consent_timestamp).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.opted_out ? (
                          <div>
                            <Badge variant="destructive">
                              <Ban className="h-3 w-3 mr-1" />
                              Opted Out
                            </Badge>
                            {contact.opt_out_method && (
                              <div className="text-xs text-gray-500 mt-1">
                                {contact.opt_out_method}
                              </div>
                            )}
                            {contact.opt_out_timestamp && (
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(contact.opt_out_timestamp).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{contact.call_attempt_count}</Badge>
                      </TableCell>
                      <TableCell>
                        {contact.last_called_at ? (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Clock className="h-3 w-3" />
                            {new Date(contact.last_called_at).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.last_call_outcome ? (
                          <Badge variant="outline" className="text-xs">
                            {contact.last_call_outcome}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!contact.opted_out && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedContact(contact);
                                setShowConsentDialog(true);
                              }}
                              disabled={processing}
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              Consent
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
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            Opt Out
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Opt-out Confirmation Dialog */}
      <AlertDialog open={showOptOutDialog} onOpenChange={setShowOptOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanent Opt-Out</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold text-red-600">
                ⚠️ This action is PERMANENT and cannot be undone.
              </p>
              <p>
                Are you sure you want to opt out{" "}
                {selectedContact && formatPhoneNumber(selectedContact.phone_number)}?
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
            <DialogTitle>Record Consent</DialogTitle>
            <DialogDescription>
              Record consent for {selectedContact && formatPhoneNumber(selectedContact.phone_number)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Consent Source</label>
              <Select value={consentSource} onValueChange={setConsentSource}>
                <SelectTrigger className="mt-1">
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
              className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
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

