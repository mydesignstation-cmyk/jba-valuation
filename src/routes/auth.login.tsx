import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthFrame } from "@/components/app/AuthFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, AuthError } from "@/lib/auth-client";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/auth/login")({
  head: () => pageMeta("Sign in", "Sign in to the property valuation operations platform."),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthFrame title="Sign in" description="Enter your credentials to continue.">
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@jballp.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="h-11" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        <Link to="/auth/forgot-password" className="text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
    </AuthFrame>
  );
}
