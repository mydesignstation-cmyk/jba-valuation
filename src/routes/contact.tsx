import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us" },
      { name: "description", content: "Contact Us page." },
      { property: "og:title", content: "Contact Us" },
      { property: "og:description", content: "Contact Us page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return <div className="min-h-screen w-full bg-background" />;
}
