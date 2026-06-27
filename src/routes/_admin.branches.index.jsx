import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Store, Plus, MapPin, Phone, Mail, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { api, imageUrl } from "@/lib/admin-api";

export const Route = createFileRoute("/_admin/branches/")({
  ssr: false,
  component: BranchesPage,
});

function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listBranches().then((data) => {
      setBranches(data.branches ?? []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">Branches</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${branches.length} branch(es)`}
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link to="/branches/new"><Plus className="h-4 w-4 mr-1.5" />New branch</Link>
        </Button>
      </header>

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
      ) : branches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Store className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No branches yet.</p>
          <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl">
            <Link to="/branches/new"><Plus className="h-4 w-4 mr-1.5" />Add branch</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) => (
            <Link
              key={b.id}
              to="/branches/$id"
              params={{ id: String(b.id) }}
              className="rounded-2xl border border-border/60 shadow-soft bg-card overflow-hidden hover:shadow-md transition-shadow block p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                {b.logo ? (
                  <img
                    src={imageUrl(b.logo)}
                    alt={b.name}
                    className="h-10 w-10 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-accent grid place-items-center shrink-0">
                    <Store className="h-5 w-5 text-accent-foreground/60" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{b.name}</div>
                  <Badge
                    className={`rounded-full font-normal text-[11px] tracking-wide px-2.5 py-0.5 border-0 ${
                      b.status ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {b.status ? "active" : "inactive"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{b.address}, {b.city}, {b.state}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{b.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{b.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(b.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}