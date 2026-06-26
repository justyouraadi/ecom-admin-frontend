import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, LifeBuoy, Send, Paperclip, User, Shield } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { api, ApiError, imageUrl } from "@/lib/admin-api";

const statusTone = {
  OPEN: "bg-accent text-accent-foreground",
  IN_PROGRESS: "bg-primary/15 text-primary",
  RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CLOSED: "bg-muted text-muted-foreground",
};

const priorityTone = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-primary/15 text-primary",
  HIGH: "bg-destructive/15 text-destructive",
  URGENT: "bg-destructive text-destructive-foreground",
};

const nextStatuses = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
};

export const Route = createFileRoute("/_admin/tickets/$id")({
  ssr: false,
  component: TicketDetail,
});

function TicketDetail() {
  const { id } = Route.useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [attachFiles, setAttachFiles] = useState([]);
  const fileRef = useRef(null);

  useEffect(() => {
    api.getTicket(id).then((data) => {
      setTicket(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [id]);

  async function handleStatusUpdate(newStatus) {
    try {
      await api.updateTicketStatus(ticket.id, newStatus);
      toast.success(`Ticket ${ticket.ticketId} → ${newStatus.toLowerCase()}`);
      setTicket((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Status update failed");
    }
  }

  async function handleReply(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);

    const fd = new FormData();
    fd.append("message", message.trim());
    attachFiles.forEach((f) => fd.append("attachments", f));

    try {
      const result = await api.replyToTicket(ticket.id, fd);
      setTicket((prev) => prev ? {
        ...prev,
        messages: [...(prev.messages || []), result],
      } : prev);
      setMessage("");
      setAttachFiles([]);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Reply sent");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to send reply");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-5">
        <Button variant="ghost" size="sm" asChild className="rounded-lg -ml-2">
          <Link to="/tickets"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
        </Button>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!ticket) throw notFound();

  const u = ticket.user || {};
  const messages = ticket.messages || [];
  const next = nextStatuses[ticket.status] || [];

  return (
    <div className="max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="rounded-lg -ml-2">
        <Link to="/tickets"><ArrowLeft className="h-4 w-4 mr-2" />Back to tickets</Link>
      </Button>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">
            <span className="font-mono text-muted-foreground">{ticket.ticketId}</span>
            <span className="ml-3">{ticket.subject}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Opened {new Date(ticket.createdAt).toLocaleDateString()} &middot; {u.name || "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge
            className={`${priorityTone[ticket.priority] || "bg-muted text-muted-foreground"} rounded-full font-normal text-sm tracking-wide px-3 py-1 border-0`}
          >
            {ticket.priority?.toLowerCase()}
          </Badge>
          <Badge
            className={`${statusTone[ticket.status] || "bg-muted text-muted-foreground"} rounded-full font-normal text-sm tracking-wide px-3 py-1 border-0`}
          >
            {ticket.status === "IN_PROGRESS" ? "in progress" : ticket.status?.toLowerCase()}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base font-medium">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Messages ({messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No messages yet.</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${m.senderType === "ADMIN" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full grid place-items-center shrink-0 text-xs ${
                        m.senderType === "ADMIN"
                          ? "bg-primary/15 text-primary"
                          : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {m.senderType === "ADMIN" ? (
                        <Shield className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] space-y-1.5 ${
                        m.senderType === "ADMIN" ? "items-end" : ""
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          m.senderType === "ADMIN"
                            ? "bg-primary/10 text-foreground"
                            : "bg-accent text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.message}</p>
                        {m.attachments?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {m.attachments.map((a, i) => (
                              <img
                                key={i}
                                src={imageUrl(a)}
                                alt={`attachment ${i + 1}`}
                                className="h-20 w-20 rounded-xl object-cover border border-border/40"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div
                        className={`text-[11px] text-muted-foreground flex gap-2 ${
                          m.senderType === "ADMIN" ? "justify-end" : ""
                        }`}
                      >
                        <span>{m.senderType === "ADMIN" ? "Admin" : u.name || "User"}</span>
                        <span>{new Date(m.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {ticket.status !== "CLOSED" && (
            <Card className="rounded-2xl border-border/60 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base font-medium">Reply</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReply} className="space-y-3">
                  <Textarea
                    placeholder="Type your reply…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="rounded-xl min-h-[100px] resize-y"
                  />
                  <div className="flex items-center gap-3">
                    <Input
                      ref={fileRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setAttachFiles(Array.from(e.target.files || []))}
                      className="h-10 rounded-xl text-sm flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={submitting || !message.trim()}
                      className="rounded-xl shrink-0"
                    >
                      <Send className="h-4 w-4 mr-1.5" />
                      {submitting ? "Sending…" : "Send"}
                    </Button>
                  </div>
                  {attachFiles.length > 0 && (
                    <p className="text-xs text-muted-foreground">{attachFiles.length} file(s) attached</p>
                  )}
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base font-medium">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Field label="Name" value={u.name || "—"} />
              <Field label="Phone" value={u.phone || "—"} />
            </CardContent>
          </Card>

          {next.length > 0 && (
            <Card className="rounded-2xl border-border/60 shadow-soft border-primary/20">
              <CardHeader>
                <CardTitle className="text-base font-medium">Update status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {next.map((ns) => (
                    <Button
                      key={ns}
                      size="sm"
                      variant={ns === "CLOSED" ? "outline" : "default"}
                      onClick={() => handleStatusUpdate(ns)}
                      className="rounded-xl"
                    >
                      {ns === "IN_PROGRESS" ? "In progress" : ns.charAt(0) + ns.slice(1).toLowerCase()}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[11px] uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}