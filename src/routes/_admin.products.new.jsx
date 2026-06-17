import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, X, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError } from "@/lib/admin-api";

export const Route = createFileRoute("/_admin/products/new")({
  ssr: false,
  component: NewProduct,
});

function NewProduct() {
  const router = useRouter();
  const formRef = useRef(null);
  const fileRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(e) {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  }

  function removeFile(i) {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      files.forEach((f) => fd.append("assets", f));
      await api.createProduct(fd);
      toast.success("Product created");
      router.navigate({ to: "/products" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="rounded-lg -ml-2">
        <Link to="/products"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
      </Button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">New product</h1>
        <p className="text-sm text-muted-foreground mt-1">Add a new product to your catalog.</p>
      </div>

      <form ref={formRef} onSubmit={onSubmit}>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <Card className="rounded-2xl border-border/60 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base font-medium">Basic info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Product name" htmlFor="name">
                  <Input id="name" name="name" required placeholder="e.g. Organic Green Tea" className="h-11 rounded-xl" />
                </Field>
                <Field label="Description" htmlFor="description">
                  <Textarea id="description" name="description" rows={4} required placeholder="Describe the product…" className="rounded-xl" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="HSN code" htmlFor="hsnCode">
                    <Input id="hsnCode" name="hsnCode" required placeholder="e.g. 090210" className="h-11 rounded-xl" />
                  </Field>
                  <Field label="GST %" htmlFor="gstPercentage">
                    <Input id="gstPercentage" name="gstPercentage" type="number" step="0.01" defaultValue="0" className="h-11 rounded-xl" />
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base font-medium">Pricing & Stock</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Cost" htmlFor="cost">
                    <Input id="cost" name="cost" type="number" step="0.01" required placeholder="0.00" className="h-11 rounded-xl" />
                  </Field>
                  <Field label="Selling price" htmlFor="sellingPrice">
                    <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" required placeholder="0.00" className="h-11 rounded-xl" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Offer price" htmlFor="offerPrice">
                    <Input id="offerPrice" name="offerPrice" type="number" step="0.01" placeholder="Optional" className="h-11 rounded-xl" />
                  </Field>
                  <Field label="Available stock" htmlFor="availableStock">
                    <Input id="availableStock" name="availableStock" type="number" required placeholder="0" className="h-11 rounded-xl" />
                  </Field>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl border-border/60 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base font-medium">Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {previews.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {previews.map((src, i) => (
                      <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border/60 bg-accent/20">
                        <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/50 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                          {i + 1}
                        </span>
                      </div>
                    ))}
                    {previews.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-border/60 grid place-items-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full aspect-square rounded-xl border-2 border-dashed border-border/60 grid place-items-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <div className="text-center">
                      <ImageIcon className="h-6 w-6 mx-auto mb-2" />
                      <span className="text-sm">Click to upload</span>
                      <p className="text-xs mt-1">Max 5 images</p>
                    </div>
                  </button>
                )}
                <input
                  ref={fileRef}
                  id="assets"
                  name="assets"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  {files.length > 0
                    ? `${files.length} file(s) selected`
                    : "Accepted: JPEG, PNG, WebP"}
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" asChild className="rounded-xl">
                <Link to="/products">Cancel</Link>
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl shadow-glow min-w-[140px]">
                {submitting ? "Saving…" : "Create product"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}