import { useSyncExternalStore } from "react";
import type { Role, User } from "@/types";

/** Mock authentication layer (development only — no real auth yet). */
export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Administrator",
  ADMIN: "Administrator",
  SITE_ENGINEER: "Site Engineer",
  MAKER: "Maker",
  CHECKER: "Checker",
  UPLOADER: "Uploader",
};

export const mockUsers: Record<Role, User> = {
  SUPER_ADMIN: { id: "u-sa", name: "Rajesh Iyer", email: "rajesh.iyer@example.com", role: "SUPER_ADMIN" },
  ADMIN: { id: "u-admin", name: "Ankur Mehta", email: "ankur.mehta@example.com", role: "ADMIN" },
  SITE_ENGINEER: { id: "u-se", name: "Vikram Singh", email: "vikram.singh@example.com", role: "SITE_ENGINEER" },
  MAKER: { id: "u-maker", name: "Priya Sharma", email: "priya.sharma@example.com", role: "MAKER" },
  CHECKER: { id: "u-checker", name: "Neha Kapoor", email: "neha.kapoor@example.com", role: "CHECKER" },
  UPLOADER: { id: "u-uploader", name: "Arjun Rao", email: "arjun.rao@example.com", role: "UPLOADER" },
};

export const mockNotificationCount = 3;

const KEY = "vc.mock-auth.role";
let current: User | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const r = window.localStorage.getItem(KEY) as Role | null;
  current = r && r in mockUsers ? mockUsers[r] : null;
}

export function getCurrentUser(): User | null {
  load();
  return current;
}

function setUser(u: User | null) {
  current = u;
  if (u) window.localStorage.setItem(KEY, u.role);
  else window.localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export const mockAuth = {
  login: (role: Role) => setUser(mockUsers[role]),
  switchRole: (role: Role) => setUser(mockUsers[role]),
  logout: () => setUser(null),
};

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useCurrentUser(): User | null {
  return useSyncExternalStore(subscribe, getCurrentUser, () => null);
}

export function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
