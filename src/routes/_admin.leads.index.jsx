import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Mail, Phone, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

import { api } from "@/lib/admin-api";

export const Route = createFileRoute("/_admin/leads/")({
  ssr: false,
  component: LeadsPage,
});

function LeadsPage() {
  const [sortOrder, setSortOrder] = useState("desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ leads: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sortOrder };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const result = await api.listLeads(params);
      setData(result);
    } catch {
      setData({ leads: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
    } finally {
      setLoading(false);
    }
  }, [page, sortOrder, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(fetchLeads, 300);
    return () => clearTimeout(timer);
  }, [fetchLeads]);

  const { leads, pagination } = data;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${pagination.total} lead(s)`}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[160px]">
          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="pl-9 h-10 rounded-xl"
            placeholder="Start date"
          />
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="pl-9 h-10 rounded-xl"
            placeholder="End date"
          />
        </div>
        <Select value={sortOrder} onValueChange={(v) => { setSortOrder(v); setPage(1); }}>
          <SelectTrigger className="h-10 rounded-xl w-[110px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest</SelectItem>
            <SelectItem value="asc">Oldest</SelectItem>
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
                <div className="h-12 bg-accent/50 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No leads match those filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((l) => (
            <Card
              key={l.id}
              className="rounded-2xl border-border/60 shadow-soft overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs text-muted-foreground">#{l.id}</span>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="font-medium text-sm break-words">{l.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 min-w-0">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{l.email}</span>
                  </div>
                  {l.phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 min-w-0">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{l.phone}</span>
                    </div>
                  )}
                </div>

                {l.message && (
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed break-words">
                    {l.message}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
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