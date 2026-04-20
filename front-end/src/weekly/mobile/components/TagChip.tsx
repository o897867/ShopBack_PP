import { useNavigate } from "react-router-dom";
import { useTags } from "../../hooks/useTags";
import type { NodeColor } from "../../types";

const TAG_COLORS: Record<NodeColor, { bg: string; fg: string }> = {
  "c-amber":  { bg: "#FAEEDA", fg: "#854F0B" },
  "c-blue":   { bg: "#E6F1FB", fg: "#185FA5" },
  "c-teal":   { bg: "#E1F5EE", fg: "#0F6E56" },
  "c-purple": { bg: "#EEEDFE", fg: "#534AB7" },
  "c-coral":  { bg: "#FAECE7", fg: "#993C1D" },
  "c-pink":   { bg: "#FBEAF0", fg: "#993556" },
  "c-gray":   { bg: "#F1EFE8", fg: "#5F5E5A" },
  "c-green":  { bg: "#EAF3DE", fg: "#3B6D11" },
  "c-red":    { bg: "#FCEBEB", fg: "#A32D2D" },
};

interface TagChipProps {
  slug: string;
  size?: "sm" | "md";
  clickable?: boolean;
}

export function TagChip({ slug, size = "md", clickable = true }: TagChipProps) {
  const navigate = useNavigate();
  const { data: tags } = useTags();

  const tag = tags?.find((t) => t.slug === slug);
  const colors = tag
    ? TAG_COLORS[tag.color as NodeColor] || TAG_COLORS["c-gray"]
    : TAG_COLORS["c-gray"];
  const displayName = tag?.name || slug;

  const handleClick = clickable
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/weekly-mindmap/topics/${slug}`);
      }
    : undefined;

  return (
    <span
      className={`tag-chip tag-chip-${size}`}
      style={{
        background: colors.bg,
        color: colors.fg,
        cursor: clickable ? "pointer" : "default",
      }}
      onClick={handleClick}
    >
      {displayName}
    </span>
  );
}
