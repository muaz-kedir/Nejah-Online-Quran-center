import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute("/zoom-guide")({
  head: () => ({
    meta: [
      { title: "Zoom Integration Guide - Nejah Online Quran Center" },
      {
        name: "description",
        content:
          "Step-by-step guide to adding, using, and removing the Nejah Online Quran Center Zoom integration for teachers."
      },
      {
        name: "keywords",
        content: "Zoom integration, Zoom guide, Nejah Online Quran Center, connect Zoom, live class"
      },
      { property: "og:title", content: "Zoom Integration Guide - Nejah Online Quran Center" },
      {
        property: "og:description",
        content: "How to add, use, and remove the Nejah Zoom integration for live Quran classes."
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nejah-quran.vercel.app/zoom-guide" },
    ]
  })
});
