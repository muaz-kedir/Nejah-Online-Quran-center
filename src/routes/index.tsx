import { createFileRoute } from "@tanstack/react-router";
import { MainLayout } from "@/layouts/MainLayout";
import { LandingPage } from "@/pages/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nejah — Online Quran & Islamic Center" },
      {
        name: "description",
        content:
          "Learn Quran online with expert teachers. Personalized one-on-one Quran, Tajweed, Hifz and Islamic Studies for kids and adults.",
      },
      { property: "og:title", content: "Nejah — Online Quran & Islamic Center" },
      {
        property: "og:description",
        content: "Personalized Quran and Islamic education with qualified scholars. Flexible 24/7 schedule.",
      },
    ],
  }),
  component: () => (
    <MainLayout>
      <LandingPage />
    </MainLayout>
  ),
});
