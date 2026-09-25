import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AuthFrame } from "./auth.login";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => pageMeta("Forgot password", "Password recovery will be available once real sign-in is added."),
  component: () => (
    <AuthFrame title="Forgot password" description="Password recovery will be available once real sign-in is added.">
      <Button asChild variant="outline" className="w-full"><Link to="/auth/login">Back to sign in</Link></Button>
    </AuthFrame>
  ),
});
