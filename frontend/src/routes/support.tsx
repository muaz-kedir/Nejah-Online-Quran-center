import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support - Nejah Online Quran Center" },
      {
        name: "description",
        content:
          "Get help with Nejah Online Quran Center. Contact our support team, find answers to common questions, and get assistance with your account or Zoom integration."
      },
      { property: "og:title", content: "Support - Nejah Online Quran Center" },
      {
        property: "og:description",
        content: "Get help with Nejah Online Quran Center."
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nejah-quran.vercel.app/support" },
    ]
  })
});
