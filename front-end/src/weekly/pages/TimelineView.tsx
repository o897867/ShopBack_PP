import { useEffect, useRef, useState } from "react";
import { weeklyApi } from "../api/weeklyApi";
import type { ReportDetail } from "../types";
import { useTimelineStore } from "../store/timelineStore";
import ReportColumn from "../components/ReportColumn";
import LinkLayer from "../components/LinkLayer";
import TimelineToolbar from "../components/TimelineToolbar";
import ViewToolbar from "../components/ViewToolbar";
import "../weekly.css";

export default function TimelineView() {
  const [reports, setReports] = useState<ReportDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Zustand store
  const setLinkIndex = useTimelineStore((s) => s.setLinkIndex);
  const setTagMap = useTimelineStore((s) => s.setTagMap);
  const clearFocus = useTimelineStore((s) => s.clearFocus);

  // Refs
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([weeklyApi.listReports(), weeklyApi.getLinkIndex(), weeklyApi.listTags()])
      .then(async ([summaries, linkIdx, tags]) => {
        if (cancelled) return;
        setLinkIndex(linkIdx);
        const m: Record<string, string> = {};
        for (const t of tags) m[t.slug] = t.name;
        setTagMap(m);
        const ids = summaries.map((s) => s.id);
        const details = await Promise.all(ids.map((id) => weeklyApi.getReport(id)));
        if (cancelled) return;
        setReports(details);
      })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [setLinkIndex]);

  if (loading) {
    return (
      <div className="wm-root">
        <div style={{ padding: 32, color: "#64748b" }}>Loading...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="wm-root">
        <div style={{ padding: 32, color: "#dc2626" }}>Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="wm-root">
      <ViewToolbar />
      <TimelineToolbar />

      {/* Timeline */}
      <div
        className="wm-timeline"
        ref={containerRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) clearFocus();
        }}
      >
        <LinkLayer
          nodeRefs={nodeRefs}
          containerRef={containerRef}
        />
        {reports.map((r) => (
          <ReportColumn
            key={r.id}
            report={r}
            nodeRefs={nodeRefs}
          />
        ))}
      </div>
    </div>
  );
}
