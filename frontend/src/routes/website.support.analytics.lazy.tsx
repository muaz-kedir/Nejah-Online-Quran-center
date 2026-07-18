/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useEffect, useState } from "react";
import { createLazyFileRoute} from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, GlassPanel } from "@/components/dashboard/design-system";
import { requireAuth } from "@/lib/auth";
import { getAnalytics, type SupportAnalytics } from "@/lib/support-pages";
import { Loader2, FileText, Eye, ThumbsUp, Ticket, CheckCircle } from "lucide-react";

export const Route = createLazyFileRoute('/website/support/analytics')({
  component: AnalyticsCmsPage,
});

function AnalyticsCmsPage() {
  const [data, setData] = useState<SupportAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await getAnalytics();
        setData(result);
      } catch (e: any) {
        console.error("Analytics error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          eyebrow="Website CMS"
          title="Support Analytics"
          description="Overview of your Help Center and Support Ticket performance"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Total Articles"
            value={data.totalArticles}
            sub={`${data.publishedArticles} published · ${data.draftArticles} drafts`}
          />
          <StatCard
            icon={Eye}
            label="Most Viewed"
            value={data.mostViewed[0]?.title?.en || "—"}
            sub={`${data.mostViewed[0]?.viewCount || 0} views`}
          />
          <StatCard
            icon={ThumbsUp}
            label="Helpful Votes"
            value={data.helpfulVotes}
            sub={`${data.notHelpfulVotes} not helpful`}
          />
          <StatCard icon={Ticket} label="Total Tickets" value={data.totalTickets} />
          <StatCard
            icon={CheckCircle}
            label="Resolved Tickets"
            value={data.resolvedTickets}
            sub={
              data.totalTickets > 0
                ? `${Math.round((data.resolvedTickets / data.totalTickets) * 100)}% resolution rate`
                : "No tickets"
            }
          />
          <StatCard icon={FileText} label="Categories" value={data.totalCategories} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassPanel className="p-6 space-y-4">
            <h3 className="font-bold text-lg">Most Viewed Articles</h3>
            {data.mostViewed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No articles yet.</p>
            ) : (
              <div className="space-y-2">
                {data.mostViewed.map((a, i) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-border p-3 bg-background/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                      <div>
                        <p className="font-medium text-sm">{a.title?.en || a.slug}</p>
                        <p className="text-xs text-muted-foreground">{a.viewCount} views</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="p-6 space-y-4">
            <h3 className="font-bold text-lg">Least Viewed Articles</h3>
            {data.leastViewed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No articles yet.</p>
            ) : (
              <div className="space-y-2">
                {data.leastViewed.map((a, i) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-border p-3 bg-background/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                      <div>
                        <p className="font-medium text-sm">{a.title?.en || a.slug}</p>
                        <p className="text-xs text-muted-foreground">{a.viewCount} views</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>
      </div>
    </DashboardLayout>
  );
}
