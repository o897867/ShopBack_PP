import { useEffect, useState } from "react";
import { weeklyApi } from "../api/weeklyApi";
import type { LinkDetail } from "../types";

export function useLinks(nodeId?: string) {
  const [data, setData] = useState<LinkDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    weeklyApi
      .listLinks(nodeId)
      .then((r) => { if (!cancelled) setData(r); })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [nodeId]);

  return { data, loading, error };
}
