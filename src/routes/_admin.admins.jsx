import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiError } from "@/lib/admin-api";
import { admins as fallback } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admins")({
  ssr: false,
  component: AdminsPage,
});

function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.listAdmins().then((data) => setAdmins(data.admins ?? data)).catch(() => {
      setAdmins(fallback);
    }).finally(() => setLoaded(true));
  }, []);

  async function toggleStatus(admin) {
    const next = !admin.status;
    try {
      await api.updateAdminStatus(admin.id, next);
      setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, status: next } : a));
      toast.success(`Admin ${next ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-medium tracking-tight">Admins</h1>
        <p className="text-sm text-muted-foreground">Manage admin & member accounts</p>
      </header>
      <Card className="rounded-2xl border-border/60 shadow-soft overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/40">
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-muted-foreground">{a.email}</TableCell>
                  <TableCell>
                    <Badge className={`rounded-full font-normal text-[11px] tracking-wide px-2.5 py-0.5 border-0 ${a.type === "ADMIN" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                      {a.type.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch checked={a.status} onCheckedChange={() => toggleStatus(a)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
