import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Package, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { api, ApiError, imageUrl } from "@/lib/admin-api";
import { orders as fallbackOrders } from "@/lib/mock-data";

const statusTone = {
  PENDING: "bg-accent text-accent-foreground",
  CONFIRMED: "bg-primary/15 text-primary",
  SHIPPED: "bg-primary/25 text-primary",
  DELIVERED: "bg-primary text-primary-foreground",
  CANCELLED: "bg-destructive/15 text-destructive",
};

const nextStatuses = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const Route = createFileRoute("/_admin/orders/")({
  ssr: false,
  component: OrdersPage,
});

function OrdersPage() {
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ orders: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sortBy, sortOrder };
      if (status !== "all") params.status = status;
      const result = await api.listOrders(params);
      setData(result);
    } catch {
      setData({ orders: pagination.total === 0 ? fallbackOrders : data.orders, pagination: { page: 1, limit: 10, total: fallbackOrders.length, totalPages: 1 } });
    } finally {
      setLoading(false);
    }
  }, [page, status, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 300);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  async function handleStatusUpdate(orderId, newStatus) {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      toast.success(`Order #${orderId} → ${newStatus.toLowerCase()}`);
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Status update failed");
    }
  }

  const { orders, pagination } = data;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${pagination.total} order(s)`}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="h-10 rounded-xl w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
          <SelectTrigger className="h-10 rounded-xl w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Newest</SelectItem>
            <SelectItem value="totalAmount">Total</SelectItem>
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
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No orders match those filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((o) => {
            const user = o.user?.name ?? o.user ?? o.userName ?? "—";
            const phone = o.user?.phone ?? "";
            const p = o.product || {};
            const next = nextStatuses[o.status] || [];
            return (
              <div
                key={o.id}
                className="rounded-2xl border border-border/60 shadow-soft bg-card overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link
                  to="/orders/$id"
                  params={{ id: String(o.id) }}
                  className="block p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">#{o.id}</span>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge
                      className={`${statusTone[o.status] || "bg-muted text-muted-foreground"} rounded-full font-normal text-[11px] tracking-wide px-2.5 py-0.5 border-0 pointer-events-none`}
                    >
                      {o.status.toLowerCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {p.assets?.[0] ? (
                      <img
                        src={imageUrl(p.assets[0])}
                        alt={p.name}
                        className="h-10 w-10 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-accent grid place-items-center shrink-0">
                        <Package className="h-4 w-4 text-accent-foreground/60" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{p.name || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.quantity} × ₹{p.sellingPrice || "—"} = <span className="font-medium text-foreground">₹{o.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs">
                    <div className="text-muted-foreground">{user}</div>
                    {phone && <div className="text-muted-foreground">{phone}</div>}
                  </div>
                </Link>

                {next.length > 0 && (
                  <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs w-full">
                          <ChevronDown className="h-3.5 w-3.5 mr-1" />
                          Update status
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        {next.map((ns) => (
                          <DropdownMenuItem
                            key={ns}
                            onClick={() => handleStatusUpdate(o.id, ns)}
                            className="rounded-lg cursor-pointer text-xs"
                          >
                            {ns === "CANCELLED" ? "Cancel" : `Mark ${ns.toLowerCase()}`}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
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