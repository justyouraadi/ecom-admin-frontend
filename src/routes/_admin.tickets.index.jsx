import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { LifeBuoy, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/admin-api";

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

export const Route = createFileRoute("/_admin/tickets/")({
  ssr: false,
  component: TicketsPage,
});

function TicketsPage() {
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ tickets: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sortBy, sortOrder };
      if (status !== "all") params.status = status;
      if (priority !== "all") params.priority = priority;
      const result = await api.listTickets(params);
      setData(result);
    } catch {
      setData({ tickets: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
    } finally {
      setLoading(false);
    }
  }, [page, status, priority, sortBy, sortOrder]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const { tickets, pagination } = data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">Tickets</h1>
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${pagination.total} ticket(s)`}
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="h-10 rounded-xl w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => { setPriority(v); setPage(1); }}>
          <SelectTrigger className="h-10 rounded-xl w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
          <SelectTrigger className="h-10 rounded-xl w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Newest</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(v) => { setSortOrder(v); setPage(1); }}>
          <SelectTrigger className="h-10 rounded-xl w-[110px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Desc</SelectItem>
            <SelectItem value="asc">Asc</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 shadow-soft overflow-hidden animate-pulse">
              <div className="p-4 space-y-3">
                <div className="h-4 bg-accent/50 rounded w-1/3" />
                <div className="h-3 bg-accent/50 rounded w-2/3" />
                <div className="h-3 bg-accent/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <LifeBuoy className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No tickets match those filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((t) => {
            const u = t.user || {};
            return (
              <Link
                key={t.id}
                to="/tickets/$id"
                params={{ id: String(t.id) }}
                className="rounded-2xl border border-border/60 shadow-soft bg-card overflow-hidden hover:shadow-md transition-shadow block p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs text-muted-foreground">{t.ticketId}</span>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge
                      className={`${priorityTone[t.priority] || "bg-muted text-muted-foreground"} rounded-full font-normal text-[11px] tracking-wide px-2.5 py-0.5 border-0`}
                    >
                      {t.priority?.toLowerCase()}
                    </Badge>
                    <Badge
                      className={`${statusTone[t.status] || "bg-muted text-muted-foreground"} rounded-full font-normal text-[11px] tracking-wide px-2.5 py-0.5 border-0`}
                    >
                      {t.status === "IN_PROGRESS" ? "progress" : t.status?.toLowerCase()}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium truncate">{t.subject}</div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.description}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{u.name || "—"}</span>
                  {t._count?.messages > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {t._count.messages}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-xl"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="rounded-xl"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}