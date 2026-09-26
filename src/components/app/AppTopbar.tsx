import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, UserCircle } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  initials,
  notificationCount,
  roleLabels,
  signOut,
  useCurrentUser,
} from "@/lib/auth-client";

export function AppTopbar() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  if (!user) return null;

  const logout = async () => {
    await signOut();
    navigate({ to: "/auth/login", replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur sm:px-4">
      <SidebarTrigger className="h-10 w-10 md:h-8 md:w-8" />
      <div className="min-w-0 flex-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative h-10 w-10"
            aria-label="Notifications"
          >
            <Link to="/notifications">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                  {notificationCount}
                </span>
              )}
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 gap-2 px-1.5 sm:px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden min-w-0 text-left md:block">
              <p className="truncate text-sm font-medium leading-tight">{user.name}</p>
              <p className="truncate text-xs leading-tight text-muted-foreground">
                {roleLabels[user.role]}
              </p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="truncate">{user.name}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile">
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
