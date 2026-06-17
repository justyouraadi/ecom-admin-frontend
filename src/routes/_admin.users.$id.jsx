import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Package, Calendar, Phone, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { api, ApiError, imageUrl } from "@/lib/admin-api";
import { toast } from "sonner";

const statusTone = {
  PENDING: "bg-accent text-accent-foreground",
  CONFIRMED: "bg-primary/15 text-primary",
  SHIPPED: "bg-primary/25 text-primary",
  DELIVERED: "bg-primary text-primary-foreground",
  CANCELLED: "bg-destructive/15 text-destructive",
};

export const Route = createFileRoute("/_admin/users/$id")({
  ssr: false,
  component: UserDetail,
});

function UserDetail() {
  const { id } = Route.useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUser(id).then((data) => {
      setUser(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [id]);

  async function toggleStatus() {
    if (!user) return;
    const next = !user.status;
    try {
      await api.updateUserStatus(user.id, next);
      toast.success(`User ${next ? "enabled" : "disabled"}`);
      setUser((prev) => prev ? { ...prev, status: next } : prev);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update");
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-5">
        <Button variant="ghost" size="sm" asChild className="rounded-lg -ml-2">
          <Link to="/users"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
        </Button>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) throw notFound();

  const orders = user.orders || [];

  return (
    <div className="max-w-5xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="rounded-lg -ml-2">
        <Link to="/users"><ArrowLeft className="h-4 w-4 mr-2" />Back to users</Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base font-medium">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="h-16 w-16 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-accent grid place-items-center shrink-0">
                    <UserIcon className="h-6 w-6 text-accent-foreground/60" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-lg font-medium">{user.name}</div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {user.phone || "—"}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <Field label="User ID" value={`#${user.id}`} />
                <Field label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
                <Field label="Updated" value={new Date(user.updatedAt).toLocaleDateString()} />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-muted-foreground">{user.status ? "Active" : "Disabled"}</span>
                <Switch checked={user.status} onCheckedChange={toggleStatus} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Orders {orders.length > 0 && `(${orders.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No orders yet.</p>
              ) : (
                <div className="divide-y divide-border/40">
                  {orders.map((o) => {
                    const p = o.product || {};
                    return (
                      <Link
                        key={o.id}
                        to="/orders/$id"
                        params={{ id: String(o.id) }}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-70 transition-opacity"
                      >
                        {p.assets?.[0] ? (
                          <img
                            src={imageUrl(p.assets[0])}
                            alt={p.name}
                            className="h-12 w-12 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-accent grid place-items-center shrink-0">
                            <Package className="h-5 w-5 text-accent-foreground/60" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{p.name || "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {o.quantity} × ₹{p.sellingPrice || "—"} = ₹{o.totalAmount}
                          </div>
                        </div>
                        <Badge
                          className={`${statusTone[o.status] || "bg-muted text-muted-foreground"} rounded-full font-normal text-[11px] tracking-wide px-2.5 py-0.5 border-0 shrink-0`}
                        >
                          {o.status.toLowerCase()}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}