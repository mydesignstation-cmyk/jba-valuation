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

function Index() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background text-foreground">
      <h1 className="text-4xl font-semibold">Hello world</h1>
    </div>
  );
}
