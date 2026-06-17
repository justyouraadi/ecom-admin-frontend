import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/_admin/settings")({
  ssr: false,
  component: Settings,
});

function Settings() {
  const [storeName, setStoreName] = useState("Lemonbalm Store");
  const [notify, setNotify] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  function save(e) {
    e.preventDefault();
    toast.success("Preferences saved");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Workspace preferences</p>
      </header>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base font-medium">General</CardTitle>
          <CardDescription>Display name and notification preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store name</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <ToggleRow
              label="Email notifications"
              description="Receive order updates by email."
              checked={notify}
              onChange={setNotify}
            />
            <ToggleRow
              label="Dark mode preview"
              description="Visual toggle for this preview only."
              checked={darkMode}
              onChange={setDarkMode}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" className="rounded-xl shadow-glow">Save changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
