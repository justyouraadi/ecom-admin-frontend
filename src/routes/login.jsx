import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast, Toaster } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, setToken, ApiError } from "@/lib/admin-api";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin · Sign in" }] }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setToken(data.jwt);
      toast.success("Welcome back");
      router.navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Toaster richColors position="top-right" />

      {/* Brand panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 60% at 20% 30%, oklch(0.93 0.05 165 / 0.9), transparent 60%), radial-gradient(60% 50% at 85% 80%, oklch(0.9 0.06 75 / 0.7), transparent 60%), oklch(0.97 0.012 80)",
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground grid place-items-center text-sm font-semibold">
              ◆
            </div>
            <span className="font-medium tracking-tight">Lemonbalm Admin</span>
          </div>
          <div className="max-w-md space-y-3">
            <h1 className="text-4xl font-medium tracking-tight leading-tight text-foreground">
              A calmer way to run your store.
            </h1>
            <p className="text-muted-foreground">
              Soft surfaces, gentle motion, and the data you need — close at hand.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">© Lemonbalm · Internal tool</div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-medium tracking-tight">Sign in</h2>
          </div>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl shadow-glow"
            >
              {loading ? "Signing in…" : "Continue"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
