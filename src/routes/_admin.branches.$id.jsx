import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Store, MapPin, Phone, Mail, Calendar, Trash2, Pencil, X, Check, Users, User as UserIcon, Shield, ShieldOff } from "lucide-react";
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

  const [team, setTeam] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [editingMember, setEditingMember] = useState(null);
  const [memberUpdating, setMemberUpdating] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    api.getBranch(id).then((data) => {
      setBranch(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (id) {
      api.listTeamByBranch(Number(id)).then((data) => {
        setTeam(data.team ?? []);
        setTeamLoading(false);
      }).catch(() => {
        setTeamLoading(false);
      });
    }
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

  async function handleAddMember(e) {
    e.preventDefault();
    setAddingMember(true);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await api.createTeamMember(fd);
      setTeam((prev) => [...prev, result]);
      setShowAddMember(false);
      toast.success("Team member added");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add team member");
    } finally {
      setAddingMember(false);
    }
  }

  async function handleMemberUpdate(e) {
    e.preventDefault();
    setMemberUpdating(true);
    const fd = new FormData(e.currentTarget);
    const fdClean = new FormData();
    let hasChanges = false;

    const textFields = ["name", "email", "phone", "password"];
    for (const key of textFields) {
      const val = fd.get(key)?.trim();
      if (val && val !== String(editingMember[key] ?? "")) {
        fdClean.append(key, val);
        hasChanges = true;
      }
    }

    const assignedBranch = fd.get("assignedBranch")?.trim();
    if (assignedBranch && Number(assignedBranch) !== Number(editingMember.assignedBranch)) {
      fdClean.append("assignedBranch", assignedBranch);
      hasChanges = true;
    }

    const statusVal = fd.get("status") === "on";
    if (statusVal !== editingMember.status) {
      fdClean.append("status", statusVal);
      hasChanges = true;
    }

    const picFile = fd.get("profilePicture");
    if (picFile && picFile.size > 0) {
      fdClean.append("profilePicture", picFile);
      hasChanges = true;
    }

    if (!hasChanges) {
      toast.info("No changes to save.");
      setMemberUpdating(false);
      return;
    }

    try {
      const result = await api.updateTeamMember(editingMember.id, fdClean);
      setTeam((prev) => prev.map((m) => m.id === result.id ? result : m));
      setEditingMember(null);
      toast.success("Team member updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update team member");
    } finally {
      setMemberUpdating(false);
    }
  }

  async function handleMemberDelete(memberId) {
    if (!confirm("Remove this team member?")) return;
    try {
      await api.deleteTeamMember(memberId);
      setTeam((prev) => prev.filter((m) => m.id !== memberId));
      setEditingMember(null);
      toast.success("Team member removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete team member");
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
            <CardHeader><CardTitle className="text-base font-medium">Edit branch</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {(logoPreview || branch.logo) && (
                <img src={logoPreview || imageUrl(branch.logo)} alt="Branch logo" className="h-20 w-20 rounded-xl object-cover border border-border/60" />
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
              <Check className="h-4 w-4 mr-1.5" />{submitting ? "Saving…" : "Save changes"}
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
          <Badge className={`rounded-full font-normal text-sm tracking-wide px-3 py-1 border-0 mt-1 ${branch.status ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
            {branch.status ? "active" : "inactive"}
          </Badge>
        </div>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader><CardTitle className="text-base font-medium">Details</CardTitle></CardHeader>
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
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" /><span>{branch.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" /><span>{branch.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>Created {new Date(branch.createdAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />Team ({team.length})
            </CardTitle>
            {!showAddMember && (
              <Button variant="outline" size="sm" onClick={() => setShowAddMember(true)} className="rounded-lg h-8 text-xs">
                <UserIcon className="h-3.5 w-3.5 mr-1" />Add member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showAddMember && (
            <form onSubmit={handleAddMember} className="mb-5 pb-5 border-b border-border/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">New team member</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddMember(false)} className="rounded-lg h-8 text-xs">
                  <X className="h-3.5 w-3.5 mr-1" />Cancel
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label htmlFor="new-name">Name</Label><Input id="new-name" name="name" required className="h-11 rounded-xl" /></div>
                <div className="space-y-2"><Label htmlFor="new-email">Email</Label><Input id="new-email" name="email" type="email" required className="h-11 rounded-xl" /></div>
                <div className="space-y-2"><Label htmlFor="new-phone">Phone</Label><Input id="new-phone" name="phone" required className="h-11 rounded-xl" /></div>
                <div className="space-y-2"><Label htmlFor="new-password">Password</Label><Input id="new-password" name="password" type="password" required className="h-11 rounded-xl" /></div>
              </div>
              <input type="hidden" name="assignedBranch" value={branch.id} />
              <div className="space-y-2">
                <Label htmlFor="new-pic">Profile picture</Label>
                <Input id="new-pic" name="profilePicture" type="file" accept="image/*" className="h-10 rounded-xl text-sm" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={addingMember} className="rounded-xl">
                  {addingMember ? "Adding…" : "Add member"}
                </Button>
              </div>
            </form>
          )}
          {teamLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading team…</p>
          ) : team.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No team members assigned.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {team.map((m) => (
                editingMember?.id === m.id ? (
                  <form key={m.id} onSubmit={handleMemberUpdate} className="py-4 first:pt-0 last:pb-0 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Edit {m.name}</span>
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingMember(null)} className="rounded-lg h-8 text-xs">
                          <X className="h-3.5 w-3.5 mr-1" />Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={memberUpdating} className="rounded-lg h-8 text-xs">
                          <Check className="h-3.5 w-3.5 mr-1" />{memberUpdating ? "Saving…" : "Save"}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field id={`name-${m.id}`} name="name" label="Name" defaultValue={m.name} />
                      <Field id={`email-${m.id}`} name="email" label="Email" defaultValue={m.email} />
                      <Field id={`phone-${m.id}`} name="phone" label="Phone" defaultValue={m.phone} />
                      <Field id={`password-${m.id}`} name="password" label="Password" type="password" placeholder="New password" />
                    </div>
                    <input type="hidden" name="assignedBranch" value={branch.id} />
                    <div className="flex items-center gap-3">
                      <Switch id={`status-${m.id}`} name="status" defaultChecked={m.status} />
                      <Label htmlFor={`status-${m.id}`}>Active</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`pic-${m.id}`}>Profile picture</Label>
                      <Input id={`pic-${m.id}`} name="profilePicture" type="file" accept="image/*" className="h-10 rounded-xl text-sm" />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleMemberDelete(m.id)} className="rounded-lg text-destructive h-8 text-xs">
                      <Trash2 className="h-3.5 w-3.5 mr-1" />Remove member
                    </Button>
                  </form>
                ) : (
                  <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    {m.profilePicture ? (
                      <img src={imageUrl(m.profilePicture)} alt={m.name} className="h-9 w-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-accent grid place-items-center shrink-0">
                        <UserIcon className="h-4 w-4 text-accent-foreground/60" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.email} &middot; {m.phone}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.status ? (
                        <Shield className="h-4 w-4 text-primary/60" />
                      ) : (
                        <ShieldOff className="h-4 w-4 text-muted-foreground/40" />
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setEditingMember(m)} className="rounded-lg h-8 w-8 p-0">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const Field = ({ id, label, defaultValue, type, accept, ref, onChange, name, placeholder }) => (
  <div className="space-y-2">
    <Label htmlFor={id || name}>{label}</Label>
    <Input
      id={id || name}
      name={name}
      type={type || "text"}
      accept={accept}
      defaultValue={defaultValue}
      placeholder={placeholder}
      ref={ref}
      onChange={onChange}
      className="h-11 rounded-xl"
    />
  </div>
);