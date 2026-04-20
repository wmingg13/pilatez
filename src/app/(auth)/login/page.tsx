// src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";
import { usernameToEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [logoError, setLogoError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert username → internal email transparently
      const email  = usernameToEmail(username.trim());
      const result = await signIn.email({ email, password });
      if (result.error) {
        toast.error("Invalid username or password.");
      } else {
        router.push("/admin/members");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {!logoError ? (
            <div className="flex justify-center mb-3">
              <Image
                src="/logo.png"
                alt="Let'z Pilates"
                width={200}
                height={72}
                className="object-contain h-20 w-auto max-w-[240px]"
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <h1 className="font-serif text-3xl text-[#2d2b45] tracking-tight mb-1">
              Let'z <span className="text-[#4a3d72]">Pilates</span>
            </h1>
          )}
          <p className="text-sm text-[#a09aad]">Admin Portal</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e0ddd5] p-8">
          <h2 className="font-serif text-xl text-[#2d2b45] mb-1">Sign in</h2>
          <p className="text-xs text-[#a09aad] mb-6">
            Enter your credentials to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-[#4a4758] text-sm">Username</Label>
              <Input
                id="username" type="text" autoComplete="username" required
                value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="bg-[#f5f3f0] border-[#e0ddd5] focus-visible:ring-[#4a3d72]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[#4a4758] text-sm">Password</Label>
              <Input
                id="password" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#f5f3f0] border-[#e0ddd5] focus-visible:ring-[#4a3d72]"
              />
            </div>
            <Button
              type="submit" disabled={loading}
              className="w-full bg-[#4a3d72] hover:bg-[#3a2f5c] text-white rounded-full h-10 mt-2"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Signing in…</> : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#a09aad] mt-6">
          Let'z Pilates · Admin access only
        </p>
      </div>
    </main>
  );
}