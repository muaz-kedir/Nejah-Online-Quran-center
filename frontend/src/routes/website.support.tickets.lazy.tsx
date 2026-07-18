/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useEffect, useState } from "react";
import { createLazyFileRoute} from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, GlassPanel } from "@/components/dashboard/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { requireAuth } from "@/lib/auth";
import {
  getTickets,
  updateTicket,
  type SupportTicket,
  TicketStatus,
  TicketPriority,
} from "@/lib/support-pages";
import { Loader2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createLazyFileRoute('/website/support/tickets')({
  component: TicketsCmsPage,
});

function TicketsCmsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [pag, setPag] = useState({ page: 1, totalPages: 1 });
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const q: any = { page: pag.page, limit: 20 };
      if (statusFilter) q.status = statusFilter;
      const result = await getTickets(q);
      setTickets(result.data);
      setPag((p) => ({ ...p, totalPages: result.meta.totalPages }));
    } catch (e: any) {
      toast.error(e.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [pag.page, statusFilter]);

  const handleUpdate = async (field: string, value: string) => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      await updateTicket(selectedTicket.id, { [field]: value });
      toast.success("Ticket updated");
      setSelectedTicket({ ...selectedTicket, [field]: value });
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          eyebrow="Website CMS"
          title="Support Tickets"
          description="Manage incoming support requests from the Help Center"
        />

        <GlassPanel className="p-6 space-y-4">
          <div className="flex gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPag({ ...pag, page: 1 });
              }}
            >
              <SelectTrigger className="max-w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tickets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tickets found.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-mono text-xs font-bold">{t.ticketId}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.email}</p>
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate">{t.subject}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[t.priority] || ""}`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[t.status] || ""}`}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button size="sm" variant="outline" onClick={() => setSelectedTicket(t)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pag.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: pag.totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={pag.page === p ? "default" : "outline"}
                  onClick={() => setPag({ ...pag, page: p })}
                >
                  {p}
                </Button>
              ))}
            </div>
          )}
        </GlassPanel>

        <Dialog open={selectedTicket !== null} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="sm:max-w-[600px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Ticket {selectedTicket?.ticketId}
              </DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Name</Label>
                    <p className="font-medium">{selectedTicket.name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{selectedTicket.email}</p>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <p className="font-medium">{selectedTicket.userRole || "—"}</p>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <p className="font-medium">{selectedTicket.subject}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <div className="rounded-xl border border-border p-3 bg-muted/20 text-sm whitespace-pre-wrap">
                    {selectedTicket.message}
                  </div>
                </div>

                {selectedTicket.attachmentUrl && (
                  <div className="space-y-1">
                    <Label>Attachment</Label>
                    <a
                      href={selectedTicket.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm underline"
                    >
                      View attachment
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(v) => handleUpdate("status", v)}
                      disabled={updating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={selectedTicket.priority}
                      onValueChange={(v) => handleUpdate("priority", v)}
                      disabled={updating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Created: {new Date(selectedTicket.createdAt).toLocaleString()} · Updated:{" "}
                  {new Date(selectedTicket.updatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
