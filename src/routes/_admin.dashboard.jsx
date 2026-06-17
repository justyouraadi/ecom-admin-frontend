import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Package,
  ShoppingBag,
  Users,
  IndianRupee,
  ArrowUpRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/admin-api";
import { stats as fallbackStats } from "@/lib/mock-data";

export const Route = createFileRoute("/_admin/dashboard")({
  ssr: false,
  component: Dashboard,
});

const statusTone = {
  PENDING: "bg-accent text-accent-foreground",
  CONFIRMED: "bg-primary/15 text-primary",
  SHIPPED: "bg-primary/25 text-primary",
  DELIVERED: "bg-primary text-primary-foreground",
  CANCELLED: "bg-destructive/15 text-destructive",
};

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getDashboard().then(setStats).catch(() => {
      setStats(fallbackStats);
    }).finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <div className="space-y-8">
        <header>
          <p className="text-sm text-muted-foreground">Good afternoon</p>
          <h1 className="text-3xl font-medium tracking-tight">Dashboard</h1>
        </header>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const cards = [
    { label: "Revenue", value: stats.revenue, hint: "+12.4%", icon: IndianRupee },
    { label: "Orders", value: stats.totalOrders, hint: "+38 this week", icon: ShoppingBag },
    { label: "Products", value: stats.totalProducts, hint: "Across catalog", icon: Package },
    { label: "Customers", value: stats.totalUsers, hint: "+114 this month", icon: Users },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Good afternoon</p>
          <h1 className="text-3xl font-medium tracking-tight">Dashboard</h1>
        </div>
        <Link
          to="/products"
          className="text-sm text-primary inline-flex items-center gap-1 hover:gap-1.5"
        >
          Browse products <ArrowUpRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {c.label}
              </CardTitle>
              <div className="h-8 w-8 grid place-items-center rounded-lg bg-accent/70">
                <c.icon className="h-4 w-4 text-accent-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium tracking-tight">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.recentOrders?.length > 0 && (
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-medium">Recent orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {stats.recentOrders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-accent grid place-items-center text-sm font-medium text-accent-foreground">
                      {(o.user || o.userName || "?").charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{o.user || o.userName}</div>
                      <div className="text-xs text-muted-foreground">
                        #{o.id} · {o.product || o.productName} × {o.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm tabular-nums">₹{o.totalAmount}</span>
                    <Badge
                      className={`${statusTone[o.status]} rounded-full font-normal text-[11px] tracking-wide px-2.5 py-0.5 border-0`}
                    >
                      {o.status.toLowerCase()}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
