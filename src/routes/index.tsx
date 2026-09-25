import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blank Page" },
      { name: "description", content: "A blank HTML page." },
    ],
  }),
  component: Index,
});

// Intentionally blank page — no application UI yet.
function Index() {
  return (
    <div
      className="min-h-screen w-full bg-background"
      style={{ margin: 0, padding: 0 }}
    />
  );
}
