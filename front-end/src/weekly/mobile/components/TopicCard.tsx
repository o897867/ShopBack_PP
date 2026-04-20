import type { Tag, NodeColor } from "../../types";

const TOPIC_COLORS: Record<NodeColor, { bg: string; title: string; meta: string }> = {
  "c-amber":  { bg: "#FAEEDA", title: "#412402", meta: "#854F0B" },
  "c-blue":   { bg: "#E6F1FB", title: "#042C53", meta: "#185FA5" },
  "c-teal":   { bg: "#E1F5EE", title: "#04342C", meta: "#0F6E56" },
  "c-purple": { bg: "#EEEDFE", title: "#26215C", meta: "#534AB7" },
  "c-coral":  { bg: "#FAECE7", title: "#4A1B0C", meta: "#993C1D" },
  "c-pink":   { bg: "#FBEAF0", title: "#4B1528", meta: "#993556" },
  "c-gray":   { bg: "#F1EFE8", title: "#2C2C2A", meta: "#5F5E5A" },
  "c-green":  { bg: "#EAF3DE", title: "#173404", meta: "#3B6D11" },
  "c-red":    { bg: "#FCEBEB", title: "#501313", meta: "#A32D2D" },
};

interface TopicCardProps {
  tag: Tag;
  onClick: () => void;
}

export function TopicCard({ tag, onClick }: TopicCardProps) {
  const palette = TOPIC_COLORS[tag.color as NodeColor] || TOPIC_COLORS["c-gray"];

  return (
    <article
      className="topic-card"
      style={{ background: palette.bg }}
      onClick={onClick}
    >
      <div className="topic-card-title" style={{ color: palette.title }}>
        {tag.name}
      </div>
      {tag.description && (
        <div className="topic-card-meta" style={{ color: palette.meta }}>
          {tag.description}
        </div>
      )}
    </article>
  );
}
