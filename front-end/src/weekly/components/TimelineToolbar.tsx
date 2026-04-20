import { useTimelineStore } from "../store/timelineStore";
import type { LinkType } from "../types";

const TYPE_LABELS: Record<LinkType, string> = {
  evolution: "演进",
  causation: "因果",
  contrast: "对照",
  resonance: "共振",
};

const TYPE_COLORS: Record<LinkType, string> = {
  evolution: "#2563eb",
  causation: "#ea580c",
  contrast: "#4b5563",
  resonance: "#9333ea",
};

export default function TimelineToolbar() {
  const { visibleTypes, showAllLinks } = useTimelineStore();
  const toggleType = useTimelineStore((s) => s.toggleType);
  const toggleShowAll = useTimelineStore((s) => s.toggleShowAll);

  return (
    <div className="wm-timeline-toolbar">
      <span className="wm-link-controls-label">关联</span>
      <div className="wm-link-controls">
        {(Object.keys(TYPE_LABELS) as LinkType[]).map((type) => {
          const active = visibleTypes.has(type);
          return (
            <button
              key={type}
              className={`wm-type-chip${active ? " is-active" : ""}`}
              onClick={() => toggleType(type)}
              style={
                active
                  ? { borderColor: TYPE_COLORS[type], color: TYPE_COLORS[type] }
                  : undefined
              }
            >
              {TYPE_LABELS[type]}
            </button>
          );
        })}

        <div className="wm-chip-divider" />

        <label className="wm-show-all-toggle">
          <input
            type="checkbox"
            checked={showAllLinks}
            onChange={toggleShowAll}
          />
          <span>全部显示</span>
        </label>
      </div>
    </div>
  );
}
