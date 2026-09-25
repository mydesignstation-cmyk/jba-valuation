import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us" },
      { name: "description", content: "About Us page." },
      { property: "og:title", content: "About Us" },
      { property: "og:description", content: "About Us page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return <div className="min-h-screen w-full bg-background" />;
}
