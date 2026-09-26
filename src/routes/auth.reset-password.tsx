import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AuthFrame } from "@/components/app/AuthFrame";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/auth/reset-password")({
  head: () =>
    pageMeta("Reset password", "Password reset will be available once real sign-in is added."),
  component: () => (
    <AuthFrame
      title="Reset password"
      description="Password reset will be available once real sign-in is added."
    >
      <Button asChild variant="outline" className="w-full">
        <Link to="/auth/login">Back to sign in</Link>
      </Button>
    </AuthFrame>
  ),
});
