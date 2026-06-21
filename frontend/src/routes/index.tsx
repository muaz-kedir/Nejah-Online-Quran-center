import { createFileRoute } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import { HomeCmsProvider } from "@/components/site/HomeCmsProvider";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { Courses } from "@/components/site/Courses";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Features } from "@/components/site/Features";
import { Teachers } from "@/components/site/Teachers";
import { Testimonials } from "@/components/site/Testimonials";
import { CTA } from "@/components/site/CTA";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { Loader } from "@/components/site/Loader";

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
  component: Index,
});

function Index() {
  return (
    <ThemeProvider>
      <HomeCmsProvider>
      <Loader />
      <div className="relative flex min-h-screen flex-col admin-shell-bg">
        <div className="pointer-events-none fixed inset-0 ambient-glow dark:ambient-glow-dark opacity-60" />
        <Navbar />
        <main className="relative z-10 flex-1">
          <Hero />
          <About />
          <Courses />
          <HowItWorks />
          <Features />
          <Teachers />
          <Testimonials />
          <CTA />
        </main>
        <Footer />
        <FloatingActions />
      </div>
      </HomeCmsProvider>
    </ThemeProvider>
  );
}
