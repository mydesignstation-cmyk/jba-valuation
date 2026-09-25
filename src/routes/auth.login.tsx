import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthFrame } from "@/components/app/AuthFrame";
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

