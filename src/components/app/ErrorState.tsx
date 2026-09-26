import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, LayoutDashboard, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  code,
  title,
  message,
  onRetry,
}: {
  code: string;
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-primary">{code}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => router.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          )}
          <Button asChild>
            <Link to="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
