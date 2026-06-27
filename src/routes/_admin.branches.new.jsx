import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { ArrowLeft, Store } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError, imageUrl } from "@/lib/admin-api";

export const Route = createFileRoute("/_admin/branches/new")({
  ssr: false,
  component: NewBranch,
});

function NewBranch() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const logoRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    if (logoFile) {
      fd.delete("logo");
      fd.append("logo", logoFile);
    }

    try {
      await api.createBranch(fd);
      toast.success("Branch created");
      router.navigate({ to: "/branches" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create branch");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="rounded-lg -ml-2">
        <Link to="/branches"><ArrowLeft className="h-4 w-4 mr-2" />Back to branches</Link>
      </Button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">New branch</h1>
        <p className="text-sm text-muted-foreground mt-1">Add a new branch location.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-medium">Branch details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {logoPreview && (
              <img src={logoPreview} alt="Logo preview" className="h-20 w-20 rounded-xl object-cover border border-border/60" />
            )}
            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <Input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                ref={logoRef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
                }}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field id="name" label="Name" required />
              <Field id="phone" label="Phone" required />
            </div>
            <Field id="address" label="Address" required />
            <div className="grid grid-cols-3 gap-4">
              <Field id="city" label="City" required />
              <Field id="state" label="State" required />
              <Field id="pincode" label="Pincode" required />
            </div>
            <Field id="country" label="Country" required />
            <Field id="email" label="Email" type="email" required />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting} className="rounded-xl shadow-glow">
            {submitting ? "Creating…" : "Create branch"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ id, label, type, required }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type || "text"} required={required} className="h-11 rounded-xl" />
    </div>
  );
}