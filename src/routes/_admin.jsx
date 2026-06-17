import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Toaster } from "sonner";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { api, getToken, clearToken } from "@/lib/admin-api";

export const Route = createFileRoute("/_admin")({
  ssr: false,
  beforeLoad: async () => {
    if (!getToken()) throw redirect({ to: "/login" });
    const ok = await api.ping();
    if (ok === false) {
      clearToken();
      throw redirect({ to: "/login" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <SidebarProvider>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/60 bg-background/80 backdrop-blur px-4 gap-3 sticky top-0 z-10">
            <SidebarTrigger className="rounded-lg" />
            <div className="text-sm text-muted-foreground">Lemonbalm Admin</div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
