import { useTags } from "../../hooks/useTags";
import { useNavigate } from "react-router-dom";
import { TopicCard } from "./TopicCard";

const FEATURED_TOPICS = [
  "gold",
  "liquidity",
  "geopolitics",
  "energy",
  "us-stocks",
  "cycle",
];

export function TopicsTab() {
  const { data: tags, loading } = useTags();
  const navigate = useNavigate();

  if (loading || !tags || tags.length === 0)
    return <div className="loading-hint">加载中⋯</div>;

  const tagsBySlug = new Map(tags.map((t) => [t.slug, t]));

  const featured = FEATURED_TOPICS.map((slug) => tagsBySlug.get(slug)).filter(
    (t): t is NonNullable<typeof t> => !!t,
  );

  const otherTags = tags.filter((t) => !FEATURED_TOPICS.includes(t.slug));

  return (
    <div className="topics-tab">
      <div className="topics-grid">
        {featured.map((tag) => (
          <TopicCard
            key={tag.slug}
            tag={tag}
            onClick={() => navigate(`/weekly-mindmap/topics/${tag.slug}`)}
          />
        ))}
      </div>

      {otherTags.length > 0 && (
        <div className="topics-index">
          <div className="topics-index-label">完整索引</div>
          <div className="topics-index-chips">
            {otherTags.map((tag) => (
              <span
                key={tag.slug}
                className="topic-index-chip"
                onClick={() => navigate(`/weekly-mindmap/topics/${tag.slug}`)}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function IndexTab() {
  const { data: tags, loading } = useTags();
  const navigate = useNavigate();

  if (loading || !tags || tags.length === 0)
    return <div className="loading-hint">加载中⋯</div>;

  const sorted = [...tags].sort((a, b) =>
    a.name.localeCompare(b.name, "zh-CN"),
  );

  return (
    <div className="topics-tab">
      <div className="topics-index-chips" style={{ marginTop: 4 }}>
        {sorted.map((tag) => (
          <span
            key={tag.slug}
            className="topic-index-chip"
            onClick={() => navigate(`/weekly-mindmap/topics/${tag.slug}`)}
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  );
}
