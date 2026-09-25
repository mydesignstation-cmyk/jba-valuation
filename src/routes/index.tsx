import { createFileRoute } from "@tanstack/react-router";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  component: Index,
});

// Intentionally blank page — no application UI yet.
function Index() {
  return (
    <html lang="en">
      <head>
        <title>Blank Page</title>
        <meta name="description" content="A blank HTML page." />
        <style>{`
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background: #ffffff;
          }
        `}</style>
      </head>
      <body>
      </body>
    </html>
  );
}
