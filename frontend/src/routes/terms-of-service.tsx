import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({
    meta: [
      { title: "Terms of Service - Nejah Online Quran Center" },
      {
        name: "description",
        content:
          "Terms of Service for Nejah Online Quran Center — rules governing use of the platform including Zoom integration features."
      },
      {
        name: "keywords",
        content: "terms of service, terms and conditions, Nejah Online Quran Center"
      },
      { property: "og:title", content: "Terms of Service - Nejah Online Quran Center" },
      {
        property: "og:description",
        content: "Terms governing use of the Nejah Online Quran Center platform."
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nejah-quran.vercel.app/terms-of-service" },
    ]
  })
});
