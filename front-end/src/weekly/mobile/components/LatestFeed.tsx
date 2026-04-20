import { useReports } from "../../hooks/useReports";
import { useEffect, useState } from "react";
import { weeklyApi } from "../../api/weeklyApi";
import type { ReportDetail } from "../../types";
import { DateDivider } from "./DateDivider";
import { NodeFeedItem } from "./NodeFeedItem";

export function LatestFeed() {
  const { data: reports, loading: reportsLoading } = useReports();
  const [reportDetails, setReportDetails] = useState<ReportDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reports || reports.length === 0) return;

    Promise.all(reports.map((r) => weeklyApi.getReport(r.id)))
      .then((details) => {
        details.sort((a, b) => b.id.localeCompare(a.id));
        setReportDetails(details);
      })
      .finally(() => setLoading(false));
  }, [reports]);

  if (reportsLoading || loading) {
    return <FeedSkeleton />;
  }

  return (
    <div className="latest-feed">
      {reportDetails.map((report) => (
        <ReportSection key={report.id} report={report} />
      ))}
    </div>
  );
}

function ReportSection({ report }: { report: ReportDetail }) {
  const nodes = [...report.nodes].sort((a, b) => a.order - b.order);

  return (
    <section className="report-section">
      <DateDivider date={report.date} nodeCount={nodes.length} />
      {nodes.map((node) => (
        <NodeFeedItem key={node.id} node={node} reportDate={report.date} />
      ))}
    </section>
  );
}

function FeedSkeleton() {
  return (
    <div className="feed-skeleton">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-card" />
      ))}
    </div>
  );
}
