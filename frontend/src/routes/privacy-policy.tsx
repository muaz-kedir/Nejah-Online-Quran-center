import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy - Nejah Online Quran Center" },
      {
        name: "description",
        content:
          "Privacy Policy for Nejah Online Quran Center — how we collect, use, and protect your data including Zoom integration information."
      },
      {
        name: "keywords",
        content: "privacy policy, data protection, Zoom integration, Nejah Online Quran Center"
      },
      { property: "og:title", content: "Privacy Policy - Nejah Online Quran Center" },
      {
        property: "og:description",
        content: "How Nejah Online Quran Center collects, uses, and protects your data."
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nejah-quran.vercel.app/privacy-policy" },
    ]
  })
});
