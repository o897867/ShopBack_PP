import { useEffect, useState } from "react";
import { weeklyApi } from "../api/weeklyApi";
import type { NodeDetail } from "../types";

export function useTagTimeline(slug: string | undefined) {
  const [data, setData] = useState<NodeDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    weeklyApi
      .getTagTimeline(slug)
      .then((r) => { if (!cancelled) setData(r); })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  return { data, loading, error };
}
