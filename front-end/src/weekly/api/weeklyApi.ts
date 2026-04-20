import type {
  LinkDetail,
  LinkIndexResponse,
  NodeDetail,
  ReportDetail,
  ReportSummary,
  Tag,
} from "../types";

const BASE = import.meta.env.VITE_API_BASE ?? "";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const weeklyApi = {
  listReports: () => get<ReportSummary[]>("/api/weekly/reports"),

  getReport: (id: string) => get<ReportDetail>(`/api/weekly/reports/${id}`),

  listNodes: (tag?: string) => {
    const q = tag ? `?tag=${encodeURIComponent(tag)}` : "";
    return get<NodeDetail[]>(`/api/weekly/nodes${q}`);
  },

  getNode: (id: string) => get<NodeDetail>(`/api/weekly/nodes/${id}`),

  listLinks: (nodeId?: string) => {
    const q = nodeId ? `?node=${encodeURIComponent(nodeId)}` : "";
    return get<LinkDetail[]>(`/api/weekly/links${q}`);
  },

  getLinkIndex: () => get<LinkIndexResponse>("/api/weekly/links/index"),

  listTags: () => get<Tag[]>("/api/weekly/tags"),

  getTagTimeline: (slug: string) =>
    get<NodeDetail[]>(`/api/weekly/tags/${slug}/timeline`),
};
