import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  IndianRupee,
  ShoppingBag,
  Users,
  Package,
  LifeBuoy,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/admin-api";

export const Route = createFileRoute("/_admin/dashboard")({
  ssr: false,
  component: Dashboard,
});

function Dashboard() {
  const [filter, setFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = { filter };
      if (filter === "custom") {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const result = await api.getDashboard(params);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filter, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = data ? [
    { label: "Revenue", value: `₹${Number(data.totalSales).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, icon: IndianRupee },
    { label: "Orders", value: data.totalOrders, icon: ShoppingBag, to: "/orders" },
    { label: "Users", value: data.totalUsers, icon: Users, to: "/users" },
    { label: "Products", value: data.totalProducts, icon: Package, to: "/products" },
    { label: "Tickets", value: data.totalTickets, icon: LifeBuoy, to: "/tickets" },
    { label: "Leads", value: data.totalLeads, icon: MessageSquare, to: "/leads" },
  ] : [];

  const orderColors = {
    pending: "bg-accent",
    confirmed: "bg-primary/40",
    shipped: "bg-primary/60",
    delivered: "bg-primary",
    cancelled: "bg-destructive/40",
  };

  const ticketColors = {
    open: "bg-accent",
    inProgress: "bg-primary/40",
    resolved: "bg-green-400 dark:bg-green-600",
    closed: "bg-muted-foreground/30",
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">Dashboard</p>
        <h1 className="text-3xl font-medium tracking-tight">Overview</h1>
      </header>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <div className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5">Period</div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-10 rounded-xl w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="weekly">This week</SelectItem>
              <SelectItem value="monthly">This month</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filter === "custom" && (
          <>
            <div>
              <div className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5">From</div>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 rounded-xl w-[160px]" />
            </div>
            <div>
              <div className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5">To</div>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 rounded-xl w-[160px]" />
            </div>
          </>
        )}
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading} className="rounded-xl mb-0.5">
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 shadow-soft p-5 animate-pulse space-y-3">
              <div className="h-3 bg-accent/50 rounded w-1/2" />
              <div className="h-7 bg-accent/50 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {statCards.map((c) => {
              const inner = (
                <Card className="rounded-2xl border-border/60 shadow-soft hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-normal text-muted-foreground">{c.label}</CardTitle>
                    <div className="h-8 w-8 grid place-items-center rounded-lg bg-accent/70">
                      <c.icon className="h-4 w-4 text-accent-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-medium tracking-tight">{c.value}</div>
                  </CardContent>
                </Card>
              );
              return c.to ? (
                <Link key={c.label} to={c.to} className="block">
                  {inner}
                </Link>
              ) : (
                <div key={c.label}>{inner}</div>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-border/60 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base font-medium">Orders by status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(Object.entries(data.orderBreakdown || {})).map(([key, count]) => (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className="font-medium tabular-nums">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-accent/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${orderColors[key] || "bg-accent"}`}
                        style={{ width: `${data.totalOrders > 0 ? (count / data.totalOrders) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base font-medium">Tickets by status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(Object.entries(data.ticketBreakdown || {})).map(([key, count]) => (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className="font-medium tabular-nums">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-accent/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${ticketColors[key] || "bg-accent"}`}
                        style={{ width: `${data.totalTickets > 0 ? (count / data.totalTickets) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p>No data available for this period.</p>
        </div>
      )}
    </div>
  );
}