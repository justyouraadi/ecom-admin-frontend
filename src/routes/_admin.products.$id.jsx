import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Package, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, imageUrl } from "@/lib/admin-api";

export const Route = createFileRoute("/_admin/products/$id")({
  ssr: false,
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    api.getProduct(id).then((data) => {
      setProduct(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl space-y-5">
        <Button variant="ghost" size="sm" asChild className="rounded-lg -ml-2">
          <Link to="/products"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
        </Button>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!product) throw notFound();

  const assets = product.assets || [];

  return (
    <div className="max-w-5xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="rounded-lg -ml-2">
        <Link to="/products"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-3">
          {assets.length > 0 ? (
            <>
              <button
                onClick={() => setLightbox(true)}
                className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-border/60 bg-accent/30 shadow-soft group"
              >
                <img
                  src={imageUrl(assets[selectedImg])}
                  alt={`${product.name} ${selectedImg + 1}`}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
              </button>
              {assets.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {assets.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImg(i)}
                      className={`shrink-0 h-16 w-16 rounded-xl overflow-hidden border-2 transition-all ${
                        i === selectedImg
                          ? "border-primary shadow-sm"
                          : "border-border/60 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={imageUrl(a)}
                        alt={`${product.name} ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full aspect-[4/3] rounded-2xl border border-border/60 bg-accent/30 grid place-items-center">
              <Package className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-xl font-medium tracking-tight leading-snug">
                  {product.name}
                </CardTitle>
                <Badge
                  className={`shrink-0 rounded-full font-normal text-[11px] tracking-wide px-2.5 py-0.5 border-0 ${
                    product.status
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {product.status ? "active" : "inactive"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-1">HSN {product.hsnCode}</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-relaxed text-foreground/80">{product.description}</p>

              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Selling price</span>
                  <span className="text-lg font-semibold">₹{product.sellingPrice}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Cost</span>
                  <span className="font-medium tabular-nums">₹{product.cost}</span>
                </div>
                {product.offerPrice && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Offer price</span>
                    <span className="font-medium tabular-nums text-green-600">₹{product.offerPrice}</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">GST</span>
                  <span className="font-medium tabular-nums">{product.gstPercentage}%</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Stock</span>
                  <span className="font-medium tabular-nums">{product.availableStock}</span>
                </div>
              </div>

              <hr className="border-border/60" />

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Created</span>
                  <span className="tabular-nums">{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated</span>
                  <span className="tabular-nums">{new Date(product.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {lightbox && assets[selectedImg] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/40 text-white grid place-items-center hover:bg-black/60"
          >
            <X className="h-4 w-4" />
          </button>
          <img
            src={imageUrl(assets[selectedImg])}
            alt={`${product.name} ${selectedImg + 1}`}
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
