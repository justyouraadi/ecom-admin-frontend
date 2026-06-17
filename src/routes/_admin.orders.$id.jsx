import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Package, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError, imageUrl } from "@/lib/admin-api";

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

export const Route = createFileRoute("/_admin/orders/$id")({
  ssr: false,
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOrder(id).then((data) => {
      setOrder(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [id]);

  async function handleStatusUpdate(newStatus) {
    try {
      await api.updateOrderStatus(order.id, newStatus);
      toast.success(`Order #${order.id} → ${newStatus.toLowerCase()}`);
      setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Status update failed");
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-5">
        <Button variant="ghost" size="sm" asChild className="rounded-lg -ml-2">
          <Link to="/orders"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
        </Button>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!order) throw notFound();

  const p = order.product || {};
  const u = order.user || {};
  const next = nextStatuses[order.status] || [];

  return (
    <div className="max-w-5xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="rounded-lg -ml-2">
        <Link to="/orders"><ArrowLeft className="h-4 w-4 mr-2" />Back to orders</Link>
      </Button>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">
            Order <span className="font-mono text-muted-foreground">#{order.id}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge
          className={`${statusTone[order.status] || "bg-muted text-muted-foreground"} rounded-full font-normal text-sm tracking-wide px-3 py-1 border-0`}
        >
          {order.status.toLowerCase()}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base font-medium">Product</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {p.assets?.[0] ? (
                  <img
                    src={imageUrl(p.assets[0])}
                    alt={p.name}
                    className="h-24 w-24 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-xl bg-accent grid place-items-center shrink-0">
                    <Package className="h-6 w-6 text-accent-foreground/60" />
                  </div>
                )}
                <div className="min-w-0 space-y-1.5">
                  <div className="font-medium">{p.name || "—"}</div>
                  {p.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  )}
                  <div className="text-sm">
                    <span className="text-muted-foreground">HSN:</span> {p.hsnCode || "—"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base font-medium">Order details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-sm">
                <Field label="Quantity" value={String(order.quantity)} />
                <Field label="Unit price" value={`₹${p.sellingPrice || "—"}`} />
                <Field label="Total amount" value={`₹${order.totalAmount}`} />
                <Field label="Cost" value={`₹${p.cost || "—"}`} />
                <Field label="Offer price" value={p.offerPrice ? `₹${p.offerPrice}` : "—"} />
                <Field label="GST" value={p.gstPercentage ? `${p.gstPercentage}%` : "—"} />
                <Field label="Created" value={new Date(order.createdAt).toLocaleDateString()} />
                <Field label="Updated" value={new Date(order.updatedAt).toLocaleDateString()} />
              </div>
            </CardContent>
          </Card>

          {order.invoice && (
            <Card className="rounded-2xl border-border/60 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base font-medium">Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={order.invoice}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  View invoice
                </a>
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
              {u.status !== undefined && (
                <Field label="Status" value={u.status ? "active" : "inactive"} />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base font-medium">Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Field label="Guardian" value={order.guardianName || "—"} />
              <Field label="Address" value={order.address || "—"} />
              <Field label="Remark" value={order.remark || "—"} />
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
                      variant={ns === "CANCELLED" ? "outline" : "default"}
                      onClick={() => handleStatusUpdate(ns)}
                      className="rounded-xl"
                    >
                      {ns === "CANCELLED" ? "Cancel order" : `Mark ${ns.toLowerCase()}`}
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