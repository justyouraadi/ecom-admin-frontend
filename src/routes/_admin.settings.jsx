import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError, imageUrl } from "@/lib/admin-api";

export const Route = createFileRoute("/_admin/settings")({
  ssr: false,
  component: Settings,
});

function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const qrRef = useRef(null);

  useEffect(() => {
    api.getSettings().then((data) => {
      setSettings(data.settings);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  function handleQrChange(e) {
    const f = e.target.files?.[0];
    if (f) {
      setQrFile(f);
      setQrPreview(URL.createObjectURL(f));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!settings) return;
    setSubmitting(true);

    const fd = new FormData();
    const form = new FormData(e.currentTarget);
    let hasChanges = false;

    const textFields = ["upiId", "beneficaryName", "bankName", "accountNumber", "ifscCode"];
    for (const key of textFields) {
      const val = form.get(key)?.trim();
      if (val !== undefined && val !== settings[key]) {
        fd.append(key, val);
        hasChanges = true;
      }
    }

    if (qrFile) {
      fd.append("qrCode", qrFile);
      hasChanges = true;
    }

    if (!hasChanges) {
      toast.info("No changes to save.");
      setSubmitting(false);
      return;
    }

    try {
      const result = await api.updateSettings(fd);
      setSettings(result.settings);
      setQrFile(null);
      setQrPreview(null);
      if (qrRef.current) qrRef.current.value = "";
      toast.success("Settings updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update settings");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <header>
          <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </header>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-2xl space-y-6">
        <header>
          <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Payment settings not configured yet.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Payment configuration</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-medium">UPI Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="qrCode">QR Code</Label>
              {(qrPreview || settings.qrCode) && (
                <img
                  src={qrPreview || imageUrl(settings.qrCode)}
                  alt="UPI QR code"
                  className="rounded-xl border border-border/60 max-h-56 w-auto object-contain mb-3"
                />
              )}
              <Input
                id="qrCode"
                ref={qrRef}
                type="file"
                accept="image/*"
                onChange={handleQrChange}
                className="h-11 rounded-xl"
              />
            </div>
            <Field id="upiId" label="UPI ID" defaultValue={settings.upiId} />
            <Field id="beneficaryName" label="Beneficiary" defaultValue={settings.beneficaryName} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-medium">Bank Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field id="bankName" label="Bank" defaultValue={settings.bankName} />
            <Field id="accountNumber" label="Account number" defaultValue={settings.accountNumber} />
            <Field id="ifscCode" label="IFSC" defaultValue={settings.ifscCode} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting} className="rounded-xl shadow-glow">
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ id, label, defaultValue }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} defaultValue={defaultValue || ""} className="h-11 rounded-xl" />
    </div>
  );
}