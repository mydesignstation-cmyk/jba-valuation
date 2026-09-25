import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockAuth, mockUsers, roleLabels } from "@/lib/mock-auth";
import { pageMeta } from "@/lib/page-meta";
import type { Role } from "@/types";

export const Route = createFileRoute("/auth/login")({
  head: () => pageMeta("Sign in", "Sign in to the property valuation operations platform."),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const signIn = (role: Role) => {
    mockAuth.login(role);
    navigate({ to: "/dashboard", replace: true });
  };
  return (
    <AuthFrame title="Sign in" description="Development mode: choose a role to continue.">
      <div className="grid gap-2">
        {(Object.keys(mockUsers) as Role[]).map((r) => (
          <Button key={r} variant="outline" className="h-12 justify-between" onClick={() => signIn(r)}>
            <span className="truncate">{mockUsers[r].name}</span>
            <span className="text-xs text-muted-foreground">{roleLabels[r]}</span>
          </Button>
        ))}
      </div>
      <div className="mt-4 text-center text-sm">
        <Link to="/auth/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
      </div>
    </AuthFrame>
  );
}

export function AuthFrame({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground"><Building2 className="h-5 w-5" /></div>
          <span className="text-lg font-semibold">ValuCase</span>
        </div>
        <Card className="shadow-card">
          <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
