import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Package, X, Pencil, Check, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError, imageUrl } from "@/lib/admin-api";

export const Route = createFileRoute("/_admin/products/$id")({
  ssr: false,
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stockUpdating, setStockUpdating] = useState(false);
  const [stockInput, setStockInput] = useState("");
  const [editFiles, setEditFiles] = useState([]);
  const [editPreviews, setEditPreviews] = useState([]);
  const fileRef = useRef(null);

  useEffect(() => {
    api.getProduct(id).then((data) => {
      setProduct(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [id]);

  async function handleStockUpdate() {
    const val = parseInt(stockInput, 10);
    if (isNaN(val) || val < 0) return;
    setStockUpdating(true);
    try {
      const result = await api.updateProductStock(product.id, val);
      setProduct((prev) => prev ? { ...prev, availableStock: result.availableStock } : prev);
      setStockInput("");
      toast.success("Stock updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Stock update failed");
    } finally {
      setStockUpdating(false);
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    editFiles.forEach((f) => fd.append("assets[]", f));
    try {
      const result = await api.updateProductEdit(product.id, fd);
      setProduct(result);
      setEditing(false);
      setEditFiles([]);
      setEditPreviews([]);
      toast.success("Product updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditFiles(e) {
    const files = Array.from(e.target.files || []);
    setEditFiles(files);
    setEditPreviews(files.map((f) => URL.createObjectURL(f)));
  }

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

  if (editing) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="rounded-lg -ml-2">
            <X className="h-4 w-4 mr-2" />Cancel
          </Button>
          <span className="text-sm text-muted-foreground">Editing {product.name}</span>
        </div>

        <form onSubmit={handleEditSubmit} className="space-y-6">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader><CardTitle className="text-base font-medium">Basic info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field id="name" label="Name" defaultValue={product.name} />
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={product.description} className="rounded-xl min-h-[100px]" />
              </div>
              <Field id="hsnCode" label="HSN code" defaultValue={product.hsnCode} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader><CardTitle className="text-base font-medium">Pricing &amp; Stock</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Field id="cost" label="Cost" type="number" step="0.01" defaultValue={product.cost} />
              <Field id="sellingPrice" label="Selling price" type="number" step="0.01" defaultValue={product.sellingPrice} />
              <Field id="offerPrice" label="Offer price" type="number" step="0.01" defaultValue={product.offerPrice || ""} />
              <Field id="availableStock" label="Stock" type="number" defaultValue={product.availableStock} />
              <Field id="gstPercentage" label="GST %" type="number" step="0.01" defaultValue={product.gstPercentage} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader><CardTitle className="text-base font-medium">Images</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {editPreviews.length > 0 ? (
                  editPreviews.map((p, i) => (
                    <div key={i} className="relative">
                      <img src={p} alt="" className="h-20 w-20 rounded-xl object-cover border border-border/60" />
                      <button type="button" onClick={() => {
                        setEditFiles((prev) => prev.filter((_, j) => j !== i));
                        setEditPreviews((prev) => prev.filter((_, j) => j !== i));
                      }} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground grid place-items-center">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  product.assets?.map((a, i) => (
                    <img key={i} src={imageUrl(a)} alt="" className="h-20 w-20 rounded-xl object-cover border border-border/60" />
                  ))
                )}
              </div>
              <Input ref={fileRef} type="file" multiple accept="image/*" onChange={handleEditFiles} className="h-11 rounded-xl" />
              <p className="text-xs text-muted-foreground">Uploading new images replaces all existing ones.</p>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Switch id="edit-status" name="status" defaultChecked={product.status} />
            <Label htmlFor="edit-status">Active</Label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting} className="rounded-xl shadow-glow">
              <Check className="h-4 w-4 mr-1.5" />{submitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  const assets = product.assets || [];

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="rounded-lg -ml-2">
          <Link to="/products"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="rounded-xl">
          <Pencil className="h-4 w-4 mr-1.5" />Edit
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-3">
          {assets.length > 0 ? (
            <>
              <button onClick={() => setLightbox(true)} className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-border/60 bg-accent/30 shadow-soft group">
                <img src={imageUrl(assets[selectedImg])} alt={`${product.name} ${selectedImg + 1}`} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
              </button>
              {assets.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {assets.map((a, i) => (
                    <button key={i} onClick={() => setSelectedImg(i)} className={`shrink-0 h-16 w-16 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImg ? "border-primary shadow-sm" : "border-border/60 opacity-70 hover:opacity-100"}`}>
                      <img src={imageUrl(a)} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
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
                <CardTitle className="text-xl font-medium tracking-tight leading-snug">{product.name}</CardTitle>
                <Badge className={`shrink-0 rounded-full font-normal text-[11px] tracking-wide px-2.5 py-0.5 border-0 ${product.status ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
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

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="New stock value"
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                    className="h-9 rounded-xl text-sm flex-1"
                  />
                  <Button size="sm" variant="outline" onClick={handleStockUpdate} disabled={stockUpdating || !stockInput} className="rounded-xl shrink-0 h-9">
                    <Save className="h-3.5 w-3.5 mr-1" />{stockUpdating ? "…" : "Update"}
                  </Button>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Created</span>
                  <span className="tabular-nums">{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Updated</span>
                  <span className="tabular-nums">{new Date(product.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {lightbox && assets[selectedImg] && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/40 text-white grid place-items-center hover:bg-black/60">
            <X className="h-4 w-4" />
          </button>
          <img src={imageUrl(assets[selectedImg])} alt={`${product.name} ${selectedImg + 1}`} className="max-w-full max-h-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function Field({ id, label, defaultValue, type, step }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type || "text"} step={step} defaultValue={defaultValue ?? ""} className="h-11 rounded-xl" />
    </div>
  );
}