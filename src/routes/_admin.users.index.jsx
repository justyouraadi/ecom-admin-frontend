import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Search, Users as UsersIcon, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { api, ApiError } from "@/lib/admin-api";
import { users as fallbackUsers } from "@/lib/mock-data";

export const Route = createFileRoute("/_admin/users/")({
  ssr: false,
  component: UsersPage,
});

function UsersPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ users: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sortBy, sortOrder };
      if (status !== "all") params.status = status === "active";
      if (name.trim()) params.name = name.trim();
      if (phone.trim()) params.phone = phone.trim();
      const result = await api.listUsers(params);
      setData(result);
    } catch {
      setData({ users: fallbackUsers, pagination: { page: 1, limit: 10, total: fallbackUsers.length, totalPages: 1 } });
    } finally {
      setLoading(false);
    }
  }, [page, name, phone, status, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  async function toggleStatus(user) {
    const next = !user.status;
    try {
      await api.updateUserStatus(user.id, next);
      toast.success(`User ${next ? "enabled" : "disabled"}`);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update");
    }
  }

  const { users, pagination } = data;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${pagination.total} registered user(s)`}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Name…"
            value={name}
            onChange={(e) => { setName(e.target.value); setPage(1); }}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Phone…"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setPage(1); }}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="h-10 rounded-xl w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
          <SelectTrigger className="h-10 rounded-xl w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Joined date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="updatedAt">Updated</SelectItem>
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
                <div className="h-10 w-10 rounded-full bg-accent/50" />
                <div className="h-4 bg-accent/50 rounded w-1/2" />
                <div className="h-3 bg-accent/50 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <UsersIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No users match those filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-2xl border border-border/60 shadow-soft bg-card overflow-hidden hover:shadow-md transition-shadow"
            >
              <Link
                to="/users/$id"
                params={{ id: String(u.id) }}
                className="block p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  {u.profilePicture ? (
                    <img
                      src={u.profilePicture}
                      alt={u.name}
                      className="h-10 w-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-accent grid place-items-center text-sm font-medium text-accent-foreground shrink-0">
                      {u.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">{u.phone}</div>
                  </div>
                  <Badge
                    className={`rounded-full font-normal text-[11px] tracking-wide px-2.5 py-0.5 border-0 pointer-events-none ${
                      u.status ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {u.status ? "active" : "disabled"}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                  {u._orderCount !== undefined && (
                    <span>{u._orderCount} order(s)</span>
                  )}
                </div>
              </Link>

              <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <Switch checked={u.status} onCheckedChange={() => toggleStatus(u)} />
                </div>
              </div>
            </div>
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