import { useEffect, useState } from "react";
import { weeklyApi } from "../../api/weeklyApi";
import type { LinkDetail, LinkType, NodeDetail } from "../../types";

interface RelatedNodeQuoteProps {
  link: LinkDetail;
  otherNodeId: string;
  direction: "in" | "out";
  onClick: () => void;
}

const TYPE_CONFIG: Record<LinkType, { label: string; color: string }> = {
  evolution: { label: "演进", color: "#185FA5" },
  causation: { label: "因果", color: "#A32D2D" },
  contrast:  { label: "对照", color: "#5F5E5A" },
  resonance: { label: "共振", color: "#534AB7" },
};

const otherNodeCache = new Map<string, { node: NodeDetail; reportDate: string }>();

export function RelatedNodeQuote({
  link,
  otherNodeId,
  direction,
  onClick,
}: RelatedNodeQuoteProps) {
  const [otherInfo, setOtherInfo] = useState(
    otherNodeCache.get(otherNodeId) || null,
  );

  useEffect(() => {
    if (otherNodeCache.has(otherNodeId)) return;

    weeklyApi.getNode(otherNodeId).then((node) => {
      return weeklyApi.getReport(node.report_id).then((report) => {
        const info = { node, reportDate: report.date };
        otherNodeCache.set(otherNodeId, info);
        setOtherInfo(info);
      });
    });
  }, [otherNodeId]);

  const config = TYPE_CONFIG[link.type];
  const directionArrow = direction === "in" ? "\u2190" : "\u2192";

  return (
    <article
      className="related-node-quote"
      style={{ borderLeftColor: config.color }}
      onClick={onClick}
    >
      <div className="related-quote-meta">
        <span className="related-quote-type" style={{ color: config.color }}>
          {config.label} {directionArrow}
        </span>
        {otherInfo && (
          <span className="related-quote-date">{otherInfo.reportDate}</span>
        )}
      </div>

      <div className="related-quote-title">
        {otherInfo?.node.title || "\u52A0\u8F7D\u4E2D\u22EF"}
      </div>

      {link.label && (
        <div className="related-quote-label">{link.label}</div>
      )}
    </article>
  );
}
