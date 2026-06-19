import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, imageUrl } from "@/lib/admin-api";

export const Route = createFileRoute("/_admin/settings")({
  ssr: false,
  component: Settings,
});

function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSettings().then((data) => {
      setSettings(data.settings);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

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

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base font-medium">UPI Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {settings.qrCode && (
            <div>
              <div className="text-[11px] uppercase text-muted-foreground tracking-wider mb-2">QR Code</div>
              <img
                src={imageUrl(settings.qrCode)}
                alt="UPI QR code"
                className="rounded-xl border border-border/60 max-h-56 w-auto object-contain"
              />
            </div>
          )}
          <Field label="UPI ID" value={settings.upiId} />
          <Field label="Beneficiary" value={settings.beneficaryName} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base font-medium">Bank Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Bank" value={settings.bankName} />
          <Field label="Account number" value={settings.accountNumber} />
          <Field label="IFSC" value={settings.ifscCode} />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[11px] uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className="mt-0.5 font-medium">{value || "—"}</div>
    </div>
  );
}