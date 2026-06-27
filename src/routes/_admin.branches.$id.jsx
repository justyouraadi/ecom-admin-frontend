import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Store, MapPin, Phone, Mail, Calendar, Trash2, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError, imageUrl } from "@/lib/admin-api";

export const Route = createFileRoute("/_admin/branches/$id")({
  ssr: false,
  component: BranchDetail,
});

function BranchDetail() {
  const { id } = Route.useParams();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const logoRef = useRef(null);

  useEffect(() => {
    api.getBranch(id).then((data) => {
      setBranch(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [id]);

  async function handleUpdate(e) {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const textFields = ["name", "address", "city", "state", "country", "pincode", "phone", "email"];
    const fdClean = new FormData();
    let hasChanges = false;

    for (const key of textFields) {
      const val = fd.get(key)?.trim();
      if (val !== undefined && val !== String(branch[key] ?? "")) {
        fdClean.append(key, val);
        hasChanges = true;
      }
    }

    const statusVal = fd.get("status") === "on";
    if (statusVal !== branch.status) {
      fdClean.append("status", statusVal);
      hasChanges = true;
    }

    if (logoFile) {
      fdClean.append("logo", logoFile);
      hasChanges = true;
    }

    if (!hasChanges) {
      toast.info("No changes to save.");
      setSubmitting(false);
      return;
    }

    try {
      const result = await api.updateBranch(branch.id, fdClean);
      setBranch(result);
      setEditing(false);
      setLogoFile(null);
      setLogoPreview(null);
      toast.success("Branch updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update branch");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this branch?")) return;
    try {
      await api.deleteBranch(branch.id);
      toast.success("Branch deleted");
      window.history.back();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete branch");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-5">
        <Button variant="ghost" size="sm" asChild className="rounded-lg -ml-2">
          <Link to="/branches"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
        </Button>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!branch) throw notFound();

  if (editing) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setLogoFile(null); setLogoPreview(null); }} className="rounded-lg -ml-2">
            <X className="h-4 w-4 mr-2" />Cancel
          </Button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base font-medium">Edit branch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {(logoPreview || branch.logo) && (
                <img
                  src={logoPreview || imageUrl(branch.logo)}
                  alt="Branch logo"
                  className="h-20 w-20 rounded-xl object-cover border border-border/60"
                />
              )}
              <Field id="logo" label="Logo" type="file" accept="image/*" ref={logoRef} onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
              }} />
              <div className="grid grid-cols-2 gap-4">
                <Field id="name" label="Name" defaultValue={branch.name} />
                <Field id="phone" label="Phone" defaultValue={branch.phone} />
              </div>
              <Field id="address" label="Address" defaultValue={branch.address} />
              <div className="grid grid-cols-3 gap-4">
                <Field id="city" label="City" defaultValue={branch.city} />
                <Field id="state" label="State" defaultValue={branch.state} />
                <Field id="pincode" label="Pincode" defaultValue={branch.pincode} />
              </div>
              <Field id="country" label="Country" defaultValue={branch.country} />
              <Field id="email" label="Email" defaultValue={branch.email} />
              <div className="flex items-center gap-3">
                <Switch id="status" name="status" defaultChecked={branch.status} />
                <Label htmlFor="status">Active</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={submitting} className="rounded-xl">
              <Check className="h-4 w-4 mr-1.5" />
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="rounded-lg -ml-2">
          <Link to="/branches"><ArrowLeft className="h-4 w-4 mr-2" />Back to branches</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="rounded-xl">
            <Pencil className="h-4 w-4 mr-1.5" />Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} className="rounded-xl text-destructive">
            <Trash2 className="h-4 w-4 mr-1.5" />Delete
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {branch.logo ? (
          <img src={imageUrl(branch.logo)} alt={branch.name} className="h-16 w-16 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-accent grid place-items-center shrink-0">
            <Store className="h-7 w-7 text-accent-foreground/60" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-medium tracking-tight">{branch.name}</h1>
          <Badge
            className={`rounded-full font-normal text-sm tracking-wide px-3 py-1 border-0 mt-1 ${
              branch.status ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {branch.status ? "active" : "inactive"}
          </Badge>
        </div>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base font-medium">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{branch.address}, {branch.city}, {branch.state} {branch.pincode}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{branch.country}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{branch.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{branch.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>Created {new Date(branch.createdAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const Field = ({ id, label, defaultValue, type, accept, ref, onChange }) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      name={id}
      type={type || "text"}
      accept={accept}
      defaultValue={defaultValue}
      ref={ref}
      onChange={onChange}
      className="h-11 rounded-xl"
    />
  </div>
);