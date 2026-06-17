import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { api, imageUrl } from "@/lib/admin-api";

export const Route = createFileRoute("/_admin/products/")({
  ssr: false,
  component: ProductsList,
});

function ProductsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ products: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sortBy, sortOrder };
      if (status !== "all") params.status = status;
      if (search) params.search = search;
      const result = await api.listProducts(params);
      setData(result);
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
    }
  }, [page, status, sortBy, sortOrder, search]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const { products, pagination } = data;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${pagination.total} item(s) in catalog`}
          </p>
        </div>
        <Button asChild className="rounded-xl shadow-glow">
          <Link to="/products/new">
            <Plus className="h-4 w-4 mr-2" />
            New product
          </Link>
        </Button>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, description, HSN…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="h-10 rounded-xl w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
          <SelectTrigger className="h-10 rounded-xl w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Newest</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="sellingPrice">Price</SelectItem>
            <SelectItem value="availableStock">Stock</SelectItem>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 shadow-soft overflow-hidden animate-pulse">
              <div className="h-40 bg-accent/50" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-accent/50 rounded w-3/4" />
                <div className="h-3 bg-accent/50 rounded w-full" />
                <div className="h-3 bg-accent/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No products match those filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <Link
              key={p.id}
              to="/products/$id"
              params={{ id: String(p.id) }}
              className="group rounded-2xl border border-border/60 shadow-soft overflow-hidden bg-card hover:shadow-md hover:border-border transition-all duration-200"
            >
              {p.assets?.[0] ? (
                <img
                  src={imageUrl(p.assets[0])}
                  alt={p.name}
                  className="h-36 sm:h-40 w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
              ) : (
                <div className="h-36 sm:h-40 bg-accent/70 grid place-items-center">
                  <Package className="h-8 w-8 text-accent-foreground/40" />
                </div>
              )}
              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm leading-snug line-clamp-1">{p.name}</h3>
                  <Badge
                    className={`shrink-0 rounded-full font-normal text-[11px] tracking-wide px-2.5 py-0.5 border-0 ${
                      p.status
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.status ? "active" : "inactive"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">{p.hsnCode}</span>
                  <span className="tabular-nums">Stock: {p.availableStock}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold">₹{p.sellingPrice}</span>
                  {p.offerPrice && (
                    <span className="text-xs text-muted-foreground line-through">₹{p.offerPrice}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
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
