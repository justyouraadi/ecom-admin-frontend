import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Package } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError, imageUrl } from "@/lib/admin-api";

export const Route = createFileRoute("/_admin/manual-orders/new")({
  ssr: false,
  component: NewManualOrder,
});

function NewManualOrder() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const screenshotRef = useRef(null);

  useEffect(() => {
    api.listProducts({ page: 1, limit: 100 })
      .then((data) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!productId) {
      toast.error("Select a product");
      return;
    }
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    fd.set("productId", productId);
    if (screenshotFile) {
      fd.delete("paymentScreenshot");
      fd.append("paymentScreenshot", screenshotFile);
    }

    try {
      await api.createManualOrder(fd);
      toast.success("Manual order created");
      router.navigate({ to: "/manual-orders" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create manual order");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedProduct = products.find((p) => String(p.id) === String(productId));

  return (
    <div className="max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="rounded-lg -ml-2">
        <Link to="/manual-orders"><ArrowLeft className="h-4 w-4 mr-2" />Back to manual orders</Link>
      </Button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">New manual order</h1>
        <p className="text-sm text-muted-foreground mt-1">Place an order on a customer's behalf.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-medium">Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger id="productId" className="h-11 rounded-xl w-full">
                  <SelectValue placeholder={productsLoading ? "Loading products…" : "Select a product"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      <span className="flex items-center gap-2 min-w-0">
                        {p.assets?.[0] && (
                          <img src={imageUrl(p.assets[0])} alt="" className="h-6 w-6 rounded-md object-cover shrink-0" />
                        )}
                        <span className="truncate">{p.name} — ₹{p.offerPrice || p.sellingPrice} ({p.availableStock} in stock)</span>
                      </span>
                    </SelectItem>
                  ))}
                  {!productsLoading && products.length === 0 && (
                    <div className="px-2 py-3 text-sm text-muted-foreground flex items-center gap-2">
                      <Package className="h-4 w-4" /> No products available
                    </div>
                  )}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <p className="text-xs text-muted-foreground">
                  Total = offer price × quantity × (1 + GST). Stock checked server-side.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field id="quantity" label="Quantity" type="number" min="1" defaultValue="1" required />
              <Field id="transactionId" label="Transaction ID" required placeholder="UPI123456789" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-medium">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field id="customerName" label="Customer name" required />
              <Field id="customerPhone" label="Customer phone" required />
            </div>
            <Field id="customerEmail" label="Email" type="email" />
            <Field id="guardianName" label="Guardian name" required />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-medium">Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" required className="rounded-xl min-h-[80px]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remark">Remark</Label>
              <Textarea id="remark" name="remark" required className="rounded-xl min-h-[80px]" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-medium">Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {screenshotPreview && (
              <img src={screenshotPreview} alt="Payment screenshot preview" className="h-24 rounded-xl object-cover border border-border/60" />
            )}
            <div className="space-y-2">
              <Label htmlFor="paymentScreenshot">Payment screenshot (optional)</Label>
              <Input
                id="paymentScreenshot"
                name="paymentScreenshot"
                type="file"
                accept="image/*"
                ref={screenshotRef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setScreenshotFile(f); setScreenshotPreview(URL.createObjectURL(f)); }
                }}
                className="h-11 rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting} className="rounded-xl shadow-glow">
            {submitting ? "Creating…" : "Create manual order"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ id, label, type, min, defaultValue, required, placeholder }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type || "text"}
        min={min}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="h-11 rounded-xl"
      />
    </div>
  );
}
